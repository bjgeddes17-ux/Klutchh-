import React, { useState, useEffect, useRef } from 'react';
import { SportRule, FrameAnalysis, AICoachingReport } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Gamepad2, 
  Sparkles, 
  Trophy, 
  Zap, 
  ShieldAlert, 
  ShieldCheck, 
  RotateCcw, 
  CheckCircle2, 
  ArrowUp, 
  ArrowDown, 
  Flame, 
  Activity, 
  HelpCircle,
  Award,
  ChevronRight,
  Info,
  Sliders,
  Target,
  BookOpen,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Play,
  Volume2,
  VolumeX,
  Footprints,
  Timer,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';

import monsterWalkImg from '../assets/images/monster_walk_drill_1786821620557.jpg';
import spineHingeImg from '../assets/images/spine_hinge_drill_1786821633655.jpg';
import trophyPoseImg from '../assets/images/trophy_pose_drill_1786821647464.jpg';
import chestOverBallImg from '../assets/images/chest_over_ball_drill_1786821658255.jpg';

interface Props {
  sportRule: SportRule;
  keyframeList: FrameAnalysis[];
  aiReport?: AICoachingReport | null;
  dynamicMetrics?: {
    peakAngularVelocity?: number;
    estimatedPeakTorque?: number;
    explosivenessScore?: number;
  } | null;
  sequenceComparison?: {
    ideal: string[];
    actual: string[];
    isCorrect: boolean;
    feedback: string;
  } | null;
  onApplyDrill?: (drillName: string) => void;
  viewMode?: 'student' | 'coach';
}

