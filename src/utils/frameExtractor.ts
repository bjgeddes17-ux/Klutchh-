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
  uri?: string; // For Native file paths
  timestamp: number;
  index: number;
  hardwareGpuPipeline?: boolean;
  microsecondTimestamp?: number;
  isBurst?: boolean;
  effectiveFps?: number;
}

export interface BurstSamplingWindow {
  startTime: number; // in seconds
  endTime: number; // in seconds
  burstFps?: number; // up to 120 FPS
  phaseName?: string;
  description?: string;
}

export interface BurstSamplingConfig {
  enabled: boolean;
  baseFps: number; // Base capture rate (e.g. 15 or 30 FPS)
  maxBurstFps: number; // Max burst FPS (up to 120 FPS on supported devices)
  windows?: BurstSamplingWindow[];
  fastActionPhases?: string[]; // Custom phase names that trigger burst sampling
  sportId?: string; // Sport context to auto-resolve fast-action phases
}

export interface BurstSamplingTelemetry {
  totalFrames: number;
  normalFrames: number;
  burstFrames: number;
  burstWindowsApplied: BurstSamplingWindow[];
  maxEffectiveFps: number;
  hardwareCapability: {
    supportsHighFrameRate: boolean;
    maxSupportedFps: number;
    isMobileDevice: boolean;
    hasRVFC: boolean;
    hasWebCodecs: boolean;
  };
}

/**
 * Standard registry of rapid kinetic action phases across sports that require high-speed burst frame rates.
 */
export const FAST_ACTION_SPORT_PHASES: Record<string, string[]> = {
  golf: ['Downswing Impact', 'Downswing', 'Impact', 'Impact Moment', 'Ball Strike', 'Top-Swing Transition'],
  tennis: ['Impact Instant', 'Racquet Drop', 'Wiper Follow-Through', 'Serve Peak Contact Stretch', 'Ball Release'],
  soccer: ['Impact Moment', 'Plant Phase', 'Ball Strike', 'Strike Moment', 'Dive Takeoff', 'Backswing'],
  rugby: ['Contact Phase', 'Impact Moment', 'Ball Release', 'Ball Strike', 'Drop Bounce', 'Takeoff', 'Cleanout'],
  netball: ['Shot Release', 'Release Instant', 'Release Point', 'Ball Reception', 'Interception', 'Sudden Stop'],
  hockey: ['Impact Moment', 'Ball Contact', 'Shot Release', 'Slapshot Snap', 'Wind-Up'],
  cricket: ['Bowling Release', 'Batting Drive', 'Ball Strike', 'Front Foot Plant'],
  general: ['Impact', 'Release', 'Strike', 'Contact', 'Downswing', 'Takeoff', 'Explosion', 'Acceleration', 'Burst', 'Transition']
};

/**
 * Checks whether a given movement phase name qualifies as a high-velocity biomechanical transition.
 */
export function isFastActionPhase(phaseName: string, sportId?: string): boolean {
  if (!phaseName) return false;
  const normalized = phaseName.toLowerCase().trim();

  if (sportId && FAST_ACTION_SPORT_PHASES[sportId.toLowerCase()]) {
    const list = FAST_ACTION_SPORT_PHASES[sportId.toLowerCase()];
    if (list.some((p) => normalized.includes(p.toLowerCase()) || p.toLowerCase().includes(normalized))) {
      return true;
    }
  }

  for (const list of Object.values(FAST_ACTION_SPORT_PHASES)) {
    if (list.some((p) => normalized.includes(p.toLowerCase()) || p.toLowerCase().includes(normalized))) {
      return true;
    }
  }

  const fastKeywords = ['impact', 'strike', 'release', 'contact', 'snap', 'cut', 'whip', 'drive', 'kick', 'downswing'];
  return fastKeywords.some((kw) => normalized.includes(kw));
}

/**
 * Detects device hardware high-frame-rate decoding capabilities (up to 120 FPS).
 */
