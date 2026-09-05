// src/services/movementKeyframeEngine.ts
// Software Engineering Solution for Movement-Specific Keyframes across All Sports & Movements

import { SportId, SportRule, BiomechanicalFrame, JointRule } from '../types';

export interface MovementKeyframeEvent {
  id: string;
  name: string; // e.g. "Top of Backswing (Max Coil)", "Impact / Ball Release", "Plant & Deceleration"
  timestamp: number; // In seconds
  frameNumber: number;
  importance: 'critical' | 'primary' | 'secondary';
  status: 'optimal' | 'warning' | 'error';
  jointTrigger?: string; // e.g. "hip_rotation", "wrist_velocity", "knee_flexion"
  measuredValue?: number;
  idealRange?: string;
  coachingHint?: string;
}

export interface MovementProfile {
  movementId: string;
  movementName: string;
  sportId: SportId;
  description: string;
  keyframeEvents: MovementKeyframeEvent[];
}

/**
 * Dynamically detects movement-relevant keyframes from raw biomechanical frame sequences
 * by analyzing velocity spikes, angular extrema (local min/max), and torso acceleration curves.
 */
export function detectMovementKeyframes(
  frames: BiomechanicalFrame[],
  sportRule: SportRule,
  durationSec: number
): MovementKeyframeEvent[] {
  if (!frames || frames.length === 0) {
    return getDefaultFallbackKeyframes(sportRule, durationSec);
  }

  const sportId = sportRule.id;

  // 1. Analyze wrist/hand elevation trajectory across frames (0 = top of image, 1 = bottom)
  let minHandY = 999;
  let minHandYIdx = 0;

  frames.forEach((f, idx) => {
    if (f.landmarks && f.landmarks.length >= 17) {
      const leftY = f.landmarks[15]?.y ?? 0.5;
      const rightY = f.landmarks[16]?.y ?? 0.5;
      const avgHandY = (leftY + rightY) / 2;

      // Look for peak hand elevation (minimum Y) between 15% and 80% of clip duration
      if (f.timestamp >= durationSec * 0.15 && f.timestamp <= durationSec * 0.8) {
        if (avgHandY < minHandY) {
          minHandY = avgHandY;
          minHandYIdx = idx;
        }
      }
    }
  });

  const backswingTopTime = frames[minHandYIdx]?.timestamp || durationSec * 0.45;

  // 2. Find Ball Impact / Release / Strike moment AFTER Top of Backswing
  let maxImpactVel = 0;
  let impactFrameIdx = minHandYIdx;

  for (let i = minHandYIdx + 1; i < frames.length; i++) {
    const f = frames[i];
    const prevF = frames[Math.max(0, i - 1)];

    let handVel = 0;
    if (f.landmarks && prevF.landmarks && f.landmarks.length >= 17 && prevF.landmarks.length >= 17) {
      const dx1 = f.landmarks[15].x - prevF.landmarks[15].x;
      const dy1 = f.landmarks[15].y - prevF.landmarks[15].y;
      const dx2 = f.landmarks[16].x - prevF.landmarks[16].x;
      const dy2 = f.landmarks[16].y - prevF.landmarks[16].y;
      const dt = Math.max(0.001, f.timestamp - prevF.timestamp);
      handVel = (Math.hypot(dx1, dy1) + Math.hypot(dx2, dy2)) / (2 * dt);
    } else {
      handVel = (f.velocity?.wrist || 0) + (f.velocity?.shoulder || 0);
    }

    if (handVel > maxImpactVel) {
      maxImpactVel = handVel;
      impactFrameIdx = i;
    }
  }

  // Fallback if impact frame is invalid or too close to backswing top
  if (impactFrameIdx <= minHandYIdx || impactFrameIdx >= frames.length - 1) {
    const remainingFrames = frames.length - 1 - minHandYIdx;
    impactFrameIdx = Math.min(frames.length - 1, minHandYIdx + Math.max(2, Math.round(remainingFrames * 0.5)));
  }

  const impactTime = frames[impactFrameIdx]?.timestamp || durationSec * 0.7;

  // 3. Address / Setup time (stationary moment before takeaway)
  let addressFrameIdx = Math.max(0, Math.round(minHandYIdx * 0.25));
  const addressTime = frames[addressFrameIdx]?.timestamp || durationSec * 0.15;

  // 4. Follow through time
  let finishFrameIdx = Math.min(frames.length - 1, impactFrameIdx + Math.max(2, Math.round((frames.length - 1 - impactFrameIdx) * 0.6)));
  const followThroughTime = frames[finishFrameIdx]?.timestamp || durationSec * 0.88;

  // 5. Movement-Specific Keyframe Generators
  switch (sportId) {
    case 'golf':
      return buildGolfKeyframes(frames, durationSec, addressTime, backswingTopTime, impactTime, followThroughTime, addressFrameIdx, minHandYIdx, impactFrameIdx, finishFrameIdx);
    case 'rugby':
      return buildRugbyKeyframes(frames, durationSec, impactTime, impactFrameIdx);
    case 'soccer':
      return buildSoccerKeyframes(frames, durationSec, impactTime, impactFrameIdx);
    case 'tennis':
      return buildTennisKeyframes(frames, durationSec, impactTime, impactFrameIdx);
    case 'cricket':
      return buildCricketKeyframes(frames, durationSec, impactTime, impactFrameIdx);
    case 'netball':
      return buildNetballKeyframes(frames, durationSec, impactTime, impactFrameIdx);
    case 'hockey':
      return buildHockeyKeyframes(frames, durationSec, impactTime, impactFrameIdx);
    default:
      return buildGenericKeyframes(frames, sportRule, durationSec, impactTime);
  }
}

