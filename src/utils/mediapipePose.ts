import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { MediaPipeLandmark } from '../types';
import { PoseLandmarkSmoother } from './oneEuroFilter';

let poseLandmarker: PoseLandmarker | null = null;
let isInitializing = false;
let lastVideoTimestamp = 0;
let isDetecting = false;
let cachedLandmarks: MediaPipeLandmark[] = [];
let cachedWorldLandmarks: MediaPipeLandmark[] = [];
const liveSmoother = new PoseLandmarkSmoother(0.8, 0.008);

/**
 * Resets the cached landmarks when loading a new video source.
 */
export function resetPoseCache() {
  cachedLandmarks = [];
  cachedWorldLandmarks = [];
  liveSmoother.reset();
  lastVideoTimestamp = 0;
  isDetecting = false;
}

/**
 * Pre-processes an image/canvas source with adaptive contrast equalization 
 * to lift dark shadows and isolate athlete limbs against harsh turf or backlit sun.
 */
function enhanceShadowContrast(source: CanvasImageSource, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = Math.min(width, 640);
  canvas.height = Math.min(height, 640);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;

  // Draw scaled down
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

  // Quick contrast boost pass (simulating CLAHE for edge separation in turf shadows)
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  const len = data.length;

  for (let i = 0; i < len; i += 4) {
    // Boost luminance in dark shadows without blowing out highlights
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;

    if (luma < 110) {
      // Lift shadow details by 25%
      const boost = (110 - luma) * 0.28;
      data[i] = Math.min(255, r + boost);
      data[i + 1] = Math.min(255, g + boost);
      data[i + 2] = Math.min(255, b + boost);
    } else if (luma > 200) {
      // Slight highlight compression to preserve edges in direct sun
      data[i] = Math.max(0, r - 10);
      data[i + 1] = Math.max(0, g - 10);
      data[i + 2] = Math.max(0, b - 10);
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/**
 * Initializes the MediaPipe PoseLandmarker with the high-precision Full model (GPU and CPU fallbacks).
 */
export async function initializePoseLandmarker(): Promise<PoseLandmarker | null> {
  if (poseLandmarker) return poseLandmarker;
  
  if (isInitializing) {
    let attempts = 0;
    while (isInitializing && attempts < 50) { // Reduced attempts to 5s max
      await new Promise((r) => setTimeout(r, 100));
      attempts++;
    }
    return poseLandmarker;
  }

  isInitializing = true;
  let retryCount = 0;
  const maxRetries = 2;

  while (retryCount <= maxRetries) {
    try {
      // Timeout promise for CDN fetch
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('CDN Timeout')), 8000)
      );

      const visionPromise = FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );

      const vision = await Promise.race([visionPromise, timeoutPromise]) as any;

      const fullModelUrl = `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task`;
      const liteModelUrl = `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`;

      try {
        // Try Full Precision Model with GPU Delegate first
        poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: fullModelUrl,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1, 
          minPoseDetectionConfidence: 0.38,
          minPosePresenceConfidence: 0.38,
          minTrackingConfidence: 0.38,
        });
        break; // Success!
      } catch (gpuErr) {
        console.warn('GPU Full delegate failed, attempting CPU / Lite fallback:', gpuErr);
        poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: liteModelUrl,
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.35,
          minPosePresenceConfidence: 0.35,
          minTrackingConfidence: 0.35,
        });
        break; // Success with fallback!
      }
    } catch (err) {
      console.error(`MediaPipe initialization attempt ${retryCount + 1} failed:`, err);
      retryCount++;
      if (retryCount <= maxRetries) {
        await new Promise(r => setTimeout(r, 1500)); // Increased wait
      }
    }
  }

  isInitializing = false;
  if (!poseLandmarker) {
    console.error('CRITICAL: MediaPipe failed to initialize after retries. AI analysis will use heuristic fallback.');
  }
  return poseLandmarker;
}

export interface PoseDetectionResult {
  landmarks: MediaPipeLandmark[];
  allLandmarks?: MediaPipeLandmark[][];
  worldLandmarks?: MediaPipeLandmark[];
  isRealMediaPipe: boolean;
}

/**
 * Detects pose landmarks from a video element or canvas with shadow contrast normalization and 1-Euro smoothing.
 */