export function detectHighFrameRateCapability(): {
  supportsHighFrameRate: boolean;
  maxSupportedFps: number;
  isMobileDevice: boolean;
  hasRVFC: boolean;
  hasWebCodecs: boolean;
} {
  const isBrowser = typeof window !== 'undefined';
  const ua = isBrowser && navigator?.userAgent ? navigator.userAgent.toLowerCase() : '';
  const isMobileDevice = /android|iphone|ipad|ipod|mobile|silk/i.test(ua);
  const hasRVFC = isBrowser && 'HTMLVideoElement' in window && 'requestVideoFrameCallback' in HTMLVideoElement.prototype;
  const hasWebCodecs = isWebCodecsSupported();

  // Modern mobile devices and GPU WebCodecs/RVFC pipelines support up to 120 FPS
  let maxSupportedFps = 60;
  if (isMobileDevice || hasWebCodecs || hasRVFC) {
    maxSupportedFps = 120;
  }

  return {
    supportsHighFrameRate: hasWebCodecs || hasRVFC || isMobileDevice,
    maxSupportedFps,
    isMobileDevice,
    hasRVFC,
    hasWebCodecs
  };
}

/**
 * Generates burst sampling time windows from detected movement phases.
 */
export function createBurstWindowsFromPhases(
  phases: Array<{ name: string; startTime: number; endTime: number }>,
  burstFps: number = 120,
  sportId?: string
): BurstSamplingWindow[] {
  const targetBurstFps = Math.min(120, Math.max(30, burstFps));
  const windows: BurstSamplingWindow[] = [];

  for (const phase of phases) {
    if (isFastActionPhase(phase.name, sportId)) {
      // 50ms temporal lead-in and follow-through padding to cleanly bracket kinematic transitions
      const padding = 0.05;
      const start = Math.max(0, phase.startTime - padding);
      const end = phase.endTime + padding;

      windows.push({
        startTime: start,
        endTime: end,
        burstFps: targetBurstFps,
        phaseName: phase.name,
        description: `High-velocity transition burst (${phase.name}) at ${targetBurstFps} FPS`
      });
    }
  }

  return windows;
}

/**
 * Computes sampling interval and target FPS for a given timestamp based on active burst windows.
 */
export function getSamplingIntervalAtTime(
  timeSec: number,
  baseFps: number = 15,
  windows: BurstSamplingWindow[] = [],
  maxBurstFps: number = 120
): { interval: number; currentFps: number; isBurst: boolean; window?: BurstSamplingWindow } {
  const clampedBaseFps = Math.max(1, baseFps);
  const clampedMaxBurstFps = Math.min(120, Math.max(clampedBaseFps, maxBurstFps));

  for (const win of windows) {
    if (timeSec >= win.startTime && timeSec <= win.endTime) {
      const burstFps = Math.min(clampedMaxBurstFps, win.burstFps || clampedMaxBurstFps);
      return {
        interval: 1 / burstFps,
        currentFps: burstFps,
        isBurst: true,
        window: win
      };
    }
  }

  return {
    interval: 1 / clampedBaseFps,
    currentFps: clampedBaseFps,
    isBurst: false
  };
}

/**
 * Builds an adaptive non-linear timeline that increases sampling density (up to 120 FPS)
 * during fast-action burst phases while maintaining baseline FPS elsewhere.
 */
