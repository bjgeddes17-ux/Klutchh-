let requireOptionalNativeModule: any = () => null;
try {
  requireOptionalNativeModule = require('expo-modules-core').requireOptionalNativeModule;
} catch (e) {}

let NativeModules: any = null;
let Platform: any = { OS: 'ios' };
try {
  const rn = require('react-native');
  NativeModules = rn.NativeModules;
  Platform = rn.Platform;
} catch (e) {}

export interface NativePoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
  score?: number;
  name?: string;
  type?: number;
  normX?: number;
  normY?: number;
}

export interface NativePoseResult {
  detected: boolean;
  confidence?: number;
  landmarks: NativePoseLandmark[];
  width?: number;
  height?: number;
  error?: string;
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
    let result: any = null;
    if (typeof detector.detectPose === 'function') {
      result = await detector.detectPose(imageUri);
    } else if (typeof detector.detectPoseFromUri === 'function') {
      result = await detector.detectPoseFromUri(imageUri);
    }

    if (!result) return null;

    // Case 1: Result is wrapped in { detected: boolean, landmarks: [...] }
    if (result && typeof result === 'object' && Array.isArray(result.landmarks)) {
      if (result.landmarks.length === 0) return null;
      const w = result.width || 1;
      const h = result.height || 1;
      const landmarkSlots: NativePoseLandmark[] = new Array(33);
      for (let i = 0; i < 33; i++) {
        landmarkSlots[i] = { x: 0, y: 0, z: 0, visibility: 0, type: i };
      }

      result.landmarks.forEach((lm: any, idx: number) => {
        const type = typeof lm.type === 'number' && lm.type >= 0 && lm.type < 33 ? lm.type : idx;
        if (type >= 0 && type < 33) {
          const rawX = typeof lm.normX === 'number' ? lm.normX : lm.x;
          const rawY = typeof lm.normY === 'number' ? lm.normY : lm.y;
          landmarkSlots[type] = {
            x: rawX > 1.5 ? Math.min(1, Math.max(0, rawX / w)) : rawX,
            y: rawY > 1.5 ? Math.min(1, Math.max(0, rawY / h)) : rawY,
            z: lm.z ?? 0,
            visibility: lm.visibility ?? lm.score ?? 0,
            name: lm.name,
            type,
          };
        }
      });
      return landmarkSlots;
    }

    // Case 2: Result is direct array of landmarks
    if (Array.isArray(result) && result.length > 0) {
      const landmarkSlots: NativePoseLandmark[] = new Array(33);
      for (let i = 0; i < 33; i++) {
        landmarkSlots[i] = { x: 0, y: 0, z: 0, visibility: 0, type: i };
      }

      result.forEach((lm: any, idx: number) => {
        const type = typeof lm.type === 'number' && lm.type >= 0 && lm.type < 33 ? lm.type : idx;
        if (type >= 0 && type < 33) {
          const rawX = typeof lm.normX === 'number' ? lm.normX : lm.x;
          const rawY = typeof lm.normY === 'number' ? lm.normY : lm.y;
          landmarkSlots[type] = {
            x: rawX > 1.5 ? Math.min(1, Math.max(0, rawX / 1000)) : rawX,
            y: rawY > 1.5 ? Math.min(1, Math.max(0, rawY / 1000)) : rawY,
            z: lm.z ?? 0,
            visibility: lm.visibility ?? lm.score ?? 0,
            name: lm.name,
            type,
          };
        }
      });
      return landmarkSlots;
    }

    return null;
  } catch (err) {
    console.warn('Native ML Kit pose detection error:', err);
    return null;
  }
};

