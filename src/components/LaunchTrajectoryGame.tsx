import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Target, 
  RotateCcw, 
  Trophy, 
  Zap, 
  Volume2, 
  VolumeX, 
  Sparkles,
  Crosshair
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SportRule } from '../types';

interface Props {
  sportRule: SportRule;
  athleteName?: string;
  onEarnXp?: (amount: number) => void;
}

export const LaunchTrajectoryGame: React.FC<Props> = ({
  sportRule,
  athleteName = 'Athlete',
  onEarnXp
}) => {
  const [angle, setAngle] = useState(42); // degrees
  const [power, setPower] = useState(75); // %
  const [targetDistance, setTargetDistance] = useState(65); // % along the field
  const [targetY, setTargetY] = useState(50); // % height
  const [shotsFired, setShotsFired] = useState(0);
  const [hits, setHits] = useState(0);
  const [score, setScore] = useState(0);
  const [isFiring, setIsFiring] = useState(false);
  const [projectilePos, setProjectilePos] = useState<{ x: number; y: number } | null>(null);
  const [trajectoryPoints, setTrajectoryPoints] = useState<{ x: number; y: number }[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [feedback, setFeedback] = useState<string>('Adjust your launch angle and power, then press FIRE!');

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
    } catch (e) {}
  };

  // Preview Trajectory Curve
  useEffect(() => {
    const points: { x: number; y: number }[] = [];
    const rad = (angle * Math.PI) / 180;
    const v0 = power * 0.8;
    const g = 9.8;

    for (let t = 0; t <= 3.5; t += 0.15) {
      const x = v0 * Math.cos(rad) * t;
      const y = (v0 * Math.sin(rad) * t) - (0.5 * g * t * t);
      if (y < 0 && t > 0) break;
      points.push({ x: Math.min(100, x * 1.5), y: Math.max(0, y * 1.8) });
    }
    setTrajectoryPoints(points);
  }, [angle, power]);

  const fireShot = () => {
    if (isFiring) return;
    setIsFiring(true);
    setShotsFired((prev) => prev + 1);
    playSound(400, 'sawtooth', 0.2);

    const rad = (angle * Math.PI) / 180;
    const v0 = power * 0.8;
    const g = 9.8;
    let t = 0;

    const interval = setInterval(() => {
      t += 0.08;
      const currentX = (v0 * Math.cos(rad) * t) * 1.5;
      const currentY = ((v0 * Math.sin(rad) * t) - (0.5 * g * t * t)) * 1.8;

      if (currentY < 0 && t > 0.2) {
        // Hit ground
        clearInterval(interval);
        setIsFiring(false);
        setProjectilePos(null);

        // Check if hit target
        const distanceDelta = Math.abs(currentX - targetDistance);
        if (distanceDelta < 9) {
          // BULLSEYE HIT!
          setHits((h) => h + 1);
          const gained = 150 + Math.round((10 - distanceDelta) * 20);
          setScore((s) => s + gained);
          setFeedback(`🎯 PERFECT BULLSEYE! +${gained} PTS!`);
          playSound(880, 'sine', 0.35);
          confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
          if (onEarnXp) onEarnXp(50);
          // Move target to a new random location
          setTargetDistance(Math.floor(40 + Math.random() * 45));
          setTargetY(Math.floor(20 + Math.random() * 50));
        } else if (currentX < targetDistance) {
          setFeedback('⚠️ Shot was short! Increase power or adjust release angle!');
          playSound(250, 'triangle', 0.2);
        } else {
          setFeedback('⚠️ Shot went too far! Lower power or angle!');
          playSound(250, 'triangle', 0.2);
        }
        return;
      }

      setProjectilePos({ x: currentX, y: currentY });
    }, 30);
  };

  const resetGame = () => {
    setShotsFired(0);
    setHits(0);
    setScore(0);
    setFeedback('Target reset! Try to get a 3-shot streak!');
    setTargetDistance(65);
  };

  return (
    <div className="bg-zinc-900 border-2 border-amber-500/40 rounded-3xl p-5 sm:p-7 flex flex-col gap-6 shadow-[0_0_40px_rgba(245,158,11,0.15)] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4 z-10">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-zinc-950 font-black text-xl shadow-lg shadow-amber-500/20">
            🎯
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30">
                LAUNCH TRAJECTORY CANNON
              </span>
              <span className="text-[10px] font-mono text-zinc-400">
                Release Angle & Kinetic Arc Physics
              </span>
            </div>
            <h2 className="text-xl font-black text-white uppercase italic tracking-wide mt-0.5">
              Kinetic Target Bullseye!
            </h2>
          </div>
        </div>

        {/* Stats Badges */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="bg-zinc-950/90 border border-zinc-800 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-zinc-500 uppercase">Score</span>
              <span className="text-xs font-mono font-black text-yellow-400">{score}</span>
            </div>
          </div>

          <div className="bg-zinc-950/90 border border-zinc-800 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-emerald-400" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-zinc-500 uppercase">Accuracy</span>
              <span className="text-xs font-mono font-black text-white">
                {shotsFired > 0 ? Math.round((hits / shotsFired) * 100) : 100}% ({hits}/{shotsFired})
              </span>
            </div>
          </div>

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

      {/* Trajectory Flight Simulation Canvas Area */}
      <div className="relative w-full h-56 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col justify-end p-4">
        {/* Field Grid lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        {/* Trajectory Arc Dots */}
        {trajectoryPoints.map((pt, pIdx) => (
          <div
            key={pIdx}
            className="absolute w-1.5 h-1.5 rounded-full bg-amber-400/40"
            style={{
              left: `${pt.x}%`,
              bottom: `${pt.y}%`
            }}
          />
        ))}

        {/* Projectile Ball in Motion */}
        {projectilePos && (
          <div
            className="absolute w-4 h-4 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 shadow-[0_0_12px_#f59e0b] border border-white transform -translate-x-1/2 translate-y-1/2"
            style={{
              left: `${projectilePos.x}%`,
              bottom: `${projectilePos.y}%`
            }}
          />
        )}

        {/* Target Bucket / Ring */}
        <div
          className="absolute w-10 h-10 rounded-full border-2 border-emerald-400 bg-emerald-500/20 shadow-[0_0_20px_rgba(52,211,153,0.5)] flex items-center justify-center text-xs font-black text-emerald-300 animate-pulse"
          style={{
            left: `${targetDistance}%`,
            bottom: `8px`
          }}
        >
          🎯
        </div>

        {/* Cannon Origin Base */}
        <div className="relative z-10 flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-zinc-950 font-black shadow-lg"
            style={{ transform: `rotate(-${angle}deg)` }}
          >
            🚀
          </div>
          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-950/80 px-2 py-0.5 rounded border border-zinc-800">
            {angle}° Launch
          </span>
        </div>
      </div>

      {/* Interactive Sliders & Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-950/80 border border-zinc-800 p-4 rounded-2xl z-10">
        {/* Angle Slider */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-zinc-300">📐 Release Angle:</span>
            <span className="font-mono text-amber-400 font-black">{angle}°</span>
          </div>
          <input
            type="range"
            min={15}
            max={75}
            value={angle}
            disabled={isFiring}
            onChange={(e) => setAngle(Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
        </div>

        {/* Power % Slider */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-zinc-300">⚡ Kinetic Power:</span>
            <span className="font-mono text-yellow-400 font-black">{power}%</span>
          </div>
          <input
            type="range"
            min={30}
            max={100}
            value={power}
            disabled={isFiring}
            onChange={(e) => setPower(Number(e.target.value))}
            className="w-full accent-yellow-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Feedback Banner */}
      <div className="bg-zinc-950/90 border border-zinc-800 p-3 rounded-2xl text-center text-xs font-bold text-amber-300 z-10">
        {feedback}
      </div>

      {/* Action Fire Button */}
      <div className="flex items-center gap-3 z-10">
        <button
          disabled={isFiring}
          onClick={fireShot}
          className="flex-1 py-4 px-6 rounded-2xl font-black text-base uppercase tracking-wider bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-zinc-950 border-2 border-amber-200 shadow-2xl shadow-amber-500/40 hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          <Zap className="w-5 h-5 fill-current" />
          <span>{isFiring ? '🚀 IN FLIGHT...' : '🎯 FIRE CANNON!'}</span>
        </button>

        <button
          onClick={resetGame}
          className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white transition-all"
          title="Reset"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
