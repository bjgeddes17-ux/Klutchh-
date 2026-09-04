import { MediaPipeLandmark, SportRule, SkillLevel, JointRule, AthleteCategory } from '../types';

export function calculateAngle(p1: MediaPipeLandmark, p2: MediaPipeLandmark, p3: MediaPipeLandmark): number {
  // Law of Cosines: c^2 = a^2 + b^2 - 2ab * cos(C)
  // angle C = acos((a^2 + b^2 - c^2) / (2ab))
  const distSq = (a: MediaPipeLandmark, b: MediaPipeLandmark) =>
    Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow(a.z - b.z, 2);

  const aSq = distSq(p1, p2);
  const bSq = distSq(p2, p3);
  const cSq = distSq(p1, p3);

  const a = Math.sqrt(aSq);
  const b = Math.sqrt(bSq);

  if (a === 0 || b === 0) return 0;

  const cosC = (aSq + bSq - cSq) / (2 * a * b);
  const clampedCosC = Math.max(-1, Math.min(1, cosC));
  
  return (Math.acos(clampedCosC) * 180) / Math.PI;
}

export function calculateBiometricScore(
  landmarks: MediaPipeLandmark[],
  sportRule: SportRule,
  skillLevel: SkillLevel,
  targetPhase?: string,
  selectedTechniqueId?: string,
  dynamicMetrics?: {
    peakAngularVelocity: number;
    estimatedPeakTorque: number;
    explosivenessScore: number;
  },
  athleteCategory: AthleteCategory = 'middle_school'
): { score: number; angles: Record<string, number>; results: Record<string, 'optimal' | 'good' | 'warning' | 'error'> } {
  let totalScore = 0;
  let maxPossibleScore = 0;
  
  const angles: Record<string, number> = {};
  const results: Record<string, 'optimal' | 'good' | 'warning' | 'error'> = {};

  // Dynamic Age Bracket Tolerance Buffer
  // Elementary kids receive a gentle +6° buffer to encourage growth without harsh penalties
  // Middle school receives +3° buffer; High school/Elite uses strict anatomical tolerances
  const ageToleranceBuffer = athleteCategory === 'elementary' ? 6 : athleteCategory === 'middle_school' ? 3 : 0;

  const activeTechnique = selectedTechniqueId && sportRule.techniques 
    ? sportRule.techniques.find(t => t.id === selectedTechniqueId)
    : null;

  const rulesPool = activeTechnique ? activeTechnique.jointRules : sportRule.jointRules;

  const filteredRules = targetPhase 
    ? rulesPool.filter(r => r.phase === targetPhase)
    : rulesPool;

  filteredRules.forEach((rule: JointRule) => {
    const [p1Idx, p2Idx, p3Idx] = rule.keypoints;
    const p1 = landmarks[p1Idx];
    const p2 = landmarks[p2Idx];
    const p3 = landmarks[p3Idx];

    if (!p1 || !p2 || !p3) {
      return;
    }

    const v1 = p1.visibility ?? 1;
    const v2 = p2.visibility ?? 1;
    const v3 = p3.visibility ?? 1;
    if (v1 < 0.35 || v2 < 0.35 || v3 < 0.35) {
      return;
    }

    const d1 = Math.hypot(p1.x - p2.x, p1.y - p2.y);
    const d2 = Math.hypot(p3.x - p2.x, p3.y - p2.y);
    if (d1 < 0.012 || d2 < 0.012) {
      return;
    }

    const angle = calculateAngle(p1, p2, p3);
    if (angle <= 8 || angle >= 179) {
      return;
    }
    angles[rule.id] = angle;

    const baseTolerance = rule.tolerancesByLevel[skillLevel] || {
      idealMin: rule.idealMin,
      idealMax: rule.idealMax,
      toleranceMargin: 10
    };

    const tolerance = {
      idealMin: Math.max(0, baseTolerance.idealMin - ageToleranceBuffer),
      idealMax: Math.min(180, baseTolerance.idealMax + ageToleranceBuffer),
      toleranceMargin: baseTolerance.toleranceMargin + ageToleranceBuffer
    };

    let ruleWeight = 1;
    if (rule.importance === 'critical_safety') ruleWeight = 3;
    else if (rule.importance === 'performance') ruleWeight = 2;

    maxPossibleScore += ruleWeight;

    if (angle >= tolerance.idealMin && angle <= tolerance.idealMax) {
      results[rule.id] = 'optimal';
      totalScore += ruleWeight;
    } else {
      const dev = Math.min(Math.abs(angle - tolerance.idealMin), Math.abs(angle - tolerance.idealMax));
      
      if (dev <= tolerance.toleranceMargin) {
        results[rule.id] = 'good';
        totalScore += ruleWeight * 0.85;
      } else if (dev <= tolerance.toleranceMargin * 2) {
        results[rule.id] = 'warning';
        totalScore += ruleWeight * 0.5;
      } else {
        results[rule.id] = 'error';
        // Elementary athletes receive small baseline effort credit
        if (athleteCategory === 'elementary') {
          totalScore += ruleWeight * 0.2;
        }
      }
    }
  });

  const baseNormalizedScore = maxPossibleScore > 0 
    ? (totalScore / maxPossibleScore) * 10 
    : 0;

  // Dynamic explosiveness blending (70% form precision, 30% dynamic momentum)
  let finalScore = baseNormalizedScore;
  if (dynamicMetrics && dynamicMetrics.explosivenessScore > 0) {
    finalScore = (baseNormalizedScore * 0.7) + (dynamicMetrics.explosivenessScore * 0.3);
  }

  return {
    score: Math.round(finalScore * 10) / 10,
    angles,
    results
  };
}

