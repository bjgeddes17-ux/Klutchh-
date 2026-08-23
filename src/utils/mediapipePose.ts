import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { MediaPipeLandmark } from '../types';

let poseLandmarker: PoseLandmarker | null = null;
let isInitializing = false;
let lastVideoTimestamp = 0;
let isDetecting = false;
let cachedLandmarks: MediaPipeLandmark[] = [];

/**
 * Resets the cached landmarks when loading a new video source.
 */
export function resetPoseCache() {
  cachedLandmarks = [];
  // Note: lastVideoTimestamp must NEVER be reset to 0 because MediaPipe WASM's VIDEO graph requires strictly monotonic increasing timestamps.
}

/**
 * Initializes the MediaPipe PoseLandmarker with GPU and CPU fallbacks.
 */
export async function initializePoseLandmarker(): Promise<PoseLandmarker | null> {
  if (poseLandmarker) return poseLandmarker;
  if (isInitializing) {
    let attempts = 0;
    while (isInitializing && attempts < 30) {
      await new Promise((r) => setTimeout(r, 100));
      attempts++;
    }
    return poseLandmarker;
  }

  try {
    isInitializing = true;
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
    );

    try {
      poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
          delegate: 'GPU',
        },
        runningMode: 'IMAGE',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
    } catch (gpuErr) {
      console.warn('GPU delegate failed for MediaPipe Pose, attempting CPU delegate fallback:', gpuErr);
      poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
          delegate: 'CPU',
        },
        runningMode: 'IMAGE',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
    }

    isInitializing = false;
    return poseLandmarker;
  } catch (err) {
    console.warn('MediaPipe PoseLandmarker initialization failed:', err);
    isInitializing = false;
    return null;
  }
}

export interface PoseDetectionResult {
  landmarks: MediaPipeLandmark[];
  isRealMediaPipe: boolean;
}

