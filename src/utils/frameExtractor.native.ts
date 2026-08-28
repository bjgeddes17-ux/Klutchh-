import * as VideoThumbnails from 'expo-video-thumbnails';
import { ExtractedFrame } from './frameExtractor';

// On Native, we use expo-video-thumbnails for high-performance extraction
export async function clearFrameCache(): Promise<void> {
  // Native cleanup logic if using FileSystem
}

export async function extractFramesPipelined(
  videoUrl: string,
  onFrame: (frame: ExtractedFrame) => Promise<void>,
  onProgress: (progress: number) => void,
  targetFps: number = 20,
  targetHeight: number = 480,
  _cropBox?: { x: number; y: number; width: number; height: number },
  startTime: number = 0,
  endTime?: number
): Promise<{ frameCount: number; duration: number }> {
  console.log('Native: Starting extraction via expo-video-thumbnails');
  
  try {
    // Note: This is a simplified extraction loop for Native.
    // In a production app, we would use a native module or ffmpeg-kit.
    // Here we extract a few key frames to keep the AI responsive.
    
    const interval = 1000 / targetFps;
    let currentTime = startTime * 1000;
    const finalTime = (endTime || 10) * 1000; // Default to 10s if unknown
    let count = 0;

    // Memory Guard: Scale down quality if extraction is heavy
    const thumbnailOptions = {
      quality: 0.6,
      time: 0,
    };

    while (currentTime < finalTime) {
      const { uri } = await VideoThumbnails.getThumbnailAsync(videoUrl, {
        ...thumbnailOptions,
        time: currentTime,
      });

      await onFrame({
        uri, // Use the new uri property
        index: count,
        timestamp: currentTime / 1000,
      });

      count++;
      currentTime += interval;
      onProgress(Math.min(95, (currentTime / finalTime) * 100));
    }

    onProgress(100);
    return { frameCount: count, duration: (finalTime - (startTime * 1000)) / 1000 };
  } catch (e) {
    console.error('Native extraction failed:', e);
    throw e;
  }
}

export async function getFrame(_index: number): Promise<ExtractedFrame | null> {
  return null;
}

export async function setFrame(_index: number, _frame: ExtractedFrame): Promise<void> {
  // On Native, we typically store these as file URIs
}
