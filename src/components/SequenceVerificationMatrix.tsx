import React, { useState, useEffect, useMemo } from 'react';
import { SportRule, FrameAnalysis } from '../types';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Sparkles, 
  Activity, 
  Info, 
  ArrowRight, 
  Zap, 
  TrendingDown,
  TrendingUp,
  Dumbbell,
  HelpCircle,
  ShieldAlert,
  Play,
  RotateCcw,
  Trophy,
  Flame
} from 'lucide-react';

interface SequenceComparison {
  ideal: string[];
  actual: string[];
  isCorrect: boolean;
  feedback: string;
}

interface SequenceVerificationMatrixProps {
  sequenceComparison: SequenceComparison | null | undefined;
  kineticSequence?: {
    steps: {
      name: string;
      timestamp: number;
      score: number;
      status: 'optimal' | 'good' | 'warning' | 'error';
    }[];
    firingOrder: {
      joint: string;
      peakTime: number;
      peakVelocity: number;
    }[];
    isCorrectOrder: boolean;
    sequenceEfficiency: number;
  } | null;
  sportRule: SportRule;
  onUpdateSequenceComparison?: (newComp: SequenceComparison) => void;
  drills?: any[];
  drillProgress?: Record<number, 'pending' | 'completed' | 'mastered'>;
  onToggleDrillStatus?: (idx: number) => void;
  keyframes?: FrameAnalysis[];
  onSelectKeyframe?: (frame: FrameAnalysis) => void;
  onSeekVideo?: (timestamp: number) => void;
  currentTime?: number;
  viewMode?: 'student' | 'coach';
}

interface PhaseTutorial {
  title: string;
  purpose: string;
  skippingCost: string;
  injuryRisk: string;
  coachingCue: string;
  energyContribution: number; // Percentage contribution to peak exit velocity
}

const PHASE_TUTORIALS: Record<string, PhaseTutorial> = {
  // Basketball Jumpshot
  'Dip & Knee Flexion': {
    title: 'Dip & Knee Flexion (Base Loading)',
    purpose: 'Stores elastic energy in the patellar tendons and loads the quadriceps to generate upward ground reaction force.',
    skippingCost: 'Reduces maximum jump height by 35% and forces the upper body to compensate, reducing shot range.',
    injuryRisk: 'Increases shoulder joint strain as the athlete attempts to throw the ball rather than shoot it from a solid base.',
    coachingCue: 'Sink your hips like loading a coil spring before the launch.',
    energyContribution: 30
  },
  'Triple Extension & Set Point': {
    title: 'Triple Extension & Set Point',
    purpose: 'Simultaneous extension of hip, knee, and ankle joints to transfer maximum kinetic energy up through the torso.',
    skippingCost: 'Disrupts shot release timing. Releasing the ball on the way down reduces release height and shot power.',
    injuryRisk: 'Incomplete knee extension increases repetitive stress on the patellar tendon due to awkward landing forces.',
    coachingCue: 'Explode straight up, bringing the ball to your forehead set-point.',
    energyContribution: 40
  },
  'Shooting Elbow Extension': {
    title: 'Shooting Elbow Extension',
    purpose: 'Locks the shoulder angle and uses elbow extension to launch the ball at an optimal 50°-55° high-arc trajectory.',
    skippingCost: 'Flat shot trajectory that reduces the target entry margin at the rim by up to 60%.',
    injuryRisk: 'Overuse of wrist flexors to compensate for dead legs, causing forearm splints or golfer\'s elbow.',
    coachingCue: 'Keep elbow tucked and push the sky. Reach into the cookie jar.',
    energyContribution: 20
  },
  'Wrist Flick & Soft Balance Landing': {
    title: 'Wrist Flick & Soft Balance Landing',
    purpose: 'Imparts backward rotation (backspin) on the ball to stabilize flight and ensure a soft rebound bounce.',
    skippingCost: 'Knuckleball flight profile with low rim capture probability and uneven forward landing balance.',
    injuryRisk: 'Landing on a single foot or with stiff knees increases risk of ankle rolls or high-impact meniscus friction.',
    coachingCue: 'Flick your wrist like waving goodbye and land softly on two balanced feet.',
    energyContribution: 10
  },

  // Rugby Tackle
  'Foot Plant & Center of Gravity': {
    title: 'Foot Plant & Center of Gravity (Base Setup)',
    purpose: 'Establishes a wide, stable base with low center of gravity to absorb collision momentum.',
    skippingCost: 'Being easily knocked backwards or run over due to lack of lateral stability and power base.',
    injuryRisk: 'Over-extending the legs or planting narrow exposes the knee to high shear forces and ACL tears.',
    coachingCue: 'Short, active feet. Chop your steps and widen your base.',
    energyContribution: 25
  },
  'Hip Hinge & Neutral Spine': {
    title: 'Hip Hinge & Neutral Spine',
    purpose: 'Maintains neutral cervical and lumbar spine curves to transfer force safely through the pelvic girdle.',
    skippingCost: 'Loss of tackle power and failure to stop the ball carrier\'s forward momentum.',
    injuryRisk: 'CRITICAL: Tackling with a flexed spine or head down increases axial loading, risking neck fracture or herniated discs.',
    coachingCue: 'Hinge at the hips, keep chest proud and chin up. Look through your eyebrows.',
    energyContribution: 35
  },
  'Lead Shoulder Wrap': {
    title: 'Lead Shoulder Wrap',
    purpose: 'Direct shoulder-to-hip contact with active arm wrap to lock the ball carrier\'s legs and prevent offloads.',
    skippingCost: 'Busted tackles. Arm-only tackles fail against powerful runners and result in missed defensive assignments.',
    injuryRisk: 'Tackling with an extended arm risks shoulder dislocation, clavicle fracture, or stinger nerve injuries.',
    coachingCue: 'Drive shoulder into thigh, wrap arms like hugging a giant tree.',
    energyContribution: 25
  },
  'Leg Drive & Triple Extension': {
    title: 'Leg Drive & Triple Extension (Power Release)',
    purpose: 'Continuous leg drive post-contact to execute a dominant tackle and bring the carrier safely to ground.',
    skippingCost: 'Allows the ball carrier to crawl forward or break free after initial contact.',
    injuryRisk: 'Passive drag-down tackling leaves legs dangling, increasing vulnerability to lower limb hyper-extension.',
    coachingCue: 'Drive your legs through contact. Do not stop pumping your feet.',
    energyContribution: 15
  },

  // Soccer Shooting
  'Plant Foot Placement': {
    title: 'Plant Foot Placement',
    purpose: 'Anchors the non-kicking leg alongside the ball, absorbing load and directing swing trajectory.',
    skippingCost: 'Planting too far behind or ahead locks the hips, causing shots to fly high or wide.',
    injuryRisk: 'Planting too close traps the kicking leg, forcing lateral knee shearing and medial collateral ligament strain.',
    coachingCue: 'Plant foot 15cm beside the ball, toe pointing directly at your target.',
    energyContribution: 20
  },
  'Knee Cocking & Hip Extension': {
    title: 'Knee Cocking & Hip Extension (Backswing)',
    purpose: 'Creates elastic tension in the hip flexors and quadriceps to maximize shooting velocity.',
    skippingCost: 'A weak, arm-pushed swing that lacks velocity and is easily intercepted by the goalkeeper.',
    injuryRisk: 'Forces repetitive groin hip-flexor strains due to poor mechanical muscle loading.',
    coachingCue: 'Draw the kicking knee back and heel up, stretching the front hip.',
    energyContribution: 35
  },
  'Chest Over Ball & Ankle Lock': {
    title: 'Chest Over Ball & Ankle Lock',
    purpose: 'Keeps ball trajectory low while locking the ankle joint to ensure rigid force transfer.',
    skippingCost: 'Lax ankle causes power leakage and erratic spin; leaning back causes the shot to sky over the crossbar.',
    injuryRisk: 'Hitting with a floppy ankle transfers high-energy impact shocks into the Achilles tendon and ankle ligaments.',
    coachingCue: 'Leap onto the ball with shoulders over knees, ankle locked solid.',
    energyContribution: 30
  },
  'High Arc Follow-Through': {
    title: 'High Arc Follow-Through',
    purpose: 'Decelerates kicking leg safely across the body centerline while maintaining posture.',
    skippingCost: 'Abruptly stopping the leg swing cuts off ball speed and ruins directional control.',
    injuryRisk: 'High risk of acute hamstring strains as muscle fibers pull hard to stop the unchecked leg momentum.',
    coachingCue: 'Follow through fully, landing on your kicking foot for complete deceleration.',
    energyContribution: 15
  }
};

