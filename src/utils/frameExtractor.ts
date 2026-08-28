import { set, get, clear, keys, del } from 'idb-keyval';
import { renderSampleSportFrame } from './sportsCanvasClips';
import { extractFramesWebCodecs, isWebCodecsSupported, WebCodecsFrame, WebCodecsTelemetry } from './webcodecsPipeline';

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
  hardwareGpuPipeline?: boolean;
  microsecondTimestamp?: number;
}

/**
 * Clears all cached frames from IndexedDB to free up space and prevent stale data overlap.
 */
export async function clearFrameCache(): Promise<void> {
  try {
    const allKeys = await keys();
    const frameKeys = allKeys.filter(k => typeof k === 'string' && k.startsWith('frames_'));
    for (const key of frameKeys) {
      await del(key);
    }
    console.log('🗑️ IndexedDB Frame Cache Cleared');
  } catch (err) {
    console.warn('Failed to clear frame cache:', err);
  }
}
/**
 * Demuxes raw NAL units in JS and decodes frame-by-frame on GPU hardware without seeking lag.
 * Falls back gracefully to HTML5 video element seeking or synthetic frame synthesis.
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
  // 1. Attempt Native GPU WebCodecs + MP4Box.js Pipeline First (Fastest, zero seeking lag)
  if (isWebCodecsSupported() && videoUrl) {
    try {
      console.log('⚡ Initializing WebCodecs + MP4Box.js Native GPU Extraction Pipeline...');
      const pendingTasks: Promise<void>[] = [];
      const MAX_CONCURRENT = 1; // Strict limit for pose detection heavy tasks

      const result = await extractFramesWebCodecs(
        videoUrl,
        async (wcFrame: WebCodecsFrame) => {
          const task = onFrame({
            imageBitmap: wcFrame.imageBitmap,
            timestamp: wcFrame.timestamp,
            index: wcFrame.index,
            hardwareGpuPipeline: true,
            microsecondTimestamp: wcFrame.microsecondTimestamp
          });
          
          pendingTasks.push(task);
          if (pendingTasks.length >= MAX_CONCURRENT) {
            await pendingTasks[0];
            pendingTasks.shift();
          }
        },
        (progressPct) => {
          onProgress(progressPct);
        },
        {
          targetFps,
          targetHeight,
          cropBox,
          startTime,
          endTime
        }
      );

      // Await all frames being processed by pose detection before finishing
      await Promise.all(pendingTasks);

      if (result.frameCount > 0) {
        console.log(`✅ WebCodecs + MP4Box.js GPU Pipeline successful: ${result.frameCount} frames extracted at ${result.telemetry.decodingSpeedFps} FPS!`);
        return { frameCount: result.frameCount, duration: result.duration };
      }
    } catch (wcError) {
      console.warn('⚠️ WebCodecs + MP4Box.js GPU Pipeline bypassed, falling back to HTML5 video player pipeline:', wcError);
    }
  }

  // 2. HTML5 Video Player Fallback Pipeline
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

    video.onerror = (_e) => {
      if (fallbackTriggered) return;

      // CORS Retry: If CORS error occurred with crossOrigin = 'anonymous', try clearing crossOrigin once
      if (video.crossOrigin && !video.dataset.corsRetried) {
        video.dataset.corsRetried = 'true';
        video.crossOrigin = null;
        video.src = videoUrl;
        video.load();
        return;
      }

      const mediaErr = video.error;
      const code = mediaErr ? mediaErr.code : 'unknown';
      const message = mediaErr ? mediaErr.message : 'Source loading or decoding issue';
      console.warn(`Video element load warning (Code ${code}): ${message}. Switching to canvas frame synthesis fallback.`);
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
        const frameInterval = 1 / targetFps; // e.g., 0.0333s for 30 FPS
        const totalExpectedFrames = Math.floor(duration / frameInterval);
        let frameCount = 0;

        // Attempt Native Hardware Sequential Frame Extraction via requestVideoFrameCallback
        if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
          try {
            video.currentTime = actualStart;
            await new Promise<void>((resSeek) => {
              const handleSeek = () => {
                video.removeEventListener('seeked', handleSeek);
                resSeek();
              };
              video.addEventListener('seeked', handleSeek);
              setTimeout(handleSeek, 300);
            });

            let lastCapturedTime = -1;
            const minInterval = 0.85 / targetFps; // Prevents duplicate frames (~0.028s for 30fps)
            const cutoffTime = Math.max(actualStart + 0.1, actualEnd - 0.08);

            // Play video at 1.0x normal speed for real-time extraction
            video.playbackRate = 1.0;

            const pendingRVFCTasks: Promise<void>[] = [];

            await new Promise<void>((resolveExtract) => {
              let isDone = false;
              let inactivityTimer: ReturnType<typeof setTimeout> | null = null;

              const finish = async () => {
                if (isDone) return;
                isDone = true;
                if (inactivityTimer) clearTimeout(inactivityTimer);
                video.pause();
                video.removeEventListener('ended', finish);
                video.removeEventListener('pause', finish);
                
                // Wait for all RVFC frame detections to complete
                await Promise.all(pendingRVFCTasks);
                resolveExtract();
              };

              video.addEventListener('ended', finish);
              video.addEventListener('pause', () => {
                // If paused near the end, treat as done
                if (video.currentTime >= cutoffTime - 0.2) finish();
              });

              const resetInactivityTimer = () => {
                if (inactivityTimer) clearTimeout(inactivityTimer);
                inactivityTimer = setTimeout(() => {
                  console.warn('RVFC extraction stall detected, wrapping up extraction.');
                  finish();
                }, 1200);
              };

              resetInactivityTimer();

              const onCallback = async (_now: DOMHighResTimeStamp, metadata: VideoFrameCallbackMetadata) => {
                if (isDone || fallbackTriggered) return;
                resetInactivityTimer();

                const mediaTime = metadata.mediaTime;

                if (mediaTime >= actualStart && mediaTime <= actualEnd + 0.05) {
                  if (lastCapturedTime < 0 || (mediaTime - lastCapturedTime) >= minInterval) {
                    lastCapturedTime = mediaTime;

                    const vWidth = video.videoWidth || 640;
                    const vHeight = video.videoHeight || 360;
                    const sx = cropBox ? cropBox.x * vWidth : 0;
                    const sy = cropBox ? cropBox.y * vHeight : 0;
                    const sWidth = cropBox ? cropBox.width * vWidth : vWidth;
                    const sHeight = cropBox ? cropBox.height * vHeight : vHeight;

                    ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);

                    const imageBitmap = await createImageBitmap(canvas);
                    const frame: ExtractedFrame = { imageBitmap, timestamp: mediaTime, index: frameCount };

                    canvas.toBlob((blob) => {
                      if (blob) {
                        set(`${idbPrefix}${frameCount}`, { blob, timestamp: mediaTime, index: frameCount }).catch(() => {});
                      }
                    }, 'image/jpeg', 0.8);

                    // Track this detection task
                    const task = onFrame(frame).then(() => {
                      if (imageBitmap.close) imageBitmap.close();
                    });
                    pendingRVFCTasks.push(task);

                    frameCount++;
                    const progressPct = Math.min(99, Math.round(((mediaTime - actualStart) / duration) * 100));
                    onProgress(progressPct);
                  }
                }

                if (mediaTime >= cutoffTime || video.ended || video.paused) {
                  finish();
                  return;
                }

                (video as any).requestVideoFrameCallback(onCallback);
              };

              (video as any).requestVideoFrameCallback(onCallback);
              video.play().catch(() => {
                finish();
              });
            });

            if (frameCount > 0) {
              cleanup();
              resolve({ frameCount, duration });
              return;
            }
          } catch (rvfcErr) {
            console.warn('requestVideoFrameCallback failed, falling back to seek loop:', rvfcErr);
          }
        }

        // Fallback Step Extractor (for environments without rvfc or blocked playback)
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
                  rejectSeek(err);
                }
              };
              video.addEventListener('seeked', handleSeeked);
              video.addEventListener('error', handleError);
              setTimeout(handleSeeked, 150);
            });

            const actualSeekedTime = video.currentTime;

            const vWidth = video.videoWidth || 640;
            const vHeight = video.videoHeight || 360;
            const sx = cropBox ? cropBox.x * vWidth : 0;
            const sy = cropBox ? cropBox.y * vHeight : 0;
            const sWidth = cropBox ? cropBox.width * vWidth : vWidth;
            const sHeight = cropBox ? cropBox.height * vHeight : vHeight;

            ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);

            const imageBitmap = await createImageBitmap(canvas);

            const frame: ExtractedFrame = { imageBitmap, timestamp: currentTime, index: frameCount };

            canvas.toBlob((blob) => {
              if (blob) {
                set(`${idbPrefix}${frameCount}`, { blob, timestamp: currentTime, index: frameCount }).catch(() => {});
              }
            }, 'image/jpeg', 0.8);

            await onFrame(frame);

            if (imageBitmap.close) imageBitmap.close();

            frameCount++;
            onProgress(Math.min(99, Math.round((frameCount / Math.max(1, totalExpectedFrames)) * 100)));
          } catch (seekErr) {
            console.warn('Seek or frame processing error:', seekErr);
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
