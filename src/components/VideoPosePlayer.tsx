import React, { useEffect, useRef, useState } from 'react';
import { SportRule, FrameAnalysis, MediaPipeLandmark, SkillLevel, SportId } from '../types';
import { detectPoseForVideoFrame, initializePoseLandmarker, PoseDetectionResult } from '../utils/mediapipePose';
import { calculateAngle, calculateSymmetry, calculateKneeValgusScore, drawPoseSkeleton, drawTrajectoryHeatmap } from '../utils/geometry';
import { KineticPathProcessor } from '../utils/trajectoryEngine';
import { calculateKlutchhScore } from '../utils/klutchhAnalysis';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Upload,
  Bookmark,
  ShieldCheck,
  AlertTriangle,
  Layers,
  Sparkles,
  Target,
  Zap,
  Cpu,
  Star,
  CheckCircle2,
  ChevronRight,
  Activity,
  Flame
} from 'lucide-react';

interface VideoPosePlayerProps {
  sportRule: SportRule;
  customVideoUrl: string | null;
  skillLevel: SkillLevel;
  selectedMovementPhase: string;
  onChangeMovementPhase: (phase: string) => void;
  onFrameUpdate: (analysis: FrameAnalysis) => void;
  onBookmarkKeyframe: (analysis: FrameAnalysis) => void;
  onTriggerUpload?: () => void;
  availableSports?: SportRule[];
  onSelectSport?: (sportId: SportId) => void;
  viewMode?: 'student' | 'coach';
}

