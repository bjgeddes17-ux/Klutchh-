// src/services/videoFrameSynchronizer.ts
// High-Precision Video Frame Synchronization Service
// Integrates HTML5 requestVideoFrameCallback (rVFC) and requestAnimationFrame (rAF)
// to lock skeleton rendering directly to the browser composition paint cycle and eliminate micro-stutter.

import { SportRule, FrameAnalysis, MediaPipeLandmark } from '../types';
import { drawPoseSkeleton } from '../utils/geometry';
import { interpolatePoseAtTime, InterpolationResult } from '../utils/poseInterpolation';

export interface VideoFrameCallbackMetadata {
  presentationTime: number;
  expectedDisplayTime: number;
  width: number;
  height: number;
  mediaTime: number;
  presentedFrames: number;
  processingDuration?: number;
  captureTime?: number;
  receiveTime?: number;
  rtpTimestamp?: number;
}

export interface SyncTelemetry {
  videoTime: number;
  metadataTime: number;
  driftMs: number;
  frameIndex: number;
  presentedFrames: number;
  method: 'requestVideoFrameCallback' | 'requestAnimationFrame';
  isHardwareSynced: boolean;
  fps: number;
  isPastData: boolean;
}

export interface VideoFrameSynchronizerOptions {
  onTimeUpdate?: (time: number) => void;
  onTelemetryUpdate?: (telemetry: SyncTelemetry) => void;
  debugForceNativeRotation?: boolean;
  viewMode?: 'student' | 'coach';
}

export class HighPrecisionVideoSynchronizer {
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private sortedFrames: FrameAnalysis[] = [];
  private sportRule: SportRule | null = null;
  private options: VideoFrameSynchronizerOptions;

  private isRunning = false;
  private rVfcHandle: number | null = null;
  private rAfHandle: number | null = null;
  private lastPaintTime = 0;
  private frameCount = 0;
  private currentFps = 60;
  private fpsWindowStart = 0;
  private fpsWindowFrames = 0;

  // Cached container geometry to avoid reflows
  private containerWidth = 0;
  private containerHeight = 0;
  private isDataReady = false;

  constructor(options: VideoFrameSynchronizerOptions = {}) {
    this.options = options;
  }

  public attach(video: HTMLVideoElement, canvas: HTMLCanvasElement): void {
    this.video = video;
    this.canvas = canvas;
    this.bindVideoEvents();
  }

  public detach(): void {
    this.stop();
    this.unbindVideoEvents();
    this.video = null;
    this.canvas = null;
  }

  public updateConfig(
    sortedFrames: FrameAnalysis[],
    sportRule: SportRule,
    isDataReady: boolean,
    containerWidth: number,
    containerHeight: number
  ): void {
    this.sortedFrames = sortedFrames;
    this.sportRule = sportRule;
    this.isDataReady = isDataReady;
    this.containerWidth = containerWidth;
    this.containerHeight = containerHeight;

    // Trigger an immediate synchronous paint on static updates (e.g. during paused scrubbing)
    if (!this.isRunning && this.video) {
      this.paintFrame(this.video.currentTime);
    }
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.fpsWindowStart = performance.now();
    this.fpsWindowFrames = 0;
    this.scheduleNextFrame();
  }

  public stop(): void {
    this.isRunning = false;
    if (this.rVfcHandle !== null && this.video && 'cancelVideoFrameCallback' in this.video) {
      (this.video as any).cancelVideoFrameCallback(this.rVfcHandle);
      this.rVfcHandle = null;
    }
    if (this.rAfHandle !== null) {
      cancelAnimationFrame(this.rAfHandle);
      this.rAfHandle = null;
    }
  }

  public forceSync(targetTime?: number): void {
    if (!this.video) return;
    const time = targetTime !== undefined ? targetTime : this.video.currentTime;
    this.paintFrame(time);
  }

  private scheduleNextFrame(): void {
    if (!this.isRunning || !this.video) return;

    // Method 1: Hardware-Synchronized requestVideoFrameCallback (Available in Chrome, Edge, Safari 15.4+)
    if ('requestVideoFrameCallback' in this.video) {
      this.rVfcHandle = (this.video as any).requestVideoFrameCallback(
        (now: number, metadata: VideoFrameCallbackMetadata) => {
          this.rVfcHandle = null;
          if (!this.isRunning) return;

          this.handleHardwareFrame(now, metadata);
          this.scheduleNextFrame();
        }
      );
    } else {
      // Method 2: High-Precision Display Refresh requestAnimationFrame Fallback
      this.rAfHandle = requestAnimationFrame((timestamp: number) => {
        this.rAfHandle = null;
        if (!this.isRunning || !this.video) return;

        this.handleStandardFrame(timestamp);
        this.scheduleNextFrame();
      });
    }
  }

