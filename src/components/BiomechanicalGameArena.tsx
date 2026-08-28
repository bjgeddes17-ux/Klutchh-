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
  Eye, 
  Activity, 
  HelpCircle,
  Award,
  ChevronRight,
  Info
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
  const [gameMode, setGameMode] = useState<'pose_matcher' | 'kinetic_puzzle' | 'xray_simulator' | 'trivia'>('pose_matcher');
  const [xp, setXp] = useState(350);
  const [level, setLevel] = useState(2);
  const [achievements, setAchievements] = useState<string[]>(['First Audit Completed']);

  // --- MODE 1: POSE MATCHER STATE ---
  const sportId = sportRule.id || 'rugby';
  const techniques = sportRule.techniques && sportRule.techniques.length > 0 ? sportRule.techniques : [];
  const [selectedTechId, setSelectedTechId] = useState<string>(techniques[0]?.id || 'default');

  // Custom joint controls based on sport
  const defaultJoints = {
    rugby: [
      { id: 'spine', name: 'Spine Hip Hinge Angle', min: 90, max: 180, idealMin: 120, idealMax: 145, current: 165, unit: '°', cue: 'Hinge back with flat spine' },
      { id: 'knee', name: 'Tackle Entry Knee Flexion', min: 70, max: 170, idealMin: 110, idealMax: 135, current: 155, unit: '°', cue: 'Sink hips low into contact' },
      { id: 'neck', name: 'Cervical Spine Chin Posture', min: 110, max: 180, idealMin: 150, idealMax: 175, current: 130, unit: '°', cue: 'Keep eyes and chin up' }
    ],
    soccer: [
      { id: 'chest', name: 'Chest Lean Over Ball', min: 60, max: 140, idealMin: 80, idealMax: 100, current: 120, unit: '°', cue: 'Nose & chest over the ball' },
      { id: 'plant_knee', name: 'Plant Knee Deceleration Cushion', min: 80, max: 170, idealMin: 115, idealMax: 135, current: 160, unit: '°', cue: 'Soft plant knee absorbs impact' },
      { id: 'ankle', name: 'Kicking Ankle Plantar Lock', min: 90, max: 175, idealMin: 155, idealMax: 175, current: 125, unit: '°', cue: 'Lock laces firm and down' }
    ],
    netball: [
      { id: 'knee_flex', name: 'Soft Bilateral Landing Cushion', min: 80, max: 170, idealMin: 110, idealMax: 130, current: 155, unit: '°', cue: 'Sink knees softly to absorb force' },
      { id: 'shooting_elbow', name: 'High Shooting Release Pocket', min: 60, max: 150, idealMin: 85, idealMax: 110, current: 70, unit: '°', cue: 'Elbow above eyebrow level' },
      { id: 'spine_erect', name: 'Vertical Landing Trunk Alignment', min: 120, max: 180, idealMin: 160, idealMax: 180, current: 140, unit: '°', cue: 'Keep torso tall and balanced' }
    ],
    hockey: [
      { id: 'crouch_knee', name: 'Deep Turf Crouch Knee Angle', min: 80, max: 160, idealMin: 110, idealMax: 135, current: 150, unit: '°', cue: 'Lower hips close to turf' },
      { id: 'torso_hinge', name: 'Sweep Torso Angle', min: 90, max: 160, idealMin: 115, idealMax: 140, current: 100, unit: '°', cue: 'Flat back, eyes on target' },
      { id: 'lead_wrist', name: 'Lead Wrist Square Angle', min: 120, max: 180, idealMin: 160, idealMax: 180, current: 135, unit: '°', cue: 'Firm flat stick face' }
    ],
    basketball: [
      { id: 'elbow_pocket', name: 'Shooting Elbow Set Point', min: 50, max: 140, idealMin: 85, idealMax: 110, current: 65, unit: '°', cue: 'Elbow tucked under ball at eye level' },
      { id: 'knee_dip', name: 'Knee Dip Base Loading', min: 80, max: 160, idealMin: 110, idealMax: 130, current: 150, unit: '°', cue: 'Synchronize dip with ball rise' },
      { id: 'wrist_snap', name: 'Follow-Through Gooseneck Snap', min: 50, max: 140, idealMin: 70, idealMax: 90, current: 120, unit: '°', cue: 'Fingers roll into cookie jar' }
    ],
    tennis: [
      { id: 'trophy_elbow', name: '90° Trophy Elbow Height', min: 50, max: 140, idealMin: 85, idealMax: 110, current: 60, unit: '°', cue: 'Keep hitting elbow at shoulder level' },
      { id: 'knee_loading', name: 'Deep Knee Loading Drive', min: 80, max: 160, idealMin: 110, idealMax: 135, current: 155, unit: '°', cue: 'Drive upward off both balls of feet' },
      { id: 'shoulder_coil', name: 'Unit Turn Shoulder Coil', min: 45, max: 130, idealMin: 85, idealMax: 115, current: 60, unit: '°', cue: 'Shoulders fully turned to baseline' }
    ],
    golf: [
      { id: 'spine_angle', name: 'Spine Tilt Forward Hinge', min: 90, max: 160, idealMin: 125, idealMax: 140, current: 155, unit: '°', cue: 'Maintain spine tilt through impact' },
      { id: 'lead_arm', name: 'Lead Arm Straightness', min: 120, max: 180, idealMin: 165, idealMax: 180, current: 140, unit: '°', cue: 'Wide backswing arc width' },
      { id: 'hip_rotation', name: 'Pelvic Downswing Clearance', min: 20, max: 80, idealMin: 40, idealMax: 60, current: 25, unit: '°', cue: 'Clear lead hip early' }
    ],
    cricket: [
      { id: 'front_knee', name: 'Braced Front Knee Delivery Plant', min: 110, max: 180, idealMin: 165, idealMax: 178, current: 135, unit: '°', cue: 'Lock front knee like an iron post' },
      { id: 'bowl_arm', name: 'Delivery Arm Straightness', min: 130, max: 180, idealMin: 165, idealMax: 180, current: 145, unit: '°', cue: '15° legal arm extension' },
      { id: 'trunk_flex', name: 'Trunk Forward Hinge at Release', min: 100, max: 170, idealMin: 120, idealMax: 145, current: 160, unit: '°', cue: 'Vault chest over front leg' }
    ]
  };

  const getInitialJoints = () => {
    const tech = sportRule.techniques?.find(t => t.id === selectedTechId) || sportRule.techniques?.[0];
    if (tech && tech.jointRules && tech.jointRules.length > 0) {
      return tech.jointRules.map(r => ({
        id: r.id,
        name: r.name,
        min: 60,
        max: 180,
        idealMin: r.idealMin,
        idealMax: r.idealMax,
        current: Math.round((r.idealMin + r.idealMax) / 2),
        unit: r.unit || '°',
        cue: r.description || 'Maintain proper biomechanical alignment'
      }));
    }
    return defaultJoints[sportId as keyof typeof defaultJoints] || defaultJoints.rugby;
  };

  const [joints, setJoints] = useState(getInitialJoints());
  const [poseMastered, setPoseMastered] = useState(false);

  // Update joints whenever sportRule or selectedTechId changes
  useEffect(() => {
    const tech = sportRule.techniques?.find(t => t.id === selectedTechId) || sportRule.techniques?.[0];
    if (tech && tech.jointRules && tech.jointRules.length > 0) {
      setJoints(tech.jointRules.map(r => ({
        id: r.id,
        name: r.name,
        min: 60,
        max: 180,
        idealMin: r.idealMin,
        idealMax: r.idealMax,
        current: Math.round((r.idealMin + r.idealMax) / 2),
        unit: r.unit || '°',
        cue: r.description || 'Maintain proper biomechanical alignment'
      })));
    } else {
      const list = defaultJoints[sportId as keyof typeof defaultJoints] || defaultJoints.rugby;
      setJoints(list);
    }
    setPoseMastered(false);
  }, [sportId, selectedTechId, sportRule]);

  useEffect(() => {
    if (sportRule.techniques && sportRule.techniques.length > 0) {
      setSelectedTechId(sportRule.techniques[0].id);
    }
  }, [sportRule]);

  const handleSliderChange = (id: string, val: number) => {
    setJoints(prev => prev.map(j => j.id === id ? { ...j, current: val } : j));
  };

  // Calculate live physics based on current slider values
  const inRangeCount = joints.filter(j => j.current >= j.idealMin && j.current <= j.idealMax).length;
  const matchPercentage = Math.round((inRangeCount / joints.length) * 100);
  const powerWatts = Math.round(450 + (matchPercentage * 4.8));
  const jointSafetyPercent = Math.round(60 + (matchPercentage * 0.38));
  const speedMph = Math.round(40 + (matchPercentage * 0.45));

  useEffect(() => {
    if (matchPercentage === 100 && !poseMastered) {
      setPoseMastered(true);
      setXp(prev => prev + 250);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      if (!achievements.includes('Gold Standard Biomechanics Master')) {
        setAchievements(prev => [...prev, 'Gold Standard Biomechanics Master']);
      }
    }
  }, [matchPercentage, poseMastered, achievements]);

  // --- MODE 2: KINETIC PUZZLE STATE ---
  const baseKineticSteps = [
    { id: 'ground', name: '1. Ground Reaction & Foot Plant', idealIndex: 0, icon: '⚡', desc: 'Anchors foundation & absorbs initial ground kinetic force' },
    { id: 'hips', name: '2. Pelvic Hip Rotation Drive', idealIndex: 1, icon: '🔄', desc: 'Transfers vertical ground drive into horizontal angular momentum' },
    { id: 'torso', name: '3. Thoracic Spine & Shoulder Coil', idealIndex: 2, icon: '🌀', desc: 'Multiplies torque through core elastic recoil' },
    { id: 'arms', name: '4. Upper Arm & Release Whip', idealIndex: 3, icon: '💥', desc: 'Terminal guidance & ball velocity transmission' }
  ];

  // Randomize initial shuffle so it's never the same order twice
  const getShuffledSteps = () => {
    const shuffled = [...baseKineticSteps];
    // Simple Fisher-Yates or deterministic pseudo-random shuffle that isn't already sorted
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    // Ensure it's not accidentally sorted
    if (shuffled.every((s, i) => s.idealIndex === i)) {
      const temp = shuffled[0];
      shuffled[0] = shuffled[1];
      shuffled[1] = temp;
    }
    return shuffled;
  };

  const [puzzleSteps, setPuzzleSteps] = useState(getShuffledSteps);
  const [puzzleSolved, setPuzzleSolved] = useState(false);

  const resetPuzzle = () => {
    setPuzzleSteps(getShuffledSteps());
    setPuzzleSolved(false);
  };

  const moveStep = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= puzzleSteps.length) return;
    const updated = [...puzzleSteps];
    const item = updated.splice(fromIdx, 1)[0];
    updated.splice(toIdx, 0, item);
    setPuzzleSteps(updated);

    // Check if sorted properly: ground (0), hips (1), torso (2), arms (3)
    const isCorrect = updated.every((s, i) => s.idealIndex === i);
    if (isCorrect && !puzzleSolved) {
      setPuzzleSolved(true);
      setXp(prev => prev + 300);
      confetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.5 }
      });
      if (!achievements.includes('Kinetic Whip Sequencer')) {
        setAchievements(prev => [...prev, 'Kinetic Whip Sequencer']);
      }
    }
  };

  const isPuzzleCorrect = puzzleSteps.every((s, i) => s.idealIndex === i);

  // --- MODE 3: FAULT & X-RAY SIMULATOR STATE ---
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
  }> = {
    valgus: {
      title: 'Inward Knee Collapse (Dynamic Valgus)',
      joint: 'Anterior Cruciate Ligament (ACL) & Patellar Cartilage',
      dangerLevel: 'CRITICAL',
      forceLeak: '-32% Vertical Spring & Deceleration Power',
      injuryRisk: 'Severe ACL tear risk and lateral meniscus friction.',
      anatomyDetail: 'When the knee caves inward relative to hip and ankle axes, ground reaction forces shear directly across the ACL rather than compressing safely through the femur-tibia bone line.',
      correctiveCue: '"Land like a feather, knees wide over your toes!"',
      bestDrill: 'Banded Gluteus Medius Monster Walks & Bilateral Soft Drop Jumps',
      drillImage: monsterWalkImg
    },
    spine_extension: {
      title: 'Loss of Spine Hinge / Early Extension',
      joint: 'Lumbar L4-L5 Vertebrae & Quadratus Lumborum',
      dangerLevel: 'HIGH',
      forceLeak: '-24% Rotational Torque & Contact Penetration',
      injuryRisk: 'Lumbar disc herniation, lower back muscle spasm, and erratic trajectory.',
      anatomyDetail: 'Standing up prematurely flattens the pelvis, jamming the lumbar facet joints together and forcing the arms to compensate without core support.',
      correctiveCue: '"Back flat, chest down, feel the wall behind your glutes!"',
      bestDrill: 'Wall Glute-Contact Spine Hinge Holds',
      drillImage: spineHingeImg
    },
    dropped_elbow: {
      title: 'Dropped Elbow / Low Release Pocket',
      joint: 'Rotator Cuff (Supraspinatus) & Medial Elbow Tendon',
      dangerLevel: 'HIGH',
      forceLeak: '-28% Release Height & Arm Lever Whip',
      injuryRisk: 'Medial epicondylitis (Golfer/Thrower elbow) & shoulder impingement.',
      anatomyDetail: 'When the elbow sags below shoulder level during acceleration, the forearm rotates early, subjecting the ulnar collateral ligament to extreme valgus torque.',
      correctiveCue: '"Elbow above the eye, reach high for the stars!"',
      bestDrill: '90° Trophy Pose Wall Alignment Holds',
      drillImage: trophyPoseImg
    },
    leaning_back: {
      title: 'Trunk Hyperextension / Leaning Back at Impact',
      joint: 'Hamstring Origin & Thoracic Paraspinals',
      dangerLevel: 'MODERATE',
      forceLeak: '-35% Ball Compression Velocity',
      injuryRisk: 'Hamstring strain during plant and lumbar facet irritation.',
      anatomyDetail: 'Leaning backward shifts your center of gravity behind the contact zone, causing strikes/shots to balloon high with zero forward penetration.',
      correctiveCue: '"Nose and sternum directly over the contact point!"',
      bestDrill: 'Weighted Chest-Over-Ball Impact Holds',
      drillImage: chestOverBallImg
    }
  };

  const currentFault = faultData[activeFaultId] || faultData.valgus;

  // --- MODE 4: TRIVIA / CHALLENGE STATE ---
  const [triviaIndex, setTriviaIndex] = useState(0);
  const [selectedTriviaOption, setSelectedTriviaOption] = useState<number | null>(null);
  const [triviaScore, setTriviaScore] = useState(0);
  const [triviaCompleted, setTriviaCompleted] = useState(false);

  const triviaQuestions = [
    {
      question: `In ${sportRule.name}, why must power initiate from the lower body and hips before the arms?`,
      options: [
        'To look stylish for match highlight reels',
        'Large leg/hip muscles create massive ground momentum that multiplies upward like a whip',
        'Arms are too heavy to move first',
        'It makes the video camera track better'
      ],
      correctIndex: 1,
      explanation: 'Proximal-to-distal sequencing uses the largest, strongest muscles (glutes & legs) first, multiplying kinetic energy into the lighter extremities for peak terminal speed.'
    },
    {
      question: 'What is Dynamic Knee Valgus and why is it dangerous?',
      options: [
        'A fast sprint cadence that burns extra calories',
        'When the knee buckles inward, placing extreme tearing shear stress on the ACL ligament',
        'A special spin pass technique in rugby',
        'A type of athletic shoe padding'
      ],
      correctIndex: 1,
      explanation: 'Dynamic knee valgus occurs when the knee caves inward relative to the foot, causing up to 400% greater ligament tension on the ACL.'
    },
    {
      question: 'What is the purpose of holding a 3-second isometric pose during corrective drills?',
      options: [
        'It teaches your nervous system and muscle spindles to memorize the exact optimal joint angle',
        'To pause the video for longer coaching notes',
        'To allow your muscles to completely fall asleep',
        'It has no biomechanical effect'
      ],
      correctIndex: 0,
      explanation: 'Isometric keyframe holds build rapid proprioceptive neuromuscular awareness, locking the correct joint coordinates into muscle memory.'
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col gap-6 shadow-[0_0_50px_-12px_rgba(239,68,68,0.2)] overflow-hidden relative"
    >
      {/* Visual background accents */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-amber-600/5 rounded-full blur-3xl pointer-events-none" />
      
      {/* HEADER WITH GAMIFICATION STATUS */}
      <div className="border-b border-zinc-800/80 pb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="bg-gradient-to-br from-red-600 to-amber-600 p-3 rounded-2xl border border-white/10 shadow-xl shadow-red-600/20 text-white"
          >
            <Gamepad2 className="w-6 h-6" />
          </motion.div>
          <div>
            <h2 className="text-lg font-black uppercase italic tracking-tighter text-white flex items-center gap-2">
              <span>Biomechanics Arena</span>
              <span className="bg-amber-500/20 text-amber-400 text-[10px] px-2.5 py-1 rounded-full border border-amber-500/30 not-italic font-mono">
                SIM_v2.4
              </span>
            </h2>
            <p className="text-xs text-zinc-400 font-medium">
              Interactive kinetic physics sandbox. Master joint angles and firing chains.
            </p>
          </div>
        </div>

        {/* XP & LEVEL BADGE */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="flex items-center gap-4 bg-zinc-950/80 border border-zinc-800 px-4 py-2.5 rounded-2xl shadow-inner"
        >
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Athlete Rank</span>
            <span className="text-sm font-black text-amber-400 flex items-center gap-1.5">
              <Trophy className="w-4 h-4" /> Level {level}
            </span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] font-mono text-zinc-500">{xp} / {(level + 1) * 500} XP</span>
            <div className="w-24 bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800 p-0.5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (xp % 500) / 5)}%` }}
                className="bg-gradient-to-r from-red-600 to-amber-500 h-full rounded-full" 
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* GAME MODE NAVIGATION TABS */}
      <div className="flex overflow-x-auto whitespace-nowrap custom-scrollbar pb-2 gap-2.5 bg-zinc-950/50 p-1.5 rounded-2xl border border-zinc-800/60 w-full max-w-full">
        {[
          { id: 'pose_matcher', label: 'Pose Matcher', icon: '🎯', color: 'from-blue-600 to-cyan-600' },
          { id: 'kinetic_puzzle', label: 'Kinetic Chain', icon: '⚡', color: 'from-amber-600 to-yellow-600' },
          { id: 'xray_simulator', label: 'Injury Lab', icon: '🩻', color: 'from-red-600 to-orange-600' },
          { id: 'trivia', label: 'Bio Quiz', icon: '🧠', color: 'from-purple-600 to-pink-600' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setGameMode(tab.id as any)}
            className={`relative px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all group overflow-hidden flex-shrink-0 ${
              gameMode === tab.id
                ? 'text-white'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {gameMode === tab.id && (
              <motion.div 
                layoutId="activeTab"
                className={`absolute inset-0 bg-gradient-to-r ${tab.color} shadow-lg shadow-black/20`}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 text-base">{tab.icon}</span>
            <span className="relative z-10 truncate">{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={gameMode}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {/* ========================================================= */}
          {/* MODE 1: INTERACTIVE POSE MATCHER / ANGLE TUNER */}
          {/* ========================================================= */}
          {gameMode === 'pose_matcher' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* SLIDERS COLUMN */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                <div className="bg-zinc-950/40 border border-zinc-800/80 p-5 rounded-3xl flex flex-col gap-5 backdrop-blur-sm shadow-xl">
                  <div className="flex flex-col gap-3 border-b border-zinc-800 pb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-amber-400 flex items-center gap-2">
                        <Activity className="w-4 h-4" /> Joint Angle Calibration ({sportRule.name})
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                        Snap To Target
                      </span>
                    </div>

                    {/* MOVEMENT / TECHNIQUE SELECTOR */}
                    {sportRule.techniques && sportRule.techniques.length > 0 && (
                      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
                        <span className="text-[10px] font-bold uppercase text-zinc-400 whitespace-nowrap">Movement:</span>
                        {sportRule.techniques.map((tech) => (
                          <button
                            key={tech.id}
                            onClick={() => setSelectedTechId(tech.id)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                              selectedTechId === tech.id
                                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                          >
                            {tech.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {joints.map((joint) => {
                      const inRange = joint.current >= joint.idealMin && joint.current <= joint.idealMax;
                      const isTooLow = joint.current < joint.idealMin;

                      return (
                        <div key={joint.id} className="flex flex-col gap-2.5 bg-zinc-900/40 border border-zinc-800/60 p-4 rounded-2xl hover:border-zinc-700 transition-colors">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-3 h-3 rounded-full ${inRange ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'} transition-all`} />
                              <span className="text-xs font-bold text-zinc-100 uppercase tracking-tight">{joint.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[9px] font-mono text-zinc-500 uppercase">Target {joint.idealMin}°-{joint.idealMax}°</span>
                              <span className={`font-black text-xs px-2.5 py-1 rounded-lg border ${inRange ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'} font-mono`}>
                                {joint.current}{joint.unit}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 px-1">
                            <span className="text-[10px] font-mono text-zinc-600">{joint.min}°</span>
                            <div className="relative flex-1 h-6 flex items-center">
                              {/* Target Zone Highlight */}
                              <div 
                                className="absolute h-1.5 bg-emerald-500/20 rounded-full"
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
                                className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-red-600 relative z-10"
                              />
                            </div>
                            <span className="text-[10px] font-mono text-zinc-600">{joint.max}°</span>
                          </div>

                          <div className="flex items-center justify-between text-[10px] px-1">
                            <span className="text-zinc-500 italic font-medium">Cue: {joint.cue}</span>
                            <span className={`font-black uppercase tracking-wider ${inRange ? 'text-emerald-400' : 'text-amber-500'}`}>
                              {inRange ? '✓ Perfect' : isTooLow ? 'Low Flexion' : 'Over-Extension'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => setJoints(prev => prev.map(j => ({ ...j, current: Math.round((j.idealMin + j.idealMax) / 2) })))}
                      className="flex-1 bg-white hover:bg-zinc-200 text-zinc-950 text-[11px] font-black uppercase tracking-widest py-3 rounded-2xl shadow-xl shadow-white/5 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Activity className="w-4 h-4" /> Snap to Gold Standard
                    </button>
                    <button
                      onClick={() => setJoints(getInitialJoints())}
                      className="p-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-2xl border border-zinc-800 transition-all active:scale-95"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* REAL-TIME PHYSICS GAUGES & CELEBRATION */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="bg-zinc-950/40 border border-zinc-800/80 p-5 rounded-3xl flex flex-col gap-4 h-full shadow-xl">
                  
                  <div className="flex flex-col gap-4">
                    <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" /> Kinetic Engine Telemetry
                    </span>

                    {/* Accuracy Match Circle */}
                    <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 p-5 rounded-2xl flex items-center justify-between shadow-lg relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 rounded-full blur-2xl" />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Accuracy</span>
                        <span className={`text-3xl font-black font-mono tracking-tighter ${matchPercentage === 100 ? 'text-emerald-400' : 'text-white'}`}>
                          {matchPercentage}%
                        </span>
                        <p className="text-[10px] text-zinc-500 font-bold mt-1 uppercase tracking-tight">
                          {matchPercentage === 100 ? '🔥 Legendary Form' : `${inRangeCount}/${joints.length} Checkpoints`}
                        </p>
                      </div>

                      <div className="relative w-16 h-16">
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="45" fill="none" stroke="#27272a" strokeWidth="8" />
                          <motion.circle 
                            cx="50" cy="50" r="45" fill="none" 
                            stroke={matchPercentage === 100 ? '#10b981' : '#dc2626'} 
                            strokeWidth="8"
                            strokeDasharray="283"
                            strokeDashoffset={283 - (283 * matchPercentage) / 100}
                            strokeLinecap="round"
                            transform="rotate(-90 50 50)"
                            transition={{ duration: 1, ease: 'easeOut' }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <CheckCircle2 className={`w-6 h-6 ${matchPercentage === 100 ? 'text-emerald-500 opacity-100' : 'text-zinc-800 opacity-30'} transition-all`} />
                        </div>
                      </div>
                    </div>

                    {/* Physics Metrics Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { label: viewMode === 'student' ? '💥 Super Power' : 'Power', val: powerWatts, unit: viewMode === 'student' ? ' LVL' : 'W', max: 950, color: 'from-amber-500 to-red-500' },
                        { label: viewMode === 'student' ? '🛡️ Armor Level' : 'Safety', val: jointSafetyPercent, unit: '%', max: 100, color: 'from-emerald-500 to-teal-500' }
                      ].map(metric => (
                        <div key={metric.label} className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex flex-col gap-2">
                          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{metric.label}</span>
                          <span className="text-lg font-black text-white font-mono">{metric.val}{metric.unit}</span>
                          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(metric.val / metric.max) * 100}%` }}
                              className={`bg-gradient-to-r ${metric.color} h-full rounded-full`} 
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between group">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-zinc-300 transition-colors">
                        {viewMode === 'student' ? '🚀 Rocket Speed' : 'Exit Velocity (EST)'}
                      </span>
                      <span className="text-xl font-black text-amber-400 font-mono italic">{speedMph} <span className="text-[10px] not-italic">{viewMode === 'student' ? 'MPH' : 'MPH'}</span></span>
                    </div>
                  </div>

                  <div className="bg-zinc-900/80 border border-zinc-800/80 p-4 rounded-2xl flex flex-col gap-2 mt-auto">
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Info className="w-4 h-4" /> Biomechanical Diagnostics
                    </span>
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">
                      {matchPercentage === 100 
                        ? "Flawless technical alignment. Peak torque transfer achieved across all kinetic segments with optimal joint protection."
                        : matchPercentage >= 66
                        ? `Structural sync detected. Minimal ${100 - matchPercentage}% power leak observed. Fine-tune red joint markers for elite output.`
                        : "Biomechanical structural breach. Significant force leakage and high joint shear stress. Recalibrate immediately."}
                    </p>
                  </div>

                </div>
              </div>

            </div>
          )}

      {/* ========================================================= */}
      {/* MODE 2: KINETIC CHAIN SEQUENCING PUZZLE */}
      {/* ========================================================= */}
      {gameMode === 'kinetic_puzzle' && (
        <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-xl flex flex-col gap-4">
          <div className="border-b border-zinc-850 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-black uppercase text-amber-400 flex items-center gap-2">
                <Zap className="w-4 h-4" /> Kinetic Firing Sequence Puzzle
              </h3>
              <p className="text-[11px] text-zinc-400">
                Order the kinetic segments from ground reaction up to release whip. Use the arrow buttons to move steps!
              </p>
            </div>
            <span className={`text-xs font-black px-3 py-1 rounded-lg border font-mono ${isPuzzleCorrect ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' : 'bg-red-950 text-red-300 border-red-500/40'}`}>
              {isPuzzleCorrect ? '✓ PERFECT PROXIMAL-TO-DISTAL FLOW' : '⚠️ TIMING SEQUENCE BREAK DETECTED'}
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {puzzleSteps.map((step, idx) => {
              const isStepCorrect = step.idealIndex === idx;

              return (
                <div
                  key={step.id}
                  className={`border p-3 rounded-xl flex items-center justify-between transition-all ${
                    isStepCorrect 
                      ? 'bg-zinc-900 border-emerald-500/40 text-zinc-200' 
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-xs font-black flex items-center justify-center text-amber-400">
                      #{idx + 1}
                    </span>
                    <span className="text-base">{step.icon}</span>
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-white">{step.name}</span>
                      <span className="text-[10px] text-zinc-500">{step.desc}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      disabled={idx === 0}
                      onClick={() => moveStep(idx, idx - 1)}
                      className="p-1.5 bg-zinc-950 hover:bg-zinc-800 disabled:opacity-30 border border-zinc-800 rounded-md text-zinc-300 transition-all"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={idx === puzzleSteps.length - 1}
                      onClick={() => moveStep(idx, idx + 1)}
                      className="p-1.5 bg-zinc-950 hover:bg-zinc-800 disabled:opacity-30 border border-zinc-800 rounded-md text-zinc-300 transition-all"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* KINETIC WAVE PULSE FEEDBACK */}
          {isPuzzleCorrect ? (
            <div className="bg-gradient-to-r from-emerald-950 via-zinc-900 to-emerald-950 border border-emerald-500/40 p-4 rounded-xl flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-3">
                <Flame className="w-6 h-6 text-emerald-400 animate-bounce" />
                <div>
                  <span className="text-xs font-black uppercase text-emerald-300 block">Flawless Kinetic Whip Flow Unlocked!</span>
                  <p className="text-[11px] text-zinc-400">
                    Energy propels from the ground into the hips, coils through the spine, and snaps out through the extremities with zero force leakage.
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-950 px-3 py-1.5 rounded-lg border border-emerald-500/30">
                100% Energy Whip
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="bg-red-950/40 border border-red-500/30 p-3.5 rounded-xl flex items-center justify-between text-xs">
                <span className="text-red-300 font-medium">
                  ⚠️ Current sequence causes an upper-body hitch. Move Ground Reaction to #1 and Pelvic Hips to #2!
                </span>
                <button
                  onClick={() => setPuzzleSteps([...baseKineticSteps].sort((a, b) => a.idealIndex - b.idealIndex))}
                  className="text-[10px] font-bold text-amber-400 bg-zinc-950 px-2.5 py-1.5 rounded border border-zinc-800 hover:bg-zinc-900 shrink-0"
                >
                  Auto-Solve Sequence
                </button>
              </div>

              {/* Exact Diagnostic Analysis: Where it went wrong & how to fix it */}
              <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col gap-3">
                <div className="flex items-center gap-2 border-b border-zinc-850 pb-2">
                  <ShieldAlert className="w-4 h-4 text-red-500" />
                  <h4 className="text-xs font-black uppercase text-white tracking-wide">
                    Kinetic Breakdown & Correction Diagnostics
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-zinc-950 p-3 rounded-lg border border-red-500/20 flex flex-col gap-1.5">
                    <span className="text-[10px] font-mono text-red-400 uppercase font-black">❌ Where the Sequence Went Wrong:</span>
                    <p className="text-zinc-300 leading-relaxed text-[11px]">
                      {puzzleSteps[0].idealIndex !== 0 
                        ? `The chain incorrectly initiates with "${puzzleSteps[0].name}" instead of Ground Reaction. Initiating force from the upper body prematurely fires upper limb muscles before heavy core/hip momentum is generated, resulting in a severe kinetic hitch and -35% power loss.`
                        : `The kinetic energy transmission stalls at segment #${puzzleSteps.findIndex(s => s.idealIndex !== puzzleSteps.indexOf(s)) + 1}. Premature arm acceleration cuts off the hip coil, forcing joints to absorb unfiltered recoil shock.`
                      }
                    </p>
                  </div>

                  <div className="bg-zinc-950 p-3 rounded-lg border border-emerald-500/20 flex flex-col gap-1.5">
                    <span className="text-[10px] font-mono text-emerald-400 uppercase font-black">⚡ Exact Correction Protocol:</span>
                    <ul className="text-zinc-300 leading-relaxed text-[11px] list-disc list-inside flex flex-col gap-1">
                      <li><strong>Step 1:</strong> Anchor lead foot firmly to establish ground reaction force first.</li>
                      <li><strong>Step 2:</strong> Rotate pelvis aggressively toward target before arms begin accelerating.</li>
                      <li><strong>Step 3:</strong> Whip extremities through terminal release with relaxed, elastic velocity.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

          {/* ========================================================= */}
          {/* MODE 3: INJURY X-RAY & FAULT SIMULATOR */}
          {/* ========================================================= */}
          {gameMode === 'xray_simulator' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* FAULT BUTTON SELECTOR */}
              <div className="lg:col-span-4 flex flex-col gap-2.5 bg-zinc-950/40 border border-zinc-800/80 p-4 rounded-3xl shadow-xl">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1 mb-1">
                  Simulate Movement Fault:
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
                    className={`p-3.5 rounded-2xl text-left text-xs font-bold flex items-center justify-between transition-all group overflow-hidden relative ${
                      activeFaultId === f.id
                        ? 'bg-red-600 text-white shadow-xl shadow-red-600/20'
                        : 'bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 relative z-10">
                      <span className="text-lg">{f.icon}</span>
                      <span className="font-black uppercase tracking-tight">{f.name}</span>
                    </div>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-black relative z-10 ${activeFaultId === f.id ? 'bg-white/20' : 'bg-zinc-950 text-zinc-500'}`}>
                      {f.danger}
                    </span>
                  </button>
                ))}
              </div>

              {/* X-RAY DIAGNOSTIC DOSSIER */}
              <div className="lg:col-span-8 bg-zinc-950/40 border border-zinc-800/80 p-6 rounded-3xl flex flex-col gap-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-red-600/5 rounded-full blur-3xl" />
                
                <div className="flex flex-col gap-5 relative z-10">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-red-600/20 flex items-center justify-center text-red-500 border border-red-500/20">
                        <ShieldAlert className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-black uppercase text-white tracking-widest italic">
                        {currentFault.title}
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono bg-red-600/10 border border-red-500/20 text-red-400 px-3 py-1 rounded-full font-black uppercase">
                      Leak: {currentFault.forceLeak}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Diagnostic Info */}
                    <div className="flex flex-col gap-4">
                      <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl flex flex-col gap-2 shadow-inner">
                        <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Anatomical Focus:</span>
                        <span className="text-xs font-black text-amber-500 uppercase">{currentFault.joint}</span>
                        <p className="text-[11px] text-zinc-300 leading-relaxed font-medium">
                          {currentFault.anatomyDetail}
                        </p>
                      </div>

                      <div className="bg-red-600/10 border border-red-500/20 p-4 rounded-2xl flex items-start gap-3">
                        <Info className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black uppercase text-red-400 tracking-widest">Injury Mechanism:</span>
                          <p className="text-[11px] text-zinc-300 font-medium leading-relaxed">{currentFault.injuryRisk}</p>
                        </div>
                      </div>
                    </div>

                    {/* Drill Image Preview */}
                    <div className="flex flex-col gap-3">
                      <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Corrective Visualization:</span>
                      <div className="aspect-video bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden relative group shadow-2xl">
                        <img 
                          src={currentFault.drillImage} 
                          alt="Drill Technique"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-60" />
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                          <span className="text-[10px] font-black text-white bg-red-600 px-2 py-1 rounded shadow-lg uppercase tracking-widest">Action Required</span>
                          <span className="text-[9px] text-zinc-400 bg-black/80 px-2 py-1 rounded backdrop-blur-md border border-white/10 font-mono uppercase tracking-widest">Biometric Render</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-5 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest mb-1">Prescription Cue:</span>
                    <span className="text-sm font-black text-white italic tracking-tight uppercase leading-none mb-1">"{currentFault.correctiveCue}"</span>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">{currentFault.bestDrill}</span>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onApplyDrill?.(currentFault.bestDrill)}
                    className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs px-6 py-3.5 rounded-2xl shadow-xl shadow-emerald-900/20 border border-white/10 flex items-center justify-center gap-2 tracking-widest uppercase transition-all"
                  >
                    <span>Activate Correction Drill</span>
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                </div>

              </div>

            </div>
          )}

      {/* ========================================================= */}
      {/* MODE 4: BIOMECHANICS TRIVIA & MASTERY QUIZ */}
      {/* ========================================================= */}
      {gameMode === 'trivia' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-zinc-950/40 border border-zinc-800/80 p-6 rounded-3xl flex flex-col gap-5 shadow-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          
          {!triviaCompleted ? (
            <div className="flex flex-col gap-5 relative z-10">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                <span className="text-[10px] font-black uppercase text-amber-400 tracking-widest flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" /> Challenge {triviaIndex + 1} of {triviaQuestions.length}
                </span>
                <span className="text-[10px] font-mono text-zinc-500 font-black uppercase tracking-widest bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
                  Score: {triviaScore} / {triviaQuestions.length}
                </span>
              </div>

              <h3 className="text-base font-black text-white leading-relaxed italic tracking-tight">
                {triviaQuestions[triviaIndex].question}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {triviaQuestions[triviaIndex].options.map((opt, optIdx) => {
                  const isSelected = selectedTriviaOption === optIdx;
                  const isCorrect = optIdx === triviaQuestions[triviaIndex].correctIndex;

                  return (
                    <button
                      key={optIdx}
                      disabled={selectedTriviaOption !== null}
                      onClick={() => handleTriviaAnswer(optIdx)}
                      className={`p-4 rounded-2xl text-left text-[11px] font-black uppercase tracking-tight border transition-all relative overflow-hidden group ${
                        selectedTriviaOption === null
                          ? 'bg-zinc-900/60 hover:bg-zinc-800 border-zinc-800 text-zinc-300'
                          : isCorrect
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-xl shadow-emerald-600/20'
                          : isSelected
                          ? 'bg-red-600 text-white border-red-500 shadow-xl shadow-red-600/20'
                          : 'bg-zinc-900/40 border-zinc-850 text-zinc-600'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 relative z-10">
                        <span className={`w-6 h-6 rounded-lg font-mono font-black flex items-center justify-center border transition-colors ${
                          selectedTriviaOption === null ? 'bg-zinc-950 border-zinc-800 text-zinc-500' : 'bg-white/20 border-white/20 text-white'
                        }`}>
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="flex-1">{opt}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Explanation & Next Question */}
              <AnimatePresence>
                {selectedTriviaOption !== null && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col gap-4 shadow-inner mt-2"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-amber-500/10 p-2 rounded-xl border border-amber-500/20 text-amber-500">
                        <Info className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase text-amber-500 tracking-widest">Kinetic Insight</span>
                        <p className="text-[11px] text-zinc-300 leading-relaxed font-medium">
                          {triviaQuestions[triviaIndex].explanation}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={handleNextTrivia}
                        className="bg-white hover:bg-zinc-200 text-zinc-950 font-black text-[10px] uppercase tracking-widest px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-xl shadow-white/5 transition-all active:scale-95"
                      >
                        <span>Advance Analysis</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-10 flex flex-col items-center gap-4 relative z-10">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                transition={{ type: 'spring', duration: 0.8 }}
                className="w-20 h-20 bg-gradient-to-tr from-amber-500 to-yellow-400 rounded-3xl flex items-center justify-center text-black shadow-2xl shadow-amber-500/30 border-2 border-amber-200"
              >
                <Award className="w-10 h-10" />
              </motion.div>
              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-black uppercase italic text-white tracking-tighter">Bio-Quiz Mastered!</h3>
                <p className="text-xs text-zinc-400 font-medium">
                  Mastery Score: <strong className="text-amber-400 font-mono">{triviaScore} / {triviaQuestions.length}</strong>
                </p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 px-5 py-3 rounded-2xl text-[10px] text-zinc-500 font-black uppercase tracking-widest">
                Unlocked: Biomechanical Scholar Badge
              </div>
              <button
                onClick={() => {
                  setTriviaIndex(0);
                  setSelectedTriviaOption(null);
                  setTriviaScore(0);
                  setTriviaCompleted(false);
                }}
                className="mt-2 bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-black uppercase tracking-widest px-8 py-3 rounded-2xl border border-zinc-700 transition-all active:scale-95"
              >
                Reset Challenge
              </button>
            </div>
          )}

        </motion.div>
      )}

    </motion.div>
  </AnimatePresence>

  {/* UNLOCKED BADGES FOOTER */}
  <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs relative overflow-hidden">
    <div className="absolute top-0 left-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl" />
    <div className="flex items-center gap-3 relative z-10">
      <Trophy className="w-5 h-5 text-amber-500 shrink-0" />
      <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Athlete Hall of Fame:</span>
    </div>
    <div className="flex flex-wrap gap-2 relative z-10">
      {achievements.map((badge, bIdx) => (
        <motion.span 
          key={bIdx}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: bIdx * 0.1 }}
          className="bg-zinc-900 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase tracking-tight px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-lg"
        >
          <span>🏆</span> {badge}
        </motion.span>
      ))}
    </div>
  </div>

</motion.div>
);
};
