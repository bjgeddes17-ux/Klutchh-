import * as VideoThumbnails from 'expo-video-thumbnails';

export interface ExtractedFrame {
  blob?: Blob;
  imageBitmap?: any;
  uri?: string; // For Native file paths
  timestamp: number;
  index: number;
  hardwareGpuPipeline?: boolean;
  microsecondTimestamp?: number;
}

// On Native, we use expo-video-thumbnails for high-performance extraction
export async function clearFrameCache(): Promise<void> {
  // Native cleanup logic
}

export async function extractFramesPipelined(
  videoUrl: string,
  onFrame: (frame: ExtractedFrame) => Promise<void>,
  onProgress: (progress: number) => void,
  targetFps: number = 20,
  _targetHeight: number = 480,
  _cropBox?: { x: number; y: number; width: number; height: number },
  startTime: number = 0,
  endTime?: number
): Promise<{ frameCount: number; duration: number }> {
  console.log('Native: Starting extraction via expo-video-thumbnails');
  
  try {
    const interval = 1000 / targetFps;
    let currentTime = startTime * 1000;
    const finalTime = (endTime || 10) * 1000;
    let count = 0;

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
        uri,
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
  // On Native, stored as file URIs
}