  private handleHardwareFrame(now: number, metadata: VideoFrameCallbackMetadata): void {
    if (!this.video) return;

    // Compute FPS metrics
    this.computeFps(now);

    const mediaTime = metadata.mediaTime !== undefined ? metadata.mediaTime : this.video.currentTime;

    // Report time update to React state
    if (this.options.onTimeUpdate) {
      this.options.onTimeUpdate(mediaTime);
    }

    // Paint synchronously in the exact hardware frame paint cycle
    this.paintFrame(mediaTime, 'requestVideoFrameCallback', metadata.presentedFrames);
  }

  private handleStandardFrame(timestamp: number): void {
    if (!this.video) return;

    this.computeFps(timestamp);

    const videoTime = this.video.currentTime;

    if (this.options.onTimeUpdate) {
      this.options.onTimeUpdate(videoTime);
    }

    this.paintFrame(videoTime, 'requestAnimationFrame');
  }

  private computeFps(now: number): void {
    this.fpsWindowFrames++;
    const delta = now - this.fpsWindowStart;
    if (delta >= 1000) {
      this.currentFps = Math.round((this.fpsWindowFrames * 1000) / delta);
      this.fpsWindowStart = now;
      this.fpsWindowFrames = 0;
    }
  }

  private paintFrame(
    time: number,
    method: 'requestVideoFrameCallback' | 'requestAnimationFrame' = 'requestAnimationFrame',
    presentedFramesCount = 0
  ): void {
    const video = this.video;
    const canvas = this.canvas;
    if (!video || !canvas || !this.isDataReady || !this.sportRule) return;

    const width = this.containerWidth || canvas.clientWidth || 640;
    const height = this.containerHeight || canvas.clientHeight || 360;

    if (width <= 0 || height <= 0) return;

    // Maintain devicePixelRatio resolution without visual blur
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const targetPixelWidth = Math.round(width * dpr);
    const targetPixelHeight = Math.round(height * dpr);

    if (canvas.width !== targetPixelWidth || canvas.height !== targetPixelHeight) {
      canvas.width = targetPixelWidth;
      canvas.height = targetPixelHeight;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const videoWidth = video.videoWidth || 640;
    const videoHeight = video.videoHeight || 360;
    const videoDuration = video.duration || 0;

    // Interpolate pose at exact hardware media timestamp
    const interpolation: InterpolationResult = interpolatePoseAtTime(
      this.sortedFrames,
      time,
      videoDuration > 0 ? videoDuration : undefined
    );

    const currentFrame = interpolation.currentFrame;
    const landmarks = interpolation.interpolatedLandmarks;

    if (landmarks && landmarks.length >= 17) {
      const activePhase = currentFrame?.detectedPhase || this.sportRule.phases[0];
      const ruleResults = currentFrame?.ruleResults || {};
      const angles = currentFrame?.angles || {};

      drawPoseSkeleton(
        ctx,
        width,
        height,
        landmarks,
        ruleResults,
        angles,
        this.sportRule,
        activePhase,
        interpolation.isPastData,
        videoWidth,
        videoHeight,
        this.options.debugForceNativeRotation ?? false
      );
    }

    ctx.restore();

    // Broadcast synchronization telemetry
    if (this.options.onTelemetryUpdate) {
      const metaTs = currentFrame?.timestamp || time;
      const driftMs = (time - metaTs) * 1000;
      const frameIndex = currentFrame?.frameNumber !== undefined ? currentFrame.frameNumber : 0;

      this.options.onTelemetryUpdate({
        videoTime: time,
        metadataTime: metaTs,
        driftMs,
        frameIndex,
        presentedFrames: presentedFramesCount || ++this.frameCount,
        method,
        isHardwareSynced: method === 'requestVideoFrameCallback',
        fps: this.currentFps,
        isPastData: interpolation.isPastData,
      });
    }
  }

  private onSeeked = (): void => {
    if (this.video) {
      this.paintFrame(this.video.currentTime);
    }
  };

  private onTimeUpdate = (): void => {
    if (!this.isRunning && this.video) {
      this.paintFrame(this.video.currentTime);
    }
  };

  private bindVideoEvents(): void {
    if (!this.video) return;
    this.video.addEventListener('seeked', this.onSeeked);
    this.video.addEventListener('timeupdate', this.onTimeUpdate);
  }

  private unbindVideoEvents(): void {
    if (!this.video) return;
    this.video.removeEventListener('seeked', this.onSeeked);
    this.video.removeEventListener('timeupdate', this.onTimeUpdate);
  }
}
