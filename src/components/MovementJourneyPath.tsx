import React from 'react';
import { FrameAnalysis, SportRule } from '../types';
import { motion } from 'motion/react';
import { CheckCircle2, AlertTriangle, Clock, Zap, Target, Activity } from 'lucide-react';

interface MovementJourneyPathProps {
  keyframeList: FrameAnalysis[];
  sportRule: SportRule;
  currentTime: number;
  onSeek: (time: number) => void;
  activePhase?: string;
}

export const MovementJourneyPath: React.FC<MovementJourneyPathProps> = ({
  keyframeList,
  sportRule,
  currentTime,
  onSeek,
  activePhase
}) => {
  if (keyframeList.length === 0) return null;

  // Calculate progress based on current time vs total movement duration
  const totalDuration = keyframeList[keyframeList.length - 1].timestamp - keyframeList[0].timestamp;
  const elapsed = currentTime - keyframeList[0].timestamp;
  const progressPercent = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
      
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center shadow-lg shadow-red-600/20">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase italic tracking-wider text-white">The Biomechanical Journey</h3>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Kinematic Chain & Trigger Synchronization</p>
          </div>
        </div>
        
        <div className="bg-zinc-950 border border-zinc-800 px-4 py-2 rounded-2xl flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-zinc-500 uppercase">Movement Status</span>
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter">Chain Synchronized</span>
          </div>
          <div className="w-px h-6 bg-zinc-800" />
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-zinc-500 uppercase">Triggers Met</span>
            <span className="text-[10px] font-black text-white uppercase tracking-tighter">
              {keyframeList.filter(k => k.score >= 90).length} / {keyframeList.length}
            </span>
          </div>
        </div>
      </div>

      {/* The Path Map */}
      <div className="relative pt-12 pb-20 px-8">
        {/* Connection Line Background */}
        <div className="absolute top-[60px] left-12 right-12 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          {/* Active Progress Line */}
          <motion.div 
            className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ type: 'spring', stiffness: 50 }}
          />
        </div>

        {/* Nodes Grid */}
        <div className="relative flex justify-between items-start">
          {keyframeList.map((frame, idx) => {
            const isActive = activePhase === frame.detectedPhase;
            const isCompleted = currentTime >= frame.timestamp;
            const isOptimal = frame.score >= 85;
            const triggerTag = frame.triggerTag || sportRule.techniques[0]?.triggers?.find(t => t.phase === frame.detectedPhase)?.requiredBiomechanics;

            return (
              <div 
                key={idx} 
                className="flex flex-col items-center group relative"
                style={{ width: `${100 / keyframeList.length}%` }}
              >
                {/* Node Dot */}
                <button
                  onClick={() => onSeek(frame.timestamp)}
                  className={`relative z-10 w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 transform ${
                    isActive 
                      ? 'scale-125 bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)] border-2 border-white' 
                      : isCompleted
                      ? 'bg-zinc-800 border-2 border-amber-500/50'
                      : 'bg-zinc-900 border-2 border-zinc-800'
                  }`}
                >
                  {isCompleted ? (
                    isOptimal ? (
                      <CheckCircle2 className={`w-5 h-5 ${isActive ? 'text-zinc-950' : 'text-emerald-400'}`} />
                    ) : (
                      <AlertTriangle className={`w-5 h-5 ${isActive ? 'text-zinc-950' : 'text-amber-500'}`} />
                    )
                  ) : (
                    <span className="text-xs font-black text-zinc-600">{idx + 1}</span>
                  )}

                  {/* Pulse Effect for Active Phase */}
                  {isActive && (
                    <motion.div 
                      className="absolute inset-0 rounded-2xl bg-amber-500"
                      animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </button>

                {/* Vertical Connector for Label */}
                <div className={`w-px h-6 bg-zinc-800 my-2 transition-colors duration-300 ${isActive ? 'bg-amber-500' : ''}`} />

                {/* Phase Info Card */}
                <div 
                  className={`absolute top-24 w-40 flex flex-col items-center text-center transition-all duration-300 ${
                    isActive ? 'opacity-100 translate-y-0' : 'opacity-60 scale-95'
                  }`}
                >
                  <span className={`text-[10px] font-black uppercase tracking-tighter mb-0.5 ${isActive ? 'text-amber-400' : 'text-zinc-400'}`}>
                    {frame.detectedPhase}
                  </span>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Clock className="w-2.5 h-2.5 text-zinc-600" />
                    <span className="text-[10px] font-mono text-zinc-500">{frame.timestamp.toFixed(2)}s</span>
                  </div>

                  {/* Trigger Tag - The "Journey Goal" */}
                  {triggerTag && (
                    <div className={`p-2.5 rounded-xl border transition-all duration-300 text-[10px] font-medium leading-tight shadow-lg ${
                      isActive 
                        ? 'bg-zinc-950 border-amber-500/40 text-amber-100' 
                        : 'bg-zinc-950/40 border-zinc-800 text-zinc-500'
                    }`}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Target className={`w-3 h-3 ${isActive ? 'text-amber-400' : 'text-zinc-700'}`} />
                        <span className="font-black uppercase text-[9px] tracking-widest">Kinematic Goal</span>
                      </div>
                      {triggerTag}
                    </div>
                  )}

                  {/* Quick Score Badge */}
                  {isActive && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="mt-2.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest"
                    >
                      Score: {frame.score}%
                    </motion.div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Helpful Info Footer */}
      <div className="mt-4 bg-zinc-950/60 border border-zinc-800 p-4 rounded-2xl flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
          <Zap className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-black text-white uppercase tracking-tight mb-1">Coach's Journey Tip</h4>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            The path above tracks your <strong>Kinematic Chain</strong>. Each node is a "Trigger Point" where the movement must satisfy a specific biomechanical condition. Green nodes mean you hit the target alignment, while amber nodes show where power leaks occurred. Click any node to review the frame.
          </p>
        </div>
      </div>
    </div>
  );
};
