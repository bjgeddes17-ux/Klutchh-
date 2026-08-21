import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

let poseLandmarker: PoseLandmarker | null = null;

async function initPose() {
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
  );
  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
      delegate: 'GPU',
    },
    runningMode: 'IMAGE',
    numPoses: 1,
    minPoseDetectionConfidence: 0.3, // Lowered for better sensitivity
    minPosePresenceConfidence: 0.3,
    minTrackingConfidence: 0.3,
  });
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
        }
      });
    } catch (err) {
      self.postMessage({ type: 'ERROR', payload: (err as Error).message });
    }
  }
};