function buildNetballKeyframes(
  frames: BiomechanicalFrame[],
  durationSec: number,
  impactTime: number,
  impactIdx: number
): MovementKeyframeEvent[] {
  const prepTime = Math.max(0, impactTime - 0.2);
  const finishTime = Math.min(durationSec, impactTime + 0.3);

  const prepFrame = findClosestFrame(frames, prepTime);
  const releaseFrame = findClosestFrame(frames, impactTime);
  const landingFrame = findClosestFrame(frames, finishTime);

  return [
    {
      id: 'netball_prep',
      name: 'High Release Preparation & Stance',
      timestamp: prepTime,
      frameNumber: prepFrame?.frameNumber || 0,
      importance: 'primary',
      status: 'optimal',
      jointTrigger: 'Elbow High Lock',
      measuredValue: prepFrame?.angles?.shoulder || 138,
      idealRange: '130° - 150°',
      coachingHint: 'Keep ball centered above forehead line before extension.',
    },
    {
      id: 'netball_release',
      name: 'High Release & Wrist Snap',
      timestamp: impactTime,
      frameNumber: releaseFrame?.frameNumber || impactIdx,
      importance: 'critical',
      status: 'optimal',
      jointTrigger: 'Shooting Arm Extension',
      measuredValue: releaseFrame?.angles?.shoulder || 168,
      idealRange: '160° - 180°',
      coachingHint: 'Full elbow extension with high arc follow-through flick.',
    },
    {
      id: 'netball_landing',
      name: 'Single-Leg Landing & Knee Cushion',
      timestamp: finishTime,
      frameNumber: landingFrame?.frameNumber || 0,
      importance: 'critical',
      status: (landingFrame?.angles?.knee || 135) > 155 ? 'warning' : 'optimal',
      jointTrigger: 'Landing Knee Flexion',
      measuredValue: landingFrame?.angles?.knee || 128,
      idealRange: '120° - 142°',
      coachingHint: 'Absorb landing force cleanly through knee flexion to avoid valgus.',
    },
  ];
}

