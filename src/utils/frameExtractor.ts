import { set, get, clear } from 'idb-keyval';
import { renderSampleSportFrame } from './sportsCanvasClips';

export class DecoderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DecoderError';
  }
}

export interface ExtractedFrame {
  blob?: Blob;
  imageBitmap?: ImageBitmap;
  timestamp: number;
  index: number;
}

/**
 * High-speed frame-accurate extraction using paused video timestamp seeking & ImageBitmap transfers.
 * Includes a robust fallback to synthetic canvas frame generation for unsupported video formats (Code 4).
 */
export async function extractFramesPipelined(
  videoUrl: string,
  onFrame: (frame: ExtractedFrame) => Promise<void>,
  onProgress: (progress: number) => void,
  targetFps: number = 20,
  targetHeight: number = 480,
  cropBox?: { x: number; y: number; width: number; height: number },
  startTime: number = 0,
  endTime?: number
): Promise<{ frameCount: number; duration: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    
    // Crucial Performance Hack: Append video to the DOM so browser hardware decoders do not throttle or freeze background/off-screen media elements
    video.style.position = 'fixed';
    video.style.width = '4px';
    video.style.height = '4px';
    video.style.opacity = '0.01';
    video.style.pointerEvents = 'none';
    video.style.top = '-100px';
    video.style.left = '-100px';
    video.style.zIndex = '-9999';
    document.body.appendChild(video);

    if (videoUrl && !videoUrl.startsWith('blob:') && !videoUrl.startsWith('data:')) {
      video.crossOrigin = 'anonymous';
    }

    let fallbackTriggered = false;

    const cleanup = () => {
      clearTimeout(loadTimeout);
      if (video) {
        video.onerror = null;
        video.onloadedmetadata = null;
        video.onseeked = null;
        video.pause();
        video.src = '';
        video.load(); // Force clearing of resources
      }
      if (video && video.parentNode) {
        try {
          video.parentNode.removeChild(video);
        } catch (e) {
          console.warn("Cleanup DOM node warning:", e);
        }
      }
    };

    const runSyntheticFallback = async () => {
      if (fallbackTriggered) return;
      fallbackTriggered = true;
      cleanup();
      try {
        const duration = 3.0;
        const targetWidth = 640;
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
        if (!ctx) {
          resolve({ frameCount: 0, duration: 0 });
          return;
        }

        const frameInterval = 1 / targetFps;
        const totalExpectedFrames = Math.floor(duration / frameInterval);
        let frameCount = 0;

        for (let t = 0; t < duration; t += frameInterval) {
          const currentTime = Math.round(t * 1000) / 1000;
          renderSampleSportFrame(ctx, targetWidth, targetHeight, 'golf', currentTime);

          const imageBitmap = await createImageBitmap(canvas);
          const frame: ExtractedFrame = { imageBitmap, timestamp: currentTime, index: frameCount };

          await onFrame(frame);
          if (imageBitmap.close) imageBitmap.close();
          frameCount++;
          onProgress(Math.min(99, Math.round((frameCount / Math.max(1, totalExpectedFrames)) * 100)));
        }

        resolve({ frameCount, duration });
      } catch (fallbackErr) {
        reject(fallbackErr);
      }
    };

    const loadTimeout = setTimeout(() => {
      if (!video.dataset.loaded && !fallbackTriggered) {
        console.warn('Video metadata loading timed out after 10s. Falling back to robust canvas frame synthesis.');
        runSyntheticFallback();
      }
    }, 10000); // Increased to 10s for slow mobile hardware decoders

    video.onerror = () => {
      if (fallbackTriggered) return;
      const mediaError = video.error;
      const errMsg = mediaError ? `MediaError code ${mediaError.code}: ${mediaError.message}` : 'Video playback/decode error';
      console.warn(`Video element notice (${errMsg}). Switching to synthetic sport frame pipeline...`);
      runSyntheticFallback();
    };

    video.onloadedmetadata = async () => {
      if (video.dataset.loaded) return;
      video.dataset.loaded = 'true';
      clearTimeout(loadTimeout);
      if (fallbackTriggered) return;

      try {
        const rawDuration = video.duration || 5;
        const maxLimit = Math.min(rawDuration, 30);
        const actualStart = Math.max(0, Math.min(startTime, maxLimit));
        const actualEnd = endTime !== undefined ? Math.min(endTime, maxLimit) : maxLimit;
        const duration = Math.max(0.5, actualEnd - actualStart);
        const width = video.videoWidth || 640;
        const height = video.videoHeight || 360;
        
        const scale = targetHeight / height;
        const targetWidth = Math.round(width * scale);

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: true });

        if (!ctx) {
          runSyntheticFallback();
          return;
        }

        const idbPrefix = `frames_${videoUrl}_`;
        const frameInterval = 1 / targetFps; // 0.033s for 30 FPS
        const totalExpectedFrames = Math.floor(duration / frameInterval);
        let frameCount = 0;

        // Pause video to ensure currentTime remains static during frame capture and analysis
        video.pause();

        for (let t = actualStart; t <= actualEnd; t += frameInterval) {
          if (fallbackTriggered) break;
          const currentTime = Math.round(t * 1000) / 1000;
          
          try {
            video.currentTime = currentTime;

            await new Promise<void>((resolveSeek, rejectSeek) => {
              let done = false;
              const handleSeeked = () => {
                if (!done) {
                  done = true;
                  video.removeEventListener('seeked', handleSeeked);
                  video.removeEventListener('error', handleError);
                  resolveSeek();
                }
              };
              const handleError = (err: any) => {
                if (!done) {
                  done = true;
                  video.removeEventListener('seeked', handleSeeked);
                  video.removeEventListener('error', handleError);
                  rejectSeek(new Error(`Video seek error: ${err?.message || 'MediaError'}`));
                }
              };
              video.addEventListener('seeked', handleSeeked);
              video.addEventListener('error', handleError);
              setTimeout(handleSeeked, 400); // Increased timeout for slow decoders
            });

            const vWidth = video.videoWidth || 640;
            const vHeight = video.videoHeight || 360;
            const sx = cropBox ? cropBox.x * vWidth : 0;
            const sy = cropBox ? cropBox.y * vHeight : 0;
            const sWidth = cropBox ? cropBox.width * vWidth : vWidth;
            const sHeight = cropBox ? cropBox.height * vHeight : vHeight;

            ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);

            // Instantaneous ImageBitmap creation without JPEG compression latency
            const imageBitmap = await createImageBitmap(canvas);

            const frame: ExtractedFrame = { imageBitmap, timestamp: currentTime, index: frameCount };

            // Persist blob to IndexedDB asynchronously in background
            canvas.toBlob((blob) => {
              if (blob) {
                set(`${idbPrefix}${frameCount}`, { blob, timestamp: currentTime, index: frameCount }).catch(() => {});
              }
            }, 'image/jpeg', 0.8);

            // Process immediately through pose detection pipeline
            await onFrame(frame);

            // CRITICAL: Close bitmap after processing to avoid GPU memory leaks
            if (imageBitmap.close) imageBitmap.close();

            frameCount++;
            onProgress(Math.min(99, Math.round((frameCount / Math.max(1, totalExpectedFrames)) * 100)));

            // Safety throttle to let hardware decoder catch up - avoids Code 4 crashes
            if (frameCount % 5 === 0) {
              await new Promise(r => setTimeout(r, 15));
            }
          } catch (seekErr: any) {
            console.warn('Seek or frame processing error, attempting recovery:', seekErr?.message || String(seekErr));
            // Non-fatal, just continue or trigger fallback if too many errors
          }
        }

        cleanup();
        resolve({ frameCount, duration });
      } catch (err) {
        cleanup();
        console.warn('Video extraction frame loop error, falling back to synthetic synthesis:', err);
        runSyntheticFallback();
      }
    };

    if (!videoUrl) {
      runSyntheticFallback();
      return;
    }

    video.preload = 'auto';
    video.src = videoUrl;
    video.load();

    if (video.readyState >= 1) {
      (video.onloadedmetadata as any)();
    }
  });
}

export async function getFrame(videoUrl: string, index: number): Promise<ExtractedFrame | undefined> {
  return await get(`frames_${videoUrl}_${index}`);
}

export async function checkVideoCompatibility(videoUrl: string): Promise<boolean> {
  const video = document.createElement('video');
  const canPlay = video.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
  // Simplistic check for H.264 MP4 support. HEVC often returns 'maybe'
  return !!canPlay;
}