const getFallbackTutorial = (phaseName: string): PhaseTutorial => ({
  title: phaseName,
  purpose: 'Serves as a critical kinetic link in the multi-joint sport movement chain.',
  skippingCost: 'Disrupts chronological energy transfer, causing a significant loss in peak velocity and mechanical accuracy.',
  injuryRisk: 'Forces neighboring joints to overload to compensate, increasing repetitive joint strain risk.',
  coachingCue: `Focus on mastering the stance and timing of the ${phaseName} phase.`,
  energyContribution: 25
});

export const SequenceVerificationMatrix: React.FC<SequenceVerificationMatrixProps> = ({
  sequenceComparison,
  kineticSequence,
  sportRule,
  onUpdateSequenceComparison,
  drills,
  drillProgress = {},
  onToggleDrillStatus,
  keyframes,
  onSelectKeyframe,
  onSeekVideo,
  currentTime,
  viewMode = 'coach'
}) => {
  const [selectedTutorialPhase, setSelectedTutorialPhase] = useState<string | null>(null);
  
  // Kinetic Simulator State
  const [simActive, setSimActive] = useState(false);
  const [simCurrentIndex, setSimCurrentIndex] = useState<number>(-1);
  const [simEnergyAccumulator, setSimEnergyAccumulator] = useState<number>(0);
  const [simStatus, setSimStatus] = useState<string>('Ready to test kinetic wave');
  const [simErrorIndex, setSimErrorIndex] = useState<number>(-1);
  const [simHasRun, setSimHasRun] = useState(false);

  // Puzzle Game State
  const [puzzlePhases, setPuzzlePhases] = useState<string[]>([]);
  const [puzzleFeedback, setPuzzleFeedback] = useState<string | null>(null);
  const [puzzleSolved, setPuzzleSolved] = useState<boolean>(false);

  const comp = sequenceComparison || {
    ideal: sportRule.sequence || sportRule.phases,
    actual: [],
    isCorrect: true,
    feedback: "Awaiting athlete video analysis to track sequence correctness."
  };

  const idealPhases = comp.ideal;
  const originalActualPhases = comp.actual;
  const activeDrills = drills || sportRule.drills || [];

  // Custom Actual Phases Override state
  const [customActualPhases, setCustomActualPhases] = useState<string[]>(originalActualPhases);
  const [isOverrideActive, setIsOverrideActive] = useState(false);

  const actualPhases = customActualPhases;
  const skippedPhases = idealPhases.filter(p => !actualPhases.includes(p));

  // Find current active step index based on video playback currentTime
  const activePlayIndex = useMemo(() => {
    if (currentTime === undefined || !keyframes || keyframes.length === 0) return -1;
    
    // Sort keyframes by timestamp
    const sorted = [...keyframes].sort((a, b) => a.timestamp - b.timestamp);
    
    // Find the latest keyframe whose timestamp is <= currentTime
    let activeIdx = -1;
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].timestamp <= currentTime) {
        activeIdx = i;
      }
    }
    
    // Map the phase name of this keyframe back to the ideal/steps index
    if (activeIdx !== -1) {
      const activePhaseName = sorted[activeIdx].detectedPhase;
      const stepNames = kineticSequence?.steps && kineticSequence.steps.length > 0 
        ? kineticSequence.steps.map(s => s.name) 
        : idealPhases;
      return stepNames.findIndex(name => name.toLowerCase() === activePhaseName.toLowerCase());
    }
    
    return -1;
  }, [currentTime, keyframes, kineticSequence, idealPhases]);

  // Synchronize the selected tutorial phase and guideboard live as the video plays!
  useEffect(() => {
    if (activePlayIndex >= 0) {
      const stepNames = kineticSequence?.steps && kineticSequence.steps.length > 0 
        ? kineticSequence.steps.map(s => s.name) 
        : idealPhases;
      const phaseName = stepNames[activePlayIndex];
      setSelectedTutorialPhase(phaseName);
    }
  }, [activePlayIndex, kineticSequence, idealPhases]);

  // Dynamically compute live energy accumulation of force during play/seek
  const liveEnergyAccumulator = useMemo(() => {
    if (simActive) return simEnergyAccumulator;
    if (activePlayIndex === -1) return 0;
    
    const stepNames = kineticSequence?.steps && kineticSequence.steps.length > 0 
      ? kineticSequence.steps.map(s => s.name) 
      : idealPhases;
      
    let energy = 0;
    for (let i = 0; i <= activePlayIndex; i++) {
      const name = stepNames[i];
      const tutor = PHASE_TUTORIALS[name] || getFallbackTutorial(name);
      energy += tutor.energyContribution || 25;
    }
    return Math.min(100, energy);
  }, [simActive, simEnergyAccumulator, activePlayIndex, kineticSequence, idealPhases]);

  useEffect(() => {
    setCustomActualPhases(originalActualPhases);
    setIsOverrideActive(false);
  }, [originalActualPhases]);

  const handleApplyOverride = (newActual: string[]) => {
    if (!onUpdateSequenceComparison) return;
    
    let isCorrect = true;
    let feedback = "";

    if (newActual.length < idealPhases.length) {
      isCorrect = false;
      const missed = idealPhases.filter(p => !newActual.includes(p));
      feedback = `Manual Calibration note: The athlete missed key phases: ${missed.join(', ')}.`;
    } else {
      let idealIdx = 0;
      for (const p of newActual) {
        if (p === idealPhases[idealIdx]) {
          idealIdx++;
        }
      }
      if (idealIdx < idealPhases.length) {
        isCorrect = false;
        feedback = `Manual Calibration: The sequence of movements was out of order. Expected: ${idealPhases.join(' → ')}.`;
      } else {
        feedback = "Perfect Calibration! All phases executed in the correct chronological kinetic sequence.";
      }
    }

    onUpdateSequenceComparison({
      ideal: idealPhases,
      actual: newActual,
      isCorrect,
      feedback
    });
    setIsOverrideActive(true);
  };

  const handleAutoAlign = () => {
    setCustomActualPhases([...idealPhases]);
    handleApplyOverride([...idealPhases]);
    setSimHasRun(false);
    setSimErrorIndex(-1);
  };

  const handleResetToAuto = () => {
    setCustomActualPhases(originalActualPhases);
    setIsOverrideActive(false);
    setSimHasRun(false);
    setSimErrorIndex(-1);
    if (onUpdateSequenceComparison) {
      onUpdateSequenceComparison(comp);
    }
  };

  const handleTogglePhaseInCustom = (phase: string) => {
    let next: string[];
    if (customActualPhases.includes(phase)) {
      next = customActualPhases.filter(p => p !== phase);
    } else {
      next = [...customActualPhases, phase];
    }
    setCustomActualPhases(next);
    handleApplyOverride(next);
    setSimHasRun(false);
    setSimErrorIndex(-1);
  };

  const handleApplyPuzzleToReport = () => {
    setCustomActualPhases([...puzzlePhases]);
    handleApplyOverride([...puzzlePhases]);
    setPuzzleFeedback("🎉 Solved sequence has been successfully synchronized as the active athlete report sequence!");
    setSimHasRun(false);
    setSimErrorIndex(-1);
  };

  // Initialize Puzzle Game
  useEffect(() => {
    resetPuzzle();
  }, [sportRule]);

  const resetPuzzle = () => {
    // Shuffle the ideal phases to make a fun drag/click game
    const shuffled = [...idealPhases].sort(() => Math.random() - 0.5);
    setPuzzlePhases(shuffled);
    setPuzzleFeedback(null);
    setPuzzleSolved(false);
  };

  const swapPuzzleItems = (idxA: number, idxB: number) => {
    if (puzzleSolved) return;
    const nextPhases = [...puzzlePhases];
    const temp = nextPhases[idxA];
    nextPhases[idxA] = nextPhases[idxB];
    nextPhases[idxB] = temp;
    setPuzzlePhases(nextPhases);

    // Auto check if they match ideal
    const matchesAll = nextPhases.every((p, i) => p === idealPhases[i]);
    if (matchesAll) {
      setPuzzleSolved(true);
      setPuzzleFeedback("🎉 Amazing Job! You aligned the Kinetic Wave in perfect sequence. Energy flows beautifully!");
    } else {
      setPuzzleFeedback(null);
    }
  };

  // Run Kinetic Energy Flow Simulator
  const runKineticSimulation = () => {
    if (simActive) return;
    setSimActive(true);
    setSimCurrentIndex(0);
    setSimEnergyAccumulator(0);
    setSimErrorIndex(-1);
    setSimStatus('🚀 Starting ground load ignition...');
    setSimHasRun(true);

    const stepsToSimulate = kineticSequence?.steps && kineticSequence.steps.length > 0
      ? kineticSequence.steps
      : idealPhases.map(p => ({ name: p, timestamp: 0, score: 85, status: 'good' as const }));

    // Pre-calculate the exact error index where the sequence breaks
    let errorIdx = -1;
    if (!comp.isCorrect) {
      if (!isOverrideActive && kineticSequence && !kineticSequence.isCorrectOrder) {
        errorIdx = 2; // Break at Step 3 (index 2) by default for timing-based sequence error
      } else {
        // Find the first ideal phase that has an issue in actualPhases
        for (let i = 0; i < idealPhases.length; i++) {
          const phase = idealPhases[i];
          // Is it skipped?
          if (!actualPhases.includes(phase)) {
            errorIdx = i;
            break;
          }
          // Is it out of order?
          const actualPos = actualPhases.indexOf(phase);
          let outOfOrder = false;
          for (let j = i + 1; j < idealPhases.length; j++) {
            const nextPhase = idealPhases[j];
            const nextActualPos = actualPhases.indexOf(nextPhase);
            if (nextActualPos !== -1 && nextActualPos < actualPos) {
              outOfOrder = true;
              break;
            }
          }
          if (outOfOrder) {
            errorIdx = i;
            break;
          }
        }
        // Fallback: if we still didn't find an error index, but comp.isCorrect is false, break at Step 3
        if (errorIdx === -1) {
          errorIdx = 2;
        }
      }
    }

    let currentIndex = 0;
    let accumulatedEnergy = 0;

    const interval = setInterval(() => {
      if (currentIndex >= stepsToSimulate.length) {
        clearInterval(interval);
        setSimActive(false);
        setSimStatus('🏆 Technical sequence complete! Peak power achieved.');
        if (stepsToSimulate.length > 0) {
          setSelectedTutorialPhase(stepsToSimulate[stepsToSimulate.length - 1].name);
        }
        return;
      }

      const step = stepsToSimulate[currentIndex];
      const phaseName = step.name;
      const tutorial = PHASE_TUTORIALS[phaseName] || getFallbackTutorial(phaseName);

      // Break if we have reached the pre-calculated error index
      if (currentIndex === errorIdx) {
        clearInterval(interval);
        setSimActive(false);
        setSimErrorIndex(currentIndex);
        setSimStatus(`⚡ WAVE COLLAPSE AT STEP ${currentIndex + 1}: ${phaseName}!`);
        setSelectedTutorialPhase(phaseName);
        return;
      }

      accumulatedEnergy += tutorial.energyContribution || 25;
      setSimEnergyAccumulator(Math.min(100, accumulatedEnergy));
      setSimCurrentIndex(currentIndex);
      setSimStatus(`🔥 Propagating force: ${phaseName} (+${tutorial.energyContribution || 25}% velocity contribution)`);

      currentIndex++;
    }, 1200);
  };

  // Calculate a mock Kinetic Chain Efficiency Index based on correctness
  let efficiencyScore = 100;
  if (actualPhases.length === 0) {
    efficiencyScore = 100; // default state
  } else {
    const missedPen = skippedPhases.length * 20;
    const orderPen = !comp.isCorrect && skippedPhases.length === 0 ? 30 : 0;
    efficiencyScore = Math.max(15, 100 - missedPen - orderPen);
  }

  // Get current tutorial details
  const activeTutorial = selectedTutorialPhase 
    ? (PHASE_TUTORIALS[selectedTutorialPhase] || getFallbackTutorial(selectedTutorialPhase))
    : null;

  return (
    <div className="bg-zinc-950 border border-red-500/30 rounded-3xl p-6 shadow-2xl flex flex-col gap-6 text-zinc-100" id="biomechanical-sequence-matrix">
      
      {/* Title & Status Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-900 pb-4 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-400 shadow-md">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-500 block">
              {viewMode === 'student' ? 'Super-Move Checker' : 'Biomechanical Flow Engine'}
            </span>
            <h3 className="text-sm font-black uppercase text-white tracking-wide">
              {viewMode === 'student' ? 'Energy Transfer Sequence' : 'Kinetic Chain Sequence Verification'}
            </h3>
          </div>
        </div>
        
        {actualPhases.length > 0 && (
          <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border self-start sm:self-center transition-all ${
            comp.isCorrect 
              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' 
              : 'text-red-400 bg-red-500/10 border-red-500/30 animate-pulse'
          }`}>
            {comp.isCorrect ? '✓ Correct Sequence' : '⚠️ Sequence Deviation'}
          </span>
        )}
      </div>

      {/* Main Grid: Interactive Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 8 Columns: Dynamic Sequence Analysis */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          
          {/* Kinetic Energy Wave Simulator */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400 animate-bounce" />
                <span className="text-xs font-black uppercase text-zinc-300">Kinetic Energy Wave Simulator</span>
              </div>
              <button
                onClick={runKineticSimulation}
                disabled={simActive}
                className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 text-white font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-red-600/10 transition-all disabled:opacity-50"
              >
                {simActive ? <Activity className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                <span>{simActive ? 'Testing Wave...' : 'Simulate Kinetic Wave'}</span>
              </button>
            </div>

            {/* Simulated Sequence Steps */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 relative">
              {(kineticSequence?.steps && kineticSequence.steps.length > 0 ? kineticSequence.steps.map(s => s.name) : idealPhases).map((phase, i) => {
                const isCurrent = (simActive && simCurrentIndex === i) || (activePlayIndex === i);
                const isFinished = (simActive && simCurrentIndex > i) || (activePlayIndex > i) || (!simActive && simCurrentIndex === idealPhases.length - 1 && activePlayIndex === -1);
                const isHaltedError = simErrorIndex === i;

                return (
                  <div 
                    key={phase}
                    className={`p-3 rounded-xl border flex flex-col gap-1 transition-all duration-300 relative overflow-hidden ${
                      isHaltedError 
                        ? 'bg-red-950/40 border-red-500 text-red-300 shadow-lg shadow-red-500/10 animate-pulse'
                        : isCurrent 
                        ? 'bg-amber-400/20 border-amber-400 text-white scale-[1.03] shadow-lg shadow-amber-400/10'
                        : isFinished 
                        ? 'bg-emerald-950/20 border-emerald-500/50 text-emerald-400' 
                        : 'bg-zinc-950 border-zinc-800/80 text-zinc-400'
                    }`}
                  >
                    {/* Glowing Progress Wave */}
                    {isCurrent && (
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-400/10 via-amber-400/20 to-amber-400/10 animate-pulse" />
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-wider">Step {i + 1}</span>
                      {isFinished ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : isHaltedError ? (
                        <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      ) : isCurrent ? (
                        <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-spin" style={{ animationDuration: '3s' }} />
                      ) : null}
                    </div>

                    <span className="text-[11px] font-extrabold uppercase tracking-wide truncate mt-1">
                      {phase}
                    </span>

                    <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden mt-1.5">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          isHaltedError ? 'bg-red-500 w-full' : isFinished ? 'bg-emerald-400 w-full' : isCurrent ? 'bg-amber-400 w-2/3' : 'bg-transparent w-0'
                        }`} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sim Console Log */}
            <div className={`p-3 rounded-xl border text-xs font-mono transition-all duration-300 ${
              simErrorIndex !== -1 
                ? 'bg-red-950/20 border-red-500/30 text-red-300' 
                : simActive || activePlayIndex !== -1
                ? 'bg-amber-950/20 border-amber-500/20 text-amber-200' 
                : 'bg-zinc-950 border-zinc-800 text-zinc-400'
            }`}>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${simActive || activePlayIndex !== -1 ? 'bg-amber-400 animate-ping' : simErrorIndex !== -1 ? 'bg-red-500' : 'bg-zinc-600'}`} />
                  <span>{currentTime !== undefined && activePlayIndex !== -1 ? `🎥 Synced to active video moment (${currentTime.toFixed(2)}s)` : simStatus}</span>
                </span>
                <span className="text-[10px] uppercase font-bold text-zinc-500">
                  Transferred Velocity: <strong className="text-zinc-200">{liveEnergyAccumulator}%</strong>
                </span>
              </div>
            </div>

            {/* Wave Halted/Error Insight */}
            {simErrorIndex !== -1 && (
              <div className="bg-red-950/30 border border-red-500/30 p-3.5 rounded-xl flex items-start gap-3 animate-fadeIn">
                <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-black text-red-400 uppercase tracking-wider">
                    Ground-Up Power Link Failure
                  </span>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Energy broke at <strong className="text-white">Step {simErrorIndex + 1}: {idealPhases[simErrorIndex]}</strong>. 
                    {PHASE_TUTORIALS[idealPhases[simErrorIndex]]?.skippingCost || 'Forces structural biomechanical overload.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* NEW: TACTICAL BIOMECHANICS GUIDEBOARD (WHY AND WHAT TO DO) */}
          {((simHasRun && !simActive) || activePlayIndex !== -1) && (
            <div className="bg-zinc-905 border border-zinc-800/80 rounded-2xl p-4 flex flex-col gap-4 animate-fadeIn" id="kinetic-simulation-guideboard">
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
                <Dumbbell className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black uppercase tracking-wider text-zinc-200">
                  {simErrorIndex !== -1 ? '💥 Biomechanical Fault Action Plan' : '🏆 Kinetic Sequence Success Plan'}
                </span>
              </div>

              {simErrorIndex !== -1 ? (
                // FAULT CORRECTION DETAILS
                (() => {
                  const activePhase = idealPhases[simErrorIndex];
                  const tutor = PHASE_TUTORIALS[activePhase] || getFallbackTutorial(activePhase);
                  
                  // Match a drill from activeDrills
                  const phaseLower = activePhase.toLowerCase();
                  const matchedDrillIdx = activeDrills.findIndex(d => {
                    const drillText = `${d.name} ${d.description} ${d.targetJoint || ''}`.toLowerCase();
                    const keywords = phaseLower.split(/\s+/).filter(w => w.length > 3);
                    return keywords.some(k => drillText.includes(k));
                  });
                  
                  const drillIdx = matchedDrillIdx !== -1 ? matchedDrillIdx : 0;
                  const drill = activeDrills[drillIdx];
                  const drillState = drillProgress[drillIdx] || 'pending';

                  return (
                    <div className="flex flex-col gap-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* WHY IT FAILED */}
                        <div className="bg-zinc-950 border border-zinc-800/60 p-3 rounded-xl flex flex-col gap-2">
                          <span className="text-[10px] font-black uppercase text-red-400 tracking-wider">
                            Why This Fails (Anatomical Impact)
                          </span>
                          <p className="text-xs text-zinc-300 leading-relaxed">
                            When <strong className="text-white">{activePhase}</strong> is executed out-of-order or skipped, the kinetic whip is disrupted.
                          </p>
                          <div className="bg-zinc-900/50 p-2.5 rounded border border-zinc-800/80 flex flex-col gap-1">
                            <span className="text-[9px] font-bold text-zinc-500 uppercase">Power Leakage:</span>
                            <span className="text-xs text-zinc-300 italic">{tutor.skippingCost}</span>
                          </div>
                          <div className="bg-red-500/5 border border-red-500/10 p-2.5 rounded flex items-start gap-2">
                            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[9px] font-black uppercase text-red-400">Joint Safety Alert:</span>
                              <p className="text-[11px] text-red-200/90 leading-snug">{tutor.injuryRisk}</p>
                            </div>
                          </div>
                        </div>

                        {/* WHAT TO DO */}
                        {drill && (
                          <div className="bg-zinc-950 border border-amber-500/20 p-3 rounded-xl flex flex-col gap-2 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full filter blur-xl" />
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                                What to Do (Targeted Corrective Drill)
                              </span>
                              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                drillState === 'mastered' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                drillState === 'completed' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                'bg-zinc-900 text-zinc-500 border border-zinc-800'
                              }`}>
                                {drillState.toUpperCase()}
                              </span>
                            </div>

                            <div className="flex flex-col gap-1">
                              <span className="text-xs font-black text-white leading-tight">{drill.name}</span>
                              <span className="text-[10px] text-zinc-400 font-mono font-medium">{drill.reps}</span>
                            </div>

                            <p className="text-xs text-zinc-300 leading-snug">
                              {drill.description}
                            </p>

                            {onToggleDrillStatus && (
                              <button
                                onClick={() => onToggleDrillStatus(drillIdx)}
                                className={`mt-2 py-1.5 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all w-full border ${
                                  drillState === 'mastered' ? 'bg-emerald-600 border-emerald-500 hover:bg-emerald-500 text-white' :
                                  drillState === 'completed' ? 'bg-blue-600 border-blue-500 hover:bg-blue-500 text-white' :
                                  'bg-zinc-800 border-zinc-700 hover:bg-zinc-800 hover:border-zinc-750 text-zinc-300'
                                }`}
                              >
                                {drillState === 'mastered' ? <Sparkles className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                <span>
                                  {drillState === 'pending' ? 'Mark Drill as Practiced' :
                                   drillState === 'completed' ? 'Mark Drill as Mastered' :
                                   'Reset Drill Status'}
                                </span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* DRILL STEP-BY-STEP EXPLANATION */}
                      {drill && drill.howToExecute && drill.howToExecute.length > 0 && (
                        <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl flex flex-col gap-2">
                          <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider flex items-center gap-1">
                            <Info className="w-3.5 h-3.5 text-zinc-500" />
                            Drill Execution Blueprint (Explain Step-by-Step):
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                            {drill.howToExecute.map((step, sIdx) => (
                              <div key={sIdx} className="bg-zinc-900 p-2 rounded-lg text-xs text-zinc-300 flex items-start gap-2 border border-zinc-800">
                                <span className="w-4 h-4 bg-zinc-950 border border-zinc-800 rounded text-[9px] font-bold text-zinc-400 flex items-center justify-center shrink-0 mt-0.5">
                                  {sIdx + 1}
                                </span>
                                <span className="leading-relaxed">{step}</span>
                              </div>
                            ))}
                          </div>
                          {drill.coachingCue && (
                            <div className="mt-1 bg-amber-950/10 border border-amber-500/10 p-2.5 rounded-lg text-xs text-amber-200 italic font-medium leading-relaxed">
                              💡 <strong className="text-amber-400 not-italic uppercase font-bold text-[9px]">Visualization Cue:</strong> "{drill.coachingCue}"
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                // SUCCESS DETAILS
                (() => {
                  const lastDrill = activeDrills[activeDrills.length - 1] || activeDrills[0];
                  const drillIdx = lastDrill ? activeDrills.indexOf(lastDrill) : 0;
                  const drillState = lastDrill ? (drillProgress[drillIdx] || 'pending') : 'pending';

                  return (
                    <div className="flex flex-col gap-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl flex flex-col gap-2">
                          <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                            Why This Succeeded (Perfect Wave Sequence)
                          </span>
                          <p className="text-xs text-zinc-300 leading-relaxed">
                            Fantastic! Your timing was completely in sync. In biomechanics, this is called the <strong className="text-white">Proximal-to-Distal Sequence</strong> (ground reaction forces propagating upwards sequentially to the terminal joint).
                          </p>
                          <p className="text-xs text-zinc-400 leading-relaxed">
                            This maximizes the <strong className="text-emerald-400">elastic energy storage</strong> inside muscular-tendon units, yielding maximum terminal release velocity with minimum physical exertion.
                          </p>
                        </div>

                        {lastDrill && (
                          <div className="bg-zinc-950 border border-emerald-500/20 p-3 rounded-xl flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                                Form Maintenance Drill
                              </span>
                              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                drillState === 'mastered' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                drillState === 'completed' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                'bg-zinc-900 text-zinc-500 border border-zinc-800'
                              }`}>
                                {drillState.toUpperCase()}
                              </span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-xs font-black text-white">{lastDrill.name}</span>
                              <span className="text-[10px] text-zinc-400 font-mono font-medium">{lastDrill.reps}</span>
                            </div>
                            <p className="text-xs text-zinc-300 leading-snug">
                              {lastDrill.description}
                            </p>

                            {onToggleDrillStatus && (
                              <button
                                onClick={() => onToggleDrillStatus(drillIdx)}
                                className={`mt-2 py-1.5 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all w-full border ${
                                  drillState === 'mastered' ? 'bg-emerald-600 border-emerald-500 hover:bg-emerald-500 text-white' :
                                  drillState === 'completed' ? 'bg-blue-600 border-blue-500 hover:bg-blue-500 text-white' :
                                  'bg-zinc-855 border-zinc-700 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-300'
                                }`}
                              >
                                {drillState === 'mastered' ? <Sparkles className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                <span>
                                  {drillState === 'pending' ? 'Mark Drill as Practiced' :
                                   drillState === 'completed' ? 'Mark Drill as Mastered' :
                                   'Reset Drill Status'}
                                </span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          )}

          {/* Manual Sequence Calibration Control Center */}
          <div className="bg-zinc-900 border border-amber-500/20 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black uppercase text-zinc-300">
                  Manual Sequence Calibration
                </span>
                {isOverrideActive && (
                  <span className="text-[9px] font-mono font-bold bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded border border-amber-500/20">
                    Calibration Active
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAutoAlign}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[9px] uppercase tracking-wider transition-all"
                  title="Auto-align all phases to 100% correct order to bypass computer noise"
                >
                  Auto-Align Correct
                </button>
                {isOverrideActive && (
                  <button
                    onClick={handleResetToAuto}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-[9px] uppercase tracking-wider transition-all"
                    title="Revert back to the sequence automatically detected from the video"
                  >
                    Reset to Auto
                  </button>
                )}
              </div>
            </div>

            <p className="text-[10px] text-zinc-400 leading-normal">
              Computer vision pose tracking can occasionally drop fast frames or lose track of rapid limb transitions. Toggle phases to custom align your athlete's sequence, or use <strong className="text-emerald-400">Auto-Align Correct</strong> to grant full sequence marks.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {idealPhases.map((phase) => {
                const isActive = customActualPhases.includes(phase);
                return (
                  <button
                    key={phase}
                    onClick={() => handleTogglePhaseInCustom(phase)}
                    className={`p-2 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                      isActive
                        ? 'bg-amber-950/30 border-amber-500/50 text-amber-300'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-[8px] font-mono font-black">
                      {isActive ? '✓ ACTIVE' : '○ EXCLUDE'}
                    </span>
                    <span className="text-[10px] font-black truncate uppercase leading-none">
                      {phase}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Athlete's Chronological Performance Tracker */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
              Athlete's Chronological Execution
            </span>
            {(!actualPhases || actualPhases.length === 0) ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center text-xs text-zinc-500 italic">
                Upload your video clip to visualize live sequence tracking.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex flex-wrap items-center gap-2">
                  {(kineticSequence?.steps || actualPhases.map(p => ({ name: p, timestamp: 0, status: 'good' }))).map((step, i) => {
                    const phase = typeof step === 'string' ? step : step.name;
                    const status = typeof step === 'string' ? 'good' : step.status;
                    const timestamp = typeof step === 'string' ? 0 : step.timestamp;
                    
                    const idealIndex = idealPhases.indexOf(phase);
                    const isOutOfOrder = idealIndex !== -1 && actualPhases.slice(0, i).some(prevPhase => {
                      const prevIdealIndex = idealPhases.indexOf(prevPhase);
                      return prevIdealIndex > idealIndex;
                    });

                    return (
                      <React.Fragment key={i}>
                        <button 
                          onClick={() => {
                            setSelectedTutorialPhase(phase);
                            if (timestamp > 0 && onSeekVideo) {
                              onSeekVideo(timestamp);
                            }
                          }}
                          className={`px-3 py-2 rounded-xl border flex flex-col text-left gap-0.5 transition-all hover:scale-[1.02] ${
                            isOutOfOrder
                              ? 'bg-amber-950/40 border-amber-500 text-amber-300 shadow shadow-amber-500/10'
                              : status === 'optimal' 
                                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-400'
                                : status === 'warning'
                                  ? 'bg-red-950/30 border-red-500/40 text-red-400'
                                  : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-[8px] font-mono font-bold uppercase text-zinc-400">
                              {isOutOfOrder ? '⚠️ OUT OF SEQUENCE' : timestamp > 0 ? `${timestamp.toFixed(2)}s` : `✓ Detected`}
                            </span>
                            {status === 'optimal' && <Sparkles className="w-2.5 h-2.5 text-emerald-400" />}
                          </div>
                          <span className="text-xs font-black uppercase tracking-wide">{phase}</span>
                        </button>
                        {i < (kineticSequence?.steps?.length || actualPhases.length) - 1 && <ArrowRight className="w-3.5 h-3.5 text-zinc-800" />}
                      </React.Fragment>
                    );
                  })}
                </div>

                {!comp.isCorrect && (
                  <div className="bg-red-950/20 border border-red-500/20 p-3.5 rounded-xl flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-black text-red-400 uppercase tracking-wider">
                        Power Leaks detected
                      </span>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        {comp.feedback} Rushing through steps bypasses core muscles and forces joints to carry the load, cutting performance in half.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Right 4 Columns: Kinetic Metrics & Play Tutorial */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          
          {/* Efficiency Index Ring */}
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-3">
            <span className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">
              Kinetic Chain Efficiency
            </span>
            
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  stroke="#18181b" 
                  strokeWidth="8" 
                  fill="transparent" 
                />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  stroke={efficiencyScore > 80 ? '#10b981' : efficiencyScore > 50 ? '#f59e0b' : '#ef4444'} 
                  strokeWidth="8" 
                  fill="transparent" 
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * efficiencyScore) / 100}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-black font-mono leading-none">
                  {efficiencyScore}%
                </span>
                <span className="text-[8px] text-zinc-400 uppercase mt-0.5 tracking-tighter">
                  Efficiency
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1 w-full text-left">
              <div className="flex items-center justify-between text-[10px] font-bold border-b border-zinc-950 pb-1.5">
                <span className="text-zinc-500">Ideal Phases:</span>
                <span className="text-white">{idealPhases.length}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-bold border-b border-zinc-950 pb-1.5">
                <span className="text-zinc-500">Athlete Detected:</span>
                <span className="text-white">{actualPhases.length}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className="text-zinc-500">Power Deficit:</span>
                <span className={efficiencyScore < 90 ? "text-amber-400" : "text-emerald-400"}>
                  {100 - efficiencyScore}%
                </span>
              </div>
            </div>
          </div>

          {/* Firing Order Telemetry */}
          {kineticSequence && kineticSequence.firingOrder && (
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                  Firing Order Telemetry
                </span>
                <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded border ${
                  kineticSequence.isCorrectOrder 
                    ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5' 
                    : 'text-red-400 border-red-500/30 bg-red-500/5'
                }`}>
                  {kineticSequence.isCorrectOrder ? 'OPTIMAL ORDER' : 'OUT OF SYNC'}
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {kineticSequence.firingOrder.map((v, i) => (
                  <div key={v.joint} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black text-white uppercase">{v.joint} Peak</span>
                      <span className="text-[9px] font-mono text-zinc-500">{v.peakTime.toFixed(2)}s</span>
                    </div>
                    <div className="relative h-2 bg-zinc-950 rounded-full border border-zinc-800 overflow-hidden">
                      <div 
                        className={`absolute h-full rounded-full transition-all duration-1000 ${
                          i === 0 ? 'bg-emerald-500' : 
                          (i === 1 && v.peakTime < kineticSequence.firingOrder[0].peakTime) || (i === 2 && v.peakTime < kineticSequence.firingOrder[1].peakTime)
                          ? 'bg-red-500 animate-pulse'
                          : i === 1 ? 'bg-amber-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(100, (v.peakVelocity / 500) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 mt-1">
                <p className="text-[9px] text-zinc-400 leading-relaxed italic">
                  {kineticSequence.isCorrectOrder 
                    ? "Ideal Proximal-to-Distal sequence detected. Power is transferring correctly from base to hands."
                    : "Proximal-to-Distal sequence broken. Upper body is out-pacing the hips, causing significant power leakage."}
                </p>
              </div>
            </div>
          )}

          {/* Interactive "Fix My Sequence" Puzzle Game */}
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-amber-400 flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5" />
                <span>Sequence Game Trainer</span>
              </span>
              <button 
                onClick={resetPuzzle}
                className="text-[9px] text-zinc-400 font-mono hover:text-white transition-all underline"
              >
                Reset Puzzle
              </button>
            </div>
            
            <p className="text-[10px] text-zinc-400 leading-normal">
              Align the movement phases in the correct chronological sequence to maximize kinetic energy flow. Click neighboring steps to swap!
            </p>

            <div className="flex flex-col gap-1.5">
              {puzzlePhases.map((phase, i) => {
                const isIdealMatch = phase === idealPhases[i];
                return (
                  <div
                    key={phase}
                    onClick={() => {
                      if (i < puzzlePhases.length - 1) {
                        swapPuzzleItems(i, i + 1);
                      } else {
                        swapPuzzleItems(i, i - 1);
                      }
                    }}
                    className={`p-2 rounded-lg border text-left text-[10px] font-bold uppercase transition-all flex items-center justify-between cursor-pointer ${
                      isIdealMatch 
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400' 
                        : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <span>{i + 1}. {phase}</span>
                    <span className="text-[9px] font-mono text-zinc-500">
                      {isIdealMatch ? '✓ Aligned' : 'Click to Swap'}
                    </span>
                  </div>
                );
              })}
            </div>

            {puzzleFeedback && (
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-bold text-amber-300 bg-amber-950/20 border border-amber-900/30 p-2 rounded-lg leading-normal animate-fadeIn text-center">
                  {puzzleFeedback}
                </p>
                {puzzleSolved && (
                  <button
                    onClick={handleApplyPuzzleToReport}
                    className="px-3 py-1.5 w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-[10px] uppercase tracking-wider shadow-md flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    <span>Apply Solved Order to Report</span>
                  </button>
                )}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Interactive Sequence Tutor Sub-Section */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Biomechanical Sequence Tutor (Explore anatomical joint loading)
          </span>
          <span className="text-[9px] text-zinc-500 font-mono">
            {selectedTutorialPhase ? 'Interactive Phase Locked' : 'Click ideal steps or actual steps to explore'}
          </span>
        </div>

        {activeTutorial ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-black text-white uppercase border-b border-zinc-800 pb-1">
                {activeTutorial.title}
              </span>
              <p className="text-xs text-zinc-300 leading-relaxed">
                <strong className="text-amber-300">Biomechanical Purpose:</strong> {activeTutorial.purpose}
              </p>
              <div className="bg-zinc-950/80 p-2.5 rounded-lg border border-zinc-800 text-[11px] text-amber-200 mt-1">
                <strong>Coaching Cue:</strong> "{activeTutorial.coachingCue}"
              </div>
            </div>

            <div className="flex flex-col gap-2 bg-red-950/10 border border-red-500/20 p-3 rounded-xl">
              <div className="flex items-center gap-1.5 text-red-400 font-bold text-xs uppercase">
                <TrendingDown className="w-4 h-4" />
                <span>Impact of Skipping or Out-of-Order Execution</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                <strong className="text-red-400">Force Leaking:</strong> {activeTutorial.skippingCost}
              </p>
              <p className="text-xs text-zinc-300 leading-relaxed mt-1">
                <strong className="text-orange-400">Anatomical Stress / Injury Risk:</strong> {activeTutorial.injuryRisk}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-4 text-center gap-1">
            <p className="text-xs text-zinc-400">
              In athletic movements, energy behaves like a kinetic whip. It must flow in order from the ground up.
            </p>
            <p className="text-[10px] text-zinc-500 italic">
              Click on any phase above to read the muscle mechanics, physiological injury risks, and coaching cues.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};