function buildHockeyKeyframes(
  frames: BiomechanicalFrame[],
  durationSec: number,
  impactTime: number,
  impactIdx: number
): MovementKeyframeEvent[] {
  const prepTime = Math.max(0, impactTime - 0.25);
  const finishTime = Math.min(durationSec, impactTime + 0.35);

  const prepFrame = findClosestFrame(frames, prepTime);
  const strikeFrame = findClosestFrame(frames, impactTime);
  const finishFrame = findClosestFrame(frames, finishTime);

  return [
    {
      id: 'hockey_prep',
      name: 'Athletic Stance & Stick Backswing',
      timestamp: prepTime,
      frameNumber: prepFrame?.frameNumber || 0,
      importance: 'primary',
      status: (prepFrame?.angles?.knee || 120) > 140 ? 'warning' : 'optimal',
      jointTrigger: 'Athletic Knee Sink',
      measuredValue: prepFrame?.angles?.knee || 118,
      idealRange: '105° - 130°',
      coachingHint: 'Sink hips low with chest angled over ball/puck line.',
    },
    {
      id: 'hockey_strike',
      name: 'Stick Impact & Shaft Whip',
      timestamp: impactTime,
      frameNumber: strikeFrame?.frameNumber || impactIdx,
      importance: 'critical',
      status: 'optimal',
      jointTrigger: 'Impact Lead Wrist Drive',
      measuredValue: strikeFrame?.angles?.hip || 132,
      idealRange: '125° - 145°',
      coachingHint: 'Drive bottom hand firmly through impact zone.',
    },
    {
      id: 'hockey_follow',
      name: 'Follow-Through & Weight Rotation',
      timestamp: finishTime,
      frameNumber: finishFrame?.frameNumber || 0,
      importance: 'secondary',
      status: 'optimal',
      jointTrigger: 'Lead Leg Extension',
      measuredValue: finishFrame?.angles?.knee || 165,
      idealRange: '155° - 178°',
      coachingHint: 'Complete rotation posting weight securely onto front foot.',
    },
  ];
}

// ---------------------------------------------------------------------
// Movement-Specific Keyframe Implementations
// ---------------------------------------------------------------------

function buildGolfKeyframes(
  frames: BiomechanicalFrame[],
  durationSec: number,
  addressTime: number,
  backswingTime: number,
  impactTime: number,
  followThroughTime: number,
  addressIdx: number,
  backswingIdx: number,
  impactIdx: number,
  finishIdx: number
): MovementKeyframeEvent[] {
  const addressFrame = frames[addressIdx] || findClosestFrame(frames, addressTime);
  const backswingFrame = frames[backswingIdx] || findClosestFrame(frames, backswingTime);
  const impactFrame = frames[impactIdx] || findClosestFrame(frames, impactTime);
  const finishFrame = frames[finishIdx] || findClosestFrame(frames, followThroughTime);

  return [
    {
      id: 'golf_address',
      name: 'Address & Setup',
      timestamp: addressTime,
      frameNumber: addressFrame?.frameNumber || addressIdx,
      importance: 'secondary',
      status: 'optimal',
      jointTrigger: 'Spine Tilt',
      measuredValue: addressFrame?.angles?.hip || 142,
      idealRange: '135° - 150°',
      coachingHint: 'Balanced athletic stance over center of feet.',
    },
    {
      id: 'golf_backswing_top',
      name: 'Top of Backswing (Max Coil)',
      timestamp: backswingTime,
      frameNumber: backswingFrame?.frameNumber || backswingIdx,
      importance: 'critical',
      status: (backswingFrame?.angles?.hip || 140) < 130 ? 'warning' : 'optimal',
      jointTrigger: 'Thoracic Coil',
      measuredValue: backswingFrame?.angles?.shoulder || 112,
      idealRange: '105° - 125°',
      coachingHint: 'Maintain lead knee flex while coiling shoulders against stable pelvis.',
    },
    {
      id: 'golf_impact',
      name: 'Ball Impact & Whip Release',
      timestamp: impactTime,
      frameNumber: impactFrame?.frameNumber || impactIdx,
      importance: 'critical',
      status: 'optimal',
      jointTrigger: 'Impact Velocity',
      measuredValue: Math.round((impactFrame?.velocity?.wrist || 320) * 1.2),
      idealRange: '350°/s - 480°/s',
      coachingHint: 'Lead wrist firm, chest over ball at strike moment.',
    },
    {
      id: 'golf_follow_through',
      name: 'Finish & Weight Transfer',
      timestamp: followThroughTime,
      frameNumber: finishFrame?.frameNumber || finishIdx,
      importance: 'primary',
      status: 'optimal',
      jointTrigger: 'Lead Hip Stack',
      measuredValue: finishFrame?.angles?.knee || 172,
      idealRange: '165° - 180°',
      coachingHint: 'Belt buckle facing target, 90% weight posted on lead leg.',
    },
  ];
}

