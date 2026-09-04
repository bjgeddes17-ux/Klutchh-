import * as VideoThumbnails from 'expo-video-thumbnails';

export interface ExtractedFrame {
  blob?: Blob;
  imageBitmap?: any;
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
  baseFps: number;
  maxBurstFps: number;
  windows?: BurstSamplingWindow[];
  fastActionPhases?: string[];
  sportId?: string;
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

export function detectHighFrameRateCapability(): {
  supportsHighFrameRate: boolean;
  maxSupportedFps: number;
  isMobileDevice: boolean;
  hasRVFC: boolean;
  hasWebCodecs: boolean;
} {
  return {
    supportsHighFrameRate: true,
    maxSupportedFps: 45, // Optimized 45 FPS fast action rate
    isMobileDevice: true,
    hasRVFC: false,
    hasWebCodecs: false
  };
}

export function createBurstWindowsFromPhases(
  phases: Array<{ name: string; startTime: number; endTime: number }>,
  burstFps: number = 45,
  sportId?: string
): BurstSamplingWindow[] {
  const targetBurstFps = Math.min(45, Math.max(15, burstFps));
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

export function getSamplingIntervalAtTime(
  timeSec: number,
  baseFps: number = 15,
  windows: BurstSamplingWindow[] = [],
  maxBurstFps: number = 45
): { interval: number; currentFps: number; isBurst: boolean; window?: BurstSamplingWindow } {
  const clampedBaseFps = Math.max(1, baseFps);
  const clampedMaxBurstFps = Math.min(45, Math.max(clampedBaseFps, maxBurstFps));

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

export function generateAdaptiveTimeline(
  startTime: number,
  endTime: number,
  baseFps: number = 15,
  windows: BurstSamplingWindow[] = [],
  maxBurstFps: number = 45,
  maxTotalFrames: number = 110
): { timestamps: number[]; burstMap: Map<number, { isBurst: boolean; currentFps: number }> } {
  const duration = Math.max(0.1, endTime - startTime);

  // Calculate burst duration vs base duration
  let burstDuration = 0;
  for (const win of windows) {
    const wStart = Math.max(startTime, win.startTime);
    const wEnd = Math.min(endTime, win.endTime);
    if (wEnd > wStart) {
      burstDuration += (wEnd - wStart);
    }
  }
  const baseDuration = Math.max(0, duration - burstDuration);

  // Target 45 FPS in fast action burst zones, 12-15 FPS in base zones
  let targetBurstFps = Math.min(45, maxBurstFps);
  let targetBaseFps = Math.min(baseFps, targetBurstFps);

  // Estimate total frames at initial targets
  const estimatedFrames = Math.ceil(baseDuration * targetBaseFps + burstDuration * targetBurstFps);

  // If estimated frames exceed maxTotalFrames (110), scale down proportionally
  if (estimatedFrames > maxTotalFrames) {
    const scaleFactor = (maxTotalFrames - 2) / estimatedFrames;
    targetBurstFps = Math.max(15, Math.floor(targetBurstFps * scaleFactor));
    targetBaseFps = Math.max(4, Math.floor(targetBaseFps * scaleFactor));
  }

  let timestamps: number[] = [];
  const burstMap = new Map<number, { isBurst: boolean; currentFps: number }>();

  let curr = startTime;
  const roundedEnd = Math.round(endTime * 1000) / 1000;

  while (curr <= roundedEnd + 0.0005) {
    const timeKey = Math.round(curr * 1000) / 1000;
    const sampleInfo = getSamplingIntervalAtTime(timeKey, targetBaseFps, windows, targetBurstFps);
    timestamps.push(timeKey);
    burstMap.set(timeKey, { isBurst: sampleInfo.isBurst, currentFps: sampleInfo.currentFps });

    curr += sampleInfo.interval;
  }

  // Strict cap safeguard: ensure total kinematics never exceed maxTotalFrames (110)
  if (timestamps.length > maxTotalFrames) {
    const decimated: number[] = [];
    const step = (timestamps.length - 1) / (maxTotalFrames - 1);
    for (let i = 0; i < maxTotalFrames; i++) {
      const idx = Math.min(timestamps.length - 1, Math.round(i * step));
      const t = timestamps[idx];
      if (decimated.length === 0 || t > decimated[decimated.length - 1]) {
        decimated.push(t);
      }
    }
    timestamps = decimated;
  }

  return { timestamps, burstMap };
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
  endTime?: number,
  burstConfig?: BurstSamplingConfig | BurstSamplingWindow[]
): Promise<{ frameCount: number; duration: number }> {
  console.log('Native: Starting extraction via expo-video-thumbnails with Burst Sampling');
  
  const resolvedBurstConfig: BurstSamplingConfig = Array.isArray(burstConfig)
    ? { enabled: burstConfig.length > 0, baseFps: targetFps, maxBurstFps: 45, windows: burstConfig }
    : burstConfig || { enabled: false, baseFps: targetFps, maxBurstFps: 45, windows: [] };

  try {
    const finalTime = endTime !== undefined ? endTime : 10;
    const duration = Math.max(0.1, finalTime - startTime);
    
    const { timestamps, burstMap } = generateAdaptiveTimeline(
      startTime,
      finalTime,
      resolvedBurstConfig.baseFps,
      resolvedBurstConfig.windows,
      resolvedBurstConfig.maxBurstFps
    );

    let count = 0;
    const thumbnailOptions = {
      quality: 0.6,
      time: 0,
    };

    for (const currentTimeSec of timestamps) {
      const currentTimeMs = Math.round(currentTimeSec * 1000);
      const burstData = burstMap.get(currentTimeSec) || { isBurst: false, currentFps: targetFps };

      const { uri } = await VideoThumbnails.getThumbnailAsync(videoUrl, {
        ...thumbnailOptions,
        time: currentTimeMs,
      });

      await onFrame({
        uri,
        index: count,
        timestamp: currentTimeSec,
        isBurst: burstData.isBurst,
        effectiveFps: burstData.currentFps
      });

      count++;
      onProgress(Math.min(95, Math.round((count / Math.max(1, timestamps.length)) * 100)));
    }

    onProgress(100);
    return { frameCount: count, duration };
  } catch (e) {
    console.error('Native extraction failed:', e);
    throw e;
  }
}

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
  const baseFps = burstConfig?.baseFps || 20;
  const maxBurstFps = Math.min(120, Math.max(baseFps, burstConfig?.maxBurstFps || 120));

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

export async function getFrame(_index: number): Promise<ExtractedFrame | null> {
  return null;
}

export async function setFrame(_index: number, _frame: ExtractedFrame): Promise<void> {
  // On Native, stored as file URIs
}

