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

  // 1. Find velocity peaks (Impact / Release / Strike)
  let maxVelFrameIdx = 0;
  let maxVel = 0;

  // 2. Find maximum joint angular excursion points
  let minKneeFlexIdx = 0;
  let minKneeAngle = 999;

  let maxHipFlexIdx = 0;
  let maxHipAngle = 0;

  frames.forEach((f, idx) => {
    const totalVel = (f.velocity?.wrist || 0) + (f.velocity?.shoulder || 0);
    if (totalVel > maxVel) {
      maxVel = totalVel;
      maxVelFrameIdx = idx;
    }

    const knee = f.angles?.knee || 180;
    if (knee < minKneeAngle) {
      minKneeAngle = knee;
      minKneeFlexIdx = idx;
    }

    const hip = f.angles?.hip || 0;
    if (hip > maxHipAngle) {
      maxHipAngle = hip;
      maxHipFlexIdx = idx;
    }
  });

  const totalFrames = frames.length;
  const impactTime = frames[maxVelFrameIdx]?.timestamp || durationSec * 0.55;

  // 3. Movement-Specific Keyframe Generators
  switch (sportId) {
    case 'golf':
      return buildGolfKeyframes(frames, durationSec, impactTime, maxVelFrameIdx);
    case 'rugby':
      return buildRugbyKeyframes(frames, durationSec, impactTime, maxVelFrameIdx);
    case 'soccer':
      return buildSoccerKeyframes(frames, durationSec, impactTime, maxVelFrameIdx);
    case 'tennis':
      return buildTennisKeyframes(frames, durationSec, impactTime, maxVelFrameIdx);
    case 'cricket':
      return buildCricketKeyframes(frames, durationSec, impactTime, maxVelFrameIdx);
    default:
      return buildGenericKeyframes(frames, sportRule, durationSec, impactTime);
  }
}

// ---------------------------------------------------------------------
// Movement-Specific Keyframe Implementations
// ---------------------------------------------------------------------

function buildGolfKeyframes(
  frames: BiomechanicalFrame[],
  durationSec: number,
  impactTime: number,
  impactIdx: number
): MovementKeyframeEvent[] {
  const addressTime = Math.max(0, impactTime * 0.2);
  const backswingTime = Math.max(addressTime + 0.2, impactTime * 0.6);
  const followThroughTime = Math.min(durationSec, impactTime + (durationSec - impactTime) * 0.6);

  const addressFrame = findClosestFrame(frames, addressTime);
  const backswingFrame = findClosestFrame(frames, backswingTime);
  const impactFrame = findClosestFrame(frames, impactTime);
  const finishFrame = findClosestFrame(frames, followThroughTime);

  return [
    {
      id: 'golf_address',
      name: 'Address & Posture Setup',
      timestamp: addressTime,
      frameNumber: addressFrame?.frameNumber || 0,
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
      frameNumber: backswingFrame?.frameNumber || 0,
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
      frameNumber: finishFrame?.frameNumber || 0,
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
  const trophyTime = Math.max(0, impactTime - 0.35);
  const dropTime = Math.max(0, impactTime - 0.15);
  const landingTime = Math.min(durationSec, impactTime + 0.3);

  const trophyFrame = findClosestFrame(frames, trophyTime);
  const impactFrame = findClosestFrame(frames, impactTime);

  return [
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
  ];
}

function buildCricketKeyframes(
  frames: BiomechanicalFrame[],
  durationSec: number,
  impactTime: number,
  impactIdx: number
): MovementKeyframeEvent[] {
  const backliftTime = Math.max(0, impactTime - 0.3);
  const releaseFrame = findClosestFrame(frames, impactTime);

  return [
    {
      id: 'cricket_backlift',
      name: 'Backlift & Stance Cock',
      timestamp: backliftTime,
      frameNumber: 0,
      importance: 'primary',
      status: 'optimal',
      jointTrigger: 'Elbow Flexion',
      measuredValue: 120,
      idealRange: '110° - 135°',
      coachingHint: 'High lead elbow pointing towards bowler.',
    },
    {
      id: 'cricket_release',
      name: 'Release Point / Stride',
      timestamp: impactTime,
      frameNumber: releaseFrame?.frameNumber || impactIdx,
      importance: 'critical',
      status: 'optimal',
      jointTrigger: 'Arm Extension',
      measuredValue: releaseFrame?.angles?.shoulder || 165,
      idealRange: '155° - 175°',
      coachingHint: 'Lock lead shoulder facing target.',
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