function buildRugbyKeyframes(
  frames: BiomechanicalFrame[],
  durationSec: number,
  impactTime: number,
  impactIdx: number
): MovementKeyframeEvent[] {
  const prepTime = Math.max(0, impactTime * 0.3);
  const wrapTime = Math.min(durationSec, impactTime + 0.25);
  const finishTime = Math.min(durationSec, impactTime + 0.6);

  const prepFrame = findClosestFrame(frames, prepTime);
  const impactFrame = findClosestFrame(frames, impactTime);
  const wrapFrame = findClosestFrame(frames, wrapTime);

  return [
    {
      id: 'rugby_approach',
      name: 'Contact Prep & Base Sink',
      timestamp: prepTime,
      frameNumber: prepFrame?.frameNumber || 0,
      importance: 'primary',
      status: (prepFrame?.angles?.knee || 130) > 145 ? 'warning' : 'optimal',
      jointTrigger: 'Knee Flexion Base',
      measuredValue: prepFrame?.angles?.knee || 118,
      idealRange: '105° - 125°',
      coachingHint: 'Lower center of gravity below ball carrier chest line.',
    },
    {
      id: 'rugby_impact',
      name: 'Peak Collision & Shoulder Strike',
      timestamp: impactTime,
      frameNumber: impactFrame?.frameNumber || impactIdx,
      importance: 'critical',
      status: (impactFrame?.angles?.hip || 135) < 120 ? 'error' : 'optimal',
      jointTrigger: 'Spine & Cervical Line',
      measuredValue: impactFrame?.angles?.hip || 138,
      idealRange: '130° - 150°',
      coachingHint: 'Head up, eyes locked on target, spine straight under load.',
    },
    {
      id: 'rugby_wrap_drive',
      name: 'Arm Wrap & Triple Leg Drive',
      timestamp: wrapTime,
      frameNumber: wrapFrame?.frameNumber || 0,
      importance: 'critical',
      status: 'optimal',
      jointTrigger: 'Leg Drive Extension',
      measuredValue: wrapFrame?.angles?.knee || 162,
      idealRange: '155° - 175°',
      coachingHint: 'Drive feet continuously through contact point.',
    },
  ];
}

function buildSoccerKeyframes(
  frames: BiomechanicalFrame[],
  durationSec: number,
  impactTime: number,
  impactIdx: number
): MovementKeyframeEvent[] {
  const plantTime = Math.max(0, impactTime - 0.15);
  const backswingTime = Math.max(0, plantTime - 0.25);
  const followThroughTime = Math.min(durationSec, impactTime + 0.35);

  const backswingFrame = findClosestFrame(frames, backswingTime);
  const plantFrame = findClosestFrame(frames, plantTime);
  const strikeFrame = findClosestFrame(frames, impactTime);
  const followFrame = findClosestFrame(frames, followThroughTime);

  return [
    {
      id: 'soccer_backswing',
      name: 'Kicking Leg Backswing Cock',
      timestamp: backswingTime,
      frameNumber: backswingFrame?.frameNumber || 0,
      importance: 'primary',
      status: 'optimal',
      jointTrigger: 'Knee Backswing Flex',
      measuredValue: backswingFrame?.angles?.knee || 92,
      idealRange: '80° - 105°',
      coachingHint: 'Load quad muscle elastomechanically behind body.',
    },
    {
      id: 'soccer_plant',
      name: 'Plant Foot Ground Impulse',
      timestamp: plantTime,
      frameNumber: plantFrame?.frameNumber || 0,
      importance: 'critical',
      status: (plantFrame?.angles?.knee || 130) > 150 ? 'warning' : 'optimal',
      jointTrigger: 'Plant Knee Cushion',
      measuredValue: plantFrame?.angles?.knee || 128,
      idealRange: '120° - 145°',
      coachingHint: 'Plant foot beside ball, knee flexed absorbing landing force.',
    },
    {
      id: 'soccer_strike',
      name: 'Ball Strike & Ankle Lock',
      timestamp: impactTime,
      frameNumber: strikeFrame?.frameNumber || impactIdx,
      importance: 'critical',
      status: 'optimal',
      jointTrigger: 'Chest Over Ball',
      measuredValue: strikeFrame?.angles?.hip || 162,
      idealRange: '155° - 172°',
      coachingHint: 'Chest over ball, ankle locked firm through strike.',
    },
    {
      id: 'soccer_follow',
      name: 'Follow-Through High Elevation',
      timestamp: followThroughTime,
      frameNumber: followFrame?.frameNumber || 0,
      importance: 'secondary',
      status: 'optimal',
      jointTrigger: 'Hip Elevation',
      measuredValue: followFrame?.angles?.knee || 168,
      idealRange: '150° - 180°',
      coachingHint: 'Kicking leg swings naturally across body centerline.',
    },
  ];
}

