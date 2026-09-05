import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Maximize, Minimize } from 'lucide-react';
import { SportRule, FrameAnalysis } from '../../types';
import { KineticHeatmapOverlay } from '../KineticHeatmapOverlay';
import {
  HighPrecisionVideoSynchronizer,
  SyncTelemetry,
} from '../../services/videoFrameSynchronizer';

interface KineticVideoPlayerProps {
  videoUrl: string;
  sportRule: SportRule;
  sortedFrames: FrameAnalysis[];
  cropBox?: { x: number; y: number; width: number; height: number };
  isPlaying: boolean;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  onDurationChange?: (duration: number) => void;
  playbackRate?: number;
  isDataReady: boolean;
  viewMode?: 'student' | 'coach';
  onTogglePlay?: () => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
  onError?: (error: boolean) => void;
  debugForceNativeRotation?: boolean;
}

export const KineticVideoPlayer: React.FC<KineticVideoPlayerProps> = ({
  videoUrl,
  sportRule,
  sortedFrames,
  isPlaying,
  currentTime,
  onTimeUpdate,
  onDurationChange,
  playbackRate = 1,
  isDataReady,
  viewMode = 'coach',
  onTogglePlay,
  onToggleFullscreen,
  isFullscreen = false,
  onError,
  debugForceNativeRotation = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [videoError, setVideoError] = useState(false);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const [telemetry, setTelemetry] = useState<SyncTelemetry | null>(null);

  // Synchronizer instance preserved across renders
  const syncRef = useRef<HighPrecisionVideoSynchronizer | null>(null);

  if (!syncRef.current) {
    syncRef.current = new HighPrecisionVideoSynchronizer({
      onTimeUpdate: (time) => {
        if (isPlaying) {
          onTimeUpdate(time);
        }
      },
      onTelemetryUpdate: (t) => {
        setTelemetry(t);
      },
      debugForceNativeRotation,
      viewMode,
    });
  }

  // Monitor container size for perfect layout sync (Fixes fullscreen jump)
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerDimensions({ width, height });
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Attach synchronizer to video and canvas elements
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const synchronizer = syncRef.current;

    if (video && canvas && synchronizer) {
      synchronizer.attach(video, canvas);
      return () => {
        synchronizer.detach();
      };
    }
  }, []);

  // Update synchronizer configuration
  useEffect(() => {
    const synchronizer = syncRef.current;
    if (synchronizer) {
      synchronizer.updateConfig(
        sortedFrames,
        sportRule,
        isDataReady,
        containerDimensions.width,
        containerDimensions.height
      );
    }
  }, [sortedFrames, sportRule, isDataReady, containerDimensions]);

  // Sync external currentTime to video element when not playing or when scrubbed
  useEffect(() => {
    if (videoRef.current && !isPlaying) {
      if (Math.abs(videoRef.current.currentTime - currentTime) > 0.04) {
        videoRef.current.currentTime = currentTime;
      }
      syncRef.current?.forceSync(currentTime);
    }
  }, [currentTime, isPlaying]);

  // Control playback loop in synchronizer
  useEffect(() => {
    const video = videoRef.current;
    const synchronizer = syncRef.current;

    if (video) {
      if (isPlaying) {
        video.play().catch((e) => console.warn('Video play failed:', e));
        synchronizer?.start();
      } else {
        video.pause();
        synchronizer?.stop();
        synchronizer?.forceSync();
      }
    }
  }, [isPlaying]);

  // Handle playback rate
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Get current frame data for overlays
  const currentFrameInfo = useMemo(() => {
    if (!sortedFrames.length) return { frame: null, index: -1 };
    let low = 0;
    let high = sortedFrames.length - 1;
    let idx = 0;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (sortedFrames[mid].timestamp <= currentTime) {
        idx = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return { frame: sortedFrames[idx], index: idx };
  }, [sortedFrames, currentTime]);

  const currentFrameData = currentFrameInfo.frame;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10 group"
    >
      <video
        ref={videoRef}
        src={videoUrl}
        playsInline
        muted
        preload="auto"
        crossOrigin="anonymous"
        className="absolute inset-0 w-full h-full object-contain z-0"
        onTimeUpdate={(e) => {
          if (isPlaying) {
            onTimeUpdate(e.currentTarget.currentTime);
          }
        }}
        onDurationChange={(e) => onDurationChange?.(e.currentTarget.duration)}
        onEnded={() => {
          if (isPlaying) onTogglePlay?.();
        }}
        onError={() => {
          setVideoError(true);
          onError?.(true);
        }}
      />
      <canvas
        ref={canvasRef}
        onClick={onTogglePlay}
        className="absolute inset-0 w-full h-full z-10 cursor-pointer"
      />

      {/* Diagnostic High-Precision Synchronization Overlay */}
      <div className="absolute top-3 left-3 z-40 bg-zinc-950/85 backdrop-blur-md border border-white/10 p-3 rounded-xl font-mono text-[10px] text-zinc-300 pointer-events-none space-y-1.5 shadow-2xl">
        <div className="flex items-center gap-2 pb-1 border-b border-white/5">
          <div
            className={`w-2 h-2 rounded-full ${
              telemetry?.isHardwareSynced ? 'bg-cyan-400' : 'bg-emerald-500'
            } animate-pulse`}
          />
          <span
            className={`text-[9px] font-black uppercase tracking-widest ${
              telemetry?.isHardwareSynced ? 'text-cyan-400' : 'text-emerald-400'
            }`}
          >
            {telemetry?.isHardwareSynced ? 'Hardware rVFC Sync' : 'rAF Paint-Locked'}
          </span>
          <span className="ml-auto text-[8.5px] text-zinc-500 font-bold">
            {telemetry?.fps || 60} FPS
          </span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-zinc-500 uppercase font-black tracking-tighter">Video Time</span>
          <span className="text-white font-bold">{currentTime.toFixed(4)}s</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-zinc-500 uppercase font-black tracking-tighter">Frame Index</span>
          <span className="text-white font-bold">
            #{telemetry ? telemetry.frameIndex : currentFrameInfo.index}
          </span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-zinc-500 uppercase font-black tracking-tighter">Meta TS</span>
          <span className="text-amber-400 font-bold">
            {(telemetry ? telemetry.metadataTime : currentFrameData?.timestamp || 0).toFixed(4)}s
          </span>
        </div>
        <div className="flex justify-between gap-6 pt-1 border-t border-white/5">
          <span className="text-zinc-500 uppercase font-black tracking-tighter">Drift</span>
          <span
            className={`font-bold ${
              Math.abs(telemetry ? telemetry.driftMs : (currentTime - (currentFrameData?.timestamp || 0)) * 1000) > 20
                ? 'text-red-400'
                : 'text-emerald-400'
            }`}
          >
            {(telemetry
              ? telemetry.driftMs
              : (currentTime - (currentFrameData?.timestamp || 0)) * 1000
            ).toFixed(2)}
            ms
          </span>
        </div>
      </div>

      <KineticHeatmapOverlay
        currentFrame={currentFrameData}
        videoDimensions={{
          width: videoRef.current?.videoWidth || 640,
          height: videoRef.current?.videoHeight || 360,
        }}
      />

      {viewMode === 'student' && (
        <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-4 mix-blend-screen">
          <div className="flex justify-between w-full">
            <div className="bg-gradient-to-r from-red-600 to-amber-500 text-white font-black text-xs px-3 py-1 rounded-full animate-pulse border border-white/20 shadow-[0_0_15px_rgba(220,38,38,0.5)]">
              ⚡ COMBO: x{Math.floor(currentTime * 2) + 1}
            </div>
            <div className="bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-black text-xs px-3 py-1 rounded-full border border-white/20 shadow-[0_0_15px_rgba(16,185,129,0.5)]">
              🛡️ ARMOR: 100%
            </div>
          </div>
          <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] mix-blend-overlay" />
        </div>
      )}

      {/* Overlay Fullscreen Toggle Button */}
      {onToggleFullscreen && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFullscreen();
          }}
          title={isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
          aria-label={isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
          className="absolute top-3 right-3 z-30 bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-700/80 hover:border-amber-400 text-white hover:text-amber-400 p-2 rounded-xl backdrop-blur-md transition-all shadow-lg shadow-black/60 flex items-center gap-1.5 group/fs active:scale-95"
        >
          {isFullscreen ? (
            <Minimize className="w-4 h-4 text-amber-400" />
          ) : (
            <Maximize className="w-4 h-4 group-hover/fs:text-amber-400 transition-colors" />
          )}
          <span className="hidden sm:inline text-[10px] font-black uppercase tracking-wider pr-1">
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </span>
        </button>
      )}

      {videoError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-6 text-center z-50">
          <div className="text-red-500 mb-4 text-4xl">⚠️</div>
          <h3 className="text-xl font-bold mb-2">Video Playback Error</h3>
          <p className="text-white/60">We encountered an issue loading your video on this device.</p>
        </div>
      )}
    </div>
  );
};

