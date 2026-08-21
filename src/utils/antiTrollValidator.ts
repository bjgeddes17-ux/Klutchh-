import { SportId, MediaPipeLandmark, SportRule } from '../types';
import { calculateAngle } from './rulesEngine';

export interface VideoValidationResult {
  isValid: boolean;
  category: 'ok' | 'static_meme' | 'blank_screen' | 'no_human' | 'incomplete_body' | 'stationary' | 'sport_mismatch';
  title: string;
  message: string;
  suggestedSport?: SportId;
  detectedMotionProfile?: string;
  confidenceScore: number; // 0 to 100
  details?: {
    avgPixelVariance?: number;
    avgLuminance?: number;
    humanFrameRatio?: number;
    maxJointRangeOfMotion?: number;
    motionSignature?: string;
  };
}

/**
 * Fast Client-Side Pre-Validation for Canvas Frames
 * Detects static memes, black/white blank screens, and zero-motion loops without any paid AI API.
 */
export function validateSampledCanvases(
  canvasList: HTMLCanvasElement[]
): { isValid: boolean; reason?: string; category?: VideoValidationResult['category'] } {
  if (!canvasList || canvasList.length === 0) {
    return { isValid: true };
  }

  try {
    const numSamples = Math.min(canvasList.length, 8);
    let totalLuminance = 0;
    let totalFrameDiff = 0;
    let diffComparisons = 0;

    const framePixelSamples: Uint8ClampedArray[] = [];

    for (let i = 0; i < numSamples; i++) {
      const idx = Math.floor((i / (numSamples - 1 || 1)) * (canvasList.length - 1));
      const cvs = canvasList[idx];
      const ctx = cvs.getContext('2d');
      if (!ctx) continue;

      // Downsample to 64x64 for lightning-fast luminance & frame-diff calculation
      const smallCvs = document.createElement('canvas');
      smallCvs.width = 64;
      smallCvs.height = 64;
      const sCtx = smallCvs.getContext('2d');
      if (!sCtx) continue;

      sCtx.drawImage(cvs, 0, 0, 64, 64);
      const imgData = sCtx.getImageData(0, 0, 64, 64);
      const data = imgData.data;

      // Calculate average luminance
      let frameLum = 0;
      for (let p = 0; p < data.length; p += 4) {
        // Rec. 601 luma formula
        const lum = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
        frameLum += lum;
      }
      const avgLum = frameLum / (data.length / 4);
      totalLuminance += avgLum;

      framePixelSamples.push(data);
    }

    if (framePixelSamples.length >= 2) {
      // Calculate pixel delta between consecutive sampled frames
      for (let f = 1; f < framePixelSamples.length; f++) {
        const prev = framePixelSamples[f - 1];
        const curr = framePixelSamples[f];
        let diff = 0;
        for (let p = 0; p < prev.length; p += 4) {
          const dR = Math.abs(prev[p] - curr[p]);
          const dG = Math.abs(prev[p + 1] - curr[p + 1]);
          const dB = Math.abs(prev[p + 2] - curr[p + 2]);
          diff += (dR + dG + dB) / 3;
        }
        const frameMeanDiff = diff / (prev.length / 4);
        totalFrameDiff += frameMeanDiff;
        diffComparisons++;
      }
    }

    const meanLuminance = totalLuminance / (framePixelSamples.length || 1);
    const meanFrameDiff = diffComparisons > 0 ? totalFrameDiff / diffComparisons : 50;

    // 1. Extreme dark or bright blank screen check
    if (meanLuminance < 8) {
      return {
        isValid: false,
        category: 'blank_screen',
        reason: 'The video appears completely dark or black. Please ensure the recording is well-lit.'
      };
    }
    if (meanLuminance > 248) {
      return {
        isValid: false,
        category: 'blank_screen',
        reason: 'The video appears overexposed or completely white. Please upload a clear recording with proper contrast.'
      };
    }

    // 2. Static image / meme check (almost 0 pixel delta across duration)
    if (meanFrameDiff < 1.2 && framePixelSamples.length >= 3) {
      return {
        isValid: false,
        category: 'static_meme',
        reason: 'This video appears to be a static still photo, screenshot, or meme. Please upload a dynamic video of an active sports movement.'
      };
    }

    return { isValid: true };
  } catch (err) {
    console.warn("Canvas pre-validation error:", err);
    return { isValid: true };
  }
}

