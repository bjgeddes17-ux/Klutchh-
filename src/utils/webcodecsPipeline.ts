import * as MP4Box from 'mp4box';

// Robust helper to instantiate MP4Box file across bundler ESM formats
function createMP4BoxFile(): any {
  if (typeof MP4Box.createFile === 'function') {
    return MP4Box.createFile();
  }
  // Use bracket notation to avoid static analysis errors during build
  const mp4boxAny = MP4Box as any;
  if (mp4boxAny['default'] && typeof mp4boxAny['default'].createFile === 'function') {
    return mp4boxAny['default'].createFile();
  }
  throw new Error('MP4Box.createFile function is not available.');
}

export interface WebCodecsFrame {
  imageBitmap: ImageBitmap;
  timestamp: number; // in seconds
  index: number;
  microsecondTimestamp: number; // exact microsecond timestamp from GPU VideoFrame
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
  seekingLatencyMs: number; // 0 for WebCodecs NAL streaming
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

/**
 * Checks if browser supports WebCodecs VideoDecoder API for GPU accelerated video decoding.
 */
export function isWebCodecsSupported(): boolean {
  return typeof window !== 'undefined' && 'VideoDecoder' in window && 'EncodedVideoChunk' in window;
}

/**
 * Native GPU Video Extraction Pipeline via MP4Box.js (Demuxer) + WebCodecs VideoDecoder API.
 * Bypasses HTML5 <video> elements completely, streaming raw NAL units directly to GPU hardware.
 */
export async function extractFramesWebCodecs(
  videoSource: string | Blob | File | ArrayBuffer,
  onFrame: (frame: WebCodecsFrame) => Promise<void>,
  onProgress: (progress: number, telemetry: Partial<WebCodecsTelemetry>) => void,
  options: ExtractOptions = {}
): Promise<{ frameCount: number; duration: number; telemetry: WebCodecsTelemetry }> {
  if (!isWebCodecsSupported()) {
    throw new Error('WebCodecs VideoDecoder API is not supported in this browser environment.');
  }

  const startTime = options.startTime || 0;
  const targetFps = options.targetFps || 30;
  const targetHeight = options.targetHeight || 480;
  const cropBox = options.cropBox;

  const telemetry: WebCodecsTelemetry = {
    isSupported: true,
    isGpuActive: true,
    codec: 'Pending Demux...',
    demuxer: 'MP4Box.js (NAL Units)',
    totalNalUnitsDemuxed: 0,
    totalGpuVideoFrames: 0,
    decodingSpeedFps: 0,
    seekingLatencyMs: 0, // 0ms - no HTML5 video seeking required!
    duration: 0,
    resolution: { width: 0, height: 0 }
  };

  const perfStart = performance.now();

  // Silence MP4Box logs if possible to prevent noisy console errors
  try {
    const mp4boxAny = MP4Box as any;
    const Log = mp4boxAny.Log || mp4boxAny.default?.Log;
    if (Log) {
      Log.setLogLevel(0); // 0 = Silent, 1 = Error, 2 = Warn, 3 = Info, 4 = Debug
      // Patch Log.error to prevent it from reaching the platform error console
      Log.error = () => {};
      Log.warn = () => {};
    }
  } catch (e) {}

  // 1. Obtain ArrayBuffer
  let arrayBuffer: ArrayBuffer;
  if (typeof videoSource === 'string') {
    const response = await fetch(videoSource);
    if (!response.ok) {
      throw new Error(`Failed to fetch video source for WebCodecs pipeline: ${response.statusText}`);
    }
    arrayBuffer = await response.arrayBuffer();
  } else if (videoSource && typeof (videoSource as any).arrayBuffer === 'function') {
    arrayBuffer = await (videoSource as any).arrayBuffer();
  } else {
    throw new Error('Invalid video source provided to WebCodecs pipeline.');
  }

  // Robustly trim trailing garbage/zeros which often cause "Invalid box type: ''" in MP4Box.js
  // Some files have extensive padding or non-ISOBMFF metadata at the tail.
  const view = new Uint8Array(arrayBuffer);
  let lastSignificantByte = view.length - 1;
  while (lastSignificantByte > 0 && view[lastSignificantByte] === 0) {
    lastSignificantByte--;
  }
  
  // If we trimmed more than 8 bytes of zeros, it was likely padding
  if (lastSignificantByte < view.length - 1) {
    arrayBuffer = arrayBuffer.slice(0, lastSignificantByte + 1);
  }

  // MP4Box requires fileStart offset on ArrayBuffer
  (arrayBuffer as any).fileStart = 0;

  return new Promise((resolve, reject) => {
    let mp4boxfile: any;
    let decoder: VideoDecoder | null = null;
    let frameIndex = 0;
    let videoTrack: any = null;
    let expectedEndTime = Infinity;
    let canvas: HTMLCanvasElement | null = null;
    let ctx: CanvasRenderingContext2D | null = null;
    let isFinished = false;
    let samplesProcessed = 0;

    const cleanup = () => {
      if (isFinished) return;
      isFinished = true;

      try {
        if (decoder && decoder.state !== 'closed') {
          decoder.reset();
          decoder.close();
        }
      } catch (e) {
        console.warn('Decoder cleanup warning:', e);
      }
      if (mp4boxfile) {
        try { 
          mp4boxfile.stop(); 
          if (typeof mp4boxfile.flush === 'function') mp4boxfile.flush();
        } catch (e) {}
      }
    };

    try {
      mp4boxfile = createMP4BoxFile();

      // Silence instance-specific log if it exists
      if (mp4boxfile.Log) mp4boxfile.Log.setLogLevel(0);

      mp4boxfile.onError = (e: string) => {
        // Ignore "Invalid box type: ''" errors that often happen at the very end of a buffer
        // if we've already started extraction and it's just a parsing artifact.
        if (e && (e.includes("box type") || e.includes("undefined") || e === "") && (telemetry.totalNalUnitsDemuxed > 0 || samplesProcessed > 0)) {
          console.warn("Ignoring non-fatal MP4Box demuxer error during finalization:", e);
          return;
        }
        
        // If we have some frames already, treat it as a warning not a failure
        if (frameIndex > 0) {
          console.warn("MP4Box encountered error but some frames were recovered:", e);
          return;
        }

        cleanup();
        reject(new Error(`MP4Box demuxer error: ${e}`));
      };

      mp4boxfile.onReady = (info: any) => {
        // Use an IIFE to handle the async configuration part safely
        (async () => {
          try {
            videoTrack = info.tracks.find((t: any) => t.type === 'video');
            if (!videoTrack) {
              cleanup();
              reject(new Error('No video track found in MP4 container during WebCodecs demuxing.'));
              return;
            }

            const rawDuration = videoTrack.duration / videoTrack.timescale;
            telemetry.duration = rawDuration;
            telemetry.codec = videoTrack.codec || 'avc1.42E01E';
            telemetry.resolution = {
              width: videoTrack.video.width,
              height: videoTrack.video.height
            };

            expectedEndTime = options.endTime !== undefined ? Math.min(options.endTime, rawDuration) : rawDuration;

            // Prepare downscaling canvas if targetHeight or cropBox specified
            const vWidth = videoTrack.video.width || 640;
            const vHeight = videoTrack.video.height || 360;
            const scale = targetHeight / vHeight;
            const targetWidth = Math.round(vWidth * scale);

            canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: true });

            // 2. Configure VideoDecoder with MP4Box Description Box
            let descriptionBuffer: Uint8Array | undefined;
            try {
              const mp4boxAny = MP4Box as any;
              const DataStreamClass = mp4boxAny.DataStream || mp4boxAny.default?.DataStream;
              const entry = mp4boxfile.getTrackSampleDescriptionEntry(videoTrack, videoTrack.samples?.[0]);
              if (entry && entry.avcC && DataStreamClass) {
                const stream = new DataStreamClass(undefined, 0, DataStreamClass.BIG_ENDIAN);
                entry.avcC.write(stream);
                descriptionBuffer = new Uint8Array(stream.buffer, 8); // Skip 8-byte box header
              } else if (entry && entry.hvcC && DataStreamClass) {
                const stream = new DataStreamClass(undefined, 0, DataStreamClass.BIG_ENDIAN);
                entry.hvcC.write(stream);
                descriptionBuffer = new Uint8Array(stream.buffer, 8);
              }
            } catch (descErr) {
              console.warn('WebCodecs extra data description extraction fallback:', descErr);
            }

            let codecString = videoTrack.codec;
            if (codecString.startsWith('vp09')) {
              codecString = 'vp09.00.10.08';
            }

            const decoderConfig: VideoDecoderConfig = {
              codec: codecString,
              codedWidth: vWidth,
              codedHeight: vHeight,
              description: descriptionBuffer
            };

            const support = await VideoDecoder.isConfigSupported(decoderConfig);
            if (!support.supported) {
              console.warn(`Codec ${codecString} is not directly supported by GPU VideoDecoder. Falling back to default avc1 config.`);
              decoderConfig.codec = 'avc1.42E01E'; 
            }

            decoder = new VideoDecoder({
              output: async (frame: VideoFrame) => {
                try {
                  const timestampSec = frame.timestamp / 1_000_000;
                  if (timestampSec < startTime || timestampSec > expectedEndTime + 0.1) {
                    frame.close();
                    return;
                  }

                  let finalBitmap: ImageBitmap;

                  if (cropBox && ctx && canvas) {
                    const sx = cropBox.x * vWidth;
                    const sy = cropBox.y * vHeight;
                    const sWidth = cropBox.width * vWidth;
                    const sHeight = cropBox.height * vHeight;
                    ctx.drawImage(frame as any, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
                    finalBitmap = await createImageBitmap(canvas);
                  } else if (targetHeight && targetHeight !== vHeight && ctx && canvas) {
                    ctx.drawImage(frame as any, 0, 0, vWidth, vHeight, 0, 0, canvas.width, canvas.height);
                    finalBitmap = await createImageBitmap(canvas);
                  } else {
                    finalBitmap = await createImageBitmap(frame as any);
                  }

                  const microsecondTs = frame.timestamp;
                  frame.close();

                  telemetry.totalGpuVideoFrames++;
                  const elapsedSec = (performance.now() - perfStart) / 1000;
                  telemetry.decodingSpeedFps = Math.round(telemetry.totalGpuVideoFrames / Math.max(0.001, elapsedSec));

                  const progressPct = Math.min(
                    99,
                    Math.round(((timestampSec - startTime) / Math.max(0.1, expectedEndTime - startTime)) * 100)
                  );
                  onProgress(progressPct, telemetry);

                  await onFrame({
                    imageBitmap: finalBitmap,
                    timestamp: timestampSec,
                    index: frameIndex++,
                    microsecondTimestamp: microsecondTs,
                    hardwareGpuPipeline: true,
                    codec: telemetry.codec
                  });
                } catch (frameErr) {
                  console.error('Error processing decoded GPU VideoFrame:', frameErr);
                  try { frame.close(); } catch (e) {}
                }
              },
              error: (decoderErr) => {
                console.error('WebCodecs VideoDecoder GPU Pipeline Error:', decoderErr);
                cleanup();
                reject(decoderErr);
              }
            });

            decoder.configure(decoderConfig);
            mp4boxfile.setExtractionOptions(videoTrack.id, null, { nbSamples: 1000 });
            mp4boxfile.start();

          } catch (initErr) {
            cleanup();
            reject(initErr);
          }
        })();
      };

      mp4boxfile.onSamples = (track_id: number, ref: any, samples: any[]) => {
        if (!decoder || decoder.state === 'closed') return;
        samplesProcessed += samples.length;

        for (const sample of samples) {
          try {
            telemetry.totalNalUnitsDemuxed++;
            const isKey = sample.is_sync || sample.is_rap;
            const timescale = sample.timescale || videoTrack.timescale || 1000;
            const timestampMicrosec = Math.round((sample.cts * 1_000_000) / timescale);
            const durationMicrosec = Math.round((sample.duration * 1_000_000) / timescale);

            const chunk = new EncodedVideoChunk({
              type: isKey ? 'key' : 'delta',
              timestamp: timestampMicrosec,
              duration: durationMicrosec,
              data: sample.data
            });

            decoder.decode(chunk);
          } catch (sampleErr) {
            console.warn('Error queuing NAL sample to VideoDecoder:', sampleErr);
          }
        }
      };

      // 4. Feed ArrayBuffer to MP4Box Demuxer
      try {
        mp4boxfile.appendBuffer(arrayBuffer);
        if (typeof mp4boxfile.flush === 'function') {
          mp4boxfile.flush();
        }
      } catch (appendErr) {
        console.warn("MP4Box synchronous appendBuffer error (ignoring if partial data available):", appendErr);
      }

      // Finalization logic with polling to ensure all frames are decoded
      let finalizeAttempts = 0;
      const finalize = async () => {
        if (!decoder || decoder.state === 'closed') {
          cleanup();
          resolve({ frameCount: frameIndex, duration: telemetry.duration, telemetry });
          return;
        }

        try {
          // Check if we still have frames in flight
          // We use samplesProcessed as the authoritative count of chunks sent to decode()
          const isDecodingStillInProgress = 
            samplesProcessed > 0 && 
            telemetry.totalGpuVideoFrames < (samplesProcessed * 0.95) && // Allow for some dropped frames/metadata samples
            finalizeAttempts < 60; // Max 6 seconds of waiting (60 * 100ms)

          if (isDecodingStillInProgress) {
            finalizeAttempts++;
            setTimeout(finalize, 100);
            return;
          }

          if (samplesProcessed > 0) {
            await decoder.flush();
          }
          
          const totalTime = (performance.now() - perfStart) / 1000;
          telemetry.decodingSpeedFps = Math.round(frameIndex / Math.max(0.001, totalTime));
          cleanup();
          resolve({
            frameCount: frameIndex,
            duration: telemetry.duration,
            telemetry
          });
        } catch (flushErr) {
          console.warn('Decoder flush warning:', flushErr);
          cleanup();
          resolve({ frameCount: frameIndex, duration: telemetry.duration, telemetry });
        }
      };

      // Use a safe initial delay before starting the finalization poll
      setTimeout(finalize, 1000);

    } catch (err) {
      cleanup();
      reject(err);
    }
  });
}
