import { MediaPipeLandmark } from '../types';

/**
 * Maps a normalized (0-1) landmark to absolute pixel coordinates
 * based on the container dimensions.
 */
export function mapLandmarkToPixels(
  landmark: MediaPipeLandmark,
  containerWidth: number,
  containerHeight: number,
  offsetX: number = 0,
  offsetY: number = 0
): { x: number; y: number } {
  return {
    x: offsetX + landmark.x * containerWidth,
    y: offsetY + landmark.y * containerHeight,
  };
}
