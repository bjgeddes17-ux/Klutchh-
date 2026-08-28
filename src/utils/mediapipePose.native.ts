// mediapipePose.native.ts
// This file provides a compatible interface for Pose Detection on Native.

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

// On Native, we use react-native-vision-camera with a frame processor
// or a cloud-based fallback if native modules aren't linked.
export async function initializePoseLandmarker(): Promise<void> {
  console.log('Native: MediaPipe initialized (Proxy)');
}

export async function detectPoseFromImage(_image: any): Promise<PoseResult | null> {
  // On Native, frame analysis happens in the frame processor.
  // This is a stub for image-based detection.
  return null;
}