export const parseNativePoseResult = (result: any): NativePoseLandmark[] | null => {
  if (!result) return null;
  try {
    if (result && typeof result === 'object' && Array.isArray(result.landmarks)) {
      if (result.landmarks.length === 0) return null;
      const w = result.width || 1;
      const h = result.height || 1;
      const landmarkSlots: NativePoseLandmark[] = new Array(33);
      for (let i = 0; i < 33; i++) {
        landmarkSlots[i] = { x: 0, y: 0, z: 0, visibility: 0, type: i };
      }

      result.landmarks.forEach((lm: any, idx: number) => {
        const type = typeof lm.type === 'number' && lm.type >= 0 && lm.type < 33 ? lm.type : idx;
        if (type >= 0 && type < 33) {
          const rawX = typeof lm.normX === 'number' ? lm.normX : lm.x;
          const rawY = typeof lm.normY === 'number' ? lm.normY : lm.y;
          landmarkSlots[type] = {
            x: rawX > 1.5 ? Math.min(1, Math.max(0, rawX / w)) : rawX,
            y: rawY > 1.5 ? Math.min(1, Math.max(0, rawY / h)) : rawY,
            z: lm.z ?? 0,
            visibility: lm.visibility ?? lm.score ?? 0,
            name: lm.name,
            type,
          };
        }
      });
      return landmarkSlots;
    }

    if (Array.isArray(result) && result.length > 0) {
      const landmarkSlots: NativePoseLandmark[] = new Array(33);
      for (let i = 0; i < 33; i++) {
        landmarkSlots[i] = { x: 0, y: 0, z: 0, visibility: 0, type: i };
      }

      result.forEach((lm: any, idx: number) => {
        const type = typeof lm.type === 'number' && lm.type >= 0 && lm.type < 33 ? lm.type : idx;
        if (type >= 0 && type < 33) {
          const rawX = typeof lm.normX === 'number' ? lm.normX : lm.x;
          const rawY = typeof lm.normY === 'number' ? lm.normY : lm.y;
          landmarkSlots[type] = {
            x: rawX > 1.5 ? Math.min(1, Math.max(0, rawX / 1000)) : rawX,
            y: rawY > 1.5 ? Math.min(1, Math.max(0, rawY / 1000)) : rawY,
            z: lm.z ?? 0,
            visibility: lm.visibility ?? lm.score ?? 0,
            name: lm.name,
            type,
          };
        }
      });
      return landmarkSlots;
    }
  } catch (err) {
    console.warn('parseNativePoseResult error:', err);
  }
  return null;
};

export const detectPosesBatch = async (imageUris: string[]): Promise<(NativePoseLandmark[] | null)[]> => {
  const detector = getNativePoseDetector();
  if (!detector || typeof detector.detectPosesBatch !== 'function') {
    // Fallback to sequential
    const fallbackResults: (NativePoseLandmark[] | null)[] = [];
    for (const uri of imageUris) {
      fallbackResults.push(await detectPoseFromUri(uri));
    }
    return fallbackResults;
  }

  try {
    const res = await detector.detectPosesBatch(imageUris);
    if (res?.success && Array.isArray(res.frames)) {
      return res.frames.map((frameRes: any) => parseNativePoseResult(frameRes));
    }
    return imageUris.map(() => null);
  } catch (err) {
    console.warn('detectPosesBatch error:', err);
    return imageUris.map(() => null);
  }
};

export const analyzeVideoDirectNative = async (
  videoUri: string,
  timestampsMs: number[]
): Promise<{ success: boolean; landmarks: (NativePoseLandmark[] | null)[] }> => {
  const detector = getNativePoseDetector();
  if (!detector || typeof detector.analyzeVideoDirect !== 'function') {
    return { success: false, landmarks: [] };
  }

  try {
    const res = await detector.analyzeVideoDirect(videoUri, timestampsMs);
    if (res?.success && Array.isArray(res.frames)) {
      const parsed = res.frames.map((f: any) => parseNativePoseResult(f));
      return { success: true, landmarks: parsed };
    }
    return { success: false, landmarks: [] };
  } catch (err) {
    console.warn('analyzeVideoDirectNative error:', err);
    return { success: false, landmarks: [] };
  }
};