/**
 * Detects pose landmarks from a video element at timestamp.
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
      let result;
      
      let sourceToDetect: HTMLVideoElement | HTMLCanvasElement = videoElement as any;

      // NEW: Handle orientation mismatch (Portrait video reported as Landscape)
      if (videoElement instanceof HTMLVideoElement) {
        const clientRatio = videoElement.clientWidth / (videoElement.clientHeight || 1);
        const intrinsicRatio = videoElement.videoWidth / (videoElement.videoHeight || 1);
        
        // Only normalize if metadata is landscape but visual container is portrait
        let isRotated = intrinsicRatio > 1 && clientRatio < 1;
        
        // Supplemental evidence: if we have cached landmarks and they were portrait in a landscape frame
        if (!isRotated && intrinsicRatio > 1 && cachedLandmarks && cachedLandmarks.length > 20) {
          let minX = 1, maxX = 0, minY = 1, maxY = 0;
          for (const p of cachedLandmarks) {
            minX = Math.min(minX, p.x);
            maxX = Math.max(maxX, p.x);
            minY = Math.min(minY, p.y);
            maxY = Math.max(maxY, p.y);
          }
          if ((maxY - minY) > (maxX - minX) * 1.2) {
            isRotated = true;
          }
        }

        if (isRotated) {
          // Normalizing via temporary canvas to ensure MediaPipe sees the correctly oriented frame
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = videoElement.videoHeight;
          tempCanvas.height = videoElement.videoWidth;
          const tempCtx = tempCanvas.getContext('2d');
          if (tempCtx) {
            tempCtx.drawImage(videoElement, 0, 0, tempCanvas.width, tempCanvas.height);
            sourceToDetect = tempCanvas;
          }
        }
      }

      if (typeof (poseLandmarker as any).detect === 'function') {
        result = (poseLandmarker as any).detect(sourceToDetect);
      } else {
        lastVideoTimestamp = Math.max(lastVideoTimestamp + 16, Math.round(performance.now()));
        result = poseLandmarker.detectForVideo(sourceToDetect, lastVideoTimestamp);
      }
      isDetecting = false;

      if (result && result.landmarks && result.landmarks.length > 0) {
        const rawLandmarks = result.landmarks[0] as MediaPipeLandmark[];

        // ANATOMICAL & SHADOW REJECTION FILTER:
        // Ensure valid upright human body proportions (height > width, shoulders above hips, hips above ankles)
        let minY = 1, maxY = 0, minX = 1, maxX = 0;
        let validPointsCount = 0;
        for (const pt of rawLandmarks) {
          if (pt && pt.visibility !== undefined && pt.visibility > 0.4) {
            minY = Math.min(minY, pt.y);
            maxY = Math.max(maxY, pt.y);
            minX = Math.min(minX, pt.x);
            maxX = Math.max(maxX, pt.x);
            validPointsCount++;
          }
        }

        const bodyHeight = maxY - minY;
        const bodyWidth = maxX - minX;

        // If body height is smaller than width (e.g. shadow on ground) or not enough points, reject!
        const isShadowOrHorizontalArtifact = bodyHeight < bodyWidth * 0.8 || bodyHeight < 0.15;
        const hasEnoughLandmarks = validPointsCount >= 15;

        // Check vertical order (shoulders 11/12 vs hips 23/24 vs ankles 27/28)
        const leftShoulder = rawLandmarks[11];
        const rightShoulder = rawLandmarks[12];
        const leftHip = rawLandmarks[23];
        const rightHip = rawLandmarks[24];
        
        const shouldersY = ((leftShoulder?.y || 0) + (rightShoulder?.y || 0)) / 2;
        const hipsY = ((leftHip?.y || 0) + (rightHip?.y || 0)) / 2;
        const isUpright = shouldersY < hipsY; // In screen coordinates, smaller Y is higher up

        if (hasEnoughLandmarks && !isShadowOrHorizontalArtifact && isUpright) {
          // ANATOMICAL SHIN CLAMP (Prevents ankles/feet from stretching down into floor shadows)
          const applyShinClamp = (hipIdx: number, kneeIdx: number, ankleIdx: number) => {
            const hip = rawLandmarks[hipIdx];
            const knee = rawLandmarks[kneeIdx];
            const ankle = rawLandmarks[ankleIdx];
            if (hip && knee && ankle) {
              const femurLen = Math.sqrt(Math.pow(knee.x - hip.x, 2) + Math.pow(knee.y - hip.y, 2));
              const shinLen = Math.sqrt(Math.pow(ankle.x - knee.x, 2) + Math.pow(ankle.y - knee.y, 2));
              const maxAllowedShin = femurLen * 1.5; // Anatomical maximum ratio
              if (shinLen > maxAllowedShin && femurLen > 0.05) {
                // Pull ankle upward along knee-ankle vector to max allowed length
                const ratio = maxAllowedShin / shinLen;
                ankle.x = knee.x + (ankle.x - knee.x) * ratio;
                ankle.y = knee.y + (ankle.y - knee.y) * ratio;
              }
            }
          };

          applyShinClamp(23, 25, 27); // Left leg
          applyShinClamp(24, 26, 28); // Right leg

          cachedLandmarks = rawLandmarks;
          return {
            landmarks: cachedLandmarks,
            isRealMediaPipe: true,
          };
        } else {
          // Reject invalid pose (shadow or background person)
          console.warn("Rejected non-human/shadow pose detection to prevent jitter/ground anchoring.");
        }
      }
    } catch (e: any) {
      isDetecting = false;
      // Fall back to detectForVideo if detect throws in current mode
      try {
        lastVideoTimestamp = Math.max(lastVideoTimestamp + 16, Math.round(performance.now()));
        const fallbackRes = poseLandmarker.detectForVideo(videoElement, lastVideoTimestamp);
        if (fallbackRes && fallbackRes.landmarks && fallbackRes.landmarks.length > 0) {
          const rawLandmarks = fallbackRes.landmarks[0] as MediaPipeLandmark[];
          let minY = 1, maxY = 0, minX = 1, maxX = 0;
          let validPoints = 0;
          for (const pt of rawLandmarks) {
            if (pt && pt.visibility !== undefined && pt.visibility > 0.4) {
              minY = Math.min(minY, pt.y);
              maxY = Math.max(maxY, pt.y);
              minX = Math.min(minX, pt.x);
              maxX = Math.max(maxX, pt.x);
              validPoints++;
            }
          }
          const bodyH = maxY - minY;
          const bodyW = maxX - minX;
          if (validPoints >= 15 && bodyH >= bodyW * 0.8 && bodyH >= 0.15) {
            const applyShinClamp = (hipIdx: number, kneeIdx: number, ankleIdx: number) => {
              const hip = rawLandmarks[hipIdx];
              const knee = rawLandmarks[kneeIdx];
              const ankle = rawLandmarks[ankleIdx];
              if (hip && knee && ankle) {
                const femurLen = Math.sqrt(Math.pow(knee.x - hip.x, 2) + Math.pow(knee.y - hip.y, 2));
                const shinLen = Math.sqrt(Math.pow(ankle.x - knee.x, 2) + Math.pow(ankle.y - knee.y, 2));
                const maxAllowedShin = femurLen * 1.5;
                if (shinLen > maxAllowedShin && femurLen > 0.05) {
                  const ratio = maxAllowedShin / shinLen;
                  ankle.x = knee.x + (ankle.x - knee.x) * ratio;
                  ankle.y = knee.y + (ankle.y - knee.y) * ratio;
                }
              }
            };
            applyShinClamp(23, 25, 27);
            applyShinClamp(24, 26, 28);

            cachedLandmarks = rawLandmarks;
            return {
              landmarks: cachedLandmarks,
              isRealMediaPipe: true,
            };
          }
        }
      } catch (fbErr: any) {
        // Silently catch timestamp note
      }
    }
  }

  // Do not return unrelated stale cached landmarks for different frames
  return {
    landmarks: [],
    isRealMediaPipe: false,
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