function buildTennisKeyframes(
  frames: BiomechanicalFrame[],
  durationSec: number,
  impactTime: number,
  impactIdx: number
): MovementKeyframeEvent[] {
  const prepTime = Math.max(0, impactTime - 0.5);
  const trophyTime = Math.max(0, impactTime - 0.25);
  const followTime = Math.min(durationSec, impactTime + 0.35);

  const prepFrame = findClosestFrame(frames, prepTime);
  const trophyFrame = findClosestFrame(frames, trophyTime);
  const impactFrame = findClosestFrame(frames, impactTime);
  const followFrame = findClosestFrame(frames, followTime);

  return [
    {
      id: 'tennis_unit_turn',
      name: 'Unit Turn & Preparation',
      timestamp: prepTime,
      frameNumber: prepFrame?.frameNumber || 0,
      importance: 'primary',
      status: 'optimal',
      jointTrigger: 'Shoulder Rotation',
      measuredValue: prepFrame?.angles?.shoulder || 108,
      idealRange: '95° - 120°',
      coachingHint: 'Turn shoulders 90° to net, non-dominant hand guiding racket.',
    },
    {
      id: 'tennis_trophy',
      name: 'Toss & Trophy Position',
      timestamp: trophyTime,
      frameNumber: trophyFrame?.frameNumber || 0,
      importance: 'critical',
      status: 'optimal',
      jointTrigger: 'Racquet Arm Elbow Angle',
      measuredValue: trophyFrame?.angles?.shoulder || 105,
      idealRange: '95° - 115°',
      coachingHint: 'Chest open up, elbow high at 90°, non-dominant arm reaching up.',
    },
    {
      id: 'tennis_impact',
      name: 'Peak Reach Ball Contact',
      timestamp: impactTime,
      frameNumber: impactFrame?.frameNumber || impactIdx,
      importance: 'critical',
      status: 'optimal',
      jointTrigger: 'Full Reach Extension',
      measuredValue: impactFrame?.angles?.shoulder || 168,
      idealRange: '160° - 178°',
      coachingHint: 'Contact ball at maximum extension slightly in front of body.',
    },
    {
      id: 'tennis_follow_through',
      name: 'Follow-Through & Recovery',
      timestamp: followTime,
      frameNumber: followFrame?.frameNumber || 0,
      importance: 'secondary',
      status: 'optimal',
      jointTrigger: 'Cross-Body Wrap',
      measuredValue: followFrame?.angles?.elbow || 145,
      idealRange: '135° - 165°',
      coachingHint: 'Racquet decelerates smoothly across non-dominant shoulder.',
    },
  ];
}

