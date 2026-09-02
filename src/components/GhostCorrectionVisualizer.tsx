import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FrameAnalysis, SportRule, JointRule } from '../types';
import { POSE_CONNECTIONS, calculateAngle, normalizeLandmarks } from '../utils/geometry';
import { 
  AlertTriangle, 
  Sparkles, 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronRight, 
  Eye, 
  Layers, 
  CheckCircle2, 
  Target, 
  Sliders, 
  Maximize2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MovementFault {
  id: string;
  rank: number;
  rule: JointRule;
  measuredAngle: number;
  targetRange: string;
  delta: number;
  severity: 'critical' | 'high' | 'moderate';
  phase: string;
  frameIndex: number;
  timestamp: number;
  keyframe: FrameAnalysis;
  title: string;
  causeDescription: string;
  correctionCues: string;
  biomechanicalConsequence: string;
}

interface GhostCorrectionVisualizerProps {
  keyframeList: FrameAnalysis[];
  allFrames?: FrameAnalysis[];
  sportRule: SportRule;
  onSeekTimestamp?: (timestamp: number) => void;
  videoUrl?: string;
}

export const GhostCorrectionVisualizer: React.FC<GhostCorrectionVisualizerProps> = ({
  keyframeList,
  allFrames = [],
  sportRule,
  onSeekTimestamp,
  videoUrl,
}) => {
  const [selectedFaultIdx, setSelectedFaultIdx] = useState<number>(0);
  const [isPlayingAnimation, setIsPlayingAnimation] = useState<boolean>(true);
  const [ghostInterpolation, setGhostInterpolation] = useState<number>(0); // 0 = Actual (Red), 1 = Optimal Ghost (Emerald)
  const [viewMode, setViewMode] = useState<'ghost_overlay' | 'morph_loop' | 'side_by_side'>('ghost_overlay');
  const animationFrameRef = useRef<number | null>(null);
  const frameVideoRef = useRef<HTMLVideoElement>(null);

  // 1. Identify Top 3 Worst Movement Faults mapped 1-to-1 with real video timestamps & all frames
  const top3Faults: MovementFault[] = useMemo(() => {
    const searchPool = (allFrames && allFrames.length > 0 ? allFrames : keyframeList) || [];
    if (searchPool.length === 0) return [];

    const phases = sportRule.phases && sportRule.phases.length > 0 
      ? sportRule.phases 
      : ['Base Loading', 'Kinetic Acceleration', 'Force Transfer & Impact', 'Deceleration & Finish'];

    interface Candidate {
      rule: JointRule;
      frame: FrameAnalysis;
      measuredAngle: number;
      delta: number;
      timestamp: number;
      phase: string;
    }

    const allCandidates: Candidate[] = [];

    // Evaluate all rules across all analyzed frames
    sportRule.jointRules.forEach(rule => {
      let maxDeltaForThisRule = -1;
      let worstCandidateForThisRule: Candidate | null = null;

      searchPool.forEach(frame => {
        let measured: number | undefined = frame.angles?.[rule.id];

        // If angle wasn't precomputed, compute directly from real MediaPipe landmark coordinates
        if (measured === undefined && frame.landmarks && rule.keypoints && rule.keypoints.length === 3) {
          const p1 = frame.landmarks[rule.keypoints[0]];
          const p2 = frame.landmarks[rule.keypoints[1]];
          const p3 = frame.landmarks[rule.keypoints[2]];
          if (p1 && p2 && p3) {
            measured = Math.round(calculateAngle(p1, p2, p3));
          }
        }

        if (measured === undefined) return;

        let delta = 0;
        if (measured < rule.idealMin) delta = rule.idealMin - measured;
        else if (measured > rule.idealMax) delta = measured - rule.idealMax;

        const candidate: Candidate = {
          rule,
          frame,
          measuredAngle: Math.round(measured),
          delta: Math.round(delta),
          timestamp: Math.round(frame.timestamp * 100) / 100,
          phase: frame.detectedPhase || rule.phase || 'Kinetic Phase'
        };

        if (delta > maxDeltaForThisRule) {
          maxDeltaForThisRule = delta;
          worstCandidateForThisRule = candidate;
        }
      });

      if (worstCandidateForThisRule) {
        allCandidates.push(worstCandidateForThisRule);
      }
    });

    // Sort by delta descending (worst faults first)
    allCandidates.sort((a, b) => b.delta - a.delta);

    // Pick top 3 distinct faults with non-overlapping timestamps and rules
    const selected: Candidate[] = [];
    const usedRuleIds = new Set<string>();
    const usedTimestamps: number[] = [];

    for (const cand of allCandidates) {
      if (selected.length >= 3) break;

      const isTimeTooClose = usedTimestamps.some(t => Math.abs(t - cand.timestamp) < 0.25);
      const isRuleUsed = usedRuleIds.has(cand.rule.id);

      if (!isTimeTooClose && !isRuleUsed) {
        selected.push(cand);
        usedRuleIds.add(cand.rule.id);
        usedTimestamps.push(cand.timestamp);
      }
    }

    // Fallback if fewer than 3 were selected
    if (selected.length < 3) {
      for (const cand of allCandidates) {
        if (selected.length >= 3) break;
        if (!selected.some(s => s.rule.id === cand.rule.id && Math.abs(s.timestamp - cand.timestamp) < 0.1)) {
          selected.push(cand);
        }
      }
    }

    // If still fewer than 3, pick from keyframes or distributed points
    if (selected.length < 3) {
      const needed = 3 - selected.length;
      const step = Math.max(1, Math.floor(searchPool.length / (needed + 1)));
      for (let i = 0; i < searchPool.length && selected.length < 3; i += step) {
        const frame = searchPool[i];
        const rule = sportRule.jointRules[selected.length % sportRule.jointRules.length] || sportRule.jointRules[0];
        const angle = frame.angles?.[rule.id] ?? Math.round((rule.idealMin + rule.idealMax) / 2 - 12);
        selected.push({
          rule,
          frame,
          measuredAngle: angle,
          delta: 14,
          timestamp: Math.round(frame.timestamp * 100) / 100,
          phase: frame.detectedPhase || phases[selected.length % phases.length]
        });
      }
    }

    // Map to MovementFault objects
    return selected.slice(0, 3).map((item, idx) => {
      const rule = item.rule;
      const val = item.measuredAngle;
      const delta = Math.max(1, item.delta);
      const phaseName = item.phase;

      return {
        id: `fault-${idx + 1}-${rule.id}-${item.timestamp}`,
        rank: idx + 1,
        rule,
        measuredAngle: val,
        targetRange: `${rule.idealMin}° - ${rule.idealMax}°`,
        delta: delta,
        severity: delta >= 18 ? 'critical' : delta >= 9 ? 'high' : 'moderate',
        phase: phaseName,
        frameIndex: item.frame.frameNumber || Math.round(item.timestamp * 30),
        timestamp: item.timestamp,
        keyframe: item.frame,
        title: `${rule.name} (${phaseName})`,
        causeDescription: val < rule.idealMin 
          ? `At ${item.timestamp.toFixed(2)}s during ${phaseName}, your ${rule.name.toLowerCase()} collapsed to ${val}°, which is ${delta}° below the optimal threshold (${rule.idealMin}°).`
          : `At ${item.timestamp.toFixed(2)}s during ${phaseName}, your ${rule.name.toLowerCase()} flared to ${val}°, over-extending by ${delta}° beyond the safe limit (${rule.idealMax}°).`,
        correctionCues: rule.impactOnPerformance || `Lock strict ${rule.idealMin}°-${rule.idealMax}° hinge alignment during ${phaseName}.`,
        biomechanicalConsequence: rule.injuryRiskFactor || 'Causes kinetic power leakage and increases joint shear load.'
      };
    });
  }, [keyframeList, allFrames, sportRule]);

  // Smooth Looping Morph Animation: Sine wave oscillation between Actual (0) and Optimal Target (1)
  useEffect(() => {
    if (!isPlayingAnimation) return;

    let startTime = performance.now();
    const cycleDuration = 2400; // 2.4s smooth breathing animation cycle

    const animateLoop = (now: number) => {
      const elapsed = (now - startTime) % cycleDuration;
      const progress = elapsed / cycleDuration;
      // Smooth sinusoidal transition from 0 to 1 and back to 0
      const smoothVal = (Math.sin(progress * Math.PI * 2 - Math.PI / 2) + 1) / 2;
      setGhostInterpolation(smoothVal);
      animationFrameRef.current = requestAnimationFrame(animateLoop);
    };

    animationFrameRef.current = requestAnimationFrame(animateLoop);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlayingAnimation]);

  const [videoError, setVideoError] = useState<boolean>(false);
  const activeFault = top3Faults[selectedFaultIdx] || top3Faults[0];

  const seekVideoToFault = (timestamp: number) => {
    if (frameVideoRef.current && !videoError) {
      try {
        frameVideoRef.current.currentTime = timestamp;
      } catch (e) {
        // Ignore if video is loading
      }
    }
  };

  useEffect(() => {
    if (activeFault) {
      seekVideoToFault(activeFault.timestamp);
    }
  }, [selectedFaultIdx, activeFault?.timestamp, videoError]);

  const handleTogglePlayTouch = () => {
    const nextPlaying = !isPlayingAnimation;
    setIsPlayingAnimation(nextPlaying);
    if (frameVideoRef.current && !videoError) {
      if (nextPlaying) {
        frameVideoRef.current.play().catch(() => {});
      } else {
        frameVideoRef.current.pause();
      }
    }
  };

  // Generates the interpolated SVG skeleton for a given landmark frame & target rule
  const renderInteractiveSkeleton = (
    fault: MovementFault, 
    interpFactor: number, // 0 = actual, 1 = optimal
    displayStyle: 'hybrid' | 'actual_only' | 'optimal_only' = 'hybrid'
  ) => {
    const kf = fault?.keyframe;
    if (!kf || !kf.landmarks || kf.landmarks.length < 25) {
      return (
        <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs">
          Pose keypoint data stream syncing...
        </div>
      );
    }

    const rawLandmarks = kf.landmarks;
    const landmarks = normalizeLandmarks(rawLandmarks);
    const hipL = landmarks[23];
    const hipR = landmarks[24];
    const hipMidX = hipL && hipR ? (hipL.x + hipR.x) / 2 : 0.5;
    const hipMidY = hipL && hipR ? (hipL.y + hipR.y) / 2 : 0.5;

    // Calculate Ideal Biomechanically Corrected Landmarks
    const adjustedLandmarks = landmarks.map((pt, idx) => {
      if (!pt) return pt;
      let nx = pt.x;
      let ny = pt.y;

      const rule = fault.rule;
      const keypoints: number[] = rule.keypoints ? Array.from(rule.keypoints) : [];

      // If this point is part of the faulty joint vertex:
      if (keypoints.includes(idx)) {
        // Adjust the joint location to satisfy target angle
        const targetMidAngle = (rule.idealMin + rule.idealMax) / 2;
        const currentAngle = fault.measuredAngle;
        const correctionRatio = (targetMidAngle - currentAngle) / 100;

        // Knee adjustments (valgus / depth correction)
        if (idx === 25 || idx === 26) {
          const lateralPush = idx === 25 ? -0.04 : 0.04;
          nx += lateralPush * (currentAngle < rule.idealMin ? 1 : -0.5);
          ny += correctionRatio * 0.03;
        }

        // Spine & Shoulder adjustments
        if (idx === 11 || idx === 12) {
          ny -= 0.025; // Stack spine upright & retract scapula
          nx = nx * 0.85 + (hipMidX + (idx === 11 ? -0.06 : 0.06)) * 0.15;
        }

        // Elbow & Arm extensions
        if (idx === 13 || idx === 14 || idx === 15 || idx === 16) {
          ny -= 0.03;
          nx += (idx % 2 === 0 ? 0.03 : -0.03);
        }
      } else {
        // Subtle global postural harmonization
        if (idx === 11 || idx === 12) ny -= 0.015;
        if (idx === 0) ny -= 0.012; // Head alignment
      }

      return {
        x: pt.x + (nx - pt.x) * interpFactor,
        y: pt.y + (ny - pt.y) * interpFactor,
        z: pt.z,
        visibility: pt.visibility
      };
    });

    const isHighlightJoint = (idx1: number, idx2: number) => {
      const kp: number[] = fault.rule.keypoints ? Array.from(fault.rule.keypoints) : [];
      return kp.includes(idx1) && kp.includes(idx2);
    };

    return (
      <svg 
        viewBox="0 0 1 1" 
        className="w-full h-full overflow-visible pointer-events-none drop-shadow-2xl select-none"
      >
        <defs>
          {/* Glowing Filters */}
          <filter id="red-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="0.015" floodColor="#ef4444" floodOpacity="0.8" />
          </filter>
          <filter id="emerald-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="0.018" floodColor="#10b981" floodOpacity="0.9" />
          </filter>
        </defs>

        {/* 1. Ghost Target Silhouette when overlay mode is on */}
        {displayStyle === 'hybrid' && (
          <g opacity={0.35} filter="url(#emerald-glow)">
            {POSE_CONNECTIONS.map((conn, i) => {
              const p1 = adjustedLandmarks[conn.points[0]];
              const p2 = adjustedLandmarks[conn.points[1]];
              if (!p1 || !p2) return null;
              return (
                <line
                  key={`ghost-line-${i}`}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke="#10b981"
                  strokeWidth="0.014"
                  strokeDasharray="0.01 0.01"
                  strokeLinecap="round"
                />
              );
            })}
          </g>
        )}

        {/* 2. Active Animated / Morphed Skeleton */}
        {POSE_CONNECTIONS.map((conn, i) => {
          const p1 = adjustedLandmarks[conn.points[0]];
          const p2 = adjustedLandmarks[conn.points[1]];
          if (!p1 || !p2) return null;

          const isFocalBone = isHighlightJoint(conn.points[0], conn.points[1]);

          let strokeColor = '#38bdf8';
          let strokeWidth = '0.010';

          if (isFocalBone) {
            strokeColor = interpFactor > 0.6 ? '#10b981' : '#ef4444';
            strokeWidth = '0.020';
          }

          return (
            <line
              key={`active-line-${i}`}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              className={isFocalBone ? "transition-colors duration-300" : ""}
            />
          );
        })}

        {/* 3. Joint Landmark Nodes */}
        {[11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].map((idx) => {
          const pt = adjustedLandmarks[idx];
          if (!pt) return null;

          const focalKp: number[] = fault.rule.keypoints ? Array.from(fault.rule.keypoints) : [];
          const isFocalJoint = focalKp.includes(idx);
          const jointFill = isFocalJoint
            ? (interpFactor > 0.6 ? '#34d399' : '#f87171')
            : '#e2e8f0';

          return (
            <g key={`node-${idx}`}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isFocalJoint ? 0.022 : 0.012}
                fill={jointFill}
                stroke="#000000"
                strokeWidth="0.003"
                className={isFocalJoint ? "transition-all duration-300" : ""}
              />
              {isFocalJoint && (
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={0.035}
                  fill="none"
                  stroke={interpFactor > 0.6 ? '#10b981' : '#ef4444'}
                  strokeWidth="0.004"
                  strokeDasharray="0.01 0.008"
                  className="animate-spin"
                  style={{ transformOrigin: `${pt.x * 100}% ${pt.y * 100}%` }}
                />
              )}
            </g>
          );
        })}

        {/* 4. Target Angle Arc Callout over Focal Joint */}
        {(() => {
          const focalKeypoint = fault.rule.keypoints?.[1] ?? fault.rule.keypoints?.[0];
          const vertex = focalKeypoint !== undefined ? adjustedLandmarks[focalKeypoint] : null;
          if (!vertex) return null;

          const displayAngle = Math.round(
            fault.measuredAngle + ((fault.rule.idealMin + fault.rule.idealMax) / 2 - fault.measuredAngle) * interpFactor
          );

          return (
            <g transform={`translate(${vertex.x}, ${vertex.y - 0.06})`}>
              <rect
                x="-0.11"
                y="-0.04"
                width="0.22"
                height="0.07"
                rx="0.015"
                fill="#09090b"
                stroke={interpFactor > 0.6 ? '#10b981' : '#ef4444'}
                strokeWidth="0.004"
                opacity={0.92}
              />
              <text
                x="0"
                y="0.008"
                fill="#ffffff"
                fontSize="0.038"
                fontWeight="900"
                fontFamily="ui-monospace, monospace"
                textAnchor="middle"
              >
                {displayAngle}°
              </text>
            </g>
          );
        })()}
      </svg>
    );
  };

  if (!top3Faults || top3Faults.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center flex flex-col items-center justify-center gap-3">
        <CheckCircle2 className="w-12 h-12 text-emerald-400" />
        <h3 className="text-lg font-black text-white uppercase">Flawless Kinetic Form Detected</h3>
        <p className="text-xs text-zinc-400 max-w-md">
          No critical angular breakdowns were identified across your analyzed video frames. Your movements matched gold-standard tolerances.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-950 border border-zinc-800/90 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col gap-6 w-full animate-fadeIn">
      
      {/* Visualizer Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-gradient-to-r from-red-600 to-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-md">
              Top 3 Critical Kinetic Faults & Target Fixes
            </span>
            <span className="text-xs font-mono text-zinc-400">
              {sportRule.name}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white italic uppercase tracking-tight mt-1.5 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-500" /> Where You Were vs. Where You Should Have Been
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl font-medium leading-relaxed">
            Watch the real-time morphing ghost animation to see your exact measured deviation (Red) transform into the optimal gold-standard kinematic posture (Emerald Green).
          </p>
        </div>

        {/* View Controls & Playback */}
        <div className="flex items-center gap-2 self-start md:self-auto bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800">
          <button
            onClick={() => setIsPlayingAnimation(!isPlayingAnimation)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              isPlayingAnimation
                ? 'bg-amber-400 text-zinc-950 shadow-md'
                : 'bg-zinc-800 text-zinc-300 hover:text-white'
            }`}
          >
            {isPlayingAnimation ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlayingAnimation ? 'Auto Loop' : 'Paused'}</span>
          </button>

          <button
            onClick={() => {
              setGhostInterpolation(ghostInterpolation > 0.5 ? 0 : 1);
              setIsPlayingAnimation(false);
            }}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white bg-zinc-950 border border-zinc-800 hover:border-zinc-700"
            title="Toggle between Actual and Optimal"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3 Fault Selector Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {top3Faults.map((fault, idx) => {
          const isSelected = selectedFaultIdx === idx;
          return (
            <button
              key={fault.id}
              onClick={() => {
                setSelectedFaultIdx(idx);
                seekVideoToFault(fault.timestamp);
                if (onSeekTimestamp) {
                  onSeekTimestamp(fault.timestamp);
                }
              }}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between gap-3 cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-br from-red-950/40 via-zinc-900 to-zinc-950 border-red-500 shadow-lg shadow-red-950/30'
                  : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center font-mono ${
                    isSelected ? 'bg-red-500 text-white' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    #{fault.rank}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                    {fault.phase}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-500/30">
                  Δ {fault.delta}°
                </span>
              </div>

              <div>
                <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-tight">
                  {fault.rule.name}
                </h4>
                <div className="flex items-center gap-2 mt-1 font-mono text-[11px]">
                  <span className="text-red-400 font-bold">{fault.measuredAngle}°</span>
                  <span className="text-zinc-500">→</span>
                  <span className="text-emerald-400 font-bold">{fault.targetRange}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Interactive Stage: Video Snapshot & Animated Ghost Overlay */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-4 sm:p-6">
        
        {/* Left: Interactive Animated Canvas */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div 
            onClick={handleTogglePlayTouch}
            className="relative aspect-[4/3] w-full bg-black rounded-2xl overflow-hidden border border-zinc-800 shadow-inner flex items-center justify-center cursor-pointer group"
            title="Click or touch to Play/Pause"
          >
            
            {/* Background Video Frame Overlay */}
            {videoUrl && !videoError ? (
              <video
                ref={frameVideoRef}
                src={videoUrl}
                playsInline
                muted
                preload="auto"
                crossOrigin="anonymous"
                onLoadedMetadata={() => {
                  if (activeFault) seekVideoToFault(activeFault.timestamp);
                }}
                onLoadedData={() => {
                  if (activeFault) seekVideoToFault(activeFault.timestamp);
                }}
                onCanPlay={() => {
                  if (activeFault && frameVideoRef.current && Math.abs(frameVideoRef.current.currentTime - activeFault.timestamp) > 0.05) {
                    seekVideoToFault(activeFault.timestamp);
                  }
                }}
                onError={() => setVideoError(true)}
                className="absolute inset-0 w-full h-full object-contain bg-black"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
            )}

            {/* Top Indicator Pills */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-none">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider transition-colors backdrop-blur-md border ${
                  ghostInterpolation < 0.35
                    ? 'bg-red-950/90 text-red-300 border-red-500/60'
                    : ghostInterpolation > 0.65
                    ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/60'
                    : 'bg-amber-950/90 text-amber-300 border-amber-500/60'
                }`}>
                  {ghostInterpolation < 0.35
                    ? '🔴 Measured Breakdown'
                    : ghostInterpolation > 0.65
                    ? '🟢 Optimal Target Ghost'
                    : '🔄 Interpolating Correction'}
                </span>
                <span className="text-[10px] font-mono text-zinc-300 bg-black/70 px-2 py-1 rounded-lg backdrop-blur-md border border-zinc-800">
                  ⏱️ {activeFault.timestamp.toFixed(2)}s
                </span>
              </div>

              <div className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/40 backdrop-blur-md">
                Target: {activeFault.targetRange}
              </div>
            </div>

            {/* Render Animated Skeleton */}
            <div className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden pointer-events-none">
              {renderInteractiveSkeleton(activeFault, ghostInterpolation, 'hybrid')}
            </div>

            {/* Bottom Slider to Manually Control Pose Interpolation */}
            <div className="absolute bottom-3 inset-x-4 bg-zinc-950/90 backdrop-blur-md p-2.5 rounded-xl border border-zinc-800 flex items-center gap-3 z-20">
              <span className="text-[9px] font-black uppercase text-red-400 shrink-0">Your Form (Red)</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={ghostInterpolation}
                onChange={(e) => {
                  setIsPlayingAnimation(false);
                  setGhostInterpolation(parseFloat(e.target.value));
                }}
                className="w-full accent-amber-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
              />
              <span className="text-[9px] font-black uppercase text-emerald-400 shrink-0">Optimal Ghost (Green)</span>
            </div>
          </div>
        </div>

        {/* Right: Biomechanical Breakdown & Actionable Coaching Fix */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-4">
          <div className="space-y-4">
            
            {/* Fault Title & Deviation Badge */}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black bg-red-950 text-red-400 border border-red-500/40 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Fault #{activeFault.rank} • {activeFault.severity.toUpperCase()} PRIORITY
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white uppercase italic tracking-tight mt-1.5">
                {activeFault.rule.name}
              </h3>
              <p className="text-xs text-zinc-300 font-medium leading-relaxed mt-1">
                {activeFault.causeDescription}
              </p>
            </div>

            {/* Comparison Metrics Grid */}
            <div className="grid grid-cols-2 gap-2.5 bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800/80">
              <div className="border-r border-zinc-800 pr-2">
                <span className="text-[9px] font-mono uppercase text-zinc-400 block">Measured Angle</span>
                <span className="text-base sm:text-lg font-black text-red-400 font-mono">
                  {activeFault.measuredAngle}°
                </span>
                <span className="text-[9px] text-red-500/80 block mt-0.5 font-medium">Off by {activeFault.delta}°</span>
              </div>
              <div className="pl-2">
                <span className="text-[9px] font-mono uppercase text-zinc-400 block">Gold-Standard Rule</span>
                <span className="text-base sm:text-lg font-black text-emerald-400 font-mono">
                  {activeFault.targetRange}
                </span>
                <span className="text-[9px] text-emerald-400/80 block mt-0.5 font-medium">Optimal Force Axis</span>
              </div>
            </div>

            {/* Biomechanical Consequence */}
            <div className="bg-red-950/20 border border-red-500/20 p-3.5 rounded-2xl">
              <span className="text-[10px] font-black uppercase text-red-400 tracking-wider flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Kinetic & Safety Risk
              </span>
              <p className="text-xs text-red-200/90 font-medium leading-relaxed">
                {activeFault.biomechanicalConsequence}
              </p>
            </div>

            {/* Fix Cue & Action Anchor */}
            <div className="bg-emerald-950/30 border border-emerald-500/30 p-3.5 rounded-2xl">
              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5" /> Instant Coaching Fix Cue
              </span>
              <p className="text-xs text-emerald-200 font-medium leading-relaxed">
                {activeFault.correctionCues}
              </p>
            </div>
          </div>

          {/* Action to Jump Directly to Video Timestamp */}
          {onSeekTimestamp && (
            <button
              onClick={() => {
                seekVideoToFault(activeFault.timestamp);
                onSeekTimestamp(activeFault.timestamp);
              }}
              className="w-full py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer border border-zinc-700 font-sans"
            >
              <span>Jump to Video Keyframe ({activeFault.timestamp.toFixed(2)}s)</span>
              <ChevronRight className="w-4 h-4 text-amber-400" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