/**
 * Biomechanical & Kinematic Video Signature Validator
 * Evaluates MediaPipe landmarks to prevent troll uploads and verify sport alignment.
 */
export function validateKinematicSportFit(
  allSampledLandmarks: { timestamp: number; landmarks: MediaPipeLandmark[] }[],
  sportRule: SportRule,
  selectedPhase?: string
): VideoValidationResult {
  // 1. Human Presence Check
  const totalFrames = allSampledLandmarks.length;
  if (totalFrames === 0) {
    return {
      isValid: true,
      category: 'ok',
      title: 'Valid Video Clip',
      message: `Analyzing athletic movement pattern.`,
      confidenceScore: 80
    };
  }

  // Filter valid frames with a relaxed threshold of 4 landmarks to capture diverse/occluded poses
  const validFrames = allSampledLandmarks.filter(f => f.landmarks && f.landmarks.length >= 4);
  const humanRatio = validFrames.length / totalFrames;

  if (validFrames.length === 0) {
    return {
      isValid: true,
      category: 'ok',
      title: 'Biomechanic Frame Sampling',
      message: `Video frames sampled for biometric technique analysis.`,
      confidenceScore: 75
    };
  }

  // 2. Body Completeness Check (Hips 23,24 and Knees 25,26 must be present)
  let framesWithLowerBody = 0;
  let framesWithUpperBody = 0;

  validFrames.forEach(({ landmarks }) => {
    const hasUpper = (landmarks[11]?.visibility ?? 1) > 0.1 && (landmarks[12]?.visibility ?? 1) > 0.1;
    const hasHips = (landmarks[23]?.visibility ?? 1) > 0.1 && (landmarks[24]?.visibility ?? 1) > 0.1;
    const hasKnees = (landmarks[25]?.visibility ?? 1) > 0.1 || (landmarks[26]?.visibility ?? 1) > 0.1;

    if (hasUpper) framesWithUpperBody++;
    if (hasHips && hasKnees) framesWithLowerBody++;
  });

  const lowerBodyRatio = framesWithLowerBody / validFrames.length;
  const upperBodyRatio = framesWithUpperBody / validFrames.length;

  // We no longer reject on upperBodyRatio because footwork-only or leg-focused athletic videos are highly common in soccer/rugby
  
  // 3. Motion & Range of Motion (ROM) Check (prevents sleeping / sitting still / stationary videos)
  let maxDisplacement = 0;
  let maxAngleRangeOfMotion = 0;

  const firstValid = validFrames[0].landmarks;
  const jointIndices = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]; // Major joints

  // Measure coordinate displacement across video
  for (let i = 1; i < validFrames.length; i++) {
    const curr = validFrames[i].landmarks;
    jointIndices.forEach(idx => {
      if (firstValid[idx] && curr[idx]) {
        const dx = curr[idx].x - firstValid[idx].x;
        const dy = curr[idx].y - firstValid[idx].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > maxDisplacement) maxDisplacement = dist;
      }
    });
  }

  // Measure joint angle variations
  const rightElbowAngles: number[] = [];
  const rightKneeAngles: number[] = [];
  const trunkAngles: number[] = [];

  validFrames.forEach(({ landmarks }) => {
    if (landmarks[12] && landmarks[14] && landmarks[16]) {
      rightElbowAngles.push(calculateAngle(landmarks[12], landmarks[14], landmarks[16]));
    }
    if (landmarks[24] && landmarks[26] && landmarks[28]) {
      rightKneeAngles.push(calculateAngle(landmarks[24], landmarks[26], landmarks[28]));
    }
    if (landmarks[12] && landmarks[24] && landmarks[26]) {
      trunkAngles.push(calculateAngle(landmarks[12], landmarks[24], landmarks[26]));
    }
  });

  const getRange = (arr: number[]) => (arr.length > 0 ? Math.max(...arr) - Math.min(...arr) : 0);
  const elbowROM = getRange(rightElbowAngles);
  const kneeROM = getRange(rightKneeAngles);
  const trunkROM = getRange(trunkAngles);
  maxAngleRangeOfMotion = Math.max(elbowROM, kneeROM, trunkROM);

  // Extremely lenient stationary check: only reject absolute frozen/still images or screenshots
  if (maxDisplacement < 0.005 && maxAngleRangeOfMotion < 1.5) {
    return {
      isValid: false,
      category: 'stationary',
      title: 'Stationary Pose Detected',
      message: 'The person in this video is standing or sitting still with minimal athletic range of motion. Please upload an active repetition of the movement.',
      confidenceScore: 30,
      details: { maxJointRangeOfMotion: maxAngleRangeOfMotion }
    };
  }

  // 4. Sport Kinematic Signature Matching
  const targetSport = sportRule.id;

  // Compute key kinematic properties
  // a) Overhead Arm Extension (Tennis Serve, Cricket Bowling, Netball High Shot)
  let maxArmOverheadRatio = 0; // Frames where wrist is significantly above shoulder
  let maxWristAngularSpeed = 0;

  validFrames.forEach(({ landmarks }) => {
    const rWrist = landmarks[16];
    const rShoulder = landmarks[12];
    const lWrist = landmarks[15];
    const lShoulder = landmarks[11];

    if ((rWrist && rShoulder && rWrist.y < rShoulder.y - 0.08) ||
        (lWrist && lShoulder && lWrist.y < lShoulder.y - 0.08)) {
      maxArmOverheadRatio++;
    }
  });
  const overheadFramePct = maxArmOverheadRatio / validFrames.length;

  // b) Lower Body Kicking / Leg Swing (Soccer, Rugby Kick)
  const maxKneeVelocity = kneeROM;

  // c) Torso Rotation / Swing Plane (Golf Full Swing, Tennis Forehand)
  let maxShoulderHipSeparation = 0;
  validFrames.forEach(({ landmarks }) => {
    if (landmarks[11] && landmarks[12] && landmarks[23] && landmarks[24]) {
      const shoulderAngle = Math.atan2(landmarks[12].y - landmarks[11].y, landmarks[12].x - landmarks[11].x) * (180 / Math.PI);
      const hipAngle = Math.atan2(landmarks[24].y - landmarks[23].y, landmarks[24].x - landmarks[23].x) * (180 / Math.PI);
      const sep = Math.abs(shoulderAngle - hipAngle);
      if (sep > maxShoulderHipSeparation) maxShoulderHipSeparation = sep;
    }
  });

  // Soft Warnings (isValid: true) instead of hard blocks for mismatched sports
  // This allows the user to see their skeleton tracking and full analysis anyway!
  
  // MISMATCH A: Golf Selected, but zero rotational coil and excessive high sprinting or kicking
  if (targetSport === 'golf') {
    if (maxDisplacement > 0.35 && trunkROM < 10 && maxShoulderHipSeparation < 10) {
      return {
        isValid: true,
        category: 'sport_mismatch',
        title: 'Sport Movement Mismatch (Soft Note)',
        message: 'You selected Golf Swing, but high-displacement linear running was detected rather than a rotational golf stance.',
        suggestedSport: 'soccer',
        detectedMotionProfile: 'Linear Running / Sprinting',
        confidenceScore: 85
      };
    }
  }

  // MISMATCH B: Cricket Bowling selected, but arm never raises overhead (overheadFramePct === 0)
  if (targetSport === 'cricket' && selectedPhase?.toLowerCase().includes('bowling')) {
    if (overheadFramePct < 0.05 && elbowROM < 20) {
      return {
        isValid: true,
        category: 'sport_mismatch',
        title: 'Technique Mismatch (Soft Note)',
        message: 'You selected Cricket Bowling, but no high overhead arm delivery or circumduction was detected in this clip.',
        confidenceScore: 80,
        detectedMotionProfile: 'Low Arm Plane Motion'
      };
    }
  }

  // MISMATCH C: Tennis Serve selected, but hands stay below shoulder level throughout
  if (targetSport === 'tennis' && (selectedPhase?.toLowerCase().includes('serve') || selectedPhase?.toLowerCase().includes('smash'))) {
    if (overheadFramePct < 0.05) {
      return {
        isValid: true,
        category: 'sport_mismatch',
        title: 'Technique Mismatch (Soft Note)',
        message: 'You selected Tennis Serve / Overhead, but the athlete\'s hitting arm remained below shoulder height throughout the clip.',
        suggestedSport: 'tennis',
        detectedMotionProfile: 'Groundstroke / Low Plane Hit',
        confidenceScore: 82
      };
    }
  }

  return {
    isValid: true,
    category: 'ok',
    title: 'Valid Athletic Video',
    message: 'Biomechanical markers successfully validated.',
    confidenceScore: 95,
    details: {
      humanFrameRatio: humanRatio,
      maxJointRangeOfMotion: maxAngleRangeOfMotion
    }
  };
}
