import React from 'react';
import { FrameAnalysis, SportRule } from '../types';
import { Bookmark, Clock, Trash2, CheckCircle2, Flame } from 'lucide-react';

interface KeyframeTimelineProps {
  keyframeList: FrameAnalysis[];
  sportRule: SportRule;
  onRemoveKeyframe: (index: number) => void;
  onClearKeyframes: () => void;
}

export const KeyframeTimeline: React.FC<KeyframeTimelineProps> = ({
  keyframeList,
  sportRule,
  onRemoveKeyframe,
  onClearKeyframes
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

  return (
    <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 text-zinc-100">
      
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-yellow-400 fill-current" />
          <h3 className="text-sm font-black uppercase italic tracking-wide text-white">
            Captured Movement Keyframes ({keyframeList.length})
          </h3>
        </div>

        <button
          onClick={onClearKeyframes}
          className="text-xs text-zinc-400 hover:text-red-400 font-bold transition-all flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear All</span>
        </button>
      </div>

      {/* Horizontal Grid of Keyframes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 overflow-x-auto pb-2">
        {keyframeList.map((frame, idx) => (
          <div
            key={idx}
            className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl flex flex-col justify-between gap-3 relative group hover:border-zinc-700 transition-all"
          >
            {/* Delete button on hover */}
            <button
              onClick={() => onRemoveKeyframe(idx)}
              className="absolute top-2 right-2 p-1 text-zinc-500 hover:text-red-400 rounded-md hover:bg-zinc-800 transition-all"
              title="Remove Keyframe"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            {/* Frame Badge & Timestamp */}
            <div className="flex items-center gap-2">
              <span className="bg-red-600 text-white font-black text-[10px] px-2 py-0.5 rounded-md uppercase">
                Frame #{frame.frameNumber}
              </span>
              <span className="text-xs font-mono text-zinc-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-zinc-500" /> {frame.timestamp}s
              </span>
            </div>

            {/* Phase Name */}
            <div className="text-xs font-extrabold text-yellow-400 uppercase tracking-wide">
              Phase: {frame.detectedPhase}
            </div>

            {/* Key Measured Angles */}
            <div className="flex flex-col gap-1.5 text-xs text-zinc-300 bg-zinc-950 p-2.5 rounded-lg border border-zinc-800/80">
              {sportRule.jointRules.slice(0, 5).map((rule) => {
                const angle = frame.angles[rule.id] ?? 'N/A';
                const status = frame.ruleResults[rule.id] || 'optimal';

                return (
                  <div key={rule.id} className="flex items-center justify-between">
                    <span className="text-zinc-400 text-[11px] truncate max-w-[120px]">
                      {rule.name}:
                    </span>
                    <span
                      className={`font-mono font-black text-[11px] ${
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
            <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400 border-t border-zinc-800 pt-2">
              <span>ACL Safety: <strong className="text-yellow-400">{frame.kneeSafetyScore}%</strong></span>
              <span>Symmetry: <strong className="text-red-500">{frame.symmetryScore}%</strong></span>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
