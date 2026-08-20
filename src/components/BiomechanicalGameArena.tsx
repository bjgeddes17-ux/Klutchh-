import React, { useState, useEffect } from 'react';
import { SportRule, FrameAnalysis } from '../types';
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
  AlertTriangle
} from 'lucide-react';
import confetti from 'canvas-confetti';

import monsterWalkImg from '../assets/images/monster_walk_drill_1786821620557.jpg';
import spineHingeImg from '../assets/images/spine_hinge_drill_1786821633655.jpg';
import trophyPoseImg from '../assets/images/trophy_pose_drill_1786821647464.jpg';
import chestOverBallImg from '../assets/images/chest_over_ball_drill_1786821658255.jpg';

interface Props {
  sportRule: SportRule;
  keyframeList: FrameAnalysis[];
  onApplyDrill?: (drillName: string) => void;
  viewMode?: 'student' | 'coach';
}

export const BiomechanicalGameArena: React.FC<Props> = ({
  sportRule,
  keyframeList,
  onApplyDrill,
  viewMode = 'coach'
}) => {
  const [gameMode, setGameMode] = useState<'pose_matcher' | 'kinetic_puzzle' | 'match_scenarios' | 'xray_simulator' | 'trivia'>('pose_matcher');
  const [xp, setXp] = useState(420);
  const [level, setLevel] = useState(2);
  const [achievements, setAchievements] = useState<string[]>(['Kinetic Foundation Started']);

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
  const [poseMastered, setPoseMastered] = useState(false);

  useEffect(() => {
    const list = defaultJoints[sportId as keyof typeof defaultJoints] || defaultJoints.rugby;
    setJoints(list);
    setPoseMastered(false);
  }, [sportId]);

  const handleSliderChange = (id: string, val: number) => {
    setJoints(prev => prev.map(j => j.id === id ? { ...j, current: val } : j));
  };

  // Live physics engine metrics
  const inRangeCount = joints.filter(j => j.current >= j.idealMin && j.current <= j.idealMax).length;
  const matchPercentage = Math.round((inRangeCount / joints.length) * 100);
  const powerWatts = Math.round(450 + (matchPercentage * 4.8));
  const jointSafetyPercent = Math.round(60 + (matchPercentage * 0.38));
  const exitVelocityMph = Math.round(42 + (matchPercentage * 0.46));
  const kineticEfficiency = Math.round(55 + (matchPercentage * 0.45));

  useEffect(() => {
    if (matchPercentage === 100 && !poseMastered) {
      setPoseMastered(true);
      setXp(prev => prev + 250);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      if (!achievements.includes('Gold Standard Biomechanics Master')) {
        setAchievements(prev => [...prev, 'Gold Standard Biomechanics Master']);
      }
    }
  }, [matchPercentage, poseMastered, achievements]);

  // --- MODE 2: KINETIC WHIP TIMING SIMULATOR ---
  const baseKineticSteps = [
    { id: 'ground', name: '1. Ground Reaction & Foot Plant', idealIndex: 0, icon: '⚡', timingMs: 0, desc: 'Ground strike generates vertical ground reaction force (GRF = 2.5-3.5× BW)' },
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

  const moveStep = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= puzzleSteps.length) return;
    const updated = [...puzzleSteps];
    const item = updated.splice(fromIdx, 1)[0];
    updated.splice(toIdx, 0, item);
    setPuzzleSteps(updated);

    const isCorrect = updated.every((s, i) => s.idealIndex === i);
    if (isCorrect && !puzzleSolved) {
      setPuzzleSolved(true);
      setXp(prev => prev + 300);
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.5 } });
      if (!achievements.includes('Kinetic Whip Sequencer')) {
        setAchievements(prev => [...prev, 'Kinetic Whip Sequencer']);
      }
    }
  };

  const isPuzzleCorrect = puzzleSteps.every((s, i) => s.idealIndex === i);

  // --- MODE 3: REAL MATCH SCENARIO DECISION ENGINE ---
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [selectedScenarioChoice, setSelectedScenarioChoice] = useState<number | null>(null);
  const [scenarioFeedback, setScenarioFeedback] = useState<string | null>(null);

  const sportScenarios = [
    {
      title: 'Late 4th Quarter Fatigue: Knee Collapse & Power Loss',
      situation: 'In minute 78, your legs are heavy. You need to deliver a high-velocity strike/pass under heavy defensive pressure, but your plant knee is caving inward (dynamic valgus) and you feel your core sag.',
      question: 'What is the biomechanically optimal adjustment to restore 100% power and protect your joints?',
      options: [
        {
          text: 'Push harder using only your shoulder and arms to compensate for tired legs.',
          isCorrect: false,
          explanation: '❌ Arm compensation places extreme shear on rotator cuff and elbow tendons while reducing ball velocity by 30% due to disconnected kinetic chain.'
        },
        {
          text: 'Widen plant foot stance slightly, cue external hip abduction (knees over toes), and hinge hips 15° deeper.',
          isCorrect: true,
          explanation: '✅ Perfect! External hip torque activates gluteus medius, realigns the knee-ankle axis, and creates a wider base of support to generate maximal ground reaction forces.'
        },
        {
          text: 'Jump high into the air during contact to avoid leg fatigue.',
          isCorrect: false,
          explanation: '❌ Airborne strikes lose all ground reaction anchoring, resulting in weak contact and high risk of uncontrolled landing injury.'
        }
      ]
    },
    {
      title: 'High Crosswind Trajectory Control',
      situation: 'A 25 mph gusting crosswind is pushing your ball offline. You need pinpoint trajectory with penetrating forward drive.',
      question: 'How do you adjust your trunk and contact point to maintain a piercing, wind-resistant trajectory?',
      options: [
        {
          text: 'Increase forward chest hinge by 10-15° and keep the release/contact point directly under your sternum.',
          isCorrect: true,
          explanation: '✅ Excellent! Keeping the sternum forward over the ball drives a flatter launch angle with heavy forward compression, minimizing aerodynamic ballooning.'
        },
        {
          text: 'Lean backwards 20° to launch the ball as high as possible above the wind.',
          isCorrect: false,
          explanation: '❌ High launch angles expose the ball to maximum wind resistance, completely killing distance and accuracy.'
        },
        {
          text: 'Swing as slowly as possible to let the ball float gently.',
          isCorrect: false,
          explanation: '❌ Low velocity gives crosswind more time to divert the ball trajectory.'
        }
      ]
    },
    {
      title: 'Absorbing Heavy Contact & Preventing Spinal Shear',
      situation: 'You are entering heavy physical contact or rapid deceleration. How should your spine and pelvis be configured at impact?',
      question: 'Which anatomical posture best disperses high collision impact without causing lower back injury?',
      options: [
        {
          text: 'Keep spine completely upright and erect with straight legs.',
          isCorrect: false,
          explanation: '❌ Upright, straight-legged posture transmits 100% of collision force directly into lumbar vertebrae facet joints and cervical spine.'
        },
        {
          text: 'Maintain a 30-40° hip hinge with braced abdominal cylinder (360° intra-abdominal pressure) and chin tucked neutral.',
          isCorrect: true,
          explanation: '✅ Flawless! Hip hinging transfers impact energy into large posterior chain muscles (glutes/hamstrings) while 360° core bracing protects the lumbar discs.'
        },
        {
          text: 'Arch your lower back backward while looking up at the sky.',
          isCorrect: false,
          explanation: '❌ Lumbar hyperextension under contact risks severe facet joint jamming and disc herniation.'
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
      setXp(prev => prev + 150);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      if (!achievements.includes('Master Tactician')) {
        setAchievements(prev => [...prev, 'Master Tactician']);
      }
    }
  };

  const nextScenario = () => {
    setSelectedScenarioChoice(null);
    setScenarioFeedback(null);
    setScenarioIndex(prev => (prev + 1) % sportScenarios.length);
  };

  // --- MODE 4: FAULT & X-RAY SIMULATOR ---
  const [activeFaultId, setActiveFaultId] = useState<string>('valgus');

  const faultData: Record<string, {
    title: string;
    joint: string;
    dangerLevel: 'CRITICAL' | 'HIGH' | 'MODERATE';
    forceLeak: string;
    injuryRisk: string;
    anatomyDetail: string;
    correctiveCue: string;
    bestDrill: string;
    drillImage: string;
    biomechanicsFormula: string;
  }> = {
    valgus: {
      title: 'Inward Knee Collapse (Dynamic Valgus)',
      joint: 'Anterior Cruciate Ligament (ACL) & Lateral Meniscus',
      dangerLevel: 'CRITICAL',
      forceLeak: '-32% Vertical Spring & Deceleration Power',
      injuryRisk: 'Severe ACL tear risk, patellofemoral cartilage erosion, and MCL strain.',
      anatomyDetail: 'When the knee buckles inward relative to the hip-ankle vector, ground reaction forces create extreme valgus torque (τ = F × d), multiplying tensile strain on the ACL by up to 400%.',
      correctiveCue: '"Land like a panther: knees wide tracking directly over 2nd & 3rd toes!"',
      bestDrill: 'Banded Gluteus Medius Monster Walks & Drop Landing Freezes',
      drillImage: monsterWalkImg,
      biomechanicsFormula: 'τ_valgus = F_GRF × sin(θ_valgus) × L_femur'
    },
    spine_extension: {
      title: 'Loss of Spine Hinge / Early Extension',
      joint: 'Lumbar L4-L5 Vertebrae & Quadratus Lumborum',
      dangerLevel: 'HIGH',
      forceLeak: '-24% Rotational Torque & Contact Penetration',
      injuryRisk: 'Lumbar facet joint impingement, disc herniation, and severe hamstring strain.',
      anatomyDetail: 'Standing up prematurely flattens pelvic tilt, locking out the posterior chain and forcing the arms to generate disconnected force without core rotational support.',
      correctiveCue: '"Hips back, flat table back, feel glutes loaded like a coiled spring!"',
      bestDrill: 'Wall Glute-Contact Spine Hinge Holds (3s Pause)',
      drillImage: spineHingeImg,
      biomechanicsFormula: 'Torque_core = F_glute × d_pelvis'
    },
    dropped_elbow: {
      title: 'Dropped Elbow / Low Release Pocket',
      joint: 'Rotator Cuff (Supraspinatus) & Medial Ulnar Collateral Ligament (UCL)',
      dangerLevel: 'HIGH',
      forceLeak: '-28% Release Height & Arm Lever Whip',
      injuryRisk: 'Medial elbow UCL tear (Tommy John syndrome) and subacromial shoulder impingement.',
      anatomyDetail: 'When the elbow sags below shoulder level during arm acceleration, the forearm rotates early, creating massive valgus extension overload on the medial elbow.',
      correctiveCue: '"Elbow above the eyebrow, reach for the stars at release!"',
      bestDrill: '90° Trophy Pose Wall Alignment Holds',
      drillImage: trophyPoseImg,
      biomechanicsFormula: 'v_terminal = ω_shoulder × r_arm'
    },
    leaning_back: {
      title: 'Trunk Hyperextension / Leaning Back at Impact',
      joint: 'Hamstring Proximal Tendon & Thoracic Paraspinals',
      dangerLevel: 'MODERATE',
      forceLeak: '-35% Ball Compression Velocity',
      injuryRisk: 'High hamstring strain and erratic skyward ball trajectory.',
      anatomyDetail: 'Shifting the center of mass behind the contact zone reduces the horizontal impact impulse (J = ∫F dt), causing strikes to balloon with zero forward penetration.',
      correctiveCue: '"Nose and sternum directly over the strike zone!"',
      bestDrill: 'Weighted Chest-Over-Ball Impact Holds',
      drillImage: chestOverBallImg,
      biomechanicsFormula: 'Impulse (J) = Δp = m × (v_final - v_initial)'
    }
  };

  const currentFault = faultData[activeFaultId] || faultData.valgus;

  // --- MODE 5: BIOMECHANICS TRIVIA ---
  const [triviaIndex, setTriviaIndex] = useState(0);
  const [selectedTriviaOption, setSelectedTriviaOption] = useState<number | null>(null);
  const [triviaScore, setTriviaScore] = useState(0);
  const [triviaCompleted, setTriviaCompleted] = useState(false);

  const triviaQuestions = [
    {
      question: `In elite sports biomechanics, what does "Proximal-to-Distal Sequencing" mean?`,
      options: [
        'Moving smaller arm muscles first to get them out of the way',
        'Initiating force with large central muscles (legs/pelvis) and transferring energy outward into fast extremities',
        'Rotating your neck before planting your feet',
        'A video editing filter technique'
      ],
      correctIndex: 1,
      explanation: 'Proximal-to-distal sequencing channels ground reaction force through massive core muscles first, multiplying angular velocity into lighter extremities for peak terminal speed.'
    },
    {
      question: 'How does a 3-second isometric hold in a drill build muscle memory faster than rapid repetitions?',
      options: [
        'It stimulates muscle spindles and neuromuscular Golgi tendon organs to lock the precise joint coordinate into motor cortex memory',
        'It lets the coach take better photos for social media',
        'It makes the video run slower',
        'It has no proven neurological benefit'
      ],
      correctIndex: 0,
      explanation: 'Isometric holds maximize proprioceptive afferent feedback to the motor cortex, building durable neural pathways for the target joint angle.'
    },
    {
      question: 'What is the relationship between lever arm length and linear speed at release (v = ω × r)?',
      options: [
        'Longer lever radius (r) creates higher linear speed (v) at the same rotational speed (ω)',
        'Shorter levers always create faster releases',
        'Lever length has no impact on velocity',
        'Rotating backwards doubles forward speed'
      ],
      correctIndex: 0,
      explanation: 'Linear exit speed is directly proportional to lever arm length (v = ω × r). Maintaining full arm extension maximizes the release arc speed.'
    }
  ];

  const handleTriviaAnswer = (optIdx: number) => {
    if (selectedTriviaOption !== null) return;
    setSelectedTriviaOption(optIdx);
    if (optIdx === triviaQuestions[triviaIndex].correctIndex) {
      setTriviaScore(prev => prev + 1);
      setXp(prev => prev + 100);
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
    }
  };

  const handleNextTrivia = () => {
    if (triviaIndex < triviaQuestions.length - 1) {
      setTriviaIndex(prev => prev + 1);
      setSelectedTriviaOption(null);
    } else {
      setTriviaCompleted(true);
      if (!achievements.includes('Biomechanical Scholar Badge')) {
        setAchievements(prev => [...prev, 'Biomechanical Scholar Badge']);
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-7 flex flex-col gap-6 shadow-2xl relative overflow-hidden text-zinc-100"
    >
      {/* Visual background accents */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* HEADER WITH GAMIFICATION STATUS */}
      <div className="border-b border-zinc-800/80 pb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="bg-gradient-to-br from-red-600 to-amber-600 p-3 rounded-2xl border border-white/10 shadow-lg text-white">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black uppercase italic tracking-tight text-white flex items-center gap-2">
              <span>Biomechanics Mastery Academy</span>
              <span className="bg-amber-500/20 text-amber-400 text-[10px] px-2.5 py-0.5 rounded-full border border-amber-500/30 not-italic font-mono">
                LAB_v3.0
              </span>
            </h2>
            <p className="text-xs text-zinc-400 font-medium">
              Interactive physics engine: master kinetic chains, joint shear safety, and motor control.
            </p>
          </div>
        </div>

        {/* XP & LEVEL BADGE */}
        <div className="flex items-center gap-4 bg-zinc-900/90 border border-zinc-800 px-4 py-2 rounded-2xl shadow-inner">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-black text-zinc-500 tracking-widest">Mastery Rank</span>
            <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5" /> Level {level} Scholar
            </span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-[9px] font-mono text-zinc-400">{xp} / {(level + 1) * 500} XP</span>
            <div className="w-20 bg-zinc-950 h-1.5 rounded-full overflow-hidden border border-zinc-800">
              <div 
                className="bg-gradient-to-r from-red-600 to-amber-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, (xp % 500) / 5)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* GAME MODE NAVIGATION TABS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-zinc-900/70 p-1.5 rounded-2xl border border-zinc-800">
        {[
          { id: 'pose_matcher', label: 'Angle Sandbox', icon: '🎯' },
          { id: 'kinetic_puzzle', label: 'Kinetic Whip', icon: '⚡' },
          { id: 'match_scenarios', label: 'Game Scenarios', icon: '🎮' },
          { id: 'xray_simulator', label: 'Fault & Fix Lab', icon: '🩻' },
          { id: 'trivia', label: 'Bio Quiz', icon: '🧠' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setGameMode(tab.id as any)}
            className={`px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
              gameMode === tab.id
                ? 'bg-amber-500 text-zinc-950 font-black shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <span>{tab.icon}</span>
            <span className="truncate">{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ========================================================= */}
        {/* MODE 1: INTERACTIVE ANGLE & SKELETON SANDBOX */}
        {/* ========================================================= */}
        {gameMode === 'pose_matcher' && (
          <motion.div 
            key="pose_matcher"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-5"
          >
            {/* SLIDERS COLUMN */}
            <div className="lg:col-span-7 flex flex-col gap-3.5">
              <div className="bg-zinc-900/80 border border-zinc-800 p-4 sm:p-5 rounded-2xl flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                  <span className="text-xs font-black uppercase text-amber-400 flex items-center gap-2">
                    <Sliders className="w-4 h-4" /> Joint Dial Calibration ({sportRule.name})
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">
                    Adjust angles to see live physics reaction
                  </span>
                </div>

                <div className="space-y-3">
                  {joints.map((joint) => {
                    const inRange = joint.current >= joint.idealMin && joint.current <= joint.idealMax;
                    const isTooLow = joint.current < joint.idealMin;

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
                          <span className="text-amber-400/90 font-bold uppercase text-[8.5px] flex items-center gap-1">
                            <BookOpen className="w-3 h-3" /> Biomechanical Principle:
                          </span>
                          <p className="leading-snug">{joint.mechanicalPrinciple}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setJoints(prev => prev.map(j => ({ ...j, current: Math.round((j.idealMin + j.idealMax) / 2) })))}
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black uppercase tracking-wider py-2.5 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" /> Snap to Gold Standard
                  </button>
                  <button
                    onClick={() => setJoints(initialJoints)}
                    className="p-2.5 bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl border border-zinc-800 transition-all"
                    title="Reset dials"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* LIVE KINEMATIC SIMULATOR & PHYSICS GAUGES */}
            <div className="lg:col-span-5 flex flex-col gap-3.5">
              <div className="bg-zinc-900/80 border border-zinc-800 p-4 sm:p-5 rounded-2xl flex flex-col gap-4 h-full shadow-lg">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <span className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
                    <Activity className="w-4 h-4" /> Live Physics Simulation
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">
                    {matchPercentage}% Form Sync
                  </span>
                </div>

                {/* 2D Interactive Kinematic Figure Preview */}
                <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-3 flex flex-col items-center justify-center relative min-h-[160px]">
                  <svg className="w-48 h-36" viewBox="0 0 200 160">
                    {/* Ground line */}
                    <line x1="20" y1="145" x2="180" y2="145" stroke="#3f3f46" strokeWidth="2" strokeDasharray="4 4" />
                    <text x="25" y="155" fill="#71717a" fontSize="8" fontFamily="monospace">GROUND CONTACT</text>
                    
                    {/* Torso & Head */}
                    <circle cx="100" cy="30" r="10" fill={matchPercentage === 100 ? '#34d399' : '#fbbf24'} />
                    {/* Spine */}
                    <line x1="100" y1="40" x2="95" y2="85" stroke={matchPercentage > 70 ? '#34d399' : '#f87171'} strokeWidth="4" strokeLinecap="round" />
                    {/* Pelvis/Hips */}
                    <line x1="80" y1="85" x2="110" y2="85" stroke="#ffffff" strokeWidth="3" />
                    {/* Lead Leg (Femur & Tibia) */}
                    <line x1="95" y1="85" x2="120" y2="115" stroke={matchPercentage > 50 ? '#34d399' : '#f87171'} strokeWidth="3" strokeLinecap="round" />
                    <line x1="120" y1="115" x2="125" y2="145" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
                    {/* Trail Leg */}
                    <line x1="80" y1="85" x2="65" y2="120" stroke="#71717a" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="65" y1="120" x2="55" y2="145" stroke="#71717a" strokeWidth="2.5" strokeLinecap="round" />
                    {/* Arms / Lever */}
                    <line x1="100" y1="45" x2="135" y2="55" stroke={matchPercentage === 100 ? '#34d399' : '#fbbf24'} strokeWidth="3" strokeLinecap="round" />
                    <line x1="135" y1="55" x2="155" y2="40" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
                    
                    {/* Kinetic Force Vector Arrow */}
                    <path d="M 125 145 L 140 100 L 165 35" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3 3" />
                    <polygon points="165,30 160,38 170,36" fill="#f59e0b" />
                  </svg>
                  <span className="text-[9px] font-mono text-zinc-400 absolute top-2 right-2 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                    GRF Vector: {powerWatts} W
                  </span>
                </div>

                {/* Gauges Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 flex flex-col gap-1">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">Kinetic Power Output</span>
                    <span className="text-base font-black text-amber-400 font-mono">{powerWatts} Watts</span>
                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-400 h-full rounded" style={{ width: `${(powerWatts / 950) * 100}%` }} />
                    </div>
                  </div>

                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 flex flex-col gap-1">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">ACL / Spine Safety</span>
                    <span className={`text-base font-black font-mono ${jointSafetyPercent > 80 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {jointSafetyPercent}% Safe
                    </span>
                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full rounded ${jointSafetyPercent > 80 ? 'bg-emerald-400' : 'bg-red-400'}`} style={{ width: `${jointSafetyPercent}%` }} />
                    </div>
                  </div>

                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 flex flex-col gap-1">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">Est. Exit Velocity</span>
                    <span className="text-base font-black text-white font-mono">{exitVelocityMph} MPH</span>
                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-400 h-full rounded" style={{ width: `${(exitVelocityMph / 90) * 100}%` }} />
                    </div>
                  </div>

                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 flex flex-col gap-1">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">Energy Transmission</span>
                    <span className="text-base font-black text-purple-400 font-mono">{kineticEfficiency}%</span>
                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-purple-400 h-full rounded" style={{ width: `${kineticEfficiency}%` }} />
                    </div>
                  </div>
                </div>

                {/* Coaching Diagnosis Takeaway */}
                <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800/80 text-[11px] text-zinc-300 leading-relaxed">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                    ⚡ Real-Time Physics Takeaway:
                  </span>
                  {matchPercentage === 100 ? (
                    <span className="text-emerald-300">
                      Perfect alignment! Proximal momentum converts to terminal release whip with zero joint shear or force dissipation.
                    </span>
                  ) : matchPercentage >= 66 ? (
                    <span className="text-amber-300">
                      Partial kinetic sync. Minor {100 - matchPercentage}% energy leak detected in red joint markers. Refine angles to unlock full power.
                    </span>
                  ) : (
                    <span className="text-red-300">
                      Severe kinetic breakdown. Force is leaking before reaching contact, placing dangerous shear on stabilizing ligaments.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* MODE 2: KINETIC WHIP SEQUENCING PUZZLE */}
        {/* ========================================================= */}
        {gameMode === 'kinetic_puzzle' && (
          <motion.div 
            key="kinetic_puzzle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl flex flex-col gap-4"
          >
            <div className="border-b border-zinc-800 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-black uppercase text-amber-400 flex items-center gap-2">
                  <Zap className="w-4 h-4" /> Kinetic Firing Sequence & Whip Simulator
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Arrange segments in true Proximal-to-Distal order (Ground Reaction → Pelvis → Torso → Terminal Release).
                </p>
              </div>
              <span className={`text-xs font-black px-3 py-1 rounded-lg border font-mono ${isPuzzleCorrect ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' : 'bg-red-950 text-red-300 border-red-500/40'}`}>
                {isPuzzleCorrect ? '✓ FLAWLESS PROXIMAL-TO-DISTAL FLOW' : '⚠️ KINETIC HITCH DETECTED'}
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {puzzleSteps.map((step, idx) => {
                const isStepCorrect = step.idealIndex === idx;

                return (
                  <div
                    key={step.id}
                    className={`border p-3.5 rounded-xl flex items-center justify-between transition-all ${
                      isStepCorrect 
                        ? 'bg-zinc-950 border-emerald-500/40 text-zinc-200 shadow-md' 
                        : 'bg-zinc-950/70 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-lg font-mono text-xs font-black flex items-center justify-center border ${isStepCorrect ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-zinc-900 text-zinc-500 border-zinc-800'}`}>
                        #{idx + 1}
                      </span>
                      <span className="text-base">{step.icon}</span>
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-white">{step.name}</span>
                        <span className="text-[10px] text-zinc-400">{step.desc}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        disabled={idx === 0}
                        onClick={() => moveStep(idx, idx - 1)}
                        className="p-1.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 border border-zinc-800 rounded-lg text-zinc-300 transition-all"
                        title="Move Up in sequence"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        disabled={idx === puzzleSteps.length - 1}
                        onClick={() => moveStep(idx, idx + 1)}
                        className="p-1.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 border border-zinc-800 rounded-lg text-zinc-300 transition-all"
                        title="Move Down in sequence"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Kinetic diagnostics */}
            {isPuzzleCorrect ? (
              <div className="bg-emerald-950/40 border border-emerald-500/40 p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Flame className="w-6 h-6 text-emerald-400 animate-bounce" />
                  <div>
                    <span className="text-xs font-black uppercase text-emerald-300 block">100% Elastic Recoil Unlocked!</span>
                    <p className="text-[11px] text-zinc-300">
                      Linear ground force converts cleanly into rotational hip momentum, accelerates through the thoracic spine, and snaps terminal levers with zero force leakage.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-950 px-3 py-1.5 rounded-lg border border-emerald-500/30 shrink-0">
                  +300 XP
                </span>
              </div>
            ) : (
              <div className="bg-red-950/30 border border-red-500/30 p-3.5 rounded-xl flex items-center justify-between text-xs">
                <span className="text-red-300">
                  ⚠️ Firing out of order forces smaller arm muscles to generate velocity without hip momentum, reducing power by ~35%.
                </span>
                <button
                  onClick={() => setPuzzleSteps([...baseKineticSteps].sort((a, b) => a.idealIndex - b.idealIndex))}
                  className="text-[10px] font-bold text-amber-400 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-900 shrink-0"
                >
                  Snap to Proper Sequence
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* MODE 3: REAL MATCH SCENARIOS */}
        {/* ========================================================= */}
        {gameMode === 'match_scenarios' && (
          <motion.div 
            key="match_scenarios"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl flex flex-col gap-4"
          >
            <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
              <span className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
                <Target className="w-4 h-4" /> Match Situation Biomechanical Decision Lab ({scenarioIndex + 1}/{sportScenarios.length})
              </span>
              <button
                onClick={nextScenario}
                className="text-[10px] font-bold text-zinc-400 hover:text-white flex items-center gap-1 bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800"
              >
                <span>Next Scenario</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex flex-col gap-2">
              <h4 className="text-sm font-black text-white uppercase italic">{currentScenario.title}</h4>
              <p className="text-xs text-zinc-300 leading-relaxed">{currentScenario.situation}</p>
              <div className="text-xs font-bold text-amber-400 pt-1">{currentScenario.question}</div>
            </div>

            <div className="flex flex-col gap-2.5">
              {currentScenario.options.map((opt, idx) => {
                const isSelected = selectedScenarioChoice === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => handleScenarioChoice(idx)}
                    className={`p-3.5 rounded-xl text-left text-xs font-bold transition-all border flex items-start gap-3 ${
                      isSelected
                        ? opt.isCorrect
                          ? 'bg-emerald-950/70 border-emerald-500 text-white'
                          : 'bg-red-950/70 border-red-500 text-white'
                        : 'bg-zinc-950/70 hover:bg-zinc-800/80 border-zinc-800 text-zinc-300'
                    }`}
                  >
                    <span className="font-mono text-amber-400 text-xs font-black">{String.fromCharCode(65 + idx)}.</span>
                    <span className="flex-1">{opt.text}</span>
                  </button>
                );
              })}
            </div>

            {scenarioFeedback && (
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-xs leading-relaxed animate-fadeIn">
                <span className="text-[10px] font-mono text-zinc-500 uppercase font-black block mb-1">
                  Coach Biomechanical Debrief:
                </span>
                <p className="text-zinc-200">{scenarioFeedback}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* MODE 4: FAULT & X-RAY SIMULATOR */}
        {/* ========================================================= */}
        {gameMode === 'xray_simulator' && (
          <motion.div 
            key="xray_simulator"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-5"
          >
            <div className="lg:col-span-4 flex flex-col gap-2 bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 px-1 mb-1">
                Select Movement Fault:
              </span>

              {[
                { id: 'valgus', name: 'Knee Collapse (Valgus)', icon: '🦵', danger: 'CRITICAL' },
                { id: 'spine_extension', name: 'Early Spine Extension', icon: '🦴', danger: 'HIGH' },
                { id: 'dropped_elbow', name: 'Dropped Elbow Pitch', icon: '💪', danger: 'HIGH' },
                { id: 'leaning_back', name: 'Trunk Hyperextension', icon: '🏃', danger: 'MODERATE' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setActiveFaultId(f.id)}
                  className={`p-3 rounded-xl text-left text-xs font-bold flex items-center justify-between transition-all ${
                    activeFaultId === f.id
                      ? 'bg-red-600 text-white shadow-md'
                      : 'bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span>{f.icon}</span>
                    <span className="font-black uppercase tracking-tight">{f.name}</span>
                  </div>
                  <span className={`text-[8.5px] font-mono px-1.5 py-0.5 rounded font-black ${activeFaultId === f.id ? 'bg-white/20' : 'bg-zinc-900 text-zinc-500'}`}>
                    {f.danger}
                  </span>
                </button>
              ))}
            </div>

            <div className="lg:col-span-8 bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl flex flex-col gap-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-red-500" />
                  <h4 className="text-xs sm:text-sm font-black uppercase text-white tracking-wide">
                    {currentFault.title}
                  </h4>
                </div>
                <span className="text-[9px] font-mono bg-red-500/10 border border-red-500/30 text-red-400 px-2.5 py-0.5 rounded-full font-bold">
                  {currentFault.forceLeak}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-3">
                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-xs">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase block mb-1">Target Anatomy & Joint:</span>
                    <span className="text-xs font-bold text-amber-400">{currentFault.joint}</span>
                    <p className="text-zinc-300 mt-1 leading-snug">{currentFault.anatomyDetail}</p>
                  </div>

                  <div className="bg-red-950/30 border border-red-500/20 p-3 rounded-xl text-xs">
                    <span className="text-[9px] font-mono text-red-400 uppercase font-black block mb-0.5">Injury Mechanism:</span>
                    <p className="text-zinc-300 leading-snug">{currentFault.injuryRisk}</p>
                  </div>

                  <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 text-[10px] font-mono text-zinc-400">
                    <span>Physics Formula: </span>
                    <strong className="text-amber-400">{currentFault.biomechanicsFormula}</strong>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase">Corrective Drill Model:</span>
                  <div className="aspect-video bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden relative">
                    <img 
                      src={currentFault.drillImage} 
                      alt="Drill"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center text-[10px]">
                      <span className="text-white font-bold">{currentFault.bestDrill}</span>
                    </div>
                  </div>
                  <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 text-xs">
                    <span className="text-[9px] font-mono text-emerald-400 uppercase font-bold block">Internal Coaching Cue:</span>
                    <span className="text-zinc-200 italic">{currentFault.correctiveCue}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* MODE 5: BIOMECHANICS TRIVIA */}
        {/* ========================================================= */}
        {gameMode === 'trivia' && (
          <motion.div 
            key="trivia"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl flex flex-col gap-4"
          >
            {!triviaCompleted ? (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                  <span className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4" /> Biomechanics Master Quiz ({triviaIndex + 1}/{triviaQuestions.length})
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400 bg-zinc-950 px-2.5 py-0.5 rounded border border-zinc-800">
                    Score: {triviaScore}/{triviaQuestions.length}
                  </span>
                </div>

                <h3 className="text-sm font-black text-white leading-snug italic">
                  {triviaQuestions[triviaIndex].question}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {triviaQuestions[triviaIndex].options.map((opt, optIdx) => {
                    const isSelected = selectedTriviaOption === optIdx;
                    const isCorrect = optIdx === triviaQuestions[triviaIndex].correctIndex;

                    return (
                      <button
                        key={optIdx}
                        disabled={selectedTriviaOption !== null}
                        onClick={() => handleTriviaAnswer(optIdx)}
                        className={`p-3.5 rounded-xl text-left text-xs font-bold border transition-all ${
                          selectedTriviaOption === null
                            ? 'bg-zinc-950 hover:bg-zinc-800 border-zinc-800 text-zinc-300'
                            : isCorrect
                            ? 'bg-emerald-950 border-emerald-500 text-white'
                            : isSelected
                            ? 'bg-red-950 border-red-500 text-white'
                            : 'bg-zinc-950/40 border-zinc-850 text-zinc-600'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-amber-400">{String.fromCharCode(65 + optIdx)}.</span>
                          <span>{opt}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {selectedTriviaOption !== null && (
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex flex-col gap-2 animate-fadeIn">
                    <span className="text-[10px] font-mono text-amber-400 uppercase font-black">
                      Scientific Explanation:
                    </span>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {triviaQuestions[triviaIndex].explanation}
                    </p>
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={handleNextTrivia}
                        className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs px-4 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                      >
                        <span>Next Question</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 flex flex-col items-center gap-3">
                <Award className="w-12 h-12 text-amber-400 animate-bounce" />
                <h3 className="text-base font-black uppercase text-white">Quiz Completed!</h3>
                <p className="text-xs text-zinc-400 font-mono">
                  Final Score: <strong className="text-amber-400">{triviaScore} / {triviaQuestions.length}</strong>
                </p>
                <button
                  onClick={() => {
                    setTriviaIndex(0);
                    setSelectedTriviaOption(null);
                    setTriviaScore(0);
                    setTriviaCompleted(false);
                  }}
                  className="mt-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold px-4 py-2 rounded-xl border border-zinc-700"
                >
                  Retake Quiz
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTER ACHIEVEMENTS */}
      <div className="bg-zinc-900/90 border border-zinc-800 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="text-[10px] font-black uppercase text-zinc-400">Mastery Badges Unlocked:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {achievements.map((badge, bIdx) => (
            <span 
              key={bIdx}
              className="bg-zinc-950 border border-amber-500/30 text-amber-400 text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow"
            >
              <span>🏆</span> {badge}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
