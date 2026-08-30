import { MediaPipeLandmark } from '../types';

export interface ViewportDimensions {
  width: number;
  height: number;
}

/**
 * Maps a normalized (0-1) landmark to absolute pixel coordinates
 * based on the container dimensions and aspect ratio preservation.
 */
export function mapLandmarkToPixels(
  landmark: MediaPipeLandmark,
  canvasDims: ViewportDimensions,
  videoAspect: number,
  offsetX: number = 0,
  offsetY: number = 0
): { x: number; y: number } {
  // 1. Calculate aspect ratios
  const canvasAspect = canvasDims.width / canvasDims.height;
  
  let frameWidth, frameHeight, frameX, frameY;

  // 2. Determine fit strategy:
  // If canvasAspect > videoAspect: Canvas is wider than video (Pillarbox - bars on sides)
  // If canvasAspect < videoAspect: Canvas is taller than video (Letterbox - bars on top/bottom)
  
  if (canvasAspect > videoAspect) {
    // Pillarbox - video frame height limited by canvas height
    frameHeight = canvasDims.height;
    frameWidth = frameHeight * videoAspect;
    frameX = offsetX + (canvasDims.width - frameWidth) / 2;
    frameY = offsetY;
  } else {
    // Letterbox - video frame width limited by canvas width
    frameWidth = canvasDims.width;
    frameHeight = frameWidth / videoAspect;
    frameX = offsetX;
    frameY = offsetY + (canvasDims.height - frameHeight) / 2;
  }

  return {
    x: frameX + landmark.x * frameWidth,
    y: frameY + landmark.y * frameHeight,
  };
}
