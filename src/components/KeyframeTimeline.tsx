import React from 'react';
import { FrameAnalysis, SportRule } from '../types';
import { Bookmark, Clock, Trash2, CheckCircle2, Flame, Play, SkipBack, SkipForward, Edit3 } from 'lucide-react';

interface KeyframeTimelineProps {
  keyframeList: FrameAnalysis[];
  sportRule: SportRule;
  onRemoveKeyframe: (index: number) => void;
  onClearKeyframes: () => void;
  onUpdateKeyframePhase?: (index: number, newPhase: string) => void;
  onSeekToKeyframe?: (timestamp: number) => void;
  onUpdateKeyframeTimestamp?: (index: number, newTimestamp: number) => void;
}

export const KeyframeTimeline: React.FC<KeyframeTimelineProps> = ({
  keyframeList,
  sportRule,
  onRemoveKeyframe,
  onClearKeyframes,
  onUpdateKeyframePhase,
  onSeekToKeyframe,
  onUpdateKeyframeTimestamp
}) => {
  if (keyframeList.length === 0) {
    return (
      <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-5 shadow-xl text-center flex flex-col items-center justify-center gap-2">
        <Bookmark className="w-8 h-8 text-zinc-700" />
        <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">No Keyframes Captured Yet</h3>
        <p className="text-xs text-zinc-500 max-w-sm">
          Click <span className="text-yellow-400 font-extrabold">"Capture Frame"</span> on the video player during a key phase (e.g. Tackle Entry, Release, Strike) to bookmark and compare metrics.
        </p>
      </div>
    );
  }

  const availablePhases = sportRule.phases && sportRule.phases.length > 0
    ? sportRule.phases
    : ['Approach', 'Setup', 'Execution', 'Contact / Release', 'Follow-Through'];

  return (
    <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 text-zinc-100">
      
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-yellow-400 fill-current" />
          <h3 className="text-sm font-black uppercase italic tracking-wide text-white">
            Captured Movement Keyframes ({keyframeList.length})
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-400 hidden sm:inline">
            💡 Select phase dropdown to re-assign or adjust timestamp to match the video
          </span>
          <button
            onClick={onClearKeyframes}
            className="text-xs text-zinc-400 hover:text-red-400 font-bold transition-all flex items-center gap-1 ml-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {/* Horizontal Grid of Keyframes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 overflow-x-auto pb-2">
        {keyframeList.map((frame, idx) => (
          <div
            key={idx}
            className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl flex flex-col justify-between gap-2.5 relative group hover:border-zinc-700 transition-all"
          >
            {/* Top row: Frame Badge, Seek Button & Delete button */}
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5">
                <span className="bg-red-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded uppercase">
                  #{frame.frameNumber || idx + 1}
                </span>
                <button
                  onClick={() => onSeekToKeyframe && onSeekToKeyframe(frame.timestamp)}
                  className="text-[11px] font-mono text-zinc-300 hover:text-amber-400 bg-zinc-950/80 px-2 py-0.5 rounded border border-zinc-800 hover:border-amber-500/40 flex items-center gap-1 transition-all"
                  title="Jump video to this frame"
                >
                  <Play className="w-2.5 h-2.5 fill-current text-amber-400" />
                  <span>{frame.timestamp.toFixed(2)}s</span>
                </button>
              </div>

              <div className="flex items-center gap-1">
                {onUpdateKeyframeTimestamp && (
                  <div className="flex items-center bg-zinc-950 rounded border border-zinc-800">
                    <button
                      onClick={() => onUpdateKeyframeTimestamp(idx, Math.max(0, frame.timestamp - 0.033))}
                      className="px-1 py-0.5 text-[9px] text-zinc-400 hover:text-white"
                      title="Nudge -1 frame"
                    >
                      -1f
                    </button>
                    <button
                      onClick={() => onUpdateKeyframeTimestamp(idx, frame.timestamp + 0.033)}
                      className="px-1 py-0.5 text-[9px] text-zinc-400 hover:text-white"
                      title="Nudge +1 frame"
                    >
                      +1f
                    </button>
                  </div>
                )}
                <button
                  onClick={() => onRemoveKeyframe(idx)}
                  className="p-1 text-zinc-500 hover:text-red-400 rounded hover:bg-zinc-800 transition-all"
                  title="Remove Keyframe"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Phase Selector Dropdown */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-mono text-zinc-400 uppercase flex items-center justify-between">
                <span>Assigned Phase:</span>
                <span className="text-[8px] text-amber-400 flex items-center gap-0.5">
                  <Edit3 className="w-2.5 h-2.5" /> Change
                </span>
              </label>
              <select
                value={frame.detectedPhase || availablePhases[0]}
                onChange={(e) => onUpdateKeyframePhase && onUpdateKeyframePhase(idx, e.target.value)}
                className="bg-zinc-950 text-amber-300 font-extrabold text-[10.5px] px-2 py-1 rounded-lg border border-zinc-700/80 focus:border-amber-500 uppercase tracking-wide cursor-pointer outline-none w-full"
              >
                {availablePhases.map((phase) => (
                  <option key={phase} value={phase} className="bg-zinc-900 text-white">
                    {phase}
                  </option>
                ))}
              </select>
            </div>

            {/* Key Measured Angles (Ultra-compact) */}
            <div className="flex flex-col gap-1 text-xs text-zinc-300 bg-zinc-950 p-2 rounded-lg border border-zinc-800/80">
              {sportRule.jointRules.slice(0, 3).map((rule) => {
                const angle = frame.angles[rule.id] ?? 'N/A';
                const status = frame.ruleResults[rule.id] || 'optimal';

                // Short joint name
                const shortName = rule.name.replace(/Angle|Flexion|Extension|Follow-Through|Height/gi, '').trim();

                return (
                  <div key={rule.id} className="flex items-center justify-between text-[10px]">
                    <span className="text-zinc-400 truncate max-w-[120px]">
                      {shortName || rule.name}:
                    </span>
                    <span
                      className={`font-mono font-black ${
                        status === 'optimal'
                          ? 'text-yellow-400'
                          : status === 'warning'
                          ? 'text-amber-400'
                          : 'text-red-500'
                      }`}
                    >
                      {angle}°
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Scores summary */}
            <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 border-t border-zinc-800 pt-1.5">
              <span>Safety: <strong className="text-yellow-400">{frame.kneeSafetyScore}%</strong></span>
              <span>Symmetry: <strong className="text-emerald-400">{frame.symmetryScore}%</strong></span>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