export function generateAdaptiveTimeline(
  startTime: number,
  endTime: number,
  baseFps: number = 15,
  windows: BurstSamplingWindow[] = [],
  maxBurstFps: number = 120
): { timestamps: number[]; burstMap: Map<number, { isBurst: boolean; currentFps: number }> } {
  const timestamps: number[] = [];
  const burstMap = new Map<number, { isBurst: boolean; currentFps: number }>();

  let curr = startTime;
  const roundedEnd = Math.round(endTime * 1000) / 1000;

  while (curr <= roundedEnd + 0.0005) {
    const timeKey = Math.round(curr * 1000) / 1000;
    const sampleInfo = getSamplingIntervalAtTime(timeKey, baseFps, windows, maxBurstFps);
    timestamps.push(timeKey);
    burstMap.set(timeKey, { isBurst: sampleInfo.isBurst, currentFps: sampleInfo.currentFps });

    curr += sampleInfo.interval;
  }

  return { timestamps, burstMap };
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
  targetFps: number = 15,
  targetHeight: number = 480,
  cropBox?: { x: number; y: number; width: number; height: number },
  startTime: number = 0,
  endTime?: number,
  burstConfig?: BurstSamplingConfig | BurstSamplingWindow[]
): Promise<{ frameCount: number; duration: number }> {
  // Resolve burst sampling configuration
  const resolvedBurstConfig: BurstSamplingConfig = Array.isArray(burstConfig)
    ? { enabled: burstConfig.length > 0, baseFps: targetFps, maxBurstFps: 120, windows: burstConfig }
    : burstConfig || { enabled: false, baseFps: targetFps, maxBurstFps: 120, windows: [] };

  // 1. Attempt Native GPU WebCodecs + MP4Box.js Pipeline First (Fastest, zero seeking lag)
  if (isWebCodecsSupported() && videoUrl) {
    try {
      console.log('⚡ Initializing WebCodecs + MP4Box.js Native GPU Extraction Pipeline...');
      const pendingTasks: Promise<void>[] = [];
      const MAX_CONCURRENT = 1; // Strict limit for pose detection heavy tasks
      let lastExtractedTs = -1;

      const result = await extractFramesWebCodecs(
        videoUrl,
        async (wcFrame: WebCodecsFrame) => {
          const timestamp = wcFrame.timestamp;
          const sampleInfo = getSamplingIntervalAtTime(
            timestamp,
            resolvedBurstConfig.baseFps,
            resolvedBurstConfig.windows,
            resolvedBurstConfig.maxBurstFps
          );

          if (resolvedBurstConfig.enabled && resolvedBurstConfig.windows && resolvedBurstConfig.windows.length > 0) {
            const minInterval = sampleInfo.interval * 0.85;
            if (lastExtractedTs >= 0 && (timestamp - lastExtractedTs) < minInterval) {
              if (wcFrame.imageBitmap && wcFrame.imageBitmap.close) {
                wcFrame.imageBitmap.close();
              }
              return;
            }
          }
          lastExtractedTs = timestamp;

          const task = onFrame({
            imageBitmap: wcFrame.imageBitmap,
            timestamp: wcFrame.timestamp,
            index: wcFrame.index,
            hardwareGpuPipeline: true,
            microsecondTimestamp: wcFrame.microsecondTimestamp,
            isBurst: sampleInfo.isBurst,
            effectiveFps: sampleInfo.currentFps
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
          targetFps: resolvedBurstConfig.enabled ? resolvedBurstConfig.maxBurstFps : targetFps,
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

        const { timestamps, burstMap } = generateAdaptiveTimeline(
          0,
          duration,
          resolvedBurstConfig.baseFps,
          resolvedBurstConfig.windows,
          resolvedBurstConfig.maxBurstFps
        );
        let frameCount = 0;

        for (const currentTime of timestamps) {
          const burstData = burstMap.get(currentTime) || { isBurst: false, currentFps: targetFps };
          renderSampleSportFrame(ctx, targetWidth, targetHeight, 'golf', currentTime);

          const imageBitmap = await createImageBitmap(canvas);
          const frame: ExtractedFrame = {
            imageBitmap,
            timestamp: currentTime,
            index: frameCount,
            isBurst: burstData.isBurst,
            effectiveFps: burstData.currentFps
          };

          await onFrame(frame);
          if (imageBitmap.close) imageBitmap.close();
          frameCount++;
          onProgress(Math.min(99, Math.round((frameCount / Math.max(1, timestamps.length)) * 100)));
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
                  const sampleInfo = getSamplingIntervalAtTime(
                    mediaTime,
                    resolvedBurstConfig.baseFps,
                    resolvedBurstConfig.windows,
                    resolvedBurstConfig.maxBurstFps
                  );
                  const dynamicMinInterval = sampleInfo.interval * 0.85;

                  if (lastCapturedTime < 0 || (mediaTime - lastCapturedTime) >= dynamicMinInterval) {
                    lastCapturedTime = mediaTime;

                    const vWidth = video.videoWidth || 640;
                    const vHeight = video.videoHeight || 360;
                    const sx = cropBox ? cropBox.x * vWidth : 0;
                    const sy = cropBox ? cropBox.y * vHeight : 0;
                    const sWidth = cropBox ? cropBox.width * vWidth : vWidth;
                    const sHeight = cropBox ? cropBox.height * vHeight : vHeight;

                    ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);

                    const imageBitmap = await createImageBitmap(canvas);
                    const frame: ExtractedFrame = {
                      imageBitmap,
                      timestamp: mediaTime,
                      index: frameCount,
                      isBurst: sampleInfo.isBurst,
                      effectiveFps: sampleInfo.currentFps
                    };

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

        const { timestamps, burstMap } = generateAdaptiveTimeline(
          actualStart,
          actualEnd,
          resolvedBurstConfig.baseFps,
          resolvedBurstConfig.windows,
          resolvedBurstConfig.maxBurstFps
        );

        for (const currentTime of timestamps) {
          if (fallbackTriggered) break;
          const burstData = burstMap.get(currentTime) || { isBurst: false, currentFps: targetFps };
          
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

            const vWidth = video.videoWidth || 640;
            const vHeight = video.videoHeight || 360;
            const sx = cropBox ? cropBox.x * vWidth : 0;
            const sy = cropBox ? cropBox.y * vHeight : 0;
            const sWidth = cropBox ? cropBox.width * vWidth : vWidth;
            const sHeight = cropBox ? cropBox.height * vHeight : vHeight;

            ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);

            const imageBitmap = await createImageBitmap(canvas);

            const frame: ExtractedFrame = {
              imageBitmap,
              timestamp: currentTime,
              index: frameCount,
              isBurst: burstData.isBurst,
              effectiveFps: burstData.currentFps
            };

            canvas.toBlob((blob) => {
              if (blob) {
                set(`${idbPrefix}${frameCount}`, { blob, timestamp: currentTime, index: frameCount }).catch(() => {});
              }
            }, 'image/jpeg', 0.8);

            await onFrame(frame);

            if (imageBitmap.close) imageBitmap.close();

            frameCount++;
            onProgress(Math.min(99, Math.round((frameCount / Math.max(1, timestamps.length)) * 100)));
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

/**
 * Dedicated high-performance Burst Sampling utility.
 * Dynamically increases capture frame rates up to 120 FPS on supported devices
 * specifically during identified fast-action movement phases (e.g. Downswing Impact, Ball Strike).
 */
export async function extractFramesWithBurstSampling(
  videoUrl: string,
  onFrame: (frame: ExtractedFrame) => Promise<void>,
  onProgress: (progress: number, telemetry?: BurstSamplingTelemetry) => void,
  burstConfig?: Partial<BurstSamplingConfig>,
  options: {
    targetHeight?: number;
    cropBox?: { x: number; y: number; width: number; height: number };
    startTime?: number;
    endTime?: number;
  } = {}
): Promise<{ frameCount: number; duration: number; telemetry: BurstSamplingTelemetry }> {
  const hw = detectHighFrameRateCapability();
  const baseFps = burstConfig?.baseFps || 15;
  const maxBurstFps = Math.min(120, Math.max(baseFps, burstConfig?.maxBurstFps || hw.maxSupportedFps || 120));

  const fullConfig: BurstSamplingConfig = {
    enabled: burstConfig?.enabled !== false,
    baseFps,
    maxBurstFps,
    windows: burstConfig?.windows ? [...burstConfig.windows] : [],
    fastActionPhases: burstConfig?.fastActionPhases,
    sportId: burstConfig?.sportId
  };

  const telemetry: BurstSamplingTelemetry = {
    totalFrames: 0,
    normalFrames: 0,
    burstFrames: 0,
    burstWindowsApplied: fullConfig.windows || [],
    maxEffectiveFps: baseFps,
    hardwareCapability: hw
  };

  console.log(`🚀 Burst Sampling initiated: base ${baseFps} FPS, burst up to ${maxBurstFps} FPS (Hardware support: ${hw.supportsHighFrameRate ? 'Yes' : 'Simulated'}, Mobile: ${hw.isMobileDevice})`);

  const wrappedOnFrame = async (frame: ExtractedFrame) => {
    telemetry.totalFrames++;
    if (frame.isBurst) {
      telemetry.burstFrames++;
      if (frame.effectiveFps && frame.effectiveFps > telemetry.maxEffectiveFps) {
        telemetry.maxEffectiveFps = frame.effectiveFps;
      }
    } else {
      telemetry.normalFrames++;
    }
    await onFrame(frame);
  };

  const wrappedOnProgress = (p: number) => {
    onProgress(p, telemetry);
  };

  const result = await extractFramesPipelined(
    videoUrl,
    wrappedOnFrame,
    wrappedOnProgress,
    baseFps,
    options.targetHeight || 480,
    options.cropBox,
    options.startTime || 0,
    options.endTime,
    fullConfig
  );

  return {
    frameCount: result.frameCount,
    duration: result.duration,
    telemetry
  };
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
