import React, { useState } from 'react';
import { FrameAnalysis, SportRule } from '../types';
import { Bookmark, Clock, Trash2, CheckCircle2, Flame, Play, SkipBack, SkipForward, Edit3, ChevronRight, Activity, ShieldCheck, Zap } from 'lucide-react';

interface KeyframeTimelineProps {
  keyframeList: FrameAnalysis[];
  sportRule: SportRule;
  onRemoveKeyframe: (index: number) => void;
  onClearKeyframes: () => void;
  onUpdateKeyframePhase?: (index: number, newPhase: string) => void;
  onSeekToKeyframe?: (timestamp: number) => void;
  onUpdateKeyframeTimestamp?: (index: number, newTimestamp: number) => void;
  currentPlayheadTime?: number;
}

export const KeyframeTimeline: React.FC<KeyframeTimelineProps> = ({
  keyframeList,
  sportRule,
  onRemoveKeyframe,
  onClearKeyframes,
  onUpdateKeyframePhase,
  onSeekToKeyframe,
  onUpdateKeyframeTimestamp,
  currentPlayheadTime = 0
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  if (keyframeList.length === 0) {
    return (
      <div className="bg-zinc-950/90 border border-zinc-800/80 rounded-2xl p-6 shadow-xl text-center flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400">
          <Bookmark className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-black text-zinc-200 uppercase tracking-wide">No Keyframes Captured Yet</h3>
          <p className="text-xs text-zinc-400 max-w-md mt-1 leading-relaxed">
            Pause the video at crucial moments (e.g. <span className="text-amber-400 font-bold">Load</span>, <span className="text-red-400 font-bold">Release</span>, or <span className="text-emerald-400 font-bold">Contact</span>) and tap <span className="text-yellow-400 font-extrabold">"Capture Frame"</span> to bookmark and analyze joint kinematics.
          </p>
        </div>
      </div>
    );
  }

  const availablePhases = sportRule.phases && sportRule.phases.length > 0
    ? sportRule.phases
    : ['Approach', 'Setup', 'Kinetic Acceleration', 'Contact / Release', 'Follow-Through'];

  const getPhaseBadgeColor = (phaseName?: string) => {
    const p = (phaseName || '').toLowerCase();
    if (p.includes('approach') || p.includes('entry') || p.includes('stance')) {
      return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    }
    if (p.includes('setup') || p.includes('load') || p.includes('coil') || p.includes('gather')) {
      return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
    }
    if (p.includes('accelerat') || p.includes('drive') || p.includes('rotat') || p.includes('execution')) {
      return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    }
    if (p.includes('release') || p.includes('strike') || p.includes('contact') || p.includes('impact') || p.includes('hit')) {
      return 'bg-red-500/20 text-red-300 border-red-500/40';
    }
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  };

  return (
    <div className="bg-zinc-950/95 border border-zinc-800/90 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col gap-4 text-zinc-100">
      
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <Bookmark className="w-4 h-4 text-amber-400 fill-current" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-wide text-white flex items-center gap-2">
              <span>Captured Keyframes</span>
              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-amber-500/30">
                {keyframeList.length} Frames
              </span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClearKeyframes}
            className="text-xs text-zinc-400 hover:text-red-400 font-bold transition-all flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-zinc-900 border border-transparent hover:border-zinc-800 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {/* Modern Responsive Card Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {keyframeList.map((frame, idx) => {
          const isActive = Math.abs(currentPlayheadTime - frame.timestamp) < 0.1;
          const phaseColor = getPhaseBadgeColor(frame.detectedPhase);

          return (
            <div
              key={idx}
              className={`bg-gradient-to-b from-zinc-900 to-zinc-950 border rounded-2xl p-4 flex flex-col justify-between gap-3 relative transition-all shadow-md ${
                isActive
                  ? 'border-amber-500 ring-1 ring-amber-500/50 shadow-amber-500/10'
                  : 'border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {/* Card Top: Index Badge + Timestamp + Quick Jump */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="bg-zinc-800 text-zinc-300 font-black text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider border border-zinc-700/50">
                    KF #{idx + 1}
                  </span>
                  
                  <button
                    onClick={() => onSeekToKeyframe && onSeekToKeyframe(frame.timestamp)}
                    className={`text-xs font-mono font-bold px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border ${
                      isActive
                        ? 'bg-amber-500 text-zinc-950 border-amber-400 font-black shadow-md shadow-amber-500/20'
                        : 'bg-zinc-950 text-amber-400 border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-900'
                    }`}
                    title="Jump playhead to this exact moment"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{frame.timestamp.toFixed(2)}s</span>
                  </button>
                </div>

                {/* Fine-Tuning & Delete controls */}
                <div className="flex items-center gap-1">
                  {onUpdateKeyframeTimestamp && (
                    <div className="flex items-center bg-zinc-950 rounded-lg border border-zinc-800 p-0.5">
                      <button
                        onClick={() => onUpdateKeyframeTimestamp(idx, Math.max(0, frame.timestamp - 0.033))}
                        className="px-1.5 py-0.5 text-[10px] font-bold text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition-colors"
                        title="Nudge 1 frame earlier (-0.033s)"
                      >
                        -1f
                      </button>
                      <span className="w-px h-3 bg-zinc-800 mx-0.5" />
                      <button
                        onClick={() => onUpdateKeyframeTimestamp(idx, frame.timestamp + 0.033)}
                        className="px-1.5 py-0.5 text-[10px] font-bold text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition-colors"
                        title="Nudge 1 frame later (+0.033s)"
                      >
                        +1f
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => onRemoveKeyframe(idx)}
                    className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-900 transition-all ml-1 cursor-pointer"
                    title="Remove Keyframe"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Movement Phase Tag with Quick Dropdown */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold uppercase">
                  <span>Movement Phase</span>
                  <span className="text-zinc-500 text-[9px]">Tap to change</span>
                </div>
                <select
                  value={frame.detectedPhase || availablePhases[0]}
                  onChange={(e) => onUpdateKeyframePhase && onUpdateKeyframePhase(idx, e.target.value)}
                  className={`font-black text-xs px-3 py-2 rounded-xl border uppercase tracking-wide cursor-pointer outline-none w-full transition-all ${phaseColor} bg-zinc-950/80 focus:ring-1 focus:ring-amber-400`}
                >
                  {availablePhases.map((phase) => (
                    <option key={phase} value={phase} className="bg-zinc-900 text-zinc-100 font-bold">
                      {phase}
                    </option>
                  ))}
                </select>
              </div>

              {/* Key Joint Angle Metrics */}
              {sportRule.jointRules && sportRule.jointRules.length > 0 && (
                <div className="bg-zinc-950/80 rounded-xl p-2.5 border border-zinc-800/80 flex flex-col gap-1.5">
                  <span className="text-[9px] font-mono uppercase text-zinc-500 tracking-wider">Kinematic Angles</span>
                  <div className="grid grid-cols-2 gap-2">
                    {sportRule.jointRules.slice(0, 2).map((rule) => {
                      const angle = frame.angles[rule.id] ?? 'N/A';
                      const status = frame.ruleResults[rule.id] || 'optimal';
                      const shortName = rule.name.replace(/Angle|Flexion|Extension|Follow-Through|Height/gi, '').trim();

                      return (
                        <div key={rule.id} className="bg-zinc-900/60 rounded-lg px-2 py-1.5 border border-zinc-800/50 flex flex-col">
                          <span className="text-[9px] text-zinc-400 truncate">{shortName || rule.name}</span>
                          <span className={`text-xs font-mono font-black ${
                            status === 'optimal' ? 'text-yellow-400' : status === 'warning' ? 'text-amber-400' : 'text-red-400'
                          }`}>
                            {angle}°
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Biometric Scores Bar */}
              <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400 border-t border-zinc-800/80 pt-2.5 px-1">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-yellow-400" />
                  <span>Safety: <strong className="text-white font-mono">{frame.kneeSafetyScore ?? 95}%</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Symmetry: <strong className="text-white font-mono">{frame.symmetryScore ?? 90}%</strong></span>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
