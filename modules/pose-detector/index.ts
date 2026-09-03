import { NativeModulesProxy } from 'expo-modules-core';
import { NativeModules, Platform } from 'react-native';

export interface NativePoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

// Check for Expo Module or standard NativeModules bridge
let NativePoseDetector: any = null;
try {
  // Expo SDK 52 requireOptionalNativeModule
  const { requireOptionalNativeModule } = require('expo-modules-core');
  NativePoseDetector = requireOptionalNativeModule('PoseDetector');
} catch {
  NativePoseDetector = NativeModules.PoseDetector;
}

export const isNativePoseDetectorAvailable = async (): Promise<boolean> => {
  if (Platform.OS === 'web') return false;
  if (!NativePoseDetector) return false;
  try {
    if (typeof NativePoseDetector.isAvailable === 'function') {
      return await NativePoseDetector.isAvailable();
    }
    return true;
  } catch {
    return false;
  }
};

export const detectPoseFromUri = async (imageUri: string): Promise<NativePoseLandmark[] | null> => {
  if (!NativePoseDetector) return null;
  try {
    const results = await NativePoseDetector.detectPoseFromUri(imageUri);
    if (Array.isArray(results) && results.length > 0) {
      return results as NativePoseLandmark[];
    }
    return null;
  } catch (err) {
    console.warn('Native ML Kit pose detection error:', err);
    return null;
  }
};
