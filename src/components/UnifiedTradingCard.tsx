import React, { useState, useRef } from 'react';
import { TrophyCard, SportId } from '../types';
import { 
  Trophy, 
  Sparkles, 
  Flame, 
  CheckCircle2, 
  RotateCw, 
  ShieldCheck, 
  Download, 
  Share2, 
  Award,
  Zap,
  Activity,
  Cpu
} from 'lucide-react';
import { motion } from 'motion/react';

export interface CardThemeDef {
  id: string;
  name: string;
  bg: string;
  cardBg: string;
  border: string;
  text: string;
  glow: string;
  accent: string;
  ribbon: string;
  badge: string;
  foilGrad: string;
}

export const UNIFIED_CARD_THEMES: Record<string, CardThemeDef> = {
  vintage_gold: {
    id: 'vintage_gold',
    name: 'Vintage Gold Foil',
    bg: 'from-amber-950/90 via-zinc-950 to-yellow-950/90',
    cardBg: 'from-amber-900/60 via-zinc-950 to-yellow-900/40',
    border: 'border-yellow-500/80 shadow-yellow-500/20',
    text: 'text-amber-400',
    glow: 'rgba(245, 158, 11, 0.45)',
    accent: 'bg-yellow-500 text-zinc-950',
    ribbon: 'from-yellow-600 via-amber-500 to-yellow-400 text-zinc-950 font-black',
    badge: 'bg-gradient-to-br from-yellow-400 to-amber-600 text-zinc-950 border-yellow-300 shadow-amber-500/30',
    foilGrad: 'from-yellow-400/20 via-amber-300/10 to-transparent'
  },
  neon_ignite: {
    id: 'neon_ignite',
    name: 'Ruby Laser Ignite',
    bg: 'from-red-950/90 via-zinc-950 to-rose-950/90',
    cardBg: 'from-red-900/60 via-zinc-950 to-rose-900/40',
    border: 'border-red-500 shadow-red-500/20',
    text: 'text-red-400',
    glow: 'rgba(239, 68, 68, 0.45)',
    accent: 'bg-red-500 text-white',
    ribbon: 'from-red-600 via-rose-500 to-red-400 text-white font-black',
    badge: 'bg-gradient-to-br from-red-500 to-rose-700 text-white border-red-400 shadow-red-500/30',
    foilGrad: 'from-red-400/20 via-rose-300/10 to-transparent'
  },
  emerald_mastery: {
    id: 'emerald_mastery',
    name: 'Holo Emerald Prism',
    bg: 'from-emerald-950/90 via-zinc-950 to-teal-950/90',
    cardBg: 'from-emerald-900/60 via-zinc-950 to-teal-900/40',
    border: 'border-emerald-400 shadow-emerald-400/20',
    text: 'text-emerald-400',
    glow: 'rgba(52, 211, 153, 0.45)',
    accent: 'bg-emerald-400 text-zinc-950',
    ribbon: 'from-emerald-500 via-teal-400 to-emerald-300 text-zinc-950 font-black',
    badge: 'bg-gradient-to-br from-emerald-400 to-teal-600 text-zinc-950 border-emerald-300 shadow-emerald-500/30',
    foilGrad: 'from-emerald-400/20 via-teal-300/10 to-transparent'
  },
  diamond_prestige: {
    id: 'diamond_prestige',
    name: 'Sapphire Diamond Foil',
    bg: 'from-blue-950/90 via-zinc-950 to-sky-950/90',
    cardBg: 'from-blue-900/60 via-zinc-950 to-sky-900/40',
    border: 'border-sky-400 shadow-sky-400/25',
    text: 'text-sky-400',
    glow: 'rgba(56, 189, 248, 0.45)',
    accent: 'bg-sky-400 text-zinc-950',
    ribbon: 'from-sky-400 via-blue-500 to-indigo-500 text-zinc-950 font-black',
    badge: 'bg-gradient-to-br from-sky-400 to-blue-600 text-zinc-950 border-sky-300 shadow-sky-500/30',
    foilGrad: 'from-sky-400/20 via-blue-300/10 to-transparent'
  },
  midnight_stealth: {
    id: 'midnight_stealth',
    name: 'Carbon Stealth Chrome',
    bg: 'from-zinc-900 via-zinc-950 to-zinc-900',
    cardBg: 'from-zinc-800/80 via-zinc-950 to-neutral-900/80',
    border: 'border-zinc-500/80 shadow-zinc-500/15',
    text: 'text-zinc-200',
    glow: 'rgba(255, 255, 255, 0.25)',
    accent: 'bg-zinc-200 text-zinc-950',
    ribbon: 'from-zinc-300 via-zinc-400 to-zinc-200 text-zinc-950 font-black',
    badge: 'bg-gradient-to-br from-zinc-200 to-zinc-400 text-zinc-950 border-zinc-100 shadow-zinc-400/30',
    foilGrad: 'from-white/15 via-zinc-400/10 to-transparent'
  },
  kinetic_power_titan: {
    id: 'kinetic_power_titan',
    name: 'Kinetic Solar Titan',
    bg: 'from-orange-950/90 via-zinc-950 to-amber-950/90',
    cardBg: 'from-orange-900/60 via-zinc-950 to-amber-900/40',
    border: 'border-orange-500 shadow-orange-500/25',
    text: 'text-orange-400',
    glow: 'rgba(249, 115, 22, 0.5)',
    accent: 'bg-orange-500 text-zinc-950',
    ribbon: 'from-orange-500 via-amber-400 to-yellow-400 text-zinc-950 font-black',
    badge: 'bg-gradient-to-br from-orange-400 to-amber-600 text-white border-orange-300 shadow-orange-500/30',
    foilGrad: 'from-orange-400/20 via-yellow-300/10 to-transparent'
  }
};

