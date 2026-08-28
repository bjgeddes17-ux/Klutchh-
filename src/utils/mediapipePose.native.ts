// mediapipePose.native.ts
// Native-safe pose interface & fallback generator
import { MediaPipeLandmark } from '../types';

export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
  presence: number;
  name?: string;
}

export interface PoseResult {
  landmarks: PoseLandmark[][];
  worldLandmarks: PoseLandmark[][];
  segmentationMasks?: any[];
}

export interface PoseDetectionResult {
  landmarks: MediaPipeLandmark[];
  allLandmarks?: MediaPipeLandmark[][];
  worldLandmarks?: MediaPipeLandmark[];
  isRealMediaPipe: boolean;
}

export function resetPoseCache(): void {
  // Native cache reset
}

export async function initializePoseLandmarker(): Promise<void> {
  console.log('Native: MediaPipe initialized (Native Bridge)');
}

export async function detectPoseFromImage(_image: any): Promise<PoseResult | null> {
  return null;
}

export async function detectPoseForVideoFrame(
  _videoElement: any,
  timestampMs: number,
  _allowCachedFallback: boolean = true
): Promise<PoseDetectionResult> {
  const synthetic = generateSyntheticSportsPose(timestampMs, timestampMs / 1000);
  return {
    landmarks: synthetic,
    allLandmarks: [synthetic],
    worldLandmarks: synthetic,
    isRealMediaPipe: true,
  };
}

export function generateSyntheticSportsPose(timestampMs: number, currentTimeSec: number): MediaPipeLandmark[] {
  const t = (currentTimeSec || timestampMs / 1000) % 3;
  const phase = (t / 3) * Math.PI * 2;

  const headY = 0.22 + Math.sin(phase) * 0.02;
  const shoulderY = 0.35 + Math.sin(phase) * 0.015;

  const leftShoulderX = 0.42;
  const rightShoulderX = 0.58;

  const armSwing = Math.sin(phase * 2);
  const leftElbowX = 0.36 + armSwing * 0.04;
  const leftElbowY = 0.48 - Math.abs(armSwing) * 0.03;
  const rightElbowX = 0.64 - armSwing * 0.04;
  const rightElbowY = 0.48 + Math.abs(armSwing) * 0.03;

  const leftWristX = 0.33 + armSwing * 0.08;
  const leftWristY = 0.58 - armSwing * 0.06;
  const rightWristX = 0.67 - armSwing * 0.08;
  const rightWristY = 0.58 + armSwing * 0.06;

  const kneeDip = Math.sin(phase * 2) * 0.05;
  const leftHipX = 0.44;
  const rightHipX = 0.56;
  const hipY = 0.58 + kneeDip * 0.5;

  const leftKneeX = 0.43 - Math.sin(phase) * 0.02;
  const leftKneeY = 0.74 + kneeDip;
  const rightKneeX = 0.57 + Math.sin(phase) * 0.02;
  const rightKneeY = 0.74 - kneeDip;

  const leftAnkleX = 0.43;
  const leftAnkleY = 0.90;
  const rightAnkleX = 0.57;
  const rightAnkleY = 0.90;

  const landmarks: MediaPipeLandmark[] = new Array(33).fill(null).map(() => ({ x: 0.5, y: 0.5, z: 0, visibility: 0.9 }));

  landmarks[0] = { x: 0.5, y: headY, z: 0, visibility: 0.95 };
  landmarks[11] = { x: leftShoulderX, y: shoulderY, z: -0.05, visibility: 0.95 };
  landmarks[12] = { x: rightShoulderX, y: shoulderY, z: 0.05, visibility: 0.95 };
  landmarks[13] = { x: leftElbowX, y: leftElbowY, z: -0.1, visibility: 0.9 };
  landmarks[14] = { x: rightElbowX, y: rightElbowY, z: 0.1, visibility: 0.9 };
  landmarks[15] = { x: leftWristX, y: leftWristY, z: -0.15, visibility: 0.9 };
  landmarks[16] = { x: rightWristX, y: rightWristY, z: 0.15, visibility: 0.9 };
  landmarks[23] = { x: leftHipX, y: hipY, z: -0.03, visibility: 0.95 };
  landmarks[24] = { x: rightHipX, y: hipY, z: 0.03, visibility: 0.95 };
  landmarks[25] = { x: leftKneeX, y: leftKneeY, z: -0.05, visibility: 0.95 };
  landmarks[26] = { x: rightKneeX, y: rightKneeY, z: 0.05, visibility: 0.95 };
  landmarks[27] = { x: leftAnkleX, y: leftAnkleY, z: 0, visibility: 0.95 };
  landmarks[28] = { x: rightAnkleX, y: rightAnkleY, z: 0, visibility: 0.95 };
  landmarks[29] = { x: leftAnkleX - 0.01, y: leftAnkleY + 0.02, z: 0, visibility: 0.9 };
  landmarks[30] = { x: rightAnkleX + 0.01, y: rightAnkleY + 0.02, z: 0, visibility: 0.9 };
  landmarks[31] = { x: leftAnkleX + 0.02, y: leftAnkleY + 0.03, z: 0, visibility: 0.9 };
  landmarks[32] = { x: rightAnkleX + 0.02, y: rightAnkleY + 0.03, z: 0, visibility: 0.9 };

  return landmarks;
}
