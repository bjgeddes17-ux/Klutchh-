// src/utils/biomechanicalValidation.ts
// Biomechanical Validation Engine: Cross-references skeletal Y-coordinates and joint relationships against SPORTS_RULES phase constraints

import { MediaPipeLandmark, SportRule, JointRule, FrameAnalysis } from '../types';

export interface FrameValidationResult {
  status: 'valid' | 'flagged_review' | 'discarded_outlier';
  isDiscarded: boolean;
  isFlaggedForReview: boolean;
  score: number; // 0 - 100
  issues: string[];
  details: {
    anatomicalHierarchyValid: boolean;
    yCoordinateBoundsValid: boolean;
    spineIntegrityValid: boolean;
    phaseSpecificBoundsValid: boolean;
    triggerConstraintsValid: boolean;
  };
}

/**
 * Validates skeletal landmarks against physiological bounds and sport-specific phase constraints.
 * Categorizes the frame as:
 * - 'valid': Passes all checks within standard tolerances.
 * - 'flagged_review': Minor boundary or phase deviation detected; acceptable for preview but tagged for coach review.
 * - 'discarded_outlier': Severe anatomical violation (e.g. inverted joints, teleported coords, collapsed spine); excluded from keyframes.
 */
export function validateBiomechanicalFrame(
  landmarks: MediaPipeLandmark[] | null | undefined,
  phaseName: string,
  phaseIndex: number,
  totalPhases: number,
  sportRule: SportRule,
  timestampSec: number
): FrameValidationResult {
  const issues: string[] = [];

  // 1. Completeness & Availability
  if (!landmarks || landmarks.length < 25) {
    return {
      status: 'discarded_outlier',
      isDiscarded: true,
      isFlaggedForReview: true,
      score: 0,
      issues: ['Incomplete pose landmarks: Less than 25 body keypoints detected'],
      details: {
        anatomicalHierarchyValid: false,
        yCoordinateBoundsValid: false,
        spineIntegrityValid: false,
        phaseSpecificBoundsValid: false,
        triggerConstraintsValid: false,
      },
    };
  }

  const nose = landmarks[0];
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftElbow = landmarks[13];
  const rightElbow = landmarks[14];
  const leftWrist = landmarks[15];
  const rightWrist = landmarks[16];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const leftKnee = landmarks[25];
  const rightKnee = landmarks[26];
  const leftAnkle = landmarks[27];
  const rightAnkle = landmarks[28];

  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip || !leftKnee || !rightKnee || !leftAnkle || !rightAnkle) {
    return {
      status: 'discarded_outlier',
      isDiscarded: true,
      isFlaggedForReview: true,
      score: 10,
      issues: ['Critical core skeletal landmarks (shoulders/hips/knees/ankles) missing'],
      details: {
        anatomicalHierarchyValid: false,
        yCoordinateBoundsValid: false,
        spineIntegrityValid: false,
        phaseSpecificBoundsValid: false,
        triggerConstraintsValid: false,
      },
    };
  }

  // Calculate midpoints for core segment tracking
  const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
  const hipY = (leftHip.y + rightHip.y) / 2;
  const kneeY = (leftKnee.y + rightKnee.y) / 2;
  const ankleY = (leftAnkle.y + rightAnkle.y) / 2;
  const headY = nose?.y ?? (shoulderY - 0.15);

  let anatomicalHierarchyValid = true;
  let yCoordinateBoundsValid = true;
  let spineIntegrityValid = true;
  let phaseSpecificBoundsValid = true;
  let triggerConstraintsValid = true;
  let fatalViolation = false;

  // 2. Y-Coordinate Viewport Bounds Check (Normalized 0.0 - 1.0 field with slight margin)
  const allCoreY = [headY, shoulderY, hipY, kneeY, ankleY];
  const outOfBoundsCount = allCoreY.filter(y => y < -0.2 || y > 1.35).length;
  if (outOfBoundsCount > 1) {
    yCoordinateBoundsValid = false;
    fatalViolation = true;
    issues.push(`Multiple core landmarks out of normalized screen bounds (y: ${allCoreY.map(y => y.toFixed(2)).join(', ')})`);
  } else if (outOfBoundsCount === 1) {
    yCoordinateBoundsValid = false;
    issues.push('Partial boundary clipping on limb landmark');
  }

  // 3. Anatomical Vertical Inversion Checks (Top-to-Bottom: Head -> Shoulder -> Hip -> Knee -> Ankle)
  // Note: in image coordinates, higher up on screen = smaller Y.
  
  // A. Fatal: Head below hips (inverted body in non-gymnastic terrestrial sports)
  if (headY > hipY + 0.05) {
    anatomicalHierarchyValid = false;
    fatalViolation = true;
    issues.push(`Severe Inversion: Head (y=${headY.toFixed(2)}) is positioned below Hips (y=${hipY.toFixed(2)})`);
  }

  // B. Fatal: Ankles higher than knees
  if (ankleY < kneeY - 0.08) {
    anatomicalHierarchyValid = false;
    fatalViolation = true;
    issues.push(`Lower Limb Inversion: Ankles (y=${ankleY.toFixed(2)}) detected above Knees (y=${kneeY.toFixed(2)})`);
  }

  // C. Fatal: Knees higher than hips (unless extreme tuck, but in upright sports it violates bounds)
  if (kneeY < hipY - 0.05) {
    anatomicalHierarchyValid = false;
    fatalViolation = true;
    issues.push(`Pelvic Inversion: Knees (y=${kneeY.toFixed(2)}) detected above Hips (y=${hipY.toFixed(2)})`);
  }

  // 4. Spine & Torso Integrity (Distance between shoulders and hips)
  const torsoLengthY = hipY - shoulderY;
  if (torsoLengthY < 0.035) {
    spineIntegrityValid = false;
    fatalViolation = true;
    issues.push(`Collapsed Spine: Torso vertical separation (${torsoLengthY.toFixed(3)}) is below minimum physiological threshold`);
  } else if (torsoLengthY > 0.65) {
    spineIntegrityValid = false;
    issues.push(`Extended Spine: Torso length (${torsoLengthY.toFixed(3)}) exceeds standard biometric proportions`);
  }

  // 5. Cross-Reference against Movement Phase Constraints in SPORTS_RULES
  const normPhaseIdx = totalPhases > 0 ? phaseIndex / Math.max(1, totalPhases - 1) : 0;
  const phaseLower = phaseName.toLowerCase();

  // A. Phase 0: Setup / Stance / Address / Approach / Pre-Contact
  if (
    phaseIndex === 0 ||
    phaseLower.includes('stance') ||
    phaseLower.includes('setup') ||
    phaseLower.includes('address') ||
    phaseLower.includes('approach') ||
    phaseLower.includes('prep')
  ) {
    // In setup, athlete should be in balanced foundation
    if (hipY < 0.20 || hipY > 0.90) {
      phaseSpecificBoundsValid = false;
      issues.push(`Setup Phase Violation: Hip center of mass y=${hipY.toFixed(2)} outside base corridor [0.20, 0.90]`);
    }
    // Ankles must be near the base of support
    if (ankleY < 0.40) {
      phaseSpecificBoundsValid = false;
      issues.push(`Setup Phase Violation: Feet (ankle y=${ankleY.toFixed(2)}) elevated off ground plane during stance`);
    }
    // Head must be clearly above shoulders
    if (headY > shoulderY - 0.02) {
      phaseSpecificBoundsValid = false;
      issues.push(`Setup Phase Warning: Cervical posture dipping below shoulder level`);
    }
  }

  // B. Phase 1: Load / Coil / Backswing / Cocking / Kinetic Drive
  else if (
    phaseIndex === 1 ||
    phaseLower.includes('load') ||
    phaseLower.includes('coil') ||
    phaseLower.includes('backswing') ||
    phaseLower.includes('cock') ||
    phaseLower.includes('drive')
  ) {
    // Check loading height continuity
    if (hipY < 0.25 || hipY > 0.92) {
      phaseSpecificBoundsValid = false;
      issues.push(`Coil Phase Warning: Excessive pelvic elevation deviation (y=${hipY.toFixed(2)})`);
    }
    // For overhead/rotational sports (Golf, Tennis, Cricket), wrists should elevate during backswing/cocking
    if (['golf', 'tennis', 'cricket'].includes(sportRule.id)) {
      const topWristY = Math.min(leftWrist?.y ?? 1, rightWrist?.y ?? 1);
      if (topWristY > hipY + 0.15) {
        phaseSpecificBoundsValid = false;
        issues.push(`Backswing / Loading Corridor: Wrists failed to reach expected elevation above hip plane`);
      }
    }
  }

  // C. Phase 2: Delivery / Strike / Impact / Release / Force Transfer
  else if (
    phaseIndex === 2 ||
    phaseLower.includes('strike') ||
    phaseLower.includes('impact') ||
    phaseLower.includes('delivery') ||
    phaseLower.includes('release')
  ) {
    // In impact/strike, athlete should maintain stable spine alignment
    if (headY > hipY - 0.05) {
      phaseSpecificBoundsValid = false;
      fatalViolation = true;
      issues.push(`Impact Moment Fault: Head dropped below safe kinetic transmission plane`);
    }
  }

  // D. Phase 3: Follow-Through / Finish / Deceleration
  else {
    // Deceleration corridor
    if (ankleY < 0.35) {
      phaseSpecificBoundsValid = false;
      issues.push(`Follow-Through Warning: Ground stability loss during kinetic deceleration`);
    }
  }

  // 6. Check Specific Technique Triggers (relative_y_lt / relative_y_gt) from SPORTS_RULES
  if (sportRule.techniques) {
    for (const technique of sportRule.techniques) {
      if (technique.triggers) {
        for (const trigger of technique.triggers) {
          if (trigger.phase === phaseName || phaseLower.includes(trigger.phase.toLowerCase())) {
            if (trigger.condition === 'relative_y_lt' && trigger.jointId !== undefined && trigger.targetId !== undefined) {
              const pJoint = landmarks[trigger.jointId];
              const pTarget = landmarks[trigger.targetId];
              if (pJoint && pTarget && pJoint.y >= pTarget.y + 0.10) {
                triggerConstraintsValid = false;
                issues.push(`Trigger Constraint Violation [${technique.name}]: Landmark #${trigger.jointId} y=${pJoint.y.toFixed(2)} exceeds target #${trigger.targetId} y=${pTarget.y.toFixed(2)}`);
              }
            } else if (trigger.condition === 'relative_y_gt' && trigger.jointId !== undefined && trigger.targetId !== undefined) {
              const pJoint = landmarks[trigger.jointId];
              const pTarget = landmarks[trigger.targetId];
              if (pJoint && pTarget && pJoint.y <= pTarget.y - 0.10) {
                triggerConstraintsValid = false;
                issues.push(`Trigger Constraint Violation [${technique.name}]: Landmark #${trigger.jointId} y=${pJoint.y.toFixed(2)} is above target #${trigger.targetId} y=${pTarget.y.toFixed(2)}`);
              }
            }
          }
        }
      }
    }
  }

  // 7. Calculate Final Status & Confidence Score
  let score = 100;
  if (!anatomicalHierarchyValid) score -= 45;
  if (!yCoordinateBoundsValid) score -= 30;
  if (!spineIntegrityValid) score -= 25;
  if (!phaseSpecificBoundsValid) score -= 20;
  if (!triggerConstraintsValid) score -= 15;
  score = Math.max(0, Math.min(100, score));

  let status: 'valid' | 'flagged_review' | 'discarded_outlier';
  if (fatalViolation || score < 40) {
    status = 'discarded_outlier';
  } else if (issues.length > 0 || score < 80) {
    status = 'flagged_review';
  } else {
    status = 'valid';
  }

  return {
    status,
    isDiscarded: status === 'discarded_outlier',
    isFlaggedForReview: status === 'flagged_review' || status === 'discarded_outlier',
    score,
    issues,
    details: {
      anatomicalHierarchyValid,
      yCoordinateBoundsValid,
      spineIntegrityValid,
      phaseSpecificBoundsValid,
      triggerConstraintsValid,
    },
  };
}
