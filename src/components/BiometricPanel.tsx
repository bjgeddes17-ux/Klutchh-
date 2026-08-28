import React from 'react';
import { SportRule, JointRule, FrameAnalysis, SkillLevel } from '../types';
import { calculateKlutchhScore, getBiomechanicalSequence } from '../utils/klutchhAnalysis';
import { ShieldCheck, AlertCircle, CheckCircle2, Activity, Target, Flame, Zap, Info, Star, Cpu, ArrowRight } from 'lucide-react';
import { checkJointVisibilityOcclusion } from '../utils/geometry';

interface BiometricPanelProps {
  sportRule: SportRule;
  analysis: FrameAnalysis | null;
  skillLevel: SkillLevel;
  selectedMovementPhase?: string;
  onChangeMovementPhase?: (phase: string) => void;
}

export const BiometricPanel: React.FC<BiometricPanelProps> = ({
  sportRule,
  analysis,
  skillLevel,
  selectedMovementPhase = 'Auto-Detect',
  onChangeMovementPhase
}) => {
  const activePhaseFilter = (selectedMovementPhase === 'Auto-Detect' && analysis?.detectedPhase) 
    ? analysis.detectedPhase 
    : (selectedMovementPhase === 'Auto-Detect' ? 'All' : selectedMovementPhase);

  const filteredRules = sportRule.jointRules.filter((rule) => {
    if (activePhaseFilter === 'All') return true;
    return rule.phase === activePhaseFilter;
  });

  const klutchhScore = calculateKlutchhScore(analysis?.ruleResults);
  const sequenceSteps = getBiomechanicalSequence(sportRule.id, selectedMovementPhase);

  const activeKneeScore = analysis?.kneeSafetyScore ?? 92;
  const activeSymmetryScore = analysis?.symmetryScore ?? 88;
  const occlusion = checkJointVisibilityOcclusion(analysis?.landmarks);

  const getCoachingFeedback = (
    rule: JointRule,
    angleVal: number,
    idealMin: number,
    idealMax: number,
    status: 'optimal' | 'warning' | 'error'
  ): string => {
    if (status === 'optimal') {
      return `✓ Great form! ${rule.name} angle is right on target (${angleVal}°).`;
    } else if (angleVal < idealMin) {
      return `💡 Quick Cue: Open/extend your ${rule.name.toLowerCase()} slightly (currently ${angleVal}°, ideal is ${idealMin}°–${idealMax}°).`;
    } else {
      return `💡 Quick Cue: Bend your ${rule.name.toLowerCase()} slightly to stay balanced and absorb shock (currently ${angleVal}°, ideal is ${idealMin}°–${idealMax}°).`;
    }
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-5 shadow-2xl flex flex-col gap-5 text-zinc-100">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-zinc-800/80 pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-black uppercase tracking-tight text-white italic">{sportRule.name}</h2>
            <span className="bg-red-600/20 text-red-400 text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full font-bold border border-red-500/30 whitespace-nowrap">
              {sportRule.category}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1 font-medium">{sportRule.description}</p>
        </div>

        {/* Total Active Rules Badge */}
        <div className="bg-zinc-900 border border-zinc-800 text-amber-400 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm self-start shrink-0">
          <Flame className="w-4 h-4 text-red-500 fill-current" />
          <span>{sportRule.jointRules.length} Rules</span>
        </div>
      </div>

      {/* Low Visibility / Occlusion Warning Banner */}
      {occlusion.hasOcclusion && (
        <div className="bg-amber-500/10 border border-amber-500/40 p-3.5 rounded-xl flex items-start gap-3 text-amber-200 text-xs shadow-md">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="font-black uppercase tracking-wider text-amber-300">
              ⚠️ Low Visibility Warning: {occlusion.occludedLimbs.join(', ')} Occluded or Low Confidence
            </span>
            <span>
              The pose tracker detected partial occlusion or low visibility for the above body parts in this frame. Joint angle measurements and kinematics are estimated using biomechanical skeleton extrapolation. For higher tracking fidelity, ensure clear camera angles and lighting.
            </span>
          </div>
        </div>
      )}

      {/* KLUTCHH SCORE OUT OF 10 & 30 FPS VERIFICATION HERO CARD */}
      <div className="bg-gradient-to-r from-zinc-900 via-red-950/30 to-zinc-900 border border-red-500/30 p-3 sm:p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3.5 w-full sm:w-auto">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-red-600 flex flex-col items-center justify-center text-white shadow-xl shadow-red-600/20 shrink-0">
            <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
            <span className="text-xs sm:text-sm font-black tracking-tight">{klutchhScore}</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">KLUTCHH FORM</span>
              <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-emerald-500/30">
                Out of 10.0
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white italic">
              {klutchhScore >= 8.5 ? 'Elite Execution' : klutchhScore >= 7.0 ? 'Solid Technique' : 'Needs Adjustment'}
            </h3>
          </div>
        </div>

        <div className="bg-zinc-950/80 border border-zinc-800/80 px-3 py-2 rounded-xl text-right shrink-0 flex flex-col items-end w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] sm:text-xs font-black uppercase">
            <Cpu className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>30 FPS Rule Engine</span>
          </div>
          <span className="text-[9px] sm:text-[10px] text-zinc-400">MediaPipe Live Pose</span>
        </div>
      </div>

      {/* BIOMECHANICAL KINETIC CHAIN SEQUENCING */}
      <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-xl flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-red-500" />
            <h4 className="text-xs font-black uppercase text-white tracking-wider">
              Biomechanical Kinetic Chain Sequence
            </h4>
          </div>
          <span className="text-[10px] font-bold text-zinc-400">
            Target: <strong className="text-amber-400">{selectedMovementPhase}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          {sequenceSteps.map((step) => (
            <div
              key={step.stepNumber}
              className="bg-zinc-950/90 border border-zinc-800/80 p-2.5 rounded-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-black uppercase text-red-400 bg-red-950/40 px-1.5 py-0.5 rounded border border-red-800/40">
                    Step {step.stepNumber}
                  </span>
                  <span className="text-[9px] font-bold text-emerald-400 font-mono">{step.targetAngleRange}</span>
                </div>
                <h5 className="text-[11px] font-bold text-white truncate">{step.title}</h5>
                <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-2 leading-tight">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Skeleton Color Spectrum Legend */}
      <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded-xl flex items-center justify-between flex-wrap gap-2 text-[10px] sm:text-[11px] font-bold">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
          <span>Optimal</span>
        </div>
        <div className="flex items-center gap-1.5 text-blue-400">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm" />
          <span>Good</span>
        </div>
        <div className="flex items-center gap-1.5 text-purple-400">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-sm" />
          <span>Warning</span>
        </div>
        <div className="flex items-center gap-1.5 text-red-400">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm" />
          <span>Severe</span>
        </div>
      </div>
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-red-950/40 border border-red-900/40 p-3.5 rounded-xl text-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Target className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <span className="font-extrabold text-white uppercase tracking-wider">
              {skillLevel === 'grassroots' && 'Grassroots / School Tier (±15° Tolerance)'}
              {skillLevel === 'academy' && 'Provincial Academy Tier (±7° Tolerance)'}
              {skillLevel === 'elite_pro' && 'Elite National Pro Tier (±2° Precision)'}
            </span>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {skillLevel === 'grassroots' && 'Forgiving biomechanical range for young learners building baseline mechanics.'}
              {skillLevel === 'academy' && 'Tighter angle tolerances demanding high kinematic precision.'}
              {skillLevel === 'elite_pro' && 'Strict professional tolerances for maximum power output and injury prevention.'}
            </p>
          </div>
        </div>
        <span className="bg-amber-400 text-zinc-950 font-black px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider shrink-0">
          {skillLevel}
        </span>
      </div>

      {/* Main Safety & Symmetry Meters */}
      <div className="grid grid-cols-2 gap-3">
        
        {/* Knee Tracking Safety Meter */}
        <div className="bg-zinc-900/90 border border-zinc-800 p-3.5 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-bold text-zinc-200">ACL / Knee Tracking Index</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400 font-mono">
              {activeKneeScore}%
            </span>
            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                activeKneeScore >= 85
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}
            >
              {activeKneeScore >= 85 ? 'OPTIMAL TRACKING' : 'VALGUS ALERT'}
            </span>
          </div>
          <div className="w-full bg-zinc-800 h-2 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-amber-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${activeKneeScore}%` }}
            />
          </div>
          <span className="text-[10px] text-zinc-500 mt-1">Monitors knee inward buckling (valgus strain)</span>
        </div>

        {/* Left / Right Limb Symmetry Meter */}
        <div className="bg-zinc-900/90 border border-zinc-800 p-3.5 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-bold text-zinc-200">L/R Body Symmetry</span>
            <Activity className="w-4 h-4 text-red-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-red-500 font-mono">
              {activeSymmetryScore}%
            </span>
            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                activeSymmetryScore >= 80
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-emerald-500/30'
              }`}
            >
              {activeSymmetryScore >= 80 ? 'BALANCED' : 'IMBALANCE'}
            </span>
          </div>
          <div className="w-full bg-zinc-800 h-2 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-red-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${activeSymmetryScore}%` }}
            />
          </div>
          <span className="text-[10px] text-zinc-500 mt-1">Bilateral loading & shoulder/hip tilt balance</span>
        </div>

      </div>

      {/* Movement Phase Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => onChangeMovementPhase?.('Auto-Detect')}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
            activePhaseFilter === 'All'
              ? 'bg-yellow-400 text-zinc-950 font-black'
              : 'bg-zinc-900 text-zinc-400 hover:text-white'
          }`}
        >
          All Phases
        </button>
        {sportRule.phases.map((phase) => (
          <button
            key={phase}
            onClick={() => onChangeMovementPhase?.(phase)}
            className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activePhaseFilter === phase
                ? 'bg-red-600 text-white font-black shadow-md shadow-red-600/20'
                : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            {phase}
          </button>
        ))}
      </div>

      {/* Joint Rules & Angle Gauges */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-yellow-400 fill-current" />
            Biometric Rules ({filteredRules.length})
          </h3>
          <span className="text-[11px] text-zinc-500">
            Real-time joint angle feedback
          </span>
        </div>

        <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
          {filteredRules.map((rule) => {
            const tolerance = rule.tolerancesByLevel[skillLevel] || {
              idealMin: rule.idealMin,
              idealMax: rule.idealMax
            };
            const idealMin = tolerance.idealMin;
            const idealMax = tolerance.idealMax;

            const angleVal = analysis?.angles[rule.id] ?? Math.round((idealMin + idealMax) / 2);
            
            let status: 'optimal' | 'good' | 'warning' | 'error' = 'optimal';
            if (angleVal < idealMin || angleVal > idealMax) {
              const diff = Math.min(Math.abs(angleVal - idealMin), Math.abs(angleVal - idealMax));
              if (diff <= 8) status = 'good';
              else if (diff <= 20) status = 'warning';
              else status = 'error';
            }

            const percent = Math.min(100, Math.max(0, (angleVal / 180) * 100));
            const minPercent = (idealMin / 180) * 100;
            const maxPercent = (idealMax / 180) * 100;

            const coachingMsg = getCoachingFeedback(
              rule,
              angleVal,
              idealMin,
              idealMax,
              status === 'good' ? 'optimal' : (status as any)
            );

            return (
              <div
                key={rule.id}
                className={`bg-zinc-900/90 border p-3.5 rounded-xl flex flex-col gap-2.5 transition-all ${
                  status === 'optimal'
                    ? 'border-emerald-500/30 bg-zinc-900/80'
                    : status === 'good'
                    ? 'border-blue-500/30 bg-zinc-900/80'
                    : status === 'warning'
                    ? 'border-purple-500/40 bg-purple-950/10'
                    : 'border-red-500/50 bg-red-950/10'
                }`}
              >
                {/* Top Row: Name, Importance & Live Angle Readout */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      {status === 'optimal' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                      {status === 'warning' && <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0" />}
                      {status === 'error' && <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />}
                      <span className="text-xs font-extrabold text-zinc-100">{rule.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 ml-6">
                      <span className="bg-zinc-800 text-zinc-300 text-[10px] font-semibold px-2 py-0.5 rounded">
                        {rule.phase}
                      </span>
                      {rule.importance === 'critical_safety' && (
                        <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                          Critical Safety
                        </span>
                      )}
                      {rule.importance === 'performance' && (
                        <span className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                          Performance
                        </span>
                      )}
                      {rule.importance === 'posture' && (
                        <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                          Posture
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Angle & Status Badge */}
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-baseline gap-1">
                      <span
                        className={`text-base font-mono font-black ${
                          status === 'optimal'
                            ? 'text-emerald-400'
                            : status === 'warning'
                            ? 'text-yellow-400'
                            : 'text-red-400'
                        }`}
                      >
                        {angleVal}
                        {rule.unit}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                          status === 'optimal'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : status === 'warning'
                            ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}
                      >
                        {status === 'optimal' && '✓ Optimal'}
                        {status === 'warning' && '⚠️ Attention'}
                        {status === 'error' && '✖ Out of Range'}
                      </span>

                      <span className="bg-zinc-800 text-zinc-400 text-[10px] font-bold px-2 py-0.5 rounded border border-zinc-700">
                        Target: {idealMin}°–{idealMax}°
                      </span>
                    </div>
                  </div>
                </div>

                {/* Relative Angle Gauge Bar with Target Band */}
                <div className="flex flex-col gap-1 mt-1">
                  <div className="relative w-full bg-zinc-800/90 h-2.5 rounded-full overflow-hidden border border-zinc-700/50">
                    {/* Ideal Target Band */}
                    <div
                      className="absolute h-full bg-emerald-500/35 border-x border-emerald-400/80"
                      style={{
                        left: `${minPercent}%`,
                        width: `${Math.max(2, maxPercent - minPercent)}%`
                      }}
                    />
                    {/* Current Position Pointer */}
                    <div
                      className={`absolute h-full w-2.5 -ml-1.25 rounded-full shadow-lg transition-all ${
                        status === 'optimal'
                          ? 'bg-emerald-400 shadow-emerald-400/50'
                          : status === 'warning'
                          ? 'bg-yellow-400 shadow-yellow-400/50'
                          : 'bg-red-500 shadow-red-500/50'
                      }`}
                      style={{ left: `${percent}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[9px] text-zinc-500 font-mono px-0.5">
                    <span>0°</span>
                    <span className="text-emerald-400 font-sans font-bold">
                      Target Zone ({idealMin}°–{idealMax}°)
                    </span>
                    <span>180°</span>
                  </div>
                </div>

                {/* Biomechanical Coaching Correction Feedback */}
                <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-lg p-2 flex items-start gap-2 text-[11px] text-zinc-300">
                  <Info className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />
                  <p className="leading-tight font-medium">{coachingMsg}</p>
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

