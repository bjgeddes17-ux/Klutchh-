import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { MediaPipeLandmark } from '../types';
import { detectPoseFromUri } from '../../modules/pose-detector';

/**
 * Advanced Computer Vision Pre-Processing Pipeline
 * 
 * Implements:
 * 1. Dynamic Contrast Normalization (Histogram Equalization) - Native Hook
 * 2. Grayscale & Luminance Stripping - Native Hook
 * 3. Attention Cropping (2-Pass Sniper Approach) - Implemented via Image Manipulator
 */
export class CVPipeline {
  /**
   * Pass 1: Fast scan to find the human bounding box
   * Pass 2: Crop image to bounding box, upscale, and run high-res scan
   */
  static async executeAttentionCrop(
    imageUri: string, 
    originalWidth: number, 
    originalHeight: number
  ): Promise<{ enhancedUri: string, offsetX: number, offsetY: number, scaleX: number, scaleY: number }> {
    
    // Pass 1: Quick rough detection on original image
    const roughLandmarks = await detectPoseFromUri(imageUri);
    
    if (!roughLandmarks || roughLandmarks.length < 25) {
      // If we can't even find a rough skeleton, return original
      return { enhancedUri: imageUri, offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1 };
    }

    // Find bounding box of the athlete
    let minX = 1.0, minY = 1.0, maxX = 0.0, maxY = 0.0;
    
    roughLandmarks.forEach(lm => {
      if (lm.visibility && lm.visibility > 0.2) {
        if (lm.x < minX) minX = lm.x;
        if (lm.x > maxX) maxX = lm.x;
        if (lm.y < minY) minY = lm.y;
        if (lm.y > maxY) maxY = lm.y;
      }
    });

    // Add 15% padding around the bounding box so we don't cut off limbs in motion
    const paddingX = (maxX - minX) * 0.15;
    const paddingY = (maxY - minY) * 0.15;
    
    minX = Math.max(0, minX - paddingX);
    minY = Math.max(0, minY - paddingY);
    maxX = Math.min(1.0, maxX + paddingX);
    maxY = Math.min(1.0, maxY + paddingY);

    // Convert normalized coordinates to absolute pixels
    const originX = Math.floor(minX * originalWidth);
    const originY = Math.floor(minY * originalHeight);
    const width = Math.floor((maxX - minX) * originalWidth);
    const height = Math.floor((maxY - minY) * originalHeight);

    if (width <= 50 || height <= 50) {
      return { enhancedUri: imageUri, offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1 };
    }

    try {
      // Execute the actual crop and upscale
      const manipResult = await manipulateAsync(
        imageUri,
        [
          { crop: { originX, originY, width, height } },
          { resize: { width: 800 } } // Upscale to standard high-res for Pass 2
        ],
        { compress: 0.8, format: SaveFormat.JPEG }
      );

      // Return the new URI along with the mathematical offset needed to remap 
      // the new skeleton coordinates back into the original 1080p video space
      return {
        enhancedUri: manipResult.uri,
        offsetX: originX,
        offsetY: originY,
        scaleX: width / originalWidth,
        scaleY: height / originalHeight
      };
    } catch (e) {
      console.warn("CV Attention Crop failed, falling back to original frame", e);
      return { enhancedUri: imageUri, offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1 };
    }
  }

  /**
   * Remaps the coordinates from the cropped Pass-2 skeleton back to the original video dimensions
   */
  static remapCoordinates(
    croppedLandmarks: MediaPipeLandmark[], 
    offsetX: number, 
    offsetY: number, 
    scaleX: number, 
    scaleY: number,
    originalWidth: number,
    originalHeight: number
  ): MediaPipeLandmark[] {
    return croppedLandmarks.map(lm => ({
      ...lm,
      // Convert normalized cropped X back to absolute cropped X, then add offset, then re-normalize to original
      x: ((lm.x * (scaleX * originalWidth)) + offsetX) / originalWidth,
      y: ((lm.y * (scaleY * originalHeight)) + offsetY) / originalHeight,
    }));
  }
}
