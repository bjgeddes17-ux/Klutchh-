import React from 'react';
import { AICoachingReport, StrengthItem, AreaToImproveItem } from '../../types';
import { CheckCircle2, AlertCircle, Zap, ShieldCheck } from 'lucide-react';

interface CoachingInsightPanelProps {
  report: AICoachingReport;
}

export const CoachingInsightPanel: React.FC<CoachingInsightPanelProps> = ({ report }) => {
  return (
    <div className="flex flex-col gap-6">
      {/* Executive Dossier */}
      {report.executiveDossier && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-5 h-5 text-yellow-500" />
            <h3 className="text-sm font-black uppercase text-white tracking-widest italic">EXECUTIVE BIOMECHANICAL DOSSIER</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <span className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1 block italic">PRIMARY FAULT DETECTED</span>
              <h4 className="text-lg font-black text-white mb-2">{report.executiveDossier.detectedFault.title}</h4>
              <p className="text-xs text-zinc-400 mb-4">{report.executiveDossier.detectedFault.description}</p>
              <div className="flex items-center gap-2 bg-red-950/20 border border-red-500/20 p-2 rounded-lg text-[10px] text-red-400">
                <AlertCircle className="w-3 h-3" />
                <span>{report.executiveDossier.detectedFault.impact}</span>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1 block italic">GOLD STANDARD ALIGNMENT</span>
              <h4 className="text-lg font-black text-white mb-2">{report.executiveDossier.goldStandard.title}</h4>
              <p className="text-xs text-zinc-400 mb-4">{report.executiveDossier.goldStandard.description}</p>
              <div className="flex items-center gap-2 bg-emerald-950/20 border border-emerald-500/20 p-2 rounded-lg text-[10px] text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                <span>{report.executiveDossier.goldStandard.forceTransmission}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Key Strengths */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <h3 className="text-sm font-black uppercase text-white tracking-widest italic">KEY STRENGTHS</h3>
          </div>
          <div className="flex flex-col gap-3">
            {report.strengthsDetailed ? (
              report.strengthsDetailed.map((strength: StrengthItem, i: number) => (
                <div key={i} className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
                  <h4 className="text-xs font-black text-white mb-1">{strength.title}</h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed mb-2">{strength.desc}</p>
                  <span className="text-[10px] font-black text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-500/20">{strength.metric}</span>
                </div>
              ))
            ) : (
              report.keyStrengths.map((strength: any, i: number) => (
                <div key={i} className="flex items-start gap-3 bg-zinc-900 border border-zinc-800 p-3 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-xs text-zinc-300">{typeof strength === 'string' ? strength : strength.title}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Areas to Improve */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            <h3 className="text-sm font-black uppercase text-white tracking-widest italic">GROWTH OPPORTUNITIES</h3>
          </div>
          <div className="flex flex-col gap-3">
            {report.areasToImprove?.map((area: AreaToImproveItem, i: number) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
                <h4 className="text-xs font-black text-white mb-1">{area.issue}</h4>
                <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">{area.explanation}</p>
                <div className="bg-yellow-500/5 border border-yellow-500/20 p-3 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black text-yellow-500 uppercase italic">CORRECTIVE DRILL</span>
                    <span className="text-[9px] font-bold text-zinc-500">{area.drillReps}</span>
                  </div>
                  <h5 className="text-[11px] font-bold text-zinc-200 uppercase">{area.drillName}</h5>
                  <p className="text-[10px] text-zinc-400 mt-1 italic">"{area.drillTip}"</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
