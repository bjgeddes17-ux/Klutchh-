import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Maximize, Minimize } from 'lucide-react';
import { SportRule, FrameAnalysis, MediaPipeLandmark } from '../../types';
import { drawPoseSkeleton } from '../../utils/geometry';
import { KineticHeatmapOverlay } from '../KineticHeatmapOverlay';

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
}

export const KineticVideoPlayer: React.FC<KineticVideoPlayerProps> = ({
  videoUrl,
  sportRule,
  sortedFrames,
  cropBox,
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
  onError
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [videoError, setVideoError] = useState(false);
  const [videoDimensions, setVideoDimensions] = useState({ width: 640, height: 360 });

  // Get current frame data for overlays
  const currentFrameData = useMemo(() => {
    if (!sortedFrames.length) return null;
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
    return sortedFrames[idx];
  }, [sortedFrames, currentTime]);

  // Sync external currentTime to video element when not playing or when scrubbed
  useEffect(() => {
    if (videoRef.current && !isPlaying) {
      if (Math.abs(videoRef.current.currentTime - currentTime) > 0.08) {
        videoRef.current.currentTime = currentTime;
      }
    }
  }, [currentTime, isPlaying]);

  // Handle play/pause
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(e => console.warn("Video play failed:", e));
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Handle playback rate
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Core skeleton drawing loop over native video
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !isDataReady) return;

    let animationFrameId: number;

    const renderOverlay = () => {
      if (!canvas || !video) return;

      const width = video.videoWidth || 640;
      const height = video.videoHeight || 360;

      if (width > 0 && height > 0) {
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
          setVideoDimensions({ width, height });
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
          const vTime = video.currentTime;
          
          if (isPlaying) {
            onTimeUpdate(vTime);
          }

          let landmarksToDraw: MediaPipeLandmark[] | null = null;
          let ruleResultsToDraw: any = {};
          let anglesToDraw: any = {};
          let activeFramePhase = sportRule.phases[0];

          if (sortedFrames.length > 0) {
            let low = 0;
            let high = sortedFrames.length - 1;
            let idx = 0;

            while (low <= high) {
              const mid = (low + high) >> 1;
              if (sortedFrames[mid].timestamp <= vTime) {
                idx = mid;
                low = mid + 1;
              } else {
                high = mid - 1;
              }
            }

            const prevFrame = sortedFrames[idx];
            const nextFrame = sortedFrames[Math.min(sortedFrames.length - 1, idx + 1)];

            const timeSpan = nextFrame.timestamp - prevFrame.timestamp;
            const alpha = timeSpan > 0.0001 
              ? Math.max(0, Math.min(1, (vTime - prevFrame.timestamp) / timeSpan)) 
              : 0;

            const closestFrame = alpha < 0.5 ? prevFrame : nextFrame;
            ruleResultsToDraw = closestFrame.ruleResults || {};
            anglesToDraw = closestFrame.angles || {};
            activeFramePhase = closestFrame.detectedPhase || sportRule.phases[0];

            if (prevFrame.landmarks && nextFrame.landmarks && prevFrame.landmarks.length === nextFrame.landmarks.length) {
              landmarksToDraw = prevFrame.landmarks.map((pt1, i) => {
                const pt2 = nextFrame.landmarks[i] || pt1;
                return {
                  x: pt1.x + (pt2.x - pt1.x) * alpha,
                  y: pt1.y + (pt2.y - pt1.y) * alpha,
                  z: (pt1.z || 0) + ((pt2.z || 0) - (pt1.z || 0)) * alpha,
                  visibility: (pt1.visibility ?? 1) + ((pt2.visibility ?? 1) - (pt1.visibility ?? 1)) * alpha
                };
              });
            } else if (closestFrame.landmarks) {
              landmarksToDraw = closestFrame.landmarks;
            }
          }

          ctx.clearRect(0, 0, width, height);

          if (landmarksToDraw) {
            drawPoseSkeleton(
              ctx,
              width,
              height,
              landmarksToDraw,
              ruleResultsToDraw,
              anglesToDraw,
              sportRule,
              activeFramePhase,
              false
            );
          }
        }
      }

      animationFrameId = requestAnimationFrame(renderOverlay);
    };

    animationFrameId = requestAnimationFrame(renderOverlay);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isDataReady, isPlaying, sortedFrames, sportRule, videoUrl]);

  return (
    <div className="relative w-full h-full bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10 group">
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
        onError={() => {
          setVideoError(true);
          onError?.(true);
        }}
      />
      <canvas
        ref={canvasRef}
        onClick={onTogglePlay}
        className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
      />

      <KineticHeatmapOverlay 
        currentFrame={currentFrameData} 
        videoDimensions={videoDimensions} 
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