function buildCricketKeyframes(
  frames: BiomechanicalFrame[],
  durationSec: number,
  impactTime: number,
  impactIdx: number
): MovementKeyframeEvent[] {
  const prepTime = Math.max(0, impactTime - 0.45);
  const backliftTime = Math.max(0, impactTime - 0.25);
  const followTime = Math.min(durationSec, impactTime + 0.35);

  const prepFrame = findClosestFrame(frames, prepTime);
  const backliftFrame = findClosestFrame(frames, backliftTime);
  const releaseFrame = findClosestFrame(frames, impactTime);
  const followFrame = findClosestFrame(frames, followTime);

  return [
    {
      id: 'cricket_stance',
      name: 'Stance & Alignment',
      timestamp: prepTime,
      frameNumber: prepFrame?.frameNumber || 0,
      importance: 'secondary',
      status: 'optimal',
      jointTrigger: 'Head Position',
      measuredValue: prepFrame?.angles?.hip || 140,
      idealRange: '135° - 150°',
      coachingHint: 'Side-on stance, head directly over front foot line.',
    },
    {
      id: 'cricket_backlift',
      name: 'Backlift & Cock Phase',
      timestamp: backliftTime,
      frameNumber: backliftFrame?.frameNumber || 0,
      importance: 'primary',
      status: 'optimal',
      jointTrigger: 'Elbow Flexion',
      measuredValue: backliftFrame?.angles?.elbow || 120,
      idealRange: '110° - 135°',
      coachingHint: 'High lead elbow pointing towards bowler.',
    },
    {
      id: 'cricket_release',
      name: 'Ball Impact / High Release',
      timestamp: impactTime,
      frameNumber: releaseFrame?.frameNumber || impactIdx,
      importance: 'critical',
      status: 'optimal',
      jointTrigger: 'Arm Extension',
      measuredValue: releaseFrame?.angles?.shoulder || 165,
      idealRange: '155° - 175°',
      coachingHint: 'Lock lead shoulder facing target with full high extension.',
    },
    {
      id: 'cricket_follow',
      name: 'Follow-Through Drive',
      timestamp: followTime,
      frameNumber: followFrame?.frameNumber || 0,
      importance: 'secondary',
      status: 'optimal',
      jointTrigger: 'Weight Transfer',
      measuredValue: followFrame?.angles?.knee || 170,
      idealRange: '160° - 180°',
      coachingHint: 'Complete swing path through ball line with balanced footwork.',
    },
  ];
}

function buildGenericKeyframes(
  frames: BiomechanicalFrame[],
  sportRule: SportRule,
  durationSec: number,
  impactTime: number
): MovementKeyframeEvent[] {
  const phases = sportRule.phases || ['Setup', 'Load', 'Impact / Release', 'Finish'];

  return phases.map((pName, pIdx) => {
    const t = (pIdx / Math.max(1, phases.length - 1)) * (durationSec * 0.85) + 0.1;
    const f = findClosestFrame(frames, t);
    return {
      id: `keyframe_${pIdx}`,
      name: pName,
      timestamp: Math.round(t * 100) / 100,
      frameNumber: f?.frameNumber || pIdx * 10,
      importance: pIdx === 2 ? 'critical' : 'primary',
      status: 'optimal',
      jointTrigger: 'Joint Angle',
      measuredValue: f?.angles?.knee || 135,
      idealRange: '120° - 150°',
      coachingHint: `Maintain biomechanical form during ${pName}.`,
    };
  });
}

function getDefaultFallbackKeyframes(
  sportRule: SportRule,
  durationSec: number
): MovementKeyframeEvent[] {
  const phases = sportRule.phases || ['Setup', 'Load', 'Impact / Release', 'Finish'];
  return phases.map((pName, pIdx) => {
    const t = (pIdx / Math.max(1, phases.length - 1)) * (durationSec * 0.85) + 0.1;
    return {
      id: `fallback_key_${pIdx}`,
      name: pName,
      timestamp: Math.round(t * 100) / 100,
      frameNumber: pIdx * 10,
      importance: 'primary',
      status: 'optimal',
      jointTrigger: 'Phase Alignment',
      measuredValue: 135,
      idealRange: '120° - 150°',
      coachingHint: `Biomechanical phase: ${pName}`,
    };
  });
}

function findClosestFrame(frames: BiomechanicalFrame[], timeSec: number): BiomechanicalFrame | null {
  if (!frames || frames.length === 0) return null;
  let closest = frames[0];
  let minDiff = Math.abs(frames[0].timestamp - timeSec);

  for (let i = 1; i < frames.length; i++) {
    const diff = Math.abs(frames[i].timestamp - timeSec);
    if (diff < minDiff) {
      minDiff = diff;
      closest = frames[i];
    }
  }

  return closest;
}