interface UnifiedTradingCardProps {
  card: TrophyCard;
  interactive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  isFlipped?: boolean;
  onFlip?: () => void;
  showControls?: boolean;
}

export const UnifiedTradingCard: React.FC<UnifiedTradingCardProps> = ({
  card,
  interactive = true,
  size = 'md',
  isFlipped: controlledFlipped,
  onFlip,
  showControls = false
}) => {
  const [internalFlipped, setInternalFlipped] = useState(false);
  const isFlipped = controlledFlipped !== undefined ? controlledFlipped : internalFlipped;
  
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glintPos, setGlintPos] = useState({ x: 50, y: 50 });
  const cardRef = useRef<HTMLDivElement>(null);

  const themeKey = card.cardStyle || 'vintage_gold';
  const theme = UNIFIED_CARD_THEMES[themeKey] || UNIFIED_CARD_THEMES.vintage_gold;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rX = ((y - centerY) / centerY) * -12;
    const rY = ((x - centerX) / centerX) * 12;
    
    setRotateX(rX);
    setRotateY(rY);
    setGlintPos({
      x: Math.round((x / rect.width) * 100),
      y: Math.round((y / rect.height) * 100)
    });
  };

  const handleMouseLeave = () => {
    if (!interactive) return;
    setRotateX(0);
    setRotateY(0);
  };

  const handleCardClick = () => {
    if (interactive) {
      if (onFlip) {
        onFlip();
      } else {
        setInternalFlipped(!internalFlipped);
      }
    }
  };

  const sportCode = card.sportId === 'rugby' ? 'TCK' : 
                    card.sportId === 'soccer' ? 'STR' : 
                    card.sportId === 'netball' ? 'SHT' :
                    card.sportId === 'golf' ? 'DRV' :
                    card.sportId === 'tennis' ? 'SRV' : 'ATH';

  const defaultStats = [
    { label: 'PWR', value: card.score || 88 },
    { label: 'BAL', value: Math.min(99, Math.round((card.score || 85) * 1.02)) },
    { label: 'SYM', value: Math.min(99, Math.round((card.score || 82) * 0.98)) },
    { label: 'TEM', value: Math.min(99, Math.round((card.score || 88) * 1.01)) },
    { label: 'ACC', value: Math.min(99, Math.round((card.score || 90) * 0.96)) },
    { label: 'DRI', value: Math.min(99, Math.round((card.score || 86) * 1.03)) },
  ];

  const displayStats = card.sportAttributes && card.sportAttributes.length >= 4 
    ? card.sportAttributes.slice(0, 6) 
    : defaultStats;

  const totalPower = displayStats.reduce((acc, curr) => acc + (typeof curr.value === 'number' ? curr.value : parseInt(String(curr.value)) || 85), 0);

  // Size scaling
  const sizeClasses = {
    sm: 'w-[200px] h-[310px] text-[9px]',
    md: 'w-[280px] h-[430px] sm:w-[300px] sm:h-[460px] text-xs',
    lg: 'w-[320px] h-[490px] sm:w-[340px] sm:h-[520px] text-sm'
  }[size];

  return (
    <div className="flex flex-col items-center gap-3">
      {/* 3D Perspective Canvas */}
      <div 
        className={`perspective-1000 ${sizeClasses} select-none ${interactive ? 'cursor-pointer' : ''}`}
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleCardClick}
      >
        <div
          className="w-full h-full relative duration-700 preserve-3d"
          style={{
            transform: `rotateY(${isFlipped ? 180 : 0}deg) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
            transformStyle: 'preserve-3d',
            transition: 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)'
          }}
        >
          {/* ================= CARD FRONT ================= */}
          <div 
            className={`absolute inset-0 bg-gradient-to-b ${theme.cardBg} border-2 ${theme.border} rounded-2xl overflow-hidden flex flex-col p-3.5 sm:p-4 shadow-2xl backface-hidden`}
            style={{
              boxShadow: `0 25px 50px -10px ${theme.glow}, inset 0 1px 2px rgba(255,255,255,0.2)`
            }}
          >
            {/* Holographic Dynamic Glint */}
            <div 
              className="absolute inset-0 pointer-events-none z-20 mix-blend-color-dodge transition-opacity duration-300 opacity-60"
              style={{
                background: `radial-gradient(circle at ${glintPos.x}% ${glintPos.y}%, rgba(255, 255, 255, 0.4) 0%, rgba(255,255,255,0.05) 40%, transparent 70%)`
              }}
            />

            {/* Top Foil Sheen Banner */}
            <div className="absolute inset-0 w-[200%] h-[200%] -top-1/2 -left-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none animate-glint z-10" />

            {/* Top Bar: Athlete Name & PSA/Pro Grade Badge */}
            <div className="flex items-center justify-between gap-2 border-b border-white/15 pb-2 z-10">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[11px] font-black text-amber-400 drop-shadow">★</span>
                <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider truncate drop-shadow-md">
                  {card.athleteName || 'Klutchh Athlete'}
                </h3>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-black/60 border border-white/20 text-zinc-300 font-mono tracking-widest">
                  {sportCode} // GEN-3
                </span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border shadow-sm ${theme.badge}`}>
                  {card.grade || 'A+'}
                </span>
              </div>
            </div>

            {/* Middle Section: Left FIFA Stats Column + Right Biomechanical Hero Frame */}
            <div className="flex flex-1 gap-2.5 items-stretch my-2.5 z-10 min-h-0">
              
              {/* Left Column: FIFA OVR Score + Sport Shield */}
              <div className="flex flex-col items-center justify-between py-1 border-r border-white/10 pr-2 w-[60px] sm:w-[68px] shrink-0 select-none">
                <div className="text-center">
                  <span className={`text-4xl sm:text-5xl font-black tracking-tighter ${theme.text} block leading-none drop-shadow-lg`}>
                    {card.score || 88}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-black uppercase text-white tracking-widest mt-1 block drop-shadow">
                    {sportCode}
                  </span>
                </div>

                <div className="w-8 h-px bg-white/20 my-1" />

                {/* Pro Lab Crest */}
                <div className="relative w-9 h-10 border border-white/30 bg-black/60 rounded-lg flex flex-col items-center justify-center text-[10px] shadow-inner">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span className="text-[7px] font-mono text-zinc-200 mt-0.5 font-bold uppercase leading-none">PRO</span>
                </div>

                <div className="w-8 h-px bg-white/20 my-1" />

                <div className="text-sm font-bold drop-shadow">🏅</div>
              </div>

              {/* Right Column: Hero Biometric Capture / Skeleton Canvas */}
              <div className="relative flex-1 bg-zinc-950/95 border border-white/15 rounded-xl overflow-hidden flex items-center justify-center shadow-inner">
                {/* Radial Target Ring */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06)_0%,transparent_75%)] pointer-events-none" />
                
                {card.capturedImage ? (
                  <img 
                    src={card.capturedImage} 
                    className="w-full h-full object-cover" 
                    alt="Biometric Capture" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 gap-2 p-3 text-center">
                    <Activity className="w-8 h-8 text-amber-500/60 animate-pulse" />
                    <span className="text-[9px] font-mono uppercase text-zinc-400 font-bold">Biometric Skeleton Render</span>
                  </div>
                )}

                {/* Detected Movement Phase Pill */}
                <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-black/85 backdrop-blur-md border border-white/15 px-2 py-0.5 rounded-lg flex items-center justify-between z-10 shadow-lg">
                  <span className="text-[8px] sm:text-[9px] font-mono text-zinc-200 uppercase font-bold truncate">
                    {card.movementPhase || 'Optimal Phase'}
                  </span>
                  <span className="text-[8px] font-mono text-emerald-400 font-bold">
                    VERIFIED
                  </span>
                </div>
              </div>

            </div>

            {/* Bottom 6-Attribute Grid */}
            <div className="bg-black/80 backdrop-blur-md border border-white/15 p-2 rounded-xl z-10 grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[9px] sm:text-[10px] shadow-lg">
              {displayStats.map((stat, sIdx) => (
                <div key={sIdx} className="flex justify-between items-center border-b border-white/5 pb-0.5">
                  <span className="text-zinc-400 font-black uppercase tracking-wider">{stat.label}</span>
                  <strong className="text-white font-black">{stat.value}</strong>
                </div>
              ))}
            </div>

            {/* Footer Foil Ribbon */}
            <div className="flex items-center justify-between pt-2 mt-1.5 border-t border-white/15 text-[8px] sm:text-[9px] font-mono text-zinc-400 z-10 leading-none">
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <strong className="text-zinc-200 font-bold">TOTAL PK: {totalPower}</strong>
              </span>
              <span className="font-bold tracking-widest text-zinc-300">KLUTCHH PRO LAB // VERIFIED</span>
            </div>
          </div>

          {/* ================= CARD BACK ================= */}
          <div 
            className="absolute inset-0 bg-zinc-950 border-2 border-zinc-700 rounded-2xl flex flex-col p-4 sm:p-5 shadow-2xl backface-hidden"
            style={{
              transform: 'rotateY(180deg)',
              boxShadow: `0 25px 50px -10px rgba(0,0,0,0.8), inset 0 1px 2px rgba(255,255,255,0.1)`
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Cpu className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase text-white tracking-wider">Biomechanical DNA</h3>
                  <p className="text-[8px] text-zinc-500 font-mono">SERIES 2026 // SECURE PROOF</p>
                </div>
              </div>
              <span className="text-[8px] font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-bold">
                MINTED
              </span>
            </div>

            {/* Body */}
            <div className="flex flex-col gap-3 my-auto py-2">
              {/* Rating Progress */}
              <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800 space-y-1">
                <div className="flex justify-between text-[9px] font-mono text-zinc-400 uppercase font-bold">
                  <span>Kinetic Execution Efficiency</span>
                  <span className="text-amber-400 font-black">{card.score || 88}%</span>
                </div>
                <div className="h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                  <div 
                    className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-400 rounded-full transition-all duration-1000"
                    style={{ width: `${card.score || 88}%` }}
                  />
                </div>
              </div>

              {/* Coaching Cue */}
              <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800 flex flex-col gap-1">
                <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-wider font-bold">
                  Coach / AI Biomechanical Assessment
                </span>
                <p className="text-[10px] sm:text-[11px] text-zinc-200 leading-snug italic font-medium">
                  &quot;{card.coachingCue || 'Maintain optimal knee stability, extend hip drive through follow-through, and stabilize shoulder axis for peak kinetic transfer.'}&quot;
                </p>
              </div>

              {/* Action Plan */}
              <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800">
                <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-wider font-bold">
                  Recommended Action Drill
                </span>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-200 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">Single-Leg Stabilization & Drop Landings</span>
                </div>
              </div>
            </div>

            {/* Authenticity Barcode Footer */}
            <div className="mt-auto border-t border-zinc-800 pt-2.5 flex items-center justify-between gap-3">
              <div className="flex-1">
                <div className="h-6 bg-white rounded flex items-center justify-around px-2 opacity-90 overflow-hidden shadow-inner">
                  {[...Array(28)].map((_, idx) => (
                    <div 
                      key={idx} 
                      className={`h-full bg-black ${idx % 3 === 0 ? 'w-1' : idx % 2 === 0 ? 'w-0.5' : 'w-1.5'}`} 
                    />
                  ))}
                </div>
                <div className="flex justify-between text-[7px] font-mono text-zinc-500 mt-1">
                  <span>#KL-{card.id ? card.id.slice(-6).toUpperCase() : '84920'}</span>
                  <span>{new Date(card.createdAt || Date.now()).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-1 text-[8px] font-black text-amber-400 uppercase">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>OFFICIAL</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Optional Flip Prompt / Controls */}
      {interactive && (
        <button
          type="button"
          onClick={handleCardClick}
          className="text-[10px] font-black uppercase tracking-wider text-zinc-400 hover:text-amber-400 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 px-3 py-1 rounded-full flex items-center gap-1.5 transition-all shadow-sm"
        >
          <RotateCw className="w-3 h-3 text-amber-400" />
          <span>{isFlipped ? 'Flip to Front' : 'Flip for DNA & Stats'}</span>
        </button>
      )}
    </div>
  );
};
