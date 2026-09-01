import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Maximize, Minimize } from 'lucide-react';

interface TimelineScrubberProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onStepFrame: (seconds: number) => void;
  fps: number;
  playbackSpeed: number;
  onPlaybackSpeedChange: (speed: number) => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
}

export const TimelineScrubber: React.FC<TimelineScrubberProps> = ({
  currentTime,
  duration,
  isPlaying,
  onTogglePlay,
  onSeek,
  onStepFrame,
  fps,
  playbackSpeed,
  onPlaybackSpeedChange,
  onToggleFullscreen,
  isFullscreen
}) => {
  return (
    <div className="bg-gradient-to-t from-black via-black/90 to-transparent pt-8 pb-3 px-4 sm:px-6 flex flex-col gap-2">
      {/* Timeline Range Slider */}
      <div className="relative w-full flex flex-col">
        <input
          type="range"
          min={0}
          max={duration || 30}
          step={1 / fps}
          value={currentTime}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          className="w-full accent-red-600 bg-zinc-800/90 h-2 rounded-lg cursor-pointer shadow-inner"
        />
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-between gap-3 pt-0.5 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePlay}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-lg shadow-red-600/30 transition-all active:scale-95 flex items-center gap-1.5 font-bold text-xs"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <button
            onClick={() => onStepFrame(-1 / fps)}
            className="p-1.5 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-lg transition-all text-xs flex items-center gap-1"
            title={`Step Back 1 Frame (-1/${fps}s)`}
          >
            <SkipBack className="w-4 h-4" />
            <span className="hidden sm:inline text-[10px] font-mono">-1f</span>
          </button>

          <button
            onClick={() => onStepFrame(1 / fps)}
            className="p-1.5 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-lg transition-all text-xs flex items-center gap-1"
            title={`Step Forward 1 Frame (+1/${fps}s)`}
          >
            <SkipForward className="w-4 h-4" />
            <span className="hidden sm:inline text-[10px] font-mono">+1f</span>
          </button>

          <div className="bg-zinc-950/90 px-2 py-1 rounded-md border border-zinc-800 text-[11px] font-mono text-zinc-300 font-bold">
            {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-zinc-950/90 p-0.5 rounded-lg border border-zinc-800 text-[10px]">
            {[0.25, 0.5, 1.0].map((speed) => (
              <button
                key={speed}
                onClick={() => onPlaybackSpeedChange(speed)}
                className={`px-2 py-0.5 rounded-md font-mono font-bold transition-all ${
                  playbackSpeed === speed
                    ? 'bg-red-600 text-white shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

          <button
            onClick={onToggleFullscreen}
            className="p-1.5 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-lg text-xs transition-all flex items-center gap-1 font-bold"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