export const VideoPosePlayer: React.FC<VideoPosePlayerProps> = ({
  sportRule,
  customVideoUrl,
  skillLevel,
  selectedMovementPhase,
  onChangeMovementPhase,
  onFrameUpdate,
  onBookmarkKeyframe,
  onTriggerUpload,
  availableSports = [],
  onSelectSport,
  viewMode = 'coach',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pathProcessor = useRef(new KineticPathProcessor());

  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(3.0);
  const [showSkeletonOverlay, setShowSkeletonOverlay] = useState(true);
  const [showTrajectoryHeatmap, setShowTrajectoryHeatmap] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const [currentAnalysis, setCurrentAnalysis] = useState<FrameAnalysis | null>(null);
  const lastLandmarksRef = useRef<MediaPipeLandmark[] | null>(null);
  const trajectoryHistoryRef = useRef<{ landmarks: MediaPipeLandmark[]; ruleResults: Record<string, 'optimal' | 'good' | 'warning' | 'error'> }[]>([]);

  // Eagerly initialize MediaPipe model
  useEffect(() => {
    initializePoseLandmarker().then((landmarker) => {
      if (landmarker) {
        console.log('MediaPipe PoseLandmarker ready for video tracking.');
      }
    });
  }, []);

  const activeVideoUrl = customVideoUrl || '';
  const klutchhScore = calculateKlutchhScore(currentAnalysis?.ruleResults);

  // Non-blocking 60 FPS Render Loop & Async Pose Detection Cache
  interface PoseCacheEntry {
    landmarks: MediaPipeLandmark[];
    timestamp: number;
  }
  const poseCacheRef = useRef<Map<number, PoseCacheEntry>>(new Map());
  const isDetectingRef = useRef(false);

  useEffect(() => {
    let animationFrameId: number;
    let videoFrameCallbackId: number;
    let lastDetectTriggerTime = 0;
    const MAX_VIDEO_DURATION = 30.0; // Max 30s clip limit

    const processFrame = (now: DOMHighResTimeStamp, metadata?: any) => {
      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!canvas || !video) {
          if ('requestVideoFrameCallback' in HTMLVideoElement.prototype && video && video.readyState >= 2) {
            videoFrameCallbackId = (video as any).requestVideoFrameCallback(processFrame);
          } else {
            animationFrameId = requestAnimationFrame((n) => processFrame(n));
          }
          return;
        }

        const width = video.videoWidth || 960;
        const height = video.videoHeight || 540;

        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          if ('requestVideoFrameCallback' in HTMLVideoElement.prototype && video.readyState >= 2) {
            videoFrameCallbackId = (video as any).requestVideoFrameCallback(processFrame);
          } else {
            animationFrameId = requestAnimationFrame((n) => processFrame(n));
          }
          return;
        }

        let videoTime = metadata && typeof metadata.mediaTime === 'number'
          ? metadata.mediaTime
          : video.currentTime || 0;

        let rawTime = video.currentTime || 0;

        if (video) {
          const capDuration = Math.min(video.duration || 30.0, MAX_VIDEO_DURATION);
          if (duration !== capDuration) setDuration(capDuration);
          if (rawTime >= MAX_VIDEO_DURATION) {
            video.currentTime = 0;
            rawTime = 0;
          }
        }
        setCurrentTime(rawTime);

        if (activeVideoUrl && video.readyState >= 2 && !isDetectingRef.current && (now - lastDetectTriggerTime > 30)) {
          isDetectingRef.current = true;
          lastDetectTriggerTime = now;
          const captureTime = videoTime;
          detectPoseForVideoFrame(video, Date.now()).then((poseResult) => {
            if (poseResult.landmarks && poseResult.landmarks.length > 0) {
              const roundedKey = Math.round(captureTime * 30) / 30;
              poseCacheRef.current.set(roundedKey, { landmarks: poseResult.landmarks, timestamp: captureTime });
              if (poseCacheRef.current.size > 150) {
                const firstKey = poseCacheRef.current.keys().next().value;
                if (firstKey !== undefined) poseCacheRef.current.delete(firstKey);
              }
            }
          }).catch((e) => console.warn("Pose detection error:", e))
            .finally(() => { isDetectingRef.current = false; });
        }

        if (!activeVideoUrl || video.readyState < 2) {
          ctx.clearRect(0, 0, width, height);
          setCurrentAnalysis(null);
          
          if ('requestVideoFrameCallback' in HTMLVideoElement.prototype && video.readyState >= 2) {
            videoFrameCallbackId = (video as any).requestVideoFrameCallback(processFrame);
          } else {
            animationFrameId = requestAnimationFrame((n) => processFrame(n));
          }
          return;
        }

        let landmarks: MediaPipeLandmark[] | null = null;
        const cacheEntries = (Array.from(poseCacheRef.current.values()) as PoseCacheEntry[]);

        if (cacheEntries.length > 0) {
          let closest = cacheEntries[0];
          let minDiff = Math.abs(closest.timestamp - videoTime);
          for (let i = 1; i < cacheEntries.length; i++) {
            const diff = Math.abs(cacheEntries[i].timestamp - videoTime);
            if (diff < minDiff) {
              minDiff = diff;
              closest = cacheEntries[i];
            }
          }

          cacheEntries.sort((a, b) => a.timestamp - b.timestamp);
          
          let before = cacheEntries[0];
          let after = cacheEntries[cacheEntries.length - 1];
          
          for (let i = 0; i < cacheEntries.length - 1; i++) {
            if (cacheEntries[i].timestamp <= videoTime && cacheEntries[i+1].timestamp >= videoTime) {
              before = cacheEntries[i];
              after = cacheEntries[i+1];
              break;
            }
          }
          
          if (before && after && before !== after) {
            const timeSpan = after.timestamp - before.timestamp;
            const distanceToClosest = Math.min(Math.abs(videoTime - before.timestamp), Math.abs(after.timestamp - videoTime));
            
            if (distanceToClosest < 0.25) {
              if (timeSpan < 0.2) {
                const ratio = (videoTime - before.timestamp) / timeSpan;
                landmarks = before.landmarks.map((lm, i) => ({
                  ...lm,
                  x: lm.x + (after.landmarks[i].x - lm.x) * ratio,
                  y: lm.y + (after.landmarks[i].y - lm.y) * ratio,
                  z: (lm.z || 0) + ((after.landmarks[i].z || 0) - (lm.z || 0)) * ratio,
                  visibility: lm.visibility + (after.landmarks[i].visibility - lm.visibility) * ratio
                }));
              } else {
                landmarks = Math.abs(videoTime - before.timestamp) < Math.abs(videoTime - after.timestamp) ? before.landmarks : after.landmarks;
              }
            } else {
              landmarks = null;
            }
          } else {
            landmarks = before?.landmarks || null;
          }
        }

        const isRealDetection = landmarks !== null && landmarks.length > 0;
        if (!isRealDetection && lastLandmarksRef.current) {
          landmarks = lastLandmarksRef.current;
        }

        ctx.clearRect(0, 0, width, height);
        // Draw video frame to canvas for 100% guaranteed zero-latency sync
        ctx.drawImage(video, 0, 0, width, height);

        if (landmarks && landmarks.length > 0) {
          lastLandmarksRef.current = landmarks;
          const calculatedAngles: Record<string, number> = {};
          const ruleResults: Record<string, 'optimal' | 'good' | 'warning' | 'error'> = {};

          sportRule.jointRules.forEach((rule) => {
            const [kp1, kp2, kp3] = rule.keypoints;
            const p1 = landmarks![kp1];
            const vertex = landmarks![kp2];
            const p3 = landmarks![kp3];

            const angle = calculateAngle(p1, vertex, p3);
            calculatedAngles[rule.id] = angle;

            const tolerance = rule.tolerancesByLevel[skillLevel] || {
              idealMin: rule.idealMin,
              idealMax: rule.idealMax,
              toleranceMargin: 10
            };

            const idealMin = tolerance.idealMin;
            const idealMax = tolerance.idealMax;
            const margin = tolerance.toleranceMargin || 10;
            const dev = Math.min(Math.abs(angle - idealMin), Math.abs(angle - idealMax));

            if (angle >= idealMin && angle <= idealMax) ruleResults[rule.id] = 'optimal';
            else if (dev <= margin) ruleResults[rule.id] = 'good';
            else ruleResults[rule.id] = 'warning';
          });

          setCurrentAnalysis({
            timestamp: rawTime,
            landmarks: landmarks,
            angles: calculatedAngles,
            ruleResults,
            detectedPhase: sportRule.phases[0],
            isRealDetection
          });

          if (showSkeletonOverlay) {
            drawPoseSkeleton(
              ctx,
              width,
              height,
              landmarks,
              ruleResults,
              calculatedAngles,
              sportRule,
              sportRule.phases[0]
            );
          }
        } else {
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(video, 0, 0, width, height);
          setCurrentAnalysis(null);
        }

      } catch (e: any) {
        console.error("Frame loop error:", e?.message || String(e));
      }

      const video = videoRef.current;
      if (video && 'requestVideoFrameCallback' in HTMLVideoElement.prototype && video.readyState >= 2) {
        videoFrameCallbackId = (video as any).requestVideoFrameCallback(processFrame);
      } else {
        animationFrameId = requestAnimationFrame((n) => processFrame(n));
      }
    };

    const video = videoRef.current;
    if (video && 'requestVideoFrameCallback' in HTMLVideoElement.prototype && video.readyState >= 2) {
      videoFrameCallbackId = (video as any).requestVideoFrameCallback(processFrame);
    } else {
      animationFrameId = requestAnimationFrame((n) => processFrame(n));
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (videoFrameCallbackId && videoRef.current && 'cancelVideoFrameCallback' in HTMLVideoElement.prototype) {
        (videoRef.current as any).cancelVideoFrameCallback(videoFrameCallbackId);
      }
    };
  }, [activeVideoUrl, sportRule, skillLevel, showSkeletonOverlay]);

  // Video playback speed sync
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  const handleTogglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        const promise = videoRef.current.play();
        if (promise !== undefined) {
          promise
            .then(() => setIsPlaying(true))
            .catch((err) => {
              console.warn('Video playback interrupted safely:', err);
              setIsPlaying(false);
            });
        }
      }
    }
  };

  const handleStepFrame = async (seconds: number) => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
      const newTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
      
      await new Promise<void>((resolve) => {
        const handleSeeked = () => {
          videoRef.current?.removeEventListener('seeked', handleSeeked);
          resolve();
        };
        videoRef.current!.addEventListener('seeked', handleSeeked);
        videoRef.current!.currentTime = newTime;
        setTimeout(handleSeeked, 250);
      });

      setCurrentTime(newTime);

      try {
        const res = await detectPoseForVideoFrame(videoRef.current, Date.now(), false);
        if (res.landmarks && res.landmarks.length > 0) {
          const roundedKey = Math.round(newTime * 30) / 30;
          poseCacheRef.current.set(roundedKey, { landmarks: res.landmarks, timestamp: newTime });
          lastLandmarksRef.current = res.landmarks;
        }
      } catch (e) {
        console.warn("Step frame pose error:", e);
      }
    }
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
      
      {/* Top Technique Phase Bar */}
      <div className="bg-zinc-900/90 px-4 py-2 border-b border-zinc-800/80 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-zinc-300 font-extrabold uppercase tracking-wider shrink-0">
          <Target className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Technique:</span>
        </div>
        
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => onChangeMovementPhase('Auto-Detect')}
            className={`px-3 py-1 rounded-lg font-bold text-[11px] uppercase tracking-wider transition-all ${
              selectedMovementPhase === 'Auto-Detect'
                ? 'bg-amber-400 text-zinc-950 shadow-md'
                : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            ⚡ Auto-Detect
          </button>
          {sportRule.phases.map((phase) => (
            <button
              key={phase}
              onClick={() => onChangeMovementPhase(phase)}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] uppercase tracking-wider whitespace-nowrap transition-all ${
                selectedMovementPhase === phase
                  ? 'bg-red-600 text-white shadow-md border border-red-500'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {phase}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas & Video Stack */}
      <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
        
        {/* Video Element or Sport Selection Stage */}
        {activeVideoUrl && !videoError ? (
          <video
            ref={videoRef}
            src={activeVideoUrl}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-contain opacity-0"
            onError={(e) => {
              console.warn("Video load notice handled:", e.currentTarget.error?.message || "Video source expired or unavailable");
              setVideoError(true);
            }}
            onTimeUpdate={() => videoRef.current && setCurrentTime(videoRef.current.currentTime)}
          />
        ) : (
          <div className="absolute inset-0 z-0 p-6 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-zinc-100 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-red-600/20 border border-red-500/40 text-red-500 flex items-center justify-center shadow-xl shadow-red-600/10">
              <Upload className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-widest block mb-1">
                {sportRule.name} • 30 FPS Biomechanical Engine
              </span>
              <h3 className="text-lg font-black text-white uppercase italic tracking-wide">
                {videoError ? 'Video Source Expired or Unsupported' : 'No Video Clip Loaded Yet'}
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1">
                {videoError ? 'Browser blob cache purged after idle time (common after ~3 minutes). Click below to reload or upload a new clip.' : "Upload your athlete's video clip or choose a sample clip from above to run instant MediaPipe 3D pose extraction and get a full coaching report."}
              </p>
            </div>

            {videoError ? (
              <button
                onClick={() => setVideoError(false)}
                className="bg-red-600 hover:bg-red-500 text-white font-black text-xs px-6 py-3 rounded-xl shadow-lg shadow-red-600/30 flex items-center gap-2 uppercase tracking-wider transition-all mt-1"
              >
                <span>🔄 Reload Video Source</span>
              </button>
            ) : onTriggerUpload && (
              <button
                onClick={onTriggerUpload}
                className="bg-red-600 hover:bg-red-500 text-white font-black text-xs px-6 py-3 rounded-xl shadow-lg shadow-red-600/30 flex items-center gap-2 uppercase tracking-wider transition-all mt-1"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Athlete Clip (Up to 30s)</span>
              </button>
            )}
          </div>
        )}

        {/* MediaPipe Pose Skeleton Canvas Overlay */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
        />

        {/* Minimal Top Status Badges + Klutchh Score Overlay */}
        <div className="absolute top-2.5 left-2.5 right-2.5 z-20 pointer-events-none flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="bg-zinc-950/90 backdrop-blur-md border border-zinc-800 px-2.5 py-1 rounded-lg text-[10px] font-black text-amber-400 flex items-center gap-1.5 shadow-md">
              <span className={`w-2 h-2 rounded-full ${activeVideoUrl ? 'bg-red-500 animate-pulse' : 'bg-amber-400'}`} />
              <span className="uppercase tracking-wider">
                {activeVideoUrl ? (currentAnalysis?.detectedPhase || 'Analyzing...') : 'Ready for Video'}
              </span>
            </div>

            {activeVideoUrl && (
              <div className="bg-gradient-to-r from-red-600 to-amber-600 text-white px-2.5 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 shadow-lg border border-red-400/40">
                <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                <span>Klutchh Score: {klutchhScore} / 10</span>
              </div>
            )}
          </div>

          <div className={`bg-zinc-950/95 backdrop-blur-md border ${activeVideoUrl ? 'border-red-500/30' : 'border-zinc-800/80'} px-2.5 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1.5 shadow-md`}>
            {typeof window !== 'undefined' && (window as any).hasOwnProperty('Capacitor') && (window as any).Capacitor?.isNativePlatform?.() ? (
              <>
                <Zap className="w-3.5 h-3.5 text-red-500 animate-pulse shrink-0" />
                <span className="text-red-400 font-black uppercase tracking-wider">⚡ NATIVE HARDWARE ACCEL</span>
              </>
            ) : (
              <>
                <Cpu className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-emerald-400 uppercase tracking-wider hidden sm:inline">🌐 WEB CORE (WASM ENGINE)</span>
                <span className="text-emerald-400 uppercase tracking-wider sm:hidden">🌐 WASM ACTIVE</span>
              </>
            )}
          </div>
        </div>

        {/* Diagnostic Confidence Overlay */}
        {showDiagnostics && (
          <div className="absolute top-12 left-2.5 bottom-12 w-48 bg-zinc-950/80 backdrop-blur-xl border border-zinc-800 rounded-xl p-3 z-30 flex flex-col gap-2 overflow-y-auto no-scrollbar pointer-events-none">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter">Landmark Visibility</span>
              <span className={`text-[8px] font-mono px-1 rounded ${currentAnalysis?.isRealDetection ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                {currentAnalysis?.isRealDetection ? 'LOCKED' : 'LOST'}
              </span>
            </div>

            <div className="space-y-1.5">
              {[
                { name: 'Nose', id: 0 },
                { name: 'L Shoulder', id: 11 },
                { name: 'R Shoulder', id: 12 },
                { name: 'L Elbow', id: 13 },
                { name: 'R Elbow', id: 14 },
                { name: 'L Wrist', id: 15 },
                { name: 'R Wrist', id: 16 },
                { name: 'L Hip', id: 23 },
                { name: 'R Hip', id: 24 },
                { name: 'L Knee', id: 25 },
                { name: 'R Knee', id: 26 },
                { name: 'L Ankle', id: 27 },
                { name: 'R Ankle', id: 28 },
              ].map((lm) => {
                const landmark = currentAnalysis?.landmarks?.[lm.id];
                const visibility = landmark?.visibility ?? 0;
                const isHealthy = visibility > 0.65;
                const isCritical = visibility < 0.4;

                return (
                  <div key={lm.id} className="flex flex-col gap-0.5">
                    <div className="flex items-center justify-between text-[9px] font-bold">
                      <span className="text-zinc-400">{lm.name}</span>
                      <span className={`${isHealthy ? 'text-emerald-400' : isCritical ? 'text-red-500 animate-pulse' : 'text-amber-400'}`}>
                        {(visibility * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${isHealthy ? 'bg-emerald-500' : isCritical ? 'bg-red-500' : 'bg-amber-500'}`}
                        style={{ width: `${Math.max(2, visibility * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-auto pt-2 border-t border-zinc-800">
              <p className="text-[8px] text-zinc-500 leading-tight italic">
                Values below 50% may cause jitter or detection dropouts. Check lighting and athlete contrast.
              </p>
            </div>
          </div>
        )}

      </div>

      {/* Unified Video Control Bar - ONLY shown when video is loaded */}
      {activeVideoUrl && (
        <div className="bg-zinc-900 px-4 py-3 border-t border-zinc-800 flex flex-col gap-2.5">
          
          {/* Scrubber & Time Bar */}
          <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono">
            <span className="w-10 text-right">{currentTime.toFixed(1)}s</span>
            <input
              type="range"
              min={0}
              max={duration || 10}
              step={0.05}
              value={currentTime}
              onInput={async (e) => {
                const val = parseFloat(e.currentTarget.value);
                setCurrentTime(val);
                if (videoRef.current) {
                  if (isPlaying) {
                    videoRef.current.pause();
                    setIsPlaying(false);
                  }

                  await new Promise<void>((resolve) => {
                    const handleSeeked = () => {
                      videoRef.current?.removeEventListener('seeked', handleSeeked);
                      resolve();
                    };
                    videoRef.current!.addEventListener('seeked', handleSeeked);
                    videoRef.current!.currentTime = val;
                    setTimeout(handleSeeked, 200);
                  });

                  try {
                    const res = await detectPoseForVideoFrame(videoRef.current, Date.now(), false);
                    if (res.landmarks && res.landmarks.length > 0) {
                      const roundedKey = Math.round(val * 30) / 30;
                      poseCacheRef.current.set(roundedKey, { landmarks: res.landmarks, timestamp: val });
                      lastLandmarksRef.current = res.landmarks;
                    }
                  } catch (err) {
                    console.warn("Scrubber pose detection error:", err);
                  }
                }
              }}
              onMouseUp={() => isPlaying && videoRef.current?.play()}
              onTouchEnd={() => isPlaying && videoRef.current?.play()}
              className="flex-1 accent-red-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer touch-none"
            />
            <span className="w-10">{(duration || 3.0).toFixed(1)}s</span>
          </div>

          {/* Controls Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            
            {/* Playback Controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleStepFrame(-0.1)}
                className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                title="Step Back (0.1s)"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={handleTogglePlay}
                className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-xl shadow-md transition-all active:scale-95"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              </button>

              <button
                onClick={() => handleStepFrame(0.1)}
                className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                title="Step Forward (0.1s)"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              {/* Speed Pills */}
              <div className="ml-2 flex items-center bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 text-[11px]">
                {[0.25, 0.5, 1.0].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => setPlaybackSpeed(rate)}
                    className={`px-2 py-0.5 rounded transition-all ${
                      playbackSpeed === rate
                        ? 'bg-red-600 text-white font-bold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons: Skeleton Toggle, Heatmap Toggle & Capture Frame */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSkeletonOverlay(!showSkeletonOverlay)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider border transition-all flex items-center gap-1.5 ${
                  showSkeletonOverlay
                    ? 'bg-red-600/90 border-red-500 text-white shadow-md'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>{showSkeletonOverlay ? 'Skeleton' : 'No Skeleton'}</span>
              </button>

              <button
                onClick={() => setShowTrajectoryHeatmap(!showTrajectoryHeatmap)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider border transition-all flex items-center gap-1.5 ${
                  showTrajectoryHeatmap
                    ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
                title="Toggle joint trajectory stability heatmap"
              >
                <Flame className="w-3.5 h-3.5 text-red-400" />
                <span>{showTrajectoryHeatmap ? 'Heatmap: On' : 'Heatmap: Off'}</span>
              </button>

              <button
                onClick={() => setShowDiagnostics(!showDiagnostics)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider border transition-all flex items-center gap-1.5 ${
                  showDiagnostics
                    ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-md'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
                title="Toggle real-time landmark confidence diagnostics"
              >
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>{showDiagnostics ? 'Diag: On' : 'Diag: Off'}</span>
              </button>

              {currentAnalysis && (
                <div className="flex items-center gap-2">
                  <select
                    className="bg-zinc-950 text-white text-[10px] font-bold p-1.5 rounded-lg border border-zinc-700 uppercase"
                    value={currentAnalysis.detectedPhase}
                    onChange={(e) => {
                      setCurrentAnalysis({ ...currentAnalysis, detectedPhase: e.target.value });
                    }}
                  >
                    {sportRule.phases.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <button
                    onClick={() => onBookmarkKeyframe(currentAnalysis)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider border transition-all flex items-center gap-1.5 ${
                      !currentAnalysis.isRealDetection
                        ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md animate-pulse'
                        : 'bg-amber-400 hover:bg-amber-300 text-zinc-950'
                    }`}
                    title={!currentAnalysis.isRealDetection ? "Low confidence: Manually force capture frame" : "Bookmark this keyframe"}
                  >
                    <Bookmark className="w-3.5 h-3.5 fill-current" />
                    {!currentAnalysis.isRealDetection ? 'Force Capture' : 'Capture'}
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );

};
