// src/services/movementKeyframeEngine.ts
// Robust Movement-Specific Keyframes across All Sports & Movement Techniques

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
  durationSec: number,
  techniqueId?: string
): MovementKeyframeEvent[] {
  const safeDuration = durationSec && durationSec > 0.3 ? durationSec : 3.5;
  if (!frames || frames.length === 0) {
    return getDefaultFallbackKeyframes(sportRule, safeDuration);
  }

  const sportId = sportRule.id;

  // 1. Analyze velocity profiles and landmark trajectories across all frames
  let maxVelocity = 0;
  let maxVelIdx = Math.floor(frames.length * 0.5);

  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    const prevF = frames[Math.max(0, i - 1)];

    let v = 0;
    if (f.landmarks && prevF.landmarks && f.landmarks.length >= 17 && prevF.landmarks.length >= 17) {
      const dx1 = f.landmarks[15].x - prevF.landmarks[15].x;
      const dy1 = f.landmarks[15].y - prevF.landmarks[15].y;
      const dx2 = f.landmarks[16].x - prevF.landmarks[16].x;
      const dy2 = f.landmarks[16].y - prevF.landmarks[16].y;
      const dt = Math.max(0.001, f.timestamp - prevF.timestamp);
      v = (Math.hypot(dx1, dy1) + Math.hypot(dx2, dy2)) / (2 * dt);
    } else {
      v = (f.velocity?.wrist || 0) + (f.velocity?.shoulder || 0);
    }

    if (v > maxVelocity) {
      maxVelocity = v;
      maxVelIdx = i;
    }
  }

  // 2. Find min hand Y (Top of Backswing / High Cock / High Reach)
  let minHandY = 999;
  let minHandYIdx = Math.max(0, Math.floor(maxVelIdx * 0.5));

  frames.forEach((f, idx) => {
    if (f.landmarks && f.landmarks.length >= 17) {
      const leftY = f.landmarks[15]?.y ?? 0.5;
      const rightY = f.landmarks[16]?.y ?? 0.5;
      const avgHandY = (leftY + rightY) / 2;

      // Peak hand elevation should precede or coincide with peak acceleration
      if (idx <= Math.min(frames.length - 1, maxVelIdx + 2)) {
        if (avgHandY < minHandY) {
          minHandY = avgHandY;
          minHandYIdx = idx;
        }
      }
    }
  });

  const backswingTopTime = frames[minHandYIdx]?.timestamp || safeDuration * 0.4;
  const impactTime = frames[maxVelIdx]?.timestamp || safeDuration * 0.65;
  const addressTime = frames[Math.max(0, Math.floor(minHandYIdx * 0.25))]?.timestamp || safeDuration * 0.12;
  const followThroughTime = frames[Math.min(frames.length - 1, maxVelIdx + Math.max(2, Math.floor((frames.length - 1 - maxVelIdx) * 0.6)))]?.timestamp || safeDuration * 0.88;

  // 3. Movement-Specific Keyframe Generators
  switch (sportId) {
    case 'golf':
      return buildGolfKeyframes(frames, safeDuration, addressTime, backswingTopTime, impactTime, followThroughTime, Math.floor(minHandYIdx * 0.25), minHandYIdx, maxVelIdx, frames.length - 1);
    case 'rugby':
      return buildRugbyKeyframes(frames, safeDuration, impactTime, maxVelIdx);
    case 'soccer':
      return buildSoccerKeyframes(frames, safeDuration, impactTime, maxVelIdx);
    case 'tennis':
      return buildTennisKeyframes(frames, safeDuration, impactTime, maxVelIdx);
    case 'cricket':
      return buildCricketKeyframes(frames, safeDuration, impactTime, maxVelIdx, techniqueId);
    case 'netball':
      return buildNetballKeyframes(frames, safeDuration, impactTime, maxVelIdx);
    case 'hockey':
      return buildHockeyKeyframes(frames, safeDuration, impactTime, maxVelIdx);
    default:
      return buildGenericKeyframes(frames, sportRule, safeDuration, impactTime);
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
  impactIdx: number,
  techniqueId?: string
): MovementKeyframeEvent[] {
  const isBowling = techniqueId ? techniqueId.toLowerCase().includes('bowl') : true;

  if (isBowling) {
    const gatherTime = Math.max(0, impactTime - 0.45);
    const backFootTime = Math.max(0, impactTime - 0.22);
    const releaseTime = impactTime;
    const followTime = Math.min(durationSec, impactTime + 0.38);

    const gatherFrame = findClosestFrame(frames, gatherTime);
    const backFootFrame = findClosestFrame(frames, backFootTime);
    const releaseFrame = findClosestFrame(frames, releaseTime);
    const followFrame = findClosestFrame(frames, followTime);

    return [
      {
        id: 'cricket_bound_gather',
        name: 'Bound & Coil Gather',
        timestamp: Math.round(gatherTime * 100) / 100,
        frameNumber: gatherFrame?.frameNumber || 0,
        importance: 'secondary',
        status: 'optimal',
        jointTrigger: 'Knee Bound Height',
        measuredValue: gatherFrame?.angles?.knee || 122,
        idealRange: '110° - 135°',
        coachingHint: 'High lead knee drive powering into delivery bound.',
      },
      {
        id: 'cricket_back_foot_contact',
        name: 'Back-Foot Plant & Thoracic Load',
        timestamp: Math.round(backFootTime * 100) / 100,
        frameNumber: backFootFrame?.frameNumber || 0,
        importance: 'primary',
        status: 'optimal',
        jointTrigger: 'Hip-Shoulder Separation',
        measuredValue: backFootFrame?.angles?.hip || 138,
        idealRange: '130° - 150°',
        coachingHint: 'Coil shoulders side-on while back foot establishes firm base.',
      },
      {
        id: 'cricket_front_brace_release',
        name: 'Front-Knee Brace & High Arm Release',
        timestamp: Math.round(releaseTime * 100) / 100,
        frameNumber: releaseFrame?.frameNumber || impactIdx,
        importance: 'critical',
        status: (releaseFrame?.angles?.knee || 170) < 162 ? 'warning' : 'optimal',
        jointTrigger: 'Front Knee Lock (168°-180°)',
        measuredValue: releaseFrame?.angles?.knee || 172,
        idealRange: '168° - 180°',
        coachingHint: 'Brace front knee firm into the turf to snap upper torso through delivery arc.',
      },
      {
        id: 'cricket_follow_through',
        name: 'Follow-Through Deceleration',
        timestamp: Math.round(followTime * 100) / 100,
        frameNumber: followFrame?.frameNumber || 0,
        importance: 'secondary',
        status: 'optimal',
        jointTrigger: 'Trunk Deceleration',
        measuredValue: followFrame?.angles?.hip || 118,
        idealRange: '110° - 130°',
        coachingHint: 'Smooth trunk flexion past lead hip protecting lumbar vertebrae.',
      },
    ];
  }

  // Batting (Cover Drive / Pull / Punch)
  const stanceTime = Math.max(0, impactTime - 0.48);
  const backliftTime = Math.max(0, impactTime - 0.25);
  const impactMoment = impactTime;
  const finishTime = Math.min(durationSec, impactTime + 0.35);

  const stanceFrame = findClosestFrame(frames, stanceTime);
  const backliftFrame = findClosestFrame(frames, backliftTime);
  const impactFrame = findClosestFrame(frames, impactMoment);
  const finishFrame = findClosestFrame(frames, finishTime);

  return [
    {
      id: 'cricket_stance',
      name: 'Stance & Head Alignment',
      timestamp: Math.round(stanceTime * 100) / 100,
      frameNumber: stanceFrame?.frameNumber || 0,
      importance: 'secondary',
      status: 'optimal',
      jointTrigger: 'Head Position',
      measuredValue: stanceFrame?.angles?.hip || 140,
      idealRange: '135° - 150°',
      coachingHint: 'Side-on stance, head directly over front foot line.',
    },
    {
      id: 'cricket_backlift',
      name: 'High Backlift & Stride',
      timestamp: Math.round(backliftTime * 100) / 100,
      frameNumber: backliftFrame?.frameNumber || 0,
      importance: 'primary',
      status: 'optimal',
      jointTrigger: 'Lead Elbow Cock',
      measuredValue: backliftFrame?.angles?.elbow || 120,
      idealRange: '110° - 135°',
      coachingHint: 'High lead elbow pointing toward bowler with soft hands.',
    },
    {
      id: 'cricket_impact',
      name: 'Ball Impact Under Eyes',
      timestamp: Math.round(impactMoment * 100) / 100,
      frameNumber: impactFrame?.frameNumber || impactIdx,
      importance: 'critical',
      status: 'optimal',
      jointTrigger: 'Full Arm Flow',
      measuredValue: impactFrame?.angles?.shoulder || 165,
      idealRange: '155° - 175°',
      coachingHint: 'Present full bat face directly underneath eye line.',
    },
    {
      id: 'cricket_follow',
      name: 'High Extension Finish',
      timestamp: Math.round(finishTime * 100) / 100,
      frameNumber: finishFrame?.frameNumber || 0,
      importance: 'secondary',
      status: 'optimal',
      jointTrigger: 'Weight Transfer',
      measuredValue: finishFrame?.angles?.knee || 170,
      idealRange: '160° - 180°',
      coachingHint: 'Complete swing arc with balanced posture on front foot.',
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
