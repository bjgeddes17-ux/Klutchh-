import React from 'react';
import { AICoachingReport, SportRule } from '../../types';

interface ExecutiveDashboardProps {
  aiReport: AICoachingReport | null;
  sportRule: SportRule;
  titanRating: number;
  explosivePower: number;
  jointArmor: number;
  precision: number;
  kineticFlow: number;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  aiReport,
  sportRule,
  titanRating,
  explosivePower,
  jointArmor,
  precision,
  kineticFlow
}) => {
  const attributes = [
    { 
      id: 'explosive_power',
      label: '⚡ Explosive Power', 
      score: explosivePower, 
      color: 'from-amber-500 to-yellow-400',
      meaning: 'Measures momentum transfer through the kinetic chain.'
    },
    { 
      id: 'joint_armor',
      label: '🛡️ Joint Armor', 
      score: jointArmor, 
      color: 'from-emerald-500 to-teal-400',
      meaning: 'Quantifies ligament protection and shock absorption.'
    },
    { 
      id: 'precision',
      label: '🎯 Precision', 
      score: precision, 
      color: 'from-blue-500 to-cyan-400',
      meaning: 'Matches body positions against elite checkpoints.'
    },
    { 
      id: 'kinetic_flow',
      label: '🔄 Kinetic Flow', 
      score: kineticFlow, 
      color: 'from-purple-500 to-pink-400',
      meaning: 'Measures seamless energy transmission ground to arms.'
    }
  ];

  return (
    <div className="relative overflow-hidden bg-zinc-950 border-2 border-yellow-500/50 rounded-3xl p-5 sm:p-6 shadow-[0_0_40px_rgba(250,204,21,0.15)] flex flex-col gap-4">
      <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 z-10 relative">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-yellow-500 text-black font-black text-2xl flex items-center justify-center shadow-lg border-2 border-yellow-300 shrink-0">
            {aiReport?.overallGrade?.startsWith('A') ? '🏆' : aiReport?.overallGrade?.startsWith('B') ? '🏅' : '🎖️'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-yellow-500 tracking-widest bg-yellow-950/50 px-2.5 py-0.5 rounded-full border border-yellow-500/40">
                {aiReport?.overallGrade?.startsWith('A') ? 'ELITE CHAMPION' : aiReport?.overallGrade?.startsWith('B') ? 'ADVANCED ATHLETE' : 'DEVELOPING ATHLETE'}
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                ⚡ TITAN RATING: {titanRating.toFixed(1)} / 10
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white italic tracking-wide uppercase mt-1">
              {sportRule.name} {aiReport?.overallGrade?.startsWith('A') ? 'TITAN' : aiReport?.overallGrade?.startsWith('B') ? 'PRODIGY' : 'PROSPECT'}
            </h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-yellow-500/20 z-10">
        {attributes.map((attr) => (
          <div key={attr.id} className="bg-zinc-900 border border-white/5 rounded-2xl p-3 flex flex-col gap-2">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter">{attr.label}</span>
            <div className="flex items-end gap-2">
              <span className="text-xl sm:text-2xl font-black text-yellow-500 font-mono">
                {attr.score}%
              </span>
              <div className="flex-1 bg-zinc-800 h-1 rounded-full mb-2 overflow-hidden">
                <div 
                  className="h-full bg-yellow-500 shadow-[0_0_10px_#facc15]"
                  style={{ width: `${attr.score}%` }}
                />
              </div>
            </div>
            <p className="text-[9px] text-zinc-500 leading-tight">{attr.meaning}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