export const BiomechanicalGameArena: React.FC<Props> = ({
  sportRule,
  keyframeList,
  aiReport,
  dynamicMetrics,
  sequenceComparison,
  onApplyDrill,
  viewMode = 'coach'
}) => {
  const [gameMode, setGameMode] = useState<'strike_sim' | 'active_reps' | 'kinetic_wave' | 'flaw_detective' | 'match_scenarios'>('strike_sim');
  const [xp, setXp] = useState(450);
  const [level, setLevel] = useState(2);
  const [achievements, setAchievements] = useState<string[]>(['Kinetic Foundation Started']);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Synthesized sound effects engine
  const playSound = (type: 'beep' | 'success' | 'strike' | 'power' | 'tick') => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume();

      if (type === 'tick') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.start();
        osc.stop(ctx.currentTime + 0.06);
      } else if (type === 'beep') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.16);
      } else if (type === 'strike') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.26);
      } else if (type === 'power') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.36);
      } else if (type === 'success') {
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
          gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.2);
          osc.start(ctx.currentTime + idx * 0.08);
          osc.stop(ctx.currentTime + idx * 0.08 + 0.22);
        });
      }
    } catch (e) {}
  };

  const sportId = sportRule.id || 'rugby';

  // --- MODE 1: INTERACTIVE BIO-SKELETON & ANGLE SANDBOX ---
  const defaultJoints = {
    rugby: [
      { id: 'spine', name: 'Spine Hip Hinge Angle', min: 90, max: 180, idealMin: 120, idealMax: 145, current: 165, unit: '°', cue: 'Hinge back with flat spine', mechanicalPrinciple: 'Hinge engages glutes & hamstrings, protecting lumbar discs against 600kg tackle shock.' },
      { id: 'knee', name: 'Tackle Entry Knee Flexion', min: 70, max: 170, idealMin: 110, idealMax: 135, current: 155, unit: '°', cue: 'Sink hips low into contact', mechanicalPrinciple: 'Lower center of mass maximizes horizontal drive momentum (p = m × v).' },
      { id: 'neck', name: 'Cervical Spine Chin Posture', min: 110, max: 180, idealMin: 150, idealMax: 175, current: 130, unit: '°', cue: 'Keep eyes and chin up', mechanicalPrinciple: 'Keeping chin neutral prevents hyper-flexion spinal loading upon collision.' }
    ],
    soccer: [
      { id: 'chest', name: 'Chest Lean Over Ball', min: 60, max: 140, idealMin: 80, idealMax: 100, current: 120, unit: '°', cue: 'Nose & chest over the ball', mechanicalPrinciple: 'Positions strike trajectory downward, driving explosive ball compression without ballooning.' },
      { id: 'plant_knee', name: 'Plant Knee Deceleration Cushion', min: 80, max: 170, idealMin: 115, idealMax: 135, current: 160, unit: '°', cue: 'Soft plant knee absorbs impact', mechanicalPrinciple: 'Quad/hamstring co-contraction absorbs 3.5× body weight ground reaction forces safely.' },
      { id: 'ankle', name: 'Kicking Ankle Plantar Lock', min: 90, max: 175, idealMin: 155, idealMax: 175, current: 125, unit: '°', cue: 'Lock laces firm and down', mechanicalPrinciple: 'Rigid foot lever transfers 95% of leg rotational kinetic energy directly into ball velocity.' }
    ],
    basketball: [
      { id: 'elbow_pocket', name: 'Shooting Elbow Set Point', min: 50, max: 140, idealMin: 85, idealMax: 110, current: 65, unit: '°', cue: 'Elbow tucked under ball at eye level', mechanicalPrinciple: 'Aligns release lever directly through the target vector for pure vertical arc elevation.' },
      { id: 'knee_dip', name: 'Knee Dip Base Loading', min: 80, max: 160, idealMin: 110, idealMax: 130, current: 150, unit: '°', cue: 'Synchronize dip with ball rise', mechanicalPrinciple: 'Elastic stretch-shortening cycle in patellar tendon creates effortless upward propulsion.' },
      { id: 'wrist_snap', name: 'Follow-Through Gooseneck Snap', min: 50, max: 140, idealMin: 70, idealMax: 90, current: 120, unit: '°', cue: 'Fingers roll into cookie jar', mechanicalPrinciple: 'Terminal finger snap imparts optimal 2-3 rps backspin for a forgiving soft bounce on rim.' }
    ],
    tennis: [
      { id: 'trophy_elbow', name: '90° Trophy Elbow Height', min: 50, max: 140, idealMin: 85, idealMax: 110, current: 60, unit: '°', cue: 'Keep hitting elbow at shoulder level', mechanicalPrinciple: 'Preserves internal shoulder rotation clearance, maximizing racquet drop acceleration.' },
      { id: 'knee_loading', name: 'Deep Knee Loading Drive', min: 80, max: 160, idealMin: 110, idealMax: 135, current: 155, unit: '°', cue: 'Drive upward off both balls of feet', mechanicalPrinciple: 'Ground force converts to vertical kinetic energy to meet serve at apex height.' },
      { id: 'shoulder_coil', name: 'Unit Turn Shoulder Coil', min: 45, max: 130, idealMin: 85, idealMax: 115, current: 60, unit: '°', cue: 'Shoulders fully turned to baseline', mechanicalPrinciple: 'Torso-pelvis angular separation (X-Factor) multiplies elastic rotational torque.' }
    ],
    golf: [
      { id: 'spine_angle', name: 'Spine Tilt Forward Hinge', min: 90, max: 160, idealMin: 125, idealMax: 140, current: 155, unit: '°', cue: 'Maintain spine tilt through impact', mechanicalPrinciple: 'Constant spine axis ensures centered face strike and consistent low-point control.' },
      { id: 'lead_arm', name: 'Lead Arm Straightness', min: 120, max: 180, idealMin: 165, idealMax: 180, current: 140, unit: '°', cue: 'Wide backswing arc width', mechanicalPrinciple: 'Maximizes the swing radius (r), multiplying clubhead speed via v = ω × r.' },
      { id: 'hip_rotation', name: 'Pelvic Downswing Clearance', min: 20, max: 80, idealMin: 40, idealMax: 60, current: 25, unit: '°', cue: 'Clear lead hip early', mechanicalPrinciple: 'Allows hands and club to drop into slot from the inside with maximum whip.' }
    ],
    cricket: [
      { id: 'front_knee', name: 'Braced Front Knee Delivery Plant', min: 110, max: 180, idealMin: 165, idealMax: 178, current: 135, unit: '°', cue: 'Lock front knee like an iron post', mechanicalPrinciple: 'Bracing converts run-up linear momentum instantly into rotational bowling arm velocity.' },
      { id: 'bowl_arm', name: 'Delivery Arm Straightness', min: 130, max: 180, idealMin: 165, idealMax: 180, current: 145, unit: '°', cue: '15° legal arm extension', mechanicalPrinciple: 'Preserves legal delivery biomechanics while extending release lever arc height.' },
      { id: 'trunk_flex', name: 'Trunk Forward Hinge at Release', min: 100, max: 170, idealMin: 120, idealMax: 145, current: 160, unit: '°', cue: 'Vault chest over front leg', mechanicalPrinciple: 'Trunk flexion vaults over locked knee, pulling delivery point down for steep bounce.' }
    ],
    netball: [
      { id: 'knee_flex', name: 'Soft Bilateral Landing Cushion', min: 80, max: 170, idealMin: 110, idealMax: 130, current: 155, unit: '°', cue: 'Sink knees softly to absorb force', mechanicalPrinciple: 'Flexion extends deceleration time (Δt), reducing peak impact force by up to 65% (F = mΔv/Δt).' },
      { id: 'shooting_elbow', name: 'High Shooting Release Pocket', min: 60, max: 150, idealMin: 85, idealMax: 110, current: 70, unit: '°', cue: 'Elbow above eyebrow level', mechanicalPrinciple: 'High release creates optimal 50-55° entry angle into hoop for maximum rim aperture.' },
      { id: 'spine_erect', name: 'Vertical Landing Trunk Alignment', min: 120, max: 180, idealMin: 160, idealMax: 180, current: 140, unit: '°', cue: 'Keep torso tall and balanced', mechanicalPrinciple: 'Eliminates lateral trunk sway, protecting hip labrum and ACL from shear.' }
    ],
    hockey: [
      { id: 'crouch_knee', name: 'Deep Turf Crouch Knee Angle', min: 80, max: 160, idealMin: 110, idealMax: 135, current: 150, unit: '°', cue: 'Lower hips close to turf', mechanicalPrinciple: 'Positions stick flat to ground with wide vision arc across field.' },
      { id: 'torso_hinge', name: 'Sweep Torso Angle', min: 90, max: 160, idealMin: 115, idealMax: 140, current: 100, unit: '°', cue: 'Flat back, eyes on target', mechanicalPrinciple: 'Engages core rectus and obliques to propel ball with explosive snap.' },
      { id: 'lead_wrist', name: 'Lead Wrist Square Angle', min: 120, max: 180, idealMin: 160, idealMax: 180, current: 135, unit: '°', cue: 'Firm flat stick face', mechanicalPrinciple: 'Maintains flat face through contact zone for pinpoint pass precision.' }
    ]
  };

  const initialJoints = defaultJoints[sportId as keyof typeof defaultJoints] || defaultJoints.rugby;
  const [joints, setJoints] = useState(initialJoints);
  const [isStriking, setIsStriking] = useState(false);
  const [strikeFeedback, setStrikeFeedback] = useState<string | null>(null);

  useEffect(() => {
    const list = defaultJoints[sportId as keyof typeof defaultJoints] || defaultJoints.rugby;
    setJoints(list);
    setStrikeFeedback(null);
  }, [sportId]);

  const handleSliderChange = (id: string, val: number) => {
    setJoints(prev => prev.map(j => j.id === id ? { ...j, current: val } : j));
    setStrikeFeedback(null);
  };

  // Live physics engine metrics
  const inRangeCount = joints.filter(j => j.current >= j.idealMin && j.current <= j.idealMax).length;
  const matchPercentage = Math.round((inRangeCount / joints.length) * 100);
  const powerWatts = Math.round(450 + (matchPercentage * 4.8));
  const jointSafetyPercent = Math.round(60 + (matchPercentage * 0.38));
  const exitVelocityMph = Math.round(42 + (matchPercentage * 0.46));
  const kineticEfficiency = Math.round(55 + (matchPercentage * 0.45));

  const handleExecuteStrike = () => {
    setIsStriking(true);
    playSound('power');
    
    setTimeout(() => {
      playSound('strike');
      if (matchPercentage === 100) {
        playSound('success');
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        setStrikeFeedback('🔥 PERFECT GOLDEN STRIKE! 100% Kinetic Energy Transfer. Zero energy leak, maximum injury protection!');
        setXp(prev => prev + 150);
      } else if (matchPercentage >= 66) {
        setStrikeFeedback(`⚡ SOLID STRIKE (${powerWatts}W)! Good alignment, but fine-tune remaining joint angles to unlock maximum velocity.`);
        setXp(prev => prev + 75);
      } else {
        setStrikeFeedback(`⚠️ ENERGY LEAK DETECTED (${powerWatts}W). Poor angle alignment created mechanical resistance and excessive joint shear.`);
      }
      setIsStriking(false);
    }, 450);
  };

  // --- MODE 2: ACTIVE 3-REP COACHING CHALLENGE (STAND UP & MOVE!) ---
  const activePhysicalDrills: Record<string, { title: string; cue: string; why: string; targetPose: string }> = {
    rugby: {
      title: 'Low Tackle Spine Lock & Knee Dip',
      cue: 'Stand up, drop hips 4 inches, hinge flat back, keep chin neutral & chest upright.',
      why: 'Engages glute recoil while locking cervical spine safely before contact.',
      targetPose: 'Flat spine hinge + 125° knee flexion'
    },
    soccer: {
      title: 'Chest-Over-Ball Plant & Ankle Lock',
      cue: 'Plant non-kicking foot 6 inches beside target, lean chest forward, point kicking toe down firmly.',
      why: 'Directs strike momentum straight down through ball equator to prevent loft.',
      targetPose: '85° chest lean + firm plantarflexion'
    },
    basketball: {
      title: 'Pocket Set-Point & Gooseneck Follow-Through',
      cue: 'Tuck elbow tight under eye level, dip knees smoothly, and finish with fingers curled down.',
      why: 'Produces pure straight-line launch arc and 3-rps soft backspin.',
      targetPose: '90° elbow pocket + relaxed wrist snap'
    },
    tennis: {
      title: '90° Trophy Elbow & Coil Extension',
      cue: 'Coil shoulders sideways to target, lift hitting elbow to shoulder level, drive up off toes.',
      why: 'Maximizes racquet drop space and internal rotational velocity.',
      targetPose: '90° trophy angle + full upward extension'
    },
    golf: {
      title: 'Spine Tilt Lock & Pelvic Clear',
      cue: 'Maintain spine forward angle through imaginary impact; rotate lead hip out of the way.',
      why: 'Stabilizes swing radius for pure centered contact.',
      targetPose: '35° spine tilt + open lead hip'
    },
    cricket: {
      title: 'Braced Front Knee Post',
      cue: 'Step forward firmly, lock front knee straight like a steel pillar, vault torso over top.',
      why: 'Instantly converts horizontal run-up into vertical arm whip.',
      targetPose: '175° braced lead knee'
    },
    netball: {
      title: 'Soft Landing Cushion & High Release',
      cue: 'Jump gently, land sinking both knees softly like springs, hold shooting arm tall.',
      why: 'Dissipates 65% of ground impact force to protect knee ligaments.',
      targetPose: '120° bilateral knee bend'
    },
    hockey: {
      title: 'Low Turf Crouch & Flat Back Sweep',
      cue: 'Drop into deep squat, keep back flat, slide hands through horizontal strike zone.',
      why: 'Maximizes low center of gravity and stick contact area.',
      targetPose: 'Deep knee bend + rigid spine'
    }
  };

  const currentActiveDrill = activePhysicalDrills[sportId] || activePhysicalDrills.rugby;
  const [repCount, setRepCount] = useState(0);
  const [repState, setRepState] = useState<'idle' | 'countdown' | 'holding' | 'completed'>('idle');
  const [timerSeconds, setTimerSeconds] = useState(3);

  const startActiveRep = () => {
    if (repCount >= 3) return;
    setRepState('countdown');
    setTimerSeconds(3);
    playSound('tick');

    const countdownTimer = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 1) {
          clearInterval(countdownTimer);
          setRepState('holding');
          playSound('beep');
          
          setTimeout(() => {
            setRepCount(rc => {
              const next = rc + 1;
              if (next >= 3) {
                setRepState('completed');
                playSound('success');
                confetti({ particleCount: 90, spread: 80, origin: { y: 0.5 } });
                setXp(x => x + 300);
                if (!achievements.includes('Active Form Champion')) {
                  setAchievements(a => [...a, 'Active Form Champion']);
                }
              } else {
                setRepState('idle');
                playSound('power');
              }
              return next;
            });
          }, 2500);
          return 0;
        }
        playSound('tick');
        return prev - 1;
      });
    }, 1000);
  };

  // --- MODE 3: KINETIC WHIP TIMING & FORCE WAVE ---
  const baseKineticSteps = [
    { id: 'ground', name: '1. Ground Reaction & Plant', idealIndex: 0, icon: '⚡', timingMs: 0, desc: 'Ground strike generates vertical ground reaction force (GRF = 2.5-3.5× BW)' },
    { id: 'hips', name: '2. Pelvic Hip Rotation Drive', idealIndex: 1, icon: '🔄', timingMs: 65, desc: 'Hips rotate 400-600°/s, transferring linear momentum into angular momentum' },
    { id: 'torso', name: '3. Thoracic Core & Shoulder Coil', idealIndex: 2, icon: '🌀', timingMs: 140, desc: 'Torso stretch-shortening recoil multiplies torque through the kinetic chain' },
    { id: 'arms', name: '4. Upper Arm & Release Whip', idealIndex: 3, icon: '💥', timingMs: 210, desc: 'Extremities snap at peak terminal velocity for maximum exit speed' }
  ];

  const [puzzleSteps, setPuzzleSteps] = useState(() => {
    const shuffled = [...baseKineticSteps];
    const temp = shuffled[0];
    shuffled[0] = shuffled[1];
    shuffled[1] = temp;
    return shuffled;
  });
  const [puzzleSolved, setPuzzleSolved] = useState(false);
  const [waveActive, setWaveActive] = useState(false);

  const moveStep = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= puzzleSteps.length) return;
    const updated = [...puzzleSteps];
    const item = updated.splice(fromIdx, 1)[0];
    updated.splice(toIdx, 0, item);
    setPuzzleSteps(updated);
    playSound('tick');

    const isCorrect = updated.every((s, i) => s.idealIndex === i);
    if (isCorrect && !puzzleSolved) {
      setPuzzleSolved(true);
      setXp(prev => prev + 300);
      playSound('success');
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.5 } });
      if (!achievements.includes('Kinetic Whip Sequencer')) {
        setAchievements(prev => [...prev, 'Kinetic Whip Sequencer']);
      }
    }
  };

  const isPuzzleCorrect = puzzleSteps.every((s, i) => s.idealIndex === i);

  const handleTestKineticWave = () => {
    setWaveActive(true);
    playSound('power');
    setTimeout(() => {
      if (isPuzzleCorrect) {
        playSound('success');
        confetti({ particleCount: 60, spread: 60 });
      } else {
        playSound('strike');
      }
      setWaveActive(false);
    }, 1200);
  };

  // --- MODE 4: FLAW DETECTIVE & FIXER ---
  const flawItems = [
    {
      id: 'valgus',
      name: 'Dynamic Knee Valgus (Inward Knee Cave)',
      affectedJoint: 'Knee Joint',
      risk: 'High ACL Shear & Patellofemoral Friction',
      whyBreaks: 'Weak gluteus medius abductors allow femur to internally rotate under load.',
      correctCue: 'Push knees outward over pinky toes during plant & landing (Activate Glute Medius).',
      drillName: 'Banded Lateral Monster Walks'
    },
    {
      id: 'spine_round',
      name: 'Thoracolumbar Hyper-Flexion (Rounded Back)',
      affectedJoint: 'Lumbar Spine',
      risk: 'Vertebral Disc Herniation & Loss of Core Power Transfer',
      whyBreaks: 'Bending from lower back rather than hinging through the posterior hip chain.',
      correctCue: 'Hinge back at the hips with chest proud and spine flat like a tabletop.',
      drillName: 'PVC Pipe 3-Point Spine Hinge'
    },
    {
      id: 'arm_drop',
      name: 'Early Lever Drop / Sagging Elbow',
      affectedJoint: 'Shoulder & Elbow',
      risk: 'Rotator Cuff Impingement & 30% Exit Speed Loss',
      whyBreaks: 'Releasing arm early before trunk rotation finishes.',
      correctCue: 'Hold high set-point at eye level; let hips pull the arm into release.',
      drillName: '90-Degree Wall Set-Point Holds'
    }
  ];

  // Dynamically merge athlete's real video analysis flaws if available
  const dynamicFlawItems = React.useMemo(() => {
    const list = [...flawItems];
    if (aiReport?.criticalFlaws && aiReport.criticalFlaws.length > 0) {
      aiReport.criticalFlaws.forEach((flaw, idx) => {
        list.unshift({
          id: `ai_flaw_${idx}`,
          name: flaw.name || flaw.joint || 'Video Detected Biomechanical Fault',
          affectedJoint: flaw.joint || 'Kinetic Joint',
          risk: flaw.severity === 'critical' ? 'High Injury Strain & Power Disconnect' : 'Moderate Energy Leak',
          whyBreaks: flaw.description || 'Movement diverged from the gold standard joint trajectory.',
          correctCue: flaw.quickCue || flaw.correction || 'Align posture with gold standard target arc.',
          drillName: flaw.suggestedDrill || 'Dynamic Alignment Reps'
        });
      });
    }
    return list;
  }, [aiReport, flawItems]);

  const [activeFlawIndex, setActiveFlawIndex] = useState(0);
  const [flawFixed, setFlawFixed] = useState(false);
  const currentFlaw = dynamicFlawItems[activeFlawIndex] || dynamicFlawItems[0];

  const handleFixFlaw = () => {
    setFlawFixed(true);
    playSound('success');
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    setXp(x => x + 200);
    if (!achievements.includes('Flaw Detective Master')) {
      setAchievements(a => [...a, 'Flaw Detective Master']);
    }
  };

  // --- MODE 5: MATCH SCENARIOS ---
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [selectedScenarioChoice, setSelectedScenarioChoice] = useState<number | null>(null);
  const [scenarioFeedback, setScenarioFeedback] = useState<string | null>(null);

  const sportScenarios = [
    {
      title: 'Late 4th Quarter Fatigue: Knee Collapse & Power Loss',
      situation: 'In minute 78, your legs are heavy. You need to deliver a high-velocity strike/pass under heavy pressure, but your plant knee is caving inward.',
      question: 'What is the biomechanically optimal adjustment to restore 100% power and protect your joints?',
      options: [
        {
          text: 'Push harder using only your shoulder and arms to compensate for tired legs.',
          isCorrect: false,
          explanation: '❌ Arm compensation places extreme shear on rotator cuff and reduces velocity by 30% due to kinetic disconnect.'
        },
        {
          text: 'Widen plant foot stance slightly, cue external hip abduction (knees over toes), and hinge hips 15° deeper.',
          isCorrect: true,
          explanation: '✅ Perfect! External hip torque activates gluteus medius and creates a solid base of support for maximal ground reaction forces.'
        },
        {
          text: 'Jump high into the air during contact to avoid leg fatigue.',
          isCorrect: false,
          explanation: '❌ Airborne strikes lose all ground reaction anchoring, resulting in weak contact.'
        }
      ]
    },
    {
      title: 'High Crosswind Trajectory Control',
      situation: 'A 25 mph gusting crosswind is pushing your ball offline. You need pinpoint trajectory with penetrating forward drive.',
      question: 'How do you adjust your trunk and contact point to maintain a piercing trajectory?',
      options: [
        {
          text: 'Increase forward chest hinge by 10-15° and keep release point under your sternum.',
          isCorrect: true,
          explanation: '✅ Excellent! Keeping sternum forward over ball drives a flatter launch angle with heavy forward compression.'
        },
        {
          text: 'Lean backwards 20° to launch the ball as high as possible above the wind.',
          isCorrect: false,
          explanation: '❌ High launch angles expose the ball to maximum wind resistance, killing distance and accuracy.'
        }
      ]
    }
  ];

  const currentScenario = sportScenarios[scenarioIndex] || sportScenarios[0];

  const handleScenarioChoice = (choiceIdx: number) => {
    setSelectedScenarioChoice(choiceIdx);
    const chosen = currentScenario.options[choiceIdx];
    setScenarioFeedback(chosen.explanation);
    if (chosen.isCorrect) {
      playSound('success');
      setXp(prev => prev + 150);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      if (!achievements.includes('Master Tactician')) {
        setAchievements(prev => [...prev, 'Master Tactician']);
      }
    } else {
      playSound('strike');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-950 border border-zinc-800 rounded-3xl p-4 sm:p-7 flex flex-col gap-6 shadow-2xl relative overflow-hidden text-zinc-100"
    >
      {/* Background Glow */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* HEADER WITH GAMIFICATION STATUS & SOUND TOGGLE */}
      <div className="border-b border-zinc-800/80 pb-4 sm:pb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="bg-gradient-to-br from-amber-500 to-red-600 p-3 rounded-2xl border border-white/10 shadow-lg text-zinc-950">
            <Flame className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black uppercase italic tracking-tight text-white flex items-center gap-2">
              <span>Active Biomechanics Arena</span>
              <span className="bg-amber-500/20 text-amber-400 text-[10px] px-2.5 py-0.5 rounded-full border border-amber-500/30 not-italic font-mono">
                {sportRule.name} Challenge
              </span>
            </h2>
            <p className="text-xs text-zinc-400 font-medium">
              Interactive physics & physical movement trials that teach real power and injury-free mechanics.
            </p>
          </div>
        </div>

        {/* XP, LEVEL & AUDIO CONTROL */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl border border-zinc-800 transition-all cursor-pointer"
            title={soundEnabled ? 'Mute Sound Effects' : 'Enable Sound Effects'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-zinc-600" />}
          </button>

          <div className="flex items-center gap-3 bg-zinc-900/90 border border-zinc-800 px-3.5 py-2 rounded-2xl shadow-inner">
            <div className="flex flex-col">
              <span className="text-[8px] uppercase font-black text-zinc-500 tracking-widest">Mastery</span>
              <span className="text-xs font-black text-amber-400 flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5" /> Lvl {Math.floor(xp / 500) + 1}
              </span>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[9px] font-mono text-zinc-400">{xp} XP</span>
              <div className="w-16 bg-zinc-950 h-1.5 rounded-full overflow-hidden border border-zinc-800">
                <div 
                  className="bg-gradient-to-r from-red-600 to-amber-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, (xp % 500) / 5)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GAME MODE NAVIGATION TABS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-zinc-900/70 p-1.5 rounded-2xl border border-zinc-800">
        {[
          { id: 'strike_sim', label: '🔥 Strike Sim', desc: 'Tune & Fire' },
          { id: 'active_reps', label: '🏃 Stand & Move', desc: '3-Rep Drill' },
          { id: 'kinetic_wave', label: '⚡ Force Wave', desc: 'Kinetic Chain' },
          { id: 'flaw_detective', label: '🕵️ Spot The Flaw', desc: 'Fault Fixer' },
          { id: 'match_scenarios', label: '🎮 Match Lab', desc: 'Game Decisions' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setGameMode(tab.id as any);
              playSound('tick');
            }}
            className={`p-2 sm:p-2.5 rounded-xl text-left flex flex-col transition-all cursor-pointer ${
              gameMode === tab.id
                ? 'bg-amber-500 text-zinc-950 font-black shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <span className="text-xs font-black uppercase tracking-tight">{tab.label}</span>
            <span className={`text-[9px] font-medium ${gameMode === tab.id ? 'text-zinc-950/80 font-bold' : 'text-zinc-500'}`}>
              {tab.desc}
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ========================================================= */}
        {/* MODE 1: ACTIVE STRIKE SIMULATOR & LIVE KINETIC FIRE */}
        {/* ========================================================= */}
        {gameMode === 'strike_sim' && (
          <motion.div 
            key="strike_sim"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-5"
          >
            {/* TUNING SLIDERS */}
            <div className="lg:col-span-7 flex flex-col gap-3.5">
              <div className="bg-zinc-900/80 border border-zinc-800 p-4 sm:p-5 rounded-2xl flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                  <span className="text-xs font-black uppercase text-amber-400 flex items-center gap-2">
                    <Sliders className="w-4 h-4" /> Joint Angle Calibration
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">
                    Match gold targets to unlock max exit velocity
                  </span>
                </div>

                <div className="space-y-3">
                  {joints.map((joint) => {
                    const inRange = joint.current >= joint.idealMin && joint.current <= joint.idealMax;

                    return (
                      <div key={joint.id} className="flex flex-col gap-2 bg-zinc-950/80 border border-zinc-800/80 p-3.5 rounded-xl hover:border-zinc-700 transition-colors">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${inRange ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`} />
                            <span className="text-xs font-bold text-white uppercase tracking-tight">{joint.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono text-zinc-500">Gold Target: {joint.idealMin}°-{joint.idealMax}°</span>
                            <span className={`font-black text-xs px-2 py-0.5 rounded border font-mono ${inRange ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30'}`}>
                              {joint.current}{joint.unit}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 px-1">
                          <span className="text-[9px] font-mono text-zinc-500">{joint.min}°</span>
                          <div className="relative flex-1 h-5 flex items-center">
                            <div 
                              className="absolute h-1 bg-emerald-500/30 rounded-full"
                              style={{ 
                                left: `${((joint.idealMin - joint.min) / (joint.max - joint.min)) * 100}%`,
                                width: `${((joint.idealMax - joint.idealMin) / (joint.max - joint.min)) * 100}%`
                              }}
                            />
                            <input 
                              type="range"
                              min={joint.min}
                              max={joint.max}
                              value={joint.current}
                              onChange={(e) => handleSliderChange(joint.id, Number(e.target.value))}
                              className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-amber-400 relative z-10"
                            />
                          </div>
                          <span className="text-[9px] font-mono text-zinc-500">{joint.max}°</span>
                        </div>

                        {/* Mechanical Principle Explanation */}
                        <div className="text-[10px] text-zinc-400 bg-zinc-900/90 p-2 rounded border border-zinc-800 flex flex-col gap-0.5">
                          <span className="text-amber-400 font-bold uppercase text-[8.5px] flex items-center gap-1">
                            <BookOpen className="w-3 h-3" /> Why It Matters:
                          </span>
                          <p className="leading-snug">{joint.mechanicalPrinciple}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      setJoints(prev => prev.map(j => ({ ...j, current: Math.round((j.idealMin + j.idealMax) / 2) })));
                      playSound('power');
                    }}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-black uppercase tracking-wider py-2.5 rounded-xl border border-zinc-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" /> Snap to Gold Standard
                  </button>
                  <button
                    onClick={() => {
                      setJoints(initialJoints);
                      playSound('tick');
                    }}
                    className="p-2.5 bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl border border-zinc-800 transition-all cursor-pointer"
                    title="Reset dials"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* LIVE SKELETON MANNEQUIN & ACTIVE EXECUTE BUTTON */}
            <div className="lg:col-span-5 flex flex-col gap-3.5">
              <div className="bg-zinc-900/80 border border-zinc-800 p-4 sm:p-5 rounded-2xl flex flex-col justify-between gap-4 h-full shadow-lg">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <span className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
                    <Activity className="w-4 h-4" /> Real-Time Physics Projection
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400 uppercase">
                    {matchPercentage}% Form Sync
                  </span>
                </div>

                {/* Animated Kinematic Mannequin */}
                <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-4 flex flex-col items-center justify-center relative min-h-[170px] overflow-hidden">
                  {isStriking && (
                    <div className="absolute inset-0 bg-amber-500/10 animate-ping pointer-events-none rounded-xl" />
                  )}
                  
                  <svg className="w-52 h-40" viewBox="0 0 200 160">
                    <line x1="20" y1="145" x2="180" y2="145" stroke="#3f3f46" strokeWidth="2" strokeDasharray="4 4" />
                    <text x="25" y="155" fill="#71717a" fontSize="8" fontFamily="monospace">GROUND ANCHOR</text>
                    
                    {/* Head */}
                    <circle cx="100" cy="30" r="10" fill={matchPercentage === 100 ? '#34d399' : '#fbbf24'} />
                    {/* Spine */}
                    <line x1="100" y1="40" x2="95" y2="85" stroke={matchPercentage > 70 ? '#34d399' : '#f87171'} strokeWidth="4" strokeLinecap="round" />
                    {/* Pelvis/Hips */}
                    <line x1="80" y1="85" x2="110" y2="85" stroke="#ffffff" strokeWidth="3" />
                    {/* Lead Leg */}
                    <line x1="95" y1="85" x2="120" y2="115" stroke={matchPercentage > 50 ? '#34d399' : '#f87171'} strokeWidth="3" strokeLinecap="round" />
                    <line x1="120" y1="115" x2="125" y2="145" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
                    {/* Trail Leg */}
                    <line x1="80" y1="85" x2="65" y2="120" stroke="#71717a" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="65" y1="120" x2="55" y2="145" stroke="#71717a" strokeWidth="2.5" strokeLinecap="round" />
                    {/* Arms / Lever */}
                    <line x1="100" y1="45" x2="135" y2="55" stroke={matchPercentage === 100 ? '#34d399' : '#fbbf24'} strokeWidth="3" strokeLinecap="round" />
                    <line x1="135" y1="55" x2={isStriking ? 170 : 155} y2={isStriking ? 30 : 40} stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
                    
                    {/* Kinetic Force Vector Arrow */}
                    <path d="M 125 145 L 140 100 L 165 35" fill="none" stroke={isStriking ? '#ef4444' : '#f59e0b'} strokeWidth={isStriking ? 4 : 2} strokeDasharray={isStriking ? 'none' : '3 3'} />
                    <polygon points="165,30 160,38 170,36" fill={isStriking ? '#ef4444' : '#f59e0b'} />
                  </svg>

                  <span className="text-[9px] font-mono text-amber-400 absolute top-2 right-2 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                    Calculated Exit: {exitVelocityMph} MPH
                  </span>
                </div>

                {/* Gauges Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 flex flex-col gap-1">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">Kinetic Output</span>
                    <span className="text-base font-black text-amber-400 font-mono">{powerWatts} Watts</span>
                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-400 h-full rounded" style={{ width: `${(powerWatts / 950) * 100}%` }} />
                    </div>
                  </div>

                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 flex flex-col gap-1">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">Joint Safety</span>
                    <span className={`text-base font-black font-mono ${jointSafetyPercent > 80 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {jointSafetyPercent}% Safe
                    </span>
                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full rounded ${jointSafetyPercent > 80 ? 'bg-emerald-400' : 'bg-red-500'}`} style={{ width: `${jointSafetyPercent}%` }} />
                    </div>
                  </div>
                </div>

                {/* BIG ACTIVE FIRE BUTTON */}
                <button
                  onClick={handleExecuteStrike}
                  disabled={isStriking}
                  className="w-full bg-gradient-to-r from-red-600 via-amber-500 to-amber-400 hover:from-red-500 hover:to-amber-300 text-zinc-950 text-xs font-black uppercase tracking-wider py-3.5 rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Flame className="w-4 h-4 fill-current" />
                  <span>{isStriking ? 'Simulating Force Transfer...' : '⚡ TEST & EXECUTE STRIKE'}</span>
                </button>

                {strikeFeedback && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-zinc-950 border border-amber-500/30 rounded-xl text-xs text-zinc-300 leading-snug"
                  >
                    {strikeFeedback}
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* MODE 2: ACTIVE 3-REP COACHING CHALLENGE (STAND UP & MOVE) */}
        {/* ========================================================= */}
        {gameMode === 'active_reps' && (
          <motion.div 
            key="active_reps"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 sm:p-6 flex flex-col gap-5 shadow-xl"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
                  <Footprints className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase italic">
                    {currentActiveDrill.title} (Active 3-Rep Trial)
                  </h3>
                  <span className="text-xs text-zinc-400">
                    Stand up and physically execute 3 muscle-memory repetitions with proper biomechanics!
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 px-3.5 py-1.5 rounded-xl font-mono text-xs">
                <span className="text-zinc-500 uppercase font-bold">Progress:</span>
                <span className="text-amber-400 font-black">{repCount} / 3 Reps Completed</span>
              </div>
            </div>

            {/* Drill Instructions Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex flex-col gap-1.5">
                <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">1. Physical Cue</span>
                <p className="text-xs text-zinc-200 font-medium leading-relaxed">{currentActiveDrill.cue}</p>
              </div>

              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex flex-col gap-1.5">
                <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">2. The Biomechanical Why</span>
                <p className="text-xs text-zinc-300 leading-relaxed">{currentActiveDrill.why}</p>
              </div>

              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex flex-col gap-1.5">
                <span className="text-[10px] font-mono text-blue-400 uppercase font-bold">3. Target Posture</span>
                <p className="text-xs text-zinc-300 font-mono font-bold">{currentActiveDrill.targetPose}</p>
              </div>
            </div>

            {/* Rep Counter Stage */}
            <div className="bg-zinc-950/90 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 text-center">
              {repState === 'idle' && (
                <div className="flex flex-col items-center gap-3">
                  <span className="text-sm font-bold text-zinc-300">
                    {repCount === 0 ? 'Ready for Rep 1? Get into position on your feet!' : `Great job! Ready for Rep ${repCount + 1}?`}
                  </span>
                  <button
                    onClick={startActiveRep}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Start 3-Second Form Hold (Rep {repCount + 1})</span>
                  </button>
                </div>
              )}

              {repState === 'countdown' && (
                <div className="flex flex-col items-center gap-2 animate-bounce">
                  <span className="text-xs font-mono text-zinc-400 uppercase">Get in Position!</span>
                  <span className="text-5xl font-black text-amber-400 font-mono">{timerSeconds}</span>
                  <span className="text-xs text-zinc-400">Locking joints into position...</span>
                </div>
              )}

              {repState === 'holding' && (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-xs font-mono text-emerald-400 uppercase font-bold">HOLD FORM PERFECTLY!</span>
                  <div className="w-16 h-16 rounded-full border-4 border-emerald-400 border-t-transparent animate-spin flex items-center justify-center" />
                  <span className="text-xs text-zinc-300 font-medium">Feel the glutes, core, and posture engaged...</span>
                </div>
              )}

              {repState === 'completed' && (
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-full">
                    <Check className="w-8 h-8 stroke-[3]" />
                  </div>
                  <span className="text-base font-black text-white uppercase italic">
                    3/3 PHYSICAL REPS COMPLETED! (+300 XP)
                  </span>
                  <span className="text-xs text-zinc-400 max-w-md">
                    You have successfully embedded this neural pathway and muscle-memory alignment into your motor cortex.
                  </span>
                  <button
                    onClick={() => {
                      setRepCount(0);
                      setRepState('idle');
                    }}
                    className="mt-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold uppercase rounded-xl border border-zinc-700 transition-all cursor-pointer"
                  >
                    🔄 Repeat Training Set
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* MODE 3: KINETIC WHIP FORCE WAVE */}
        {/* ========================================================= */}
        {gameMode === 'kinetic_wave' && (
          <motion.div 
            key="kinetic_wave"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 sm:p-6 flex flex-col gap-5 shadow-xl"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase italic">
                    Kinetic Whip Sequence Sequencer
                  </h3>
                  <span className="text-xs text-zinc-400">
                    Arrange the power transfer stages in order from ground reaction to release.
                  </span>
                </div>
              </div>

              <button
                onClick={handleTestKineticWave}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>{waveActive ? 'PULSING ENERGY...' : '⚡ TEST FORCE TRANSFER'}</span>
              </button>
            </div>

            {/* Kinetic Steps Sequence */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {puzzleSteps.map((step, idx) => {
                const isCorrectSlot = step.idealIndex === idx;

                return (
                  <div
                    key={step.id}
                    className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 transition-all relative ${
                      isCorrectSlot
                        ? 'bg-zinc-950/90 border-emerald-500/40 shadow-emerald-500/5'
                        : 'bg-zinc-950/60 border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{step.icon}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveStep(idx, idx - 1)}
                          disabled={idx === 0}
                          className="p-1.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 rounded-lg text-zinc-300 border border-zinc-800 cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveStep(idx, idx + 1)}
                          disabled={idx === puzzleSteps.length - 1}
                          className="p-1.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 rounded-lg text-zinc-300 border border-zinc-800 cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-white">{step.name}</span>
                      <p className="text-[10px] text-zinc-400 leading-snug">{step.desc}</p>
                    </div>

                    <div className="text-[9px] font-mono uppercase font-bold pt-2 border-t border-zinc-850">
                      {isCorrectSlot ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Slot {idx + 1} Aligned
                        </span>
                      ) : (
                        <span className="text-zinc-500">Slot {idx + 1} (Out of Sequence)</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* MODE 4: FLAW DETECTIVE & FIXER */}
        {/* ========================================================= */}
        {gameMode === 'flaw_detective' && (
          <motion.div 
            key="flaw_detective"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 sm:p-6 flex flex-col gap-5 shadow-xl"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-600/10 text-red-500 rounded-2xl border border-red-500/20">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase italic">
                    Biomechanical Flaw Detective Lab
                  </h3>
                  <span className="text-xs text-zinc-400">
                    Diagnose structural breakdown risks and apply the golden corrective cue.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {dynamicFlawItems.map((flaw, fIdx) => (
                  <button
                    key={flaw.id}
                    onClick={() => {
                      setActiveFlawIndex(fIdx);
                      setFlawFixed(false);
                      playSound('tick');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase cursor-pointer transition-all ${
                      activeFlawIndex === fIdx
                        ? 'bg-amber-500 text-zinc-950 font-black'
                        : 'bg-zinc-950 text-zinc-400 border border-zinc-800'
                    }`}
                  >
                    Case #{fIdx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Diagnostic Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-zinc-950 p-4 sm:p-5 rounded-2xl border border-zinc-800 flex flex-col gap-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-red-400 uppercase font-bold">⚠️ Identified Flaw</span>
                  <span className="text-[10px] font-mono bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20 font-bold">
                    {currentFlaw.affectedJoint}
                  </span>
                </div>

                <h4 className="text-sm font-black text-white">{currentFlaw.name}</h4>
                <p className="text-xs text-zinc-300 leading-relaxed"><strong className="text-zinc-100">Why It Occurs:</strong> {currentFlaw.whyBreaks}</p>
                <div className="p-3 bg-red-500/5 rounded-xl border border-red-500/20 text-xs text-red-300 font-mono">
                  <strong>Injury / Power Hazard:</strong> {currentFlaw.risk}
                </div>
              </div>

              <div className="bg-zinc-950 p-4 sm:p-5 rounded-2xl border border-zinc-800 flex flex-col justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-mono text-emerald-400 uppercase font-bold">🛡️ Golden Fix & Corrective Cue</span>
                  <p className="text-xs text-zinc-200 font-medium leading-relaxed bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                    "{currentFlaw.correctCue}"
                  </p>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    Prescribed Drill: <strong className="text-amber-400">{currentFlaw.drillName}</strong>
                  </span>
                </div>

                <button
                  onClick={handleFixFlaw}
                  disabled={flawFixed}
                  className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    flawFixed
                      ? 'bg-emerald-500 text-zinc-950 shadow-md'
                      : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  }`}
                >
                  {flawFixed ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>FLAW RESOLVED (+200 XP)</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 fill-current" />
                      <span>APPLY NEURO-MOTOR CUE & FIX FORM</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* MODE 5: MATCH TACTICS & DECISION LAB */}
        {/* ========================================================= */}
        {gameMode === 'match_scenarios' && (
          <motion.div 
            key="match_scenarios"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 sm:p-6 flex flex-col gap-5 shadow-xl"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase italic">
                    Match Decision Simulation ({scenarioIndex + 1}/{sportScenarios.length})
                  </h3>
                  <span className="text-xs text-zinc-400">
                    Real in-game tactical situations requiring instant biomechanical adjustment.
                  </span>
                </div>
              </div>

              {scenarioIndex < sportScenarios.length - 1 && (
                <button
                  onClick={() => {
                    setScenarioIndex(prev => prev + 1);
                    setSelectedScenarioChoice(null);
                    setScenarioFeedback(null);
                    playSound('tick');
                  }}
                  className="px-3.5 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 text-xs font-bold uppercase rounded-xl border border-zinc-800 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Next Match Scenario</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="bg-zinc-950 p-4 sm:p-5 rounded-2xl border border-zinc-800 flex flex-col gap-3">
              <h4 className="text-sm font-black text-white">{currentScenario.title}</h4>
              <p className="text-xs text-zinc-300 leading-relaxed">{currentScenario.situation}</p>
              <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-xs text-amber-300 font-bold">
                🎯 {currentScenario.question}
              </div>
            </div>

            <div className="space-y-2.5">
              {currentScenario.options.map((opt, oIdx) => {
                const isSelected = selectedScenarioChoice === oIdx;
                let btnStyle = 'bg-zinc-950 hover:bg-zinc-900 border-zinc-800 text-zinc-300';
                if (isSelected) {
                  btnStyle = opt.isCorrect ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200' : 'bg-red-950/60 border-red-500 text-red-200';
                }

                return (
                  <button
                    key={oIdx}
                    onClick={() => handleScenarioChoice(oIdx)}
                    className={`w-full text-left p-4 rounded-xl border text-xs font-medium transition-all flex items-start gap-3 cursor-pointer ${btnStyle}`}
                  >
                    <span className="font-mono text-amber-400 font-black">{String.fromCharCode(65 + oIdx)}.</span>
                    <span className="flex-1 leading-relaxed">{opt.text}</span>
                  </button>
                );
              })}
            </div>

            {scenarioFeedback && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 leading-relaxed font-sans"
              >
                {scenarioFeedback}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ACHIEVEMENTS STRIP */}
      <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-zinc-800/80">
        <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold flex items-center gap-1">
          <Award className="w-3.5 h-3.5 text-amber-400" /> Unlocked Badges:
        </span>
        {achievements.map((badge, bIdx) => (
          <span key={bIdx} className="bg-amber-500/10 text-amber-300 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-amber-500/20 flex items-center gap-1">
            ✨ {badge}
          </span>
        ))}
      </div>
    </motion.div>
  );
};
