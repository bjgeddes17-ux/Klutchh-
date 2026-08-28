import { MediaPipeLandmark } from '../types';
import { PoseLandmarkSmoother } from './oneEuroFilter';

// On Native, we don't use the Web MediaPipe library.
// This file provides a compatible interface to prevent build crashes.
// Real-time analysis on Native should use react-native-vision-camera frame processors.

let cachedLandmarks: MediaPipeLandmark[] = [];
let cachedWorldLandmarks: MediaPipeLandmark[] = [];
const liveSmoother = new PoseLandmarkSmoother(0.8, 0.008);

export function resetPoseCache() {
  cachedLandmarks = [];
  cachedWorldLandmarks = [];
  liveSmoother.reset();
}

export async function initializePoseLandmarker(): Promise<any> {
  console.log('PoseLandmarker is not supported on Native via the Web SDK.');
  return null;
}

export interface PoseDetectionResult {
  landmarks: MediaPipeLandmark[];
  allLandmarks?: MediaPipeLandmark[][];
  worldLandmarks?: MediaPipeLandmark[];
  isRealMediaPipe: boolean;
}

export async function detectPoseForVideoFrame(
  _videoElement: any,
  _timestampMs: number,
  _allowCachedFallback: boolean = true
): Promise<PoseDetectionResult> {
  // On Native, we return empty or use a different source of landmarks
  return {
    landmarks: cachedLandmarks,
    allLandmarks: cachedLandmarks.length > 0 ? [cachedLandmarks] : [],
    worldLandmarks: cachedWorldLandmarks,
    isRealMediaPipe: false,
  };
}

export function generateSyntheticSportsPose(timestampMs: number, currentTimeSec: number): MediaPipeLandmark[] {
  // Fallback synthetic pose for Native preview
  const t = (currentTimeSec || timestampMs / 1000) % 3;
  const phase = (t / 3) * Math.PI * 2;
  const landmarks: MediaPipeLandmark[] = new Array(33).fill(null).map(() => ({ x: 0.5, y: 0.5, z: 0, visibility: 0.9 }));
  // ... basic pose logic if needed, but keeping it light
  return landmarks;
}
