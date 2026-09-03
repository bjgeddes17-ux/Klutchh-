import { requireOptionalNativeModule } from 'expo-modules-core';
import { NativeModules, Platform } from 'react-native';

export interface NativePoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

// Check for Expo Module or standard NativeModules bridge
function getNativePoseDetector(): any {
  if (Platform.OS === 'web') return null;
  try {
    return requireOptionalNativeModule('PoseDetector') || NativeModules?.PoseDetector || null;
  } catch {
    return NativeModules?.PoseDetector || null;
  }
}

export const isNativePoseDetectorAvailable = async (): Promise<boolean> => {
  if (Platform.OS === 'web') return false;
  const detector = getNativePoseDetector();
  if (!detector) return false;
  try {
    if (typeof detector.isAvailable === 'function') {
      return await detector.isAvailable();
    }
    return true;
  } catch {
    return false;
  }
};

export const detectPoseFromUri = async (imageUri: string): Promise<NativePoseLandmark[] | null> => {
  const detector = getNativePoseDetector();
  if (!detector) return null;
  try {
    const results = await detector.detectPoseFromUri(imageUri);
    if (Array.isArray(results) && results.length > 0) {
      return results as NativePoseLandmark[];
    }
    return null;
  } catch (err) {
    console.warn('Native ML Kit pose detection error:', err);
    return null;
  }
};