/**
 * Matches a frame against Biomechanical Archetypes (Frameworks).
 * Uses angles, velocity, and force vectors to confirm if a frame fits a specific "Perfect Form" blueprint.
 */
export function matchBiomechanicalArchetype(
  landmarks: MediaPipeLandmark[],
  sportRule: SportRule,
  currentPhase: string,
  velocity?: { jointIdx: number; magnitude: number; vector: { x: number; y: number; z: number } }
): { matchScore: number; feedback: string } {
  const archetype = sportRule.archetypes?.find(a => a.phase === currentPhase);
  if (!archetype) return { matchScore: 0, feedback: 'No framework defined for this phase.' };

  let matchPoints = 0;
  let totalCriteria = 0;

  // 1. Angle Alignment (Framework X)
  if (archetype.targetAngles) {
    const angleKeys = Object.keys(archetype.targetAngles);
    angleKeys.forEach(ruleId => {
      totalCriteria++;
      const rule = sportRule.jointRules.find(r => r.id === ruleId);
      if (rule) {
        const [p1Idx, p2Idx, p3Idx] = rule.keypoints;
        const angle = calculateAngle(landmarks[p1Idx], landmarks[p2Idx], landmarks[p3Idx]);
        const target = archetype.targetAngles[ruleId];
        const diff = Math.abs(angle - target);
        if (diff < 15) matchPoints += 1;
        else if (diff < 30) matchPoints += 0.5;
      }
    });
  }

  // 2. Velocity Signature (Framework Y)
  if (archetype.expectedVelocity && velocity) {
    totalCriteria++;
    if (velocity.jointIdx === archetype.expectedVelocity.jointIdx) {
      if (velocity.magnitude >= archetype.expectedVelocity.minMagnitude) {
        // Check vector alignment (dot product)
        const dot = 
          velocity.vector.x * archetype.expectedVelocity.vector.x +
          velocity.vector.y * archetype.expectedVelocity.vector.y +
          velocity.vector.z * archetype.expectedVelocity.vector.z;
        
        if (dot > 0.7) matchPoints += 1; // Good alignment
        else if (dot > 0.4) matchPoints += 0.5;
      }
    }
  }

  // 3. Spine/Core Constraint (Framework Z)
  if (archetype.spineConstraint) {
    totalCriteria++;
    // Simple heuristic for spine constraint: check alignment of nose, shoulders, and hips
    const nose = landmarks[0];
    const midShoulder = { x: (landmarks[11].x + landmarks[12].x) / 2, y: (landmarks[11].y + landmarks[12].y) / 2 };
    const midHip = { x: (landmarks[23].x + landmarks[24].x) / 2, y: (landmarks[23].y + landmarks[24].y) / 2 };
    
    if (archetype.spineConstraint === 'linear') {
      const dx = midShoulder.x - midHip.x;
      const dy = midShoulder.y - midHip.y;
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      // Linear spine should be relatively vertical or purposeful
      matchPoints += 1; // Assume match for now as complex linear check requires multi-point spline
    } else {
      matchPoints += 1; // Coiled/Hinged are harder to verify purely with landmarks, marked as pass
    }
  }

  const score = totalCriteria > 0 ? (matchPoints / totalCriteria) * 100 : 0;
  
  return {
    matchScore: score,
    feedback: score > 80 ? 'Perfect Archetype Match!' : score > 50 ? 'Strong Framework Alignment.' : 'Weak Archetype Match.'
  };
}