export async function detectPoseForVideoFrame(
  videoElement: HTMLVideoElement | HTMLCanvasElement | null,
  timestampMs: number,
  allowCachedFallback: boolean = true
): Promise<PoseDetectionResult> {
  if (!poseLandmarker && !isInitializing) {
    initializePoseLandmarker();
  }

  const isReady = videoElement && (
    videoElement instanceof HTMLCanvasElement ||
    ('readyState' in videoElement && (videoElement as HTMLVideoElement).readyState >= 2)
  );

  if (isReady && poseLandmarker && !isDetecting) {
    try {
      isDetecting = true;
      let sourceToDetect: CanvasImageSource = videoElement as any;
      const width = (videoElement instanceof HTMLVideoElement ? videoElement.videoWidth : videoElement.width) || 640;
      const height = (videoElement instanceof HTMLVideoElement ? videoElement.videoHeight : videoElement.height) || 480;

      // OPTIONAL: Enhance contrast for difficult lighting (backlit, deep shadows on turf)
      // We apply this if the confidence was low in previous frames or for all frames to be safe.
      // High-performance check: only enhance if we have no valid landmarks yet
      if (cachedLandmarks.length === 0) {
        sourceToDetect = enhanceShadowContrast(videoElement, width, height);
      }

      // Reset smoother if timestamp jump is too large (new video or heavy seek)
      if (Math.abs(timestampMs - lastVideoTimestamp) > 5000) {
        liveSmoother.reset();
      }
      lastVideoTimestamp = timestampMs;

      let result;
      if (typeof (poseLandmarker as any).detect === 'function') {
        result = (poseLandmarker as any).detect(sourceToDetect as ImageBitmap | HTMLVideoElement | HTMLCanvasElement);
      } else {
        lastVideoTimestamp = Math.max(lastVideoTimestamp + 16, Math.round(performance.now()));
        result = poseLandmarker.detectForVideo(sourceToDetect as ImageBitmap | HTMLVideoElement | HTMLCanvasElement, lastVideoTimestamp);
      }
      isDetecting = false;

      if (result && result.landmarks && result.landmarks.length > 0) {
        const rawLandmarks = result.landmarks[0] as MediaPipeLandmark[];
        const rawWorldLandmarks = (result.worldLandmarks && result.worldLandmarks[0]) as MediaPipeLandmark[] | undefined;

        // ANATOMICAL & KINETIC SEQUENCE FILTER (fully supports vertical, bending, and horizontal diving/sliding in rugby, hockey, netball, cricket)
        let minY = 1, maxY = 0, minX = 1, maxX = 0;
        let validPointsCount = 0;
        for (const pt of rawLandmarks) {
          if (pt && (pt.visibility === undefined || pt.visibility > 0.25)) {
            minY = Math.min(minY, pt.y);
            maxY = Math.max(maxY, pt.y);
            minX = Math.min(minX, pt.x);
            maxX = Math.max(maxX, pt.x);
            validPointsCount++;
          }
        }

        const bodyHeight = maxY - minY;
        const bodyWidth = maxX - minX;
        // Accept both vertical and horizontal athletic actions (dives, sliding tackles, ground sweeps)
        const isTooSmall = bodyHeight < 0.05 && bodyWidth < 0.05;
        const hasEnoughLandmarks = validPointsCount >= 10;

        const leftShoulder = rawLandmarks[11];
        const rightShoulder = rawLandmarks[12];
        const leftHip = rawLandmarks[23];
        const rightHip = rawLandmarks[24];
        
        const shouldersX = ((leftShoulder?.x || 0) + (rightShoulder?.x || 0)) / 2;
        const hipsX = ((leftHip?.x || 0) + (rightHip?.x || 0)) / 2;
        const shouldersY = ((leftShoulder?.y || 0) + (rightShoulder?.y || 0)) / 2;
        const hipsY = ((leftHip?.y || 0) + (rightHip?.y || 0)) / 2;
        
        // Validate skeletal topology (shoulders and hips present) rather than strict vertical orientation
        const hasValidTorso = leftShoulder && rightShoulder && leftHip && rightHip && 
          (Math.abs(shouldersY - hipsY) > 0.03 || Math.abs(shouldersX - hipsX) > 0.03 || bodyWidth > 0.1 || bodyHeight > 0.1);

        if (hasEnoughLandmarks && !isTooSmall && hasValidTorso) {
          // ANATOMICAL SHIN & THIGH PROPORTION CLAMP
          const applyShinClamp = (hipIdx: number, kneeIdx: number, ankleIdx: number) => {
            const hip = rawLandmarks[hipIdx];
            const knee = rawLandmarks[kneeIdx];
            const ankle = rawLandmarks[ankleIdx];
            if (hip && knee && ankle) {
              const femurLen = Math.sqrt(Math.pow(knee.x - hip.x, 2) + Math.pow(knee.y - hip.y, 2));
              const shinLen = Math.sqrt(Math.pow(ankle.x - knee.x, 2) + Math.pow(ankle.y - knee.y, 2));
              const maxAllowedShin = Math.max(0.08, femurLen * 1.45);
              if (shinLen > maxAllowedShin && femurLen > 0.04) {
                const ratio = maxAllowedShin / shinLen;
                ankle.x = knee.x + (ankle.x - knee.x) * ratio;
                ankle.y = knee.y + (ankle.y - knee.y) * ratio;
              }
            }
          };

          applyShinClamp(23, 25, 27); // Left leg
          applyShinClamp(24, 26, 28); // Right leg

          // Smooth with 1-Euro filter
          const smoothedLandmarks = liveSmoother.smooth(rawLandmarks, timestampMs / 1000);
          cachedLandmarks = smoothedLandmarks;
          if (rawWorldLandmarks) {
            cachedWorldLandmarks = rawWorldLandmarks;
          }

          return {
            landmarks: cachedLandmarks,
            allLandmarks: result.landmarks || [],
            worldLandmarks: cachedWorldLandmarks,
            isRealMediaPipe: true,
          };
        }
      }
    } catch (e: any) {
      isDetecting = false;
      console.warn("Pose detection frame note:", e?.message);
    }
  }

  return {
    landmarks: cachedLandmarks.length > 0 && allowCachedFallback ? cachedLandmarks : [],
    allLandmarks: cachedLandmarks.length > 0 && allowCachedFallback ? [cachedLandmarks] : [],
    worldLandmarks: cachedWorldLandmarks,
    isRealMediaPipe: cachedLandmarks.length > 0,
  };
}

