import { MediaPipeLandmark } from '../types';

export interface ViewportDimensions {
  width: number;
  height: number;
}

/**
 * Maps a normalized (0-1) landmark to absolute pixel coordinates
 * based on the pre-calculated video frame metrics.
 */
export function mapLandmarkToPixels(
  landmark: MediaPipeLandmark,
  drawWidth: number,
  drawHeight: number,
  offsetX: number,
  offsetY: number
): { x: number; y: number } {
  return {
    x: offsetX + landmark.x * drawWidth,
    y: offsetY + landmark.y * drawHeight,
  };
}
