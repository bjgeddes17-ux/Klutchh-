// On Native, WebCodecs and MP4Box are not available.
// This file provides a compatible interface to prevent build crashes.

export interface WebCodecsFrame {
  imageBitmap: any;
  timestamp: number;
  index: number;
  microsecondTimestamp: number;
  hardwareGpuPipeline: boolean;
  codec: string;
}

export interface WebCodecsTelemetry {
  isSupported: boolean;
  isGpuActive: boolean;
  codec: string;
  demuxer: string;
  totalNalUnitsDemuxed: number;
  totalGpuVideoFrames: number;
  decodingSpeedFps: number;
  seekingLatencyMs: number;
  duration: number;
  resolution: { width: number; height: number };
}

export interface ExtractOptions {
  targetFps?: number;
  targetHeight?: number;
  cropBox?: { x: number; y: number; width: number; height: number };
  startTime?: number;
  endTime?: number;
}

export function isWebCodecsSupported(): boolean {
  return false;
}

export async function extractFramesWebCodecs(
  _videoSource: any,
  _onFrame: (frame: WebCodecsFrame) => Promise<void>,
  _onProgress: (progress: number, telemetry: Partial<WebCodecsTelemetry>) => void,
  _options: ExtractOptions = {}
): Promise<{ frameCount: number; duration: number; telemetry: WebCodecsTelemetry }> {
  console.log('extractFramesWebCodecs is not supported on Native.');
  
  const telemetry: WebCodecsTelemetry = {
    isSupported: false,
    isGpuActive: false,
    codec: 'N/A',
    demuxer: 'N/A',
    totalNalUnitsDemuxed: 0,
    totalGpuVideoFrames: 0,
    decodingSpeedFps: 0,
    seekingLatencyMs: 0,
    duration: 0,
    resolution: { width: 0, height: 0 }
  };

  return {
    frameCount: 0,
    duration: 0,
    telemetry
  };
}