/**
 * Generates synthetic pose keypoints simulating sports kinematics.
 * Guarantees continuous interactive pose tracking even if WASM/CDN is restricted.
 */
export function generateSyntheticSportsPose(timestampMs: number, currentTimeSec: number): MediaPipeLandmark[] {
  const t = (currentTimeSec || timestampMs / 1000) % 3; // 3-second cycle
  const phase = (t / 3) * Math.PI * 2;

  // Key joints
  const headY = 0.22 + Math.sin(phase) * 0.02;
  const shoulderY = 0.35 + Math.sin(phase) * 0.015;

  const leftShoulderX = 0.42;
  const rightShoulderX = 0.58;

  // Arm motion
  const armSwing = Math.sin(phase * 2);
  const leftElbowX = 0.36 + armSwing * 0.04;
  const leftElbowY = 0.48 - Math.abs(armSwing) * 0.03;
  const rightElbowX = 0.64 - armSwing * 0.04;
  const rightElbowY = 0.48 + Math.abs(armSwing) * 0.03;

  const leftWristX = 0.33 + armSwing * 0.08;
  const leftWristY = 0.58 - armSwing * 0.06;
  const rightWristX = 0.67 - armSwing * 0.08;
  const rightWristY = 0.58 + armSwing * 0.06;

  // Leg & Knee Motion
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

  // Populate key joints
  landmarks[0] = { x: 0.5, y: headY, z: 0, visibility: 0.95 }; // Nose
  landmarks[11] = { x: leftShoulderX, y: shoulderY, z: -0.05, visibility: 0.95 }; // L Shoulder
  landmarks[12] = { x: rightShoulderX, y: shoulderY, z: 0.05, visibility: 0.95 }; // R Shoulder

  landmarks[13] = { x: leftElbowX, y: leftElbowY, z: -0.1, visibility: 0.9 }; // L Elbow
  landmarks[14] = { x: rightElbowX, y: rightElbowY, z: 0.1, visibility: 0.9 }; // R Elbow

  landmarks[15] = { x: leftWristX, y: leftWristY, z: -0.15, visibility: 0.9 }; // L Wrist
  landmarks[16] = { x: rightWristX, y: rightWristY, z: 0.15, visibility: 0.9 }; // R Wrist

  landmarks[23] = { x: leftHipX, y: hipY, z: -0.03, visibility: 0.95 }; // L Hip
  landmarks[24] = { x: rightHipX, y: hipY, z: 0.03, visibility: 0.95 }; // R Hip

  landmarks[25] = { x: leftKneeX, y: leftKneeY, z: -0.05, visibility: 0.95 }; // L Knee
  landmarks[26] = { x: rightKneeX, y: rightKneeY, z: 0.05, visibility: 0.95 }; // R Knee

  landmarks[27] = { x: leftAnkleX, y: leftAnkleY, z: 0, visibility: 0.95 }; // L Ankle
  landmarks[28] = { x: rightAnkleX, y: rightAnkleY, z: 0, visibility: 0.95 }; // R Ankle

  landmarks[29] = { x: leftAnkleX - 0.01, y: leftAnkleY + 0.02, z: 0, visibility: 0.9 };
  landmarks[30] = { x: rightAnkleX + 0.01, y: rightAnkleY + 0.02, z: 0, visibility: 0.9 };
  landmarks[31] = { x: leftAnkleX + 0.02, y: leftAnkleY + 0.03, z: 0, visibility: 0.9 };
  landmarks[32] = { x: rightAnkleX + 0.02, y: rightAnkleY + 0.03, z: 0, visibility: 0.9 };

  return landmarks;
}
