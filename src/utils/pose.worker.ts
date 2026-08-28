import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

let poseLandmarker: PoseLandmarker | null = null;

async function initPose() {
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
  );

  const fullModelUrl = `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task`;
  const liteModelUrl = `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`;

  try {
    poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: fullModelUrl,
        delegate: 'GPU',
      },
      runningMode: 'IMAGE',
      numPoses: 4,
      minPoseDetectionConfidence: 0.4,
      minPosePresenceConfidence: 0.4,
      minTrackingConfidence: 0.4,
    });
  } catch (gpuErr) {
    poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: liteModelUrl,
        delegate: 'CPU',
      },
      runningMode: 'IMAGE',
      numPoses: 4,
      minPoseDetectionConfidence: 0.35,
      minPosePresenceConfidence: 0.35,
      minTrackingConfidence: 0.35,
    });
  }
}

self.onmessage = async (e) => {
  const { type, payload } = e.data;

  if (type === 'INIT') {
    try {
      await initPose();
      self.postMessage({ type: 'INIT_DONE' });
    } catch (err) {
      self.postMessage({ type: 'ERROR', payload: (err as Error).message });
    }
  }

  if (type === 'ANALYZE_FRAME') {
    if (!poseLandmarker) {
      self.postMessage({ type: 'ERROR', payload: 'PoseLandmarker not initialized' });
      return;
    }

    try {
      const { imageBitmap, index } = payload;
      const result = poseLandmarker.detect(imageBitmap);
      imageBitmap.close();
      
      self.postMessage({
        type: 'FRAME_RESULT',
        payload: {
          index,
          landmarks: result.landmarks[0] || [],
          allLandmarks: result.landmarks || [],
          worldLandmarks: result.worldLandmarks ? result.worldLandmarks[0] : [],
        }
      });
    } catch (err) {
      self.postMessage({ type: 'ERROR', payload: (err as Error).message });
    }
  }
};
