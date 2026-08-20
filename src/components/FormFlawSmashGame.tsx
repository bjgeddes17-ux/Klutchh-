import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, 
  Trophy, 
  RotateCcw, 
  Zap, 
  ShieldAlert, 
  CheckCircle2, 
  Volume2, 
  VolumeX,
  Clock,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SportRule } from '../types';

interface Props {
  sportRule: SportRule;
  athleteName?: string;
  onEarnXp?: (amount: number) => void;
}

interface GridCard {
  id: string;
  text: string;
  type: 'flaw' | 'gold_standard';
  icon: string;
  points: number;
}

export const FormFlawSmashGame: React.FC<Props> = ({
  sportRule,
  athleteName = 'Athlete',
  onEarnXp
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem(`klutchh_flaw_smash_hs_${sportRule.id}`) || '0', 10);
  });
  const [timeLeft, setTimeLeft] = useState(25);
  const [combo, setCombo] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [grid, setGrid] = useState<(GridCard | null)[]>(Array(9).fill(null));
  const [smashedIndices, setSmashedIndices] = useState<number[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const spawnTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sport-specific flaw and gold standard item definitions
  const itemsPool: GridCard[] = [
    // Flaws to SMASH!
    { id: 'f1', text: 'Dropping Elbow', type: 'flaw', icon: '💥', points: 100 },
    { id: 'f2', text: 'Collapsed Plant Knee', type: 'flaw', icon: '💥', points: 100 },
    { id: 'f3', text: 'Lazy Spine Posture', type: 'flaw', icon: '💥', points: 100 },
    { id: 'f4', text: 'Early Hip Opening', type: 'flaw', icon: '💥', points: 100 },
    { id: 'f5', text: 'Stiff Landing Impact', type: 'flaw', icon: '💥', points: 100 },
    { id: 'f6', text: 'Over-Rotating Head', type: 'flaw', icon: '💥', points: 100 },
    // Gold Standard to PROTECT (Don't Smash!)
    { id: 'g1', text: 'Chest Over Ball', type: 'gold_standard', icon: '🌟', points: -75 },
    { id: 'g2', text: 'Iron Knee Cushion', type: 'gold_standard', icon: '🛡️', points: -75 },
    { id: 'g3', text: 'Smooth Follow Through', type: 'gold_standard', icon: '✨', points: -75 },
    { id: 'g4', text: 'Eyes on Target', type: 'gold_standard', icon: '🎯', points: -75 }
  ];

  // Sound Synth
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
    } catch (e) {}
  };

  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    setCombo(0);
    setTimeLeft(25);
    setGrid(Array(9).fill(null));
    setSmashedIndices([]);
  };

  // Game Timer Countdown
  useEffect(() => {
    if (!isPlaying) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          clearInterval(spawnTimerRef.current!);
          setIsPlaying(false);
          playSound(600, 'triangle', 0.4);
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  // Spawning Cards on Grid
  useEffect(() => {
    if (!isPlaying) return;

    spawnTimerRef.current = setInterval(() => {
      setGrid((currentGrid) => {
        const nextGrid = [...currentGrid];
        // Clear 1-2 random slots
        const clearIdx = Math.floor(Math.random() * 9);
        nextGrid[clearIdx] = null;

        // Spawn 1-2 items in empty slots
        const emptyIndices = nextGrid.map((val, idx) => (val === null ? idx : null)).filter((v): v is number => v !== null);
        if (emptyIndices.length > 0) {
          const spawnIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
          const randomItem = itemsPool[Math.floor(Math.random() * itemsPool.length)];
          nextGrid[spawnIdx] = randomItem;
        }
        return nextGrid;
      });
    }, 700);

    return () => {
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
    };
  }, [isPlaying]);

  const handleCardClick = (index: number) => {
    if (!isPlaying) return;
    const card = grid[index];
    if (!card) return;

    setSmashedIndices((prev) => [...prev, index]);
    setTimeout(() => {
      setSmashedIndices((prev) => prev.filter((i) => i !== index));
    }, 300);

    if (card.type === 'flaw') {
      // SMASHED A BAD HABIT!
      const gained = card.points * (1 + combo * 0.1);
      setScore((s) => {
        const next = Math.round(s + gained);
        if (next > highScore) {
          setHighScore(next);
          localStorage.setItem(`klutchh_flaw_smash_hs_${sportRule.id}`, next.toString());
        }
        return next;
      });
      setCombo((c) => c + 1);
      playSound(700, 'sawtooth', 0.15);
      if (onEarnXp) onEarnXp(20);
    } else {
      // OOPS! SMASHED A GOLD STANDARD HABIT
      setScore((s) => Math.max(0, s + card.points));
      setCombo(0);
      playSound(200, 'square', 0.2);
    }

    // Remove from grid
    setGrid((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  };

  return (
    <div className="bg-zinc-900 border-2 border-red-500/40 rounded-3xl p-5 sm:p-7 flex flex-col gap-6 shadow-[0_0_40px_rgba(239,68,68,0.15)] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4 z-10">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-red-500/20">
            🥊
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-500/30">
                RAPID SMASH ARCADE
              </span>
              <span className="text-[10px] font-mono text-zinc-400">
                25-Second Form Eliminator
              </span>
            </div>
            <h2 className="text-xl font-black text-white uppercase italic tracking-wide mt-0.5">
              Smash The Form Flaws!
            </h2>
          </div>
        </div>

        {/* Score & Timer Badges */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="bg-zinc-950/90 border border-zinc-800 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-zinc-500 uppercase">Time Left</span>
              <span className={`text-xs font-mono font-black ${timeLeft <= 5 ? 'text-red-400 animate-ping' : 'text-white'}`}>
                {timeLeft}s
              </span>
            </div>
          </div>

          <div className="bg-zinc-950/90 border border-zinc-800 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-zinc-500 uppercase">High Score</span>
              <span className="text-xs font-mono font-black text-yellow-400">{highScore}</span>
            </div>
          </div>

          <div className="bg-zinc-950/90 border border-zinc-800 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <Flame className={`w-4 h-4 ${combo > 2 ? 'text-red-500 animate-bounce' : 'text-zinc-600'}`} />
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-zinc-500 uppercase">Streak</span>
              <span className="text-xs font-mono font-black text-white">{combo}x</span>
            </div>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition-all ${
              soundEnabled ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-zinc-950 border-zinc-800 text-zinc-600'
            }`}
            title="Toggle Sound"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Rules Banner */}
      <div className="flex items-center justify-between bg-zinc-950/80 border border-zinc-800/80 p-3 rounded-2xl text-xs z-10">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-bold">🟢 Tap Red Flaws to SMASH!</span>
          <span className="text-zinc-600">•</span>
          <span className="text-red-400 font-bold">🔴 Avoid Green Gold Standard Cards!</span>
        </div>
        <span className="text-amber-400 font-mono font-black text-sm">Score: {score}</span>
      </div>

      {/* 3x3 Interactive Smash Grid */}
      <div className="grid grid-cols-3 gap-3 z-10">
        {grid.map((card, idx) => {
          const isSmashed = smashedIndices.includes(idx);
          return (
            <motion.button
              key={idx}
              disabled={!isPlaying}
              onClick={() => handleCardClick(idx)}
              whileTap={{ scale: 0.9 }}
              className={`h-24 sm:h-28 rounded-2xl border-2 flex flex-col items-center justify-center p-2.5 transition-all relative overflow-hidden select-none ${
                !card
                  ? 'bg-zinc-950/40 border-zinc-800/40'
                  : card.type === 'flaw'
                  ? 'bg-gradient-to-tr from-red-950/80 via-zinc-900 to-red-900/60 border-red-500 shadow-lg shadow-red-600/30 hover:brightness-125 cursor-pointer'
                  : 'bg-gradient-to-tr from-emerald-950/80 via-zinc-900 to-teal-900/60 border-emerald-500 shadow-lg shadow-emerald-600/30 hover:brightness-125 cursor-pointer'
              } ${isSmashed ? 'scale-90 opacity-40' : ''}`}
            >
              {card ? (
                <div className="flex flex-col items-center gap-1 text-center animate-fadeIn">
                  <span className="text-2xl sm:text-3xl">{card.icon}</span>
                  <span className={`text-[10px] sm:text-xs font-black uppercase tracking-tight ${card.type === 'flaw' ? 'text-red-300' : 'text-emerald-300'}`}>
                    {card.text}
                  </span>
                  <span className={`text-[8px] font-mono font-bold px-1.5 py-0.2 rounded border ${card.type === 'flaw' ? 'bg-red-500/20 text-red-400 border-red-500/40' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'}`}>
                    {card.type === 'flaw' ? 'SMASH ME!' : 'PROTECT!'}
                  </span>
                </div>
              ) : (
                <div className="w-2 h-2 rounded-full bg-zinc-800" />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Start / Reset Game Action Button */}
      <div className="flex items-center justify-center gap-3 z-10">
        {!isPlaying ? (
          <button
            onClick={startGame}
            className="w-full sm:w-80 py-4 px-6 rounded-2xl font-black text-base uppercase tracking-wider bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 text-zinc-950 border-2 border-red-300 shadow-2xl shadow-red-500/40 hover:brightness-110 transition-all flex items-center justify-center gap-2.5"
          >
            <Zap className="w-5 h-5 fill-current" />
            <span>{timeLeft === 0 ? '🔄 PLAY AGAIN (25s)' : '🚀 START SMASH GAME'}</span>
          </button>
        ) : (
          <button
            onClick={() => setIsPlaying(false)}
            className="px-6 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white transition-all text-xs font-black uppercase"
          >
            Stop Game
          </button>
        )}
      </div>
    </div>
  );
};
