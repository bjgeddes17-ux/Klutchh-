import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Shield, 
  Flame, 
  Trophy, 
  Sparkles, 
  Swords, 
  RotateCcw, 
  Award, 
  Activity, 
  Heart,
  Volume2,
  VolumeX,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SportRule, AICoachingReport } from '../types';

interface Props {
  sportRule: SportRule;
  aiReport?: AICoachingReport | null;
  athleteName?: string;
  dynamicMetrics?: any;
  sequenceComparison?: any;
  overallSymmetry?: number;
  overallKneeSafety?: number;
  onExplainerClick?: (metric: any) => void;
  onPlayVoiceCoach?: () => void;
  isPlayingAudio?: boolean;
}

export const KineticTitanBattleCard: React.FC<Props> = ({
  sportRule,
  aiReport,
  athleteName = 'Athlete',
  dynamicMetrics,
  sequenceComparison,
  overallSymmetry,
  overallKneeSafety,
  onExplainerClick,
  onPlayVoiceCoach,
  isPlayingAudio = false
}) => {
  const [viewMode, setViewMode] = useState<'battle' | 'stats'>('battle');
  
  // RPG Battle State
  const [playerHp, setPlayerHp] = useState(100);
  const [bossHp, setBossHp] = useState(1000);
  const [bossMaxHp] = useState(1000);
  const [turn, setTurn] = useState<'player' | 'boss'>('player');
  const [battleLog, setBattleLog] = useState<string[]>(['⚔️ Gravitational Overload Boss appeared! Use your biomechanical powers to defeat him!']);
  const [isAttacking, setIsAttacking] = useState(false);
  const [bossShake, setBossShake] = useState(false);
  const [playerShake, setPlayerShake] = useState(false);
  const [victory, setVictory] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [energy, setEnergy] = useState(100);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Dynamic player stats based on video analysis metrics
  const powerScore = Math.min(98, Math.max(72, dynamicMetrics?.explosivenessScore || 85));
  const armorScore = Math.min(98, Math.max(75, overallKneeSafety || (sequenceComparison as any)?.kneeSafetyScore || 88));
  const precisionScore = Math.min(98, Math.max(72, Math.round((dynamicMetrics?.estimatedPeakTorque || 8.2) * 10)));
  const flowScore = Math.min(98, Math.max(72, overallSymmetry || (sequenceComparison as any)?.overallSymmetry || 85));

  // Sound generator
  const playSound = (freq: number, type: OscillatorType = 'sine', duration: number = 0.15) => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio permitted upon user interaction
    }
  };

  // Player Moves
  const performMove = (moveType: 'hip_explosion' | 'titan_armor' | 'kinetic_whip' | 'super_surge') => {
    if (turn !== 'player' || isAttacking || bossHp <= 0) return;

    setIsAttacking(true);
    let damage = 0;
    let logMsg = '';

    if (moveType === 'hip_explosion') {
      damage = Math.round(280 + (powerScore * 1.5));
      logMsg = `💥 ${athleteName} unleashed EXPLOSIVE HIP DRIVE! Dealt ${damage} damage!`;
      playSound(440, 'sawtooth', 0.25);
    } else if (moveType === 'titan_armor') {
      const heal = 35;
      damage = Math.round(120 + (armorScore * 0.8));
      setPlayerHp((prev) => Math.min(100, prev + heal));
      logMsg = `🛡️ ${athleteName} raised TITAN JOINT ARMOR! Restored ${heal} HP and dealt ${damage} shockwave damage!`;
      playSound(600, 'triangle', 0.3);
    } else if (moveType === 'kinetic_whip') {
      damage = Math.round(380 + (flowScore * 1.8));
      logMsg = `🌀 ${athleteName} executed KINETIC CHAIN WHIP! Critical strike for ${damage} damage!`;
      playSound(750, 'sawtooth', 0.3);
    } else if (moveType === 'super_surge') {
      damage = Math.round(550 + (precisionScore * 2.2));
      logMsg = `⚡ ULTIMATE TITAN STRIKE! ${athleteName} channeled Gold Standard Biomechanics for ${damage} MEGA DAMAGE!`;
      playSound(880, 'square', 0.4);
    }

    setBossShake(true);
    setTimeout(() => setBossShake(false), 500);

    const newBossHp = Math.max(0, bossHp - damage);
    setBossHp(newBossHp);
    setBattleLog((prev) => [logMsg, ...prev.slice(0, 3)]);

    if (newBossHp <= 0) {
      setVictory(true);
      setXpEarned(500);
      setIsAttacking(false);
      playSound(900, 'sine', 0.5);
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 }
      });
      return;
    }

    // Boss Turn Counterattack
    setTurn('boss');
    setTimeout(() => {
      const bossAttack = Math.floor(Math.random() * 3);
      let bossDamage = 0;
      let bossMsg = '';

      if (bossAttack === 0) {
        bossDamage = 18;
        bossMsg = `👾 Gravitational Boss used "Form Drag"! Dealt ${bossDamage} fatigue damage.`;
      } else if (bossAttack === 1) {
        bossDamage = 24;
        bossMsg = `👾 Gravitational Boss used "Energy Leak"! Dealt ${bossDamage} damage.`;
      } else {
        bossDamage = 12;
        bossMsg = `👾 Gravitational Boss tried "Muscle Stiffness"! ${athleteName}'s armor absorbed most of it (${bossDamage} dmg).`;
      }

      setPlayerShake(true);
      setTimeout(() => setPlayerShake(false), 500);
      setPlayerHp((prev) => Math.max(10, prev - bossDamage));
      setBattleLog((prev) => [bossMsg, ...prev.slice(0, 3)]);
      setTurn('player');
      setIsAttacking(false);
      playSound(220, 'sawtooth', 0.2);
    }, 1000);
  };

  const resetBattle = () => {
    setPlayerHp(100);
    setBossHp(1000);
    setTurn('player');
    setVictory(false);
    setIsAttacking(false);
    setBattleLog(['⚔️ Boss Battle Reset! Unleash your kinetic power!']);
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-amber-950/90 via-zinc-950 to-purple-950/90 border-2 border-amber-500/50 rounded-3xl p-5 sm:p-6 shadow-[0_0_40px_rgba(245,158,11,0.25)] flex flex-col gap-5">
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar: Athlete Identity & View Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 z-10 relative">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-400 to-amber-500 text-black font-black text-2xl flex items-center justify-center shadow-lg shadow-amber-500/40 border-2 border-amber-200 shrink-0">
            {aiReport?.gamifiedKidDossier?.earnedBadge?.icon || '🏆'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-widest bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-500/40">
                ATHLETE: {athleteName.toUpperCase()} • LVL 5 TITAN
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                ⚡ POWER LEVEL: {Math.round(powerScore * 10)} XP
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white italic tracking-wide uppercase mt-1">
              {athleteName}'s Kinetic Titan RPG Arena
            </h2>
          </div>
        </div>

        {/* Action Toggles: Battle vs Stats & Voice Coach */}
        <div className="flex items-center gap-2 flex-wrap z-10">
          <div className="flex bg-zinc-950/80 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setViewMode('battle')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                viewMode === 'battle' ? 'bg-amber-500 text-zinc-950 shadow font-extrabold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Swords className="w-3.5 h-3.5" />
              <span>🎮 Boss Battle</span>
            </button>
            <button
              onClick={() => setViewMode('stats')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                viewMode === 'stats' ? 'bg-amber-500 text-zinc-950 shadow font-extrabold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>📊 Telemetry Stats</span>
            </button>
          </div>

          {onPlayVoiceCoach && (
            <button
              type="button"
              onClick={onPlayVoiceCoach}
              className={`px-3.5 py-2 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg transition-all transform hover:scale-105 border ${
                isPlayingAudio 
                  ? 'bg-red-500 text-white border-red-400 animate-pulse' 
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400 hover:from-purple-500 hover:to-indigo-500'
              }`}
            >
              <span>{isPlayingAudio ? '🔴' : '🎙️'}</span>
              <span>{isPlayingAudio ? 'Stop Voice' : 'Coach Voice'}</span>
            </button>
          )}

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition-all ${
              soundEnabled ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-zinc-950 border-zinc-800 text-zinc-600'
            }`}
            title="Toggle Sound"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* VIEW 1: INTERACTIVE BOSS BATTLE GAME */}
      {viewMode === 'battle' ? (
        <div className="flex flex-col gap-4 z-10">
          {/* Battle Arena Stage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-950/80 border border-zinc-800/90 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
            
            {/* Player Side */}
            <motion.div 
              animate={playerShake ? { x: [-10, 10, -5, 5, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="flex flex-col gap-3 bg-zinc-900/60 border border-blue-500/30 p-4 rounded-xl relative"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <span className="text-xs font-black uppercase text-blue-400 tracking-wider">HERO TITAN</span>
                    <h3 className="text-sm font-black text-white">{athleteName}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-emerald-400 text-xs font-mono font-bold">
                  <Heart className="w-3.5 h-3.5 fill-current" />
                  <span>{playerHp} / 100 HP</span>
                </div>
              </div>

              {/* Player HP Bar */}
              <div className="w-full bg-zinc-950 h-3 rounded-full overflow-hidden border border-zinc-800">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 rounded-full"
                  style={{ width: `${playerHp}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-zinc-400 pt-1">
                <span>💥 Power: <b className="text-amber-400">{powerScore}%</b></span>
                <span>🛡️ Armor: <b className="text-emerald-400">{armorScore}%</b></span>
              </div>
            </motion.div>

            {/* Boss Side */}
            <motion.div 
              animate={bossShake ? { x: [-15, 15, -10, 10, 0], scale: [1, 1.05, 0.95, 1] } : {}}
              transition={{ duration: 0.4 }}
              className="flex flex-col gap-3 bg-zinc-900/60 border border-red-500/30 p-4 rounded-xl relative"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl animate-pulse">👾</span>
                  <div>
                    <span className="text-xs font-black uppercase text-red-400 tracking-wider">BOSS ENEMY</span>
                    <h3 className="text-sm font-black text-white">Gravitational Overload</h3>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-red-400 text-xs font-mono font-bold">
                  <Heart className="w-3.5 h-3.5 fill-current" />
                  <span>{bossHp} / {bossMaxHp} HP</span>
                </div>
              </div>

              {/* Boss HP Bar */}
              <div className="w-full bg-zinc-950 h-3 rounded-full overflow-hidden border border-zinc-800">
                <div 
                  className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 transition-all duration-300 rounded-full"
                  style={{ width: `${(bossHp / bossMaxHp) * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pt-1">
                <span>Weakness: <b className="text-amber-400">Explosive Hip Hinge</b></span>
                <span className="text-red-400 font-bold">{bossHp > 0 ? 'FIGHTING' : 'DEFEATED!'}</span>
              </div>
            </motion.div>
          </div>

          {/* Battle Action Buttons or Victory Banner */}
          {victory ? (
            <div className="bg-gradient-to-r from-amber-500/20 via-yellow-400/30 to-amber-500/20 border-2 border-amber-400 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-400 text-zinc-950 flex items-center justify-center text-2xl font-black shadow-lg">
                  🏆
                </div>
                <div>
                  <h3 className="text-lg font-black text-white uppercase italic">
                    VICTORY! {athleteName.toUpperCase()} DEFEATED THE GRAVITY BOSS!
                  </h3>
                  <p className="text-xs text-amber-200 font-medium">
                    You mastered the {sportRule.name} kinetic chain! +500 XP Awarded!
                  </p>
                </div>
              </div>
              <button
                onClick={resetBattle}
                className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all"
              >
                ⚔️ Play Again
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-zinc-400">
                <span>Choose Your Kinetic Strike:</span>
                <span className="text-amber-400 font-mono">Turn: {turn === 'player' ? 'Your Move!' : 'Boss Moving...'}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  disabled={turn !== 'player' || isAttacking}
                  onClick={() => performMove('hip_explosion')}
                  className="bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 border border-amber-500/40 hover:border-amber-400 p-3 rounded-xl flex flex-col items-start gap-1 text-left transition-all active:scale-95 group shadow-md"
                >
                  <span className="text-base">💥</span>
                  <span className="text-xs font-black text-white group-hover:text-amber-300 uppercase">Hip Drive Strike</span>
                  <span className="text-[10px] text-zinc-400 font-mono">~350 DMG • Fast</span>
                </button>

                <button
                  disabled={turn !== 'player' || isAttacking}
                  onClick={() => performMove('titan_armor')}
                  className="bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 border border-emerald-500/40 hover:border-emerald-400 p-3 rounded-xl flex flex-col items-start gap-1 text-left transition-all active:scale-95 group shadow-md"
                >
                  <span className="text-base">🛡️</span>
                  <span className="text-xs font-black text-white group-hover:text-emerald-300 uppercase">Titan Armor Shield</span>
                  <span className="text-[10px] text-zinc-400 font-mono">+35 HP • Cushion</span>
                </button>

                <button
                  disabled={turn !== 'player' || isAttacking}
                  onClick={() => performMove('kinetic_whip')}
                  className="bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 border border-purple-500/40 hover:border-purple-400 p-3 rounded-xl flex flex-col items-start gap-1 text-left transition-all active:scale-95 group shadow-md"
                >
                  <span className="text-base">🌀</span>
                  <span className="text-xs font-black text-white group-hover:text-purple-300 uppercase">Kinetic Chain Whip</span>
                  <span className="text-[10px] text-zinc-400 font-mono">~450 DMG • Crit</span>
                </button>

                <button
                  disabled={turn !== 'player' || isAttacking}
                  onClick={() => performMove('super_surge')}
                  className="bg-gradient-to-r from-red-600 via-amber-500 to-yellow-500 disabled:opacity-50 border border-amber-300 p-3 rounded-xl flex flex-col items-start gap-1 text-left transition-all active:scale-95 group shadow-lg text-zinc-950 font-extrabold"
                >
                  <span className="text-base">⚡</span>
                  <span className="text-xs font-black uppercase">Ultimate Strike</span>
                  <span className="text-[10px] opacity-90 font-mono">~650 MEGA DMG</span>
                </button>
              </div>
            </div>
          )}

          {/* Battle Action Log */}
          <div className="bg-zinc-950/90 border border-zinc-800/80 p-2.5 rounded-xl flex flex-col gap-1 text-[11px] font-mono">
            {battleLog.map((log, lIdx) => (
              <p key={lIdx} className={`${lIdx === 0 ? 'text-amber-300 font-bold' : 'text-zinc-500'}`}>
                {log}
              </p>
            ))}
          </div>
        </div>
      ) : (
        /* VIEW 2: TELEMETRY STATS BARS */
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-amber-500/20 z-10">
          {[
            { 
              id: 'explosive_power',
              label: '⚡ Explosive Power', 
              score: powerScore, 
              color: 'from-amber-500 to-yellow-400',
              meaning: 'Measures how rapidly ground force transfers into terminal movement velocity.'
            },
            { 
              id: 'joint_armor',
              label: '🛡️ Joint Armor', 
              score: armorScore, 
              color: 'from-emerald-500 to-teal-400',
              meaning: 'Quantifies ligament protection and shock absorption capacity during plant.'
            },
            { 
              id: 'precision',
              label: '🎯 Precision', 
              score: precisionScore, 
              color: 'from-blue-500 to-cyan-400',
              meaning: 'Evaluates alignment against gold standard pro biomechanical checkpoints.'
            },
            { 
              id: 'kinetic_flow',
              label: '🔄 Kinetic Flow', 
              score: flowScore, 
              color: 'from-purple-500 to-pink-400',
              meaning: 'Measures seamless kinetic energy transmission through the whole body.'
            }
          ].map((attr) => (
            <div 
              key={attr.id} 
              onClick={() => onExplainerClick && onExplainerClick(attr)}
              className="bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 p-2.5 rounded-xl flex flex-col gap-1 cursor-pointer transition-all group"
            >
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-zinc-300 group-hover:text-amber-300 transition-colors">{attr.label}</span>
                <span className="font-mono text-amber-400 font-black">{attr.score}%</span>
              </div>
              <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className={`bg-gradient-to-r ${attr.color} h-full rounded-full transition-all duration-1000`}
                  style={{ width: `${attr.score}%` }}
                />
              </div>
              <span className="text-[8px] font-mono text-zinc-500 group-hover:text-zinc-400 text-right">Tap for Telemetry ↗</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
