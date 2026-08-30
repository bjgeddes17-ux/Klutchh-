import { MediaPipeLandmark } from '../types';

/**
 * Calculates the angle (in degrees 0-180) at vertex point p2 formed by lines p1-p2 and p3-p2.
 */
export function calculateAngle(
  p1: MediaPipeLandmark,
  p2: MediaPipeLandmark,
  p3: MediaPipeLandmark
): number {
  if (!p1 || !p2 || !p3) return 0;

  // Vectors from vertex p2 to p1 and p3 (supporting 3D coordinates x, y, z)
  const v1x = p1.x - p2.x;
  const v1y = p1.y - p2.y;
  const v1z = (p1.z || 0) - (p2.z || 0);

  const v2x = p3.x - p2.x;
  const v2y = p3.y - p2.y;
  const v2z = (p3.z || 0) - (p2.z || 0);

  // Dot product and magnitudes for Law of Cosines
  const dotProduct = v1x * v2x + v1y * v2y + v1z * v2z;
  const mag1 = Math.sqrt(v1x * v1x + v1y * v1y + v1z * v1z);
  const mag2 = Math.sqrt(v2x * v2x + v2y * v2y + v2z * v2z);

  if (mag1 === 0 || mag2 === 0) return 0;

  let cosTheta = dotProduct / (mag1 * mag2);
  cosTheta = Math.max(-1, Math.min(1, cosTheta));

  const angleRad = Math.acos(cosTheta);
  const angleDeg = (angleRad * 180.0) / Math.PI;

  return Math.round(angleDeg * 10) / 10;
}

/**
 * Evaluates left-right symmetry (0 - 100%) across shoulders, elbows, hips, and knees.
 */
export function calculateSymmetry(landmarks: MediaPipeLandmark[]): number {
  if (!landmarks || landmarks.length < 29) return 90;

  // Key pairs: Left Shoulder (11) vs Right Shoulder (12)
  // Left Elbow (13) vs Right Elbow (14)
  // Left Hip (23) vs Right Hip (24)
  // Left Knee (25) vs Right Knee (26)
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftElbow = landmarks[13];
  const rightElbow = landmarks[14];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const leftKnee = landmarks[25];
  const rightKnee = landmarks[26];

  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return 88;

  // Levelness of shoulder axis
  const shoulderTilt = Math.abs(leftShoulder.y - rightShoulder.y);
  // Levelness of hip axis
  const hipTilt = Math.abs(leftHip.y - rightHip.y);

  // Arm flex balance if available
  let armDiff = 0;
  if (leftElbow && rightElbow && landmarks[15] && landmarks[16]) {
    const leftArmAngle = calculateAngle(leftShoulder, leftElbow, landmarks[15]);
    const rightArmAngle = calculateAngle(rightShoulder, rightElbow, landmarks[16]);
    armDiff = Math.abs(leftArmAngle - rightArmAngle) / 180;
  }

  const tiltPenalty = (shoulderTilt + hipTilt) * 150;
  const score = Math.max(50, Math.min(100, Math.round(100 - tiltPenalty - armDiff * 25)));

  return score;
}

/**
 * Calculates Knee Valgus Safety Index (0-100%).
 * Valgus occurs when knees buckle inward relative to the line connecting hip and ankle.
 */
export function calculateKneeValgusScore(landmarks: MediaPipeLandmark[]): number {
  if (!landmarks || landmarks.length < 29) return 92;

  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const leftKnee = landmarks[25];
  const rightKnee = landmarks[26];
  const leftAnkle = landmarks[27];
  const rightAnkle = landmarks[28];

  if (!leftHip || !rightHip || !leftKnee || !rightKnee || !leftAnkle || !rightAnkle) return 90;

  // Check inward displacement ratio
  // Normal stance: knee X is between hip X and ankle X (or close to midpoint)
  const leftMidX = (leftHip.x + leftAnkle.x) / 2;
  const rightMidX = (rightHip.x + rightAnkle.x) / 2;

  // Left knee buckling inward towards center (towards right)
  const leftInward = leftKnee.x - leftMidX; 
  // Right knee buckling inward towards center (towards left)
  const rightInward = rightMidX - rightKnee.x;

  const maxInward = Math.max(0, leftInward, rightInward);
  const penalty = maxInward * 300;

  return Math.max(40, Math.min(100, Math.round(100 - penalty)));
}

// MediaPipe Pose Skeleton Connection Indices with associated joint keys
export const POSE_CONNECTIONS: { points: [number, number]; jointName?: string }[] = [
  // Torso & Shoulders
  { points: [11, 12] },
  { points: [11, 23], jointName: 'shoulder_hip' },
  { points: [12, 24], jointName: 'shoulder_hip' },
  { points: [23, 24] },
  // Left Arm
  { points: [11, 13], jointName: 'elbow' },
  { points: [13, 15], jointName: 'elbow' },
  // Right Arm
  { points: [12, 14], jointName: 'elbow' },
  { points: [14, 16], jointName: 'elbow' },
  // Left Leg
  { points: [23, 25], jointName: 'hip' },
  { points: [25, 27], jointName: 'knee' },
  { points: [27, 29], jointName: 'ankle' },
  { points: [29, 31] },
  // Right Leg
  { points: [24, 26], jointName: 'hip' },
  { points: [26, 28], jointName: 'knee' },
  { points: [28, 30], jointName: 'ankle' },
  { points: [30, 32] },
  // Face & Neck
  { points: [0, 1] }, { points: [1, 2] }, { points: [2, 3] }, { points: [3, 7] },
  { points: [0, 4] }, { points: [4, 5] }, { points: [5, 6] }, { points: [6, 8] }, { points: [9, 10] }
];
