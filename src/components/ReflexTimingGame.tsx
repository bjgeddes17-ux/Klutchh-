import React, { useState, useEffect, useRef } from 'react';
import { SportRule, FrameAnalysis } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Trophy, 
  Flame, 
  RotateCcw, 
  Sparkles, 
  Award, 
  CheckCircle2, 
  Crosshair,
  Volume2,
  VolumeX,
  Gauge
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  sportRule: SportRule;
  athleteName?: string;
  onEarnXp?: (amount: number) => void;
}

export const ReflexTimingGame: React.FC<Props> = ({
  sportRule,
  athleteName = 'Athlete',
  onEarnXp
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem(`klutchh_reflex_hs_${sportRule.id}`) || '0', 10);
  });
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [difficulty, setDifficulty] = useState<'rookie' | 'pro' | 'legend'>('pro');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [feedback, setFeedback] = useState<{ text: string; color: string; score: number } | null>(null);
  const [attempts, setAttempts] = useState(0);

  // Position of the moving cursor (0 to 100)
  const [cursorPos, setCursorPos] = useState(0);
  const directionRef = useRef(1); // 1 = forward, -1 = backward
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  // Target Sweet Spot (e.g. 45% to 60% of the timeline)
  const targetZone = { min: 46, max: 58, ideal: 52 };

  // Audio synthesize beep/chime
  const playChime = (frequency: number, type: OscillatorType = 'sine', duration: number = 0.15) => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio not permitted without interaction
    }
  };

  // Speed multiplier based on difficulty
  const speed = difficulty === 'rookie' ? 0.07 : difficulty === 'pro' ? 0.12 : 0.18;

  // Animation Loop for moving cursor
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    lastTimeRef.current = performance.now();

    const loop = (time: number) => {
      const delta = Math.min(time - lastTimeRef.current, 50);
      lastTimeRef.current = time;

      setCursorPos((prev) => {
        let next = prev + directionRef.current * speed * delta;
        if (next >= 100) {
          next = 100;
          directionRef.current = -1;
        } else if (next <= 0) {
          next = 0;
          directionRef.current = 1;
        }
        return next;
      });

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, difficulty, speed]);

  // Handle Tap / Spacebar Hit
  const handleHit = () => {
    if (!isPlaying) {
      setIsPlaying(true);
      return;
    }

    setAttempts((prev) => prev + 1);
    const diff = Math.abs(cursorPos - targetZone.ideal);

    if (diff <= 3) {
      // PERFECT / BULLSEYE
      const gained = Math.round(150 * (1 + combo * 0.2));
      setScore((s) => {
        const next = s + gained;
        if (next > highScore) {
          setHighScore(next);
          localStorage.setItem(`klutchh_reflex_hs_${sportRule.id}`, next.toString());
        }
        return next;
      });
      setCombo((c) => {
        const nc = c + 1;
        if (nc > maxCombo) setMaxCombo(nc);
        return nc;
      });
      setFeedback({ text: '🎯 PERFECT RELEASE!', color: 'text-amber-400', score: gained });
      playChime(880, 'triangle', 0.25);
      if (onEarnXp) onEarnXp(50);

      // Trigger Confetti on 5+ combo
      if (combo + 1 >= 5 && (combo + 1) % 5 === 0) {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      }
    } else if (diff <= 8) {
      // GREAT HIT
      const gained = Math.round(80 * (1 + combo * 0.1));
      setScore((s) => {
        const next = s + gained;
        if (next > highScore) {
          setHighScore(next);
          localStorage.setItem(`klutchh_reflex_hs_${sportRule.id}`, next.toString());
        }
        return next;
      });
      setCombo((c) => {
        const nc = c + 1;
        if (nc > maxCombo) setMaxCombo(nc);
        return nc;
      });
      setFeedback({ text: '⚡ GREAT TIMING!', color: 'text-emerald-400', score: gained });
      playChime(660, 'sine', 0.18);
      if (onEarnXp) onEarnXp(25);
    } else {
      // MISS / OFF TIMING
      const isEarly = cursorPos < targetZone.min;
      setCombo(0);
      setFeedback({ 
        text: isEarly ? '⚠️ TOO EARLY! Wait for the sweet spot' : '⚠️ TOO LATE! Release earlier', 
        color: 'text-red-400', 
        score: 0 
      });
      playChime(220, 'sawtooth', 0.2);
    }
  };

  // Keyboard shortcut listener for spacebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement)?.tagName !== 'INPUT' && (e.target as HTMLElement)?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        handleHit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const resetGame = () => {
    setIsPlaying(false);
    setScore(0);
    setCombo(0);
    setAttempts(0);
    setFeedback(null);
    setCursorPos(0);
    directionRef.current = 1;
  };

  return (
    <div className="bg-zinc-900 border-2 border-amber-500/40 rounded-3xl p-5 sm:p-7 flex flex-col gap-6 shadow-[0_0_40px_rgba(245,158,11,0.15)] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4 z-10">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-amber-500/20">
            🕹️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30">
                REFLEX TIMING CHALLENGE
              </span>
              <span className="text-[10px] font-mono text-zinc-400">
                {sportRule.name} Sweet-Spot Trainer
              </span>
            </div>
            <h2 className="text-xl font-black text-white uppercase italic tracking-wide mt-0.5">
              {athleteName}'s Kinetic Release Zone
            </h2>
          </div>
        </div>

        {/* Stats & Score Chips */}
        <div className="flex items-center gap-2.5 flex-wrap">
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
              <span className="text-[9px] font-black text-zinc-500 uppercase">Combo</span>
              <span className="text-xs font-mono font-black text-white">{combo}x</span>
            </div>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition-all ${
              soundEnabled ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-zinc-950 border-zinc-800 text-zinc-600'
            }`}
            title="Toggle Sound Effects"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Difficulty Switcher & Plain English Cue */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-zinc-950/80 border border-zinc-800/80 p-3 rounded-2xl z-10">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Speed:</span>
          {(['rookie', 'pro', 'legend'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => {
                setDifficulty(lvl);
                resetGame();
              }}
              className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                difficulty === lvl
                  ? 'bg-amber-500 text-zinc-950 shadow-md font-extrabold'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {lvl === 'rookie' ? '🐢 Rookie' : lvl === 'pro' ? '⚡ Pro' : '🔥 Legend'}
            </button>
          ))}
        </div>

        <div className="text-xs text-zinc-300 font-medium flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Goal: Tap when the laser reaches the <b className="text-amber-400">Gold Target Zone</b>!</span>
        </div>
      </div>

      {/* The Main Interactive Kinetic Timing Runway */}
      <div className="flex flex-col gap-4 z-10">
        <div className="relative w-full h-20 sm:h-24 bg-zinc-950 border-2 border-zinc-800 rounded-2xl overflow-hidden shadow-inner flex items-center px-4">
          
          {/* Background Phase Gradient Tracks */}
          <div className="absolute inset-0 flex">
            <div className="w-[46%] h-full bg-blue-950/20 border-r border-zinc-800/50 flex items-center justify-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-400/40 select-none">
                1. Windup & Load
              </span>
            </div>
            {/* The Gold Sweet Spot Zone */}
            <div className="w-[12%] h-full bg-gradient-to-r from-amber-500/30 via-yellow-400/40 to-amber-500/30 border-x-2 border-amber-400/80 shadow-[0_0_25px_rgba(245,158,11,0.35)] flex flex-col items-center justify-center relative">
              <span className="text-[10px] font-black uppercase text-amber-300 tracking-tight flex items-center gap-0.5 select-none animate-pulse">
                <Crosshair className="w-3 h-3 text-amber-400" />
                <span>SWEET SPOT</span>
              </span>
              <span className="text-[8px] font-mono font-bold text-amber-200/80 select-none">
                PERFECT
              </span>
            </div>
            <div className="w-[42%] h-full bg-purple-950/20 border-l border-zinc-800/50 flex items-center justify-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-400/40 select-none">
                3. Follow Through
              </span>
            </div>
          </div>

          {/* The Moving Laser Cursor Indicator */}
          <div
            className="absolute top-1 bottom-1 w-3 sm:w-4 -ml-1.5 sm:-ml-2 bg-gradient-to-b from-white via-red-500 to-amber-500 rounded-full shadow-[0_0_20px_#ef4444] z-20 transition-transform duration-75 pointer-events-none flex flex-col items-center justify-between"
            style={{ left: `${cursorPos}%` }}
          >
            <div className="w-2 h-2 rounded-full bg-white shadow-md animate-ping" />
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-300 shadow" />
          </div>
        </div>

        {/* Live Feedback Toast Notification */}
        <div className="h-10 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {feedback ? (
              <motion.div
                key={`${attempts}-${feedback.text}`}
                initial={{ scale: 0.8, opacity: 0, y: 5 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className={`flex items-center gap-2 font-black text-sm uppercase tracking-wider ${feedback.color}`}
              >
                <span>{feedback.text}</span>
                {feedback.score > 0 && (
                  <span className="bg-amber-400 text-zinc-950 px-2 py-0.5 rounded-full text-xs font-mono">
                    +{feedback.score} XP
                  </span>
                )}
              </motion.div>
            ) : (
              <span className="text-xs text-zinc-500 font-medium">
                Press the big button below or hit <kbd className="px-1.5 py-0.5 bg-zinc-800 text-zinc-300 rounded font-mono text-[10px]">SPACEBAR</kbd>
              </span>
            )}
          </AnimatePresence>
        </div>

        {/* Big Action Tap Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleHit}
            className={`w-full sm:w-80 py-4 px-6 rounded-2xl font-black text-base uppercase tracking-wider shadow-2xl transition-all transform active:scale-95 flex items-center justify-center gap-2.5 border-2 ${
              isPlaying
                ? 'bg-gradient-to-r from-red-600 via-amber-500 to-yellow-500 text-zinc-950 border-amber-300 shadow-amber-500/40 hover:brightness-110'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 border-emerald-300 shadow-emerald-500/30'
            }`}
          >
            <Zap className="w-5 h-5 fill-current" />
            <span>{isPlaying ? '💥 HIT RELEASE POINT NOW!' : '🚀 START TIMING GAME'}</span>
          </button>

          {isPlaying && (
            <button
              onClick={resetGame}
              className="p-4 rounded-2xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-all"
              title="Reset Game"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Score Summary Footer Card */}
      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-zinc-800 text-center z-10">
        <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/80">
          <span className="text-[9px] font-black uppercase text-zinc-500">Current Score</span>
          <p className="text-base font-black text-white font-mono">{score}</p>
        </div>
        <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/80">
          <span className="text-[9px] font-black uppercase text-zinc-500">Max Streak</span>
          <p className="text-base font-black text-amber-400 font-mono">{maxCombo} in a row</p>
        </div>
        <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/80">
          <span className="text-[9px] font-black uppercase text-zinc-500">Attempts</span>
          <p className="text-base font-black text-zinc-300 font-mono">{attempts}</p>
        </div>
      </div>
    </div>
  );
};
