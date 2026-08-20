import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SavedReport, TrophyCard, UserAccount, FrameAnalysis, SportId } from '../types';
import { drawPoseSkeleton } from '../utils/geometry';
import { 
  Trophy, 
  Award, 
  Sparkles, 
  FlipHorizontal, 
  Download, 
  Trash2, 
  Flame, 
  CheckCircle2, 
  Shirt, 
  Info, 
  ShieldCheck, 
  Save, 
  Coins 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { get, set } from 'idb-keyval';
import { UnifiedTradingCard } from './UnifiedTradingCard';

interface TrophyCardMakerProps {
  report: SavedReport;
  currentUser: UserAccount | null;
  currentTime?: number;
}

export const CARD_THEMES = [
  {
    id: 'vintage_gold',
    name: 'Vintage Gold',
    bg: 'from-amber-900/90 via-zinc-900 to-yellow-950/90',
    border: 'border-yellow-500/80 shadow-yellow-500/10',
    text: 'text-amber-400',
    glow: 'rgba(245, 158, 11, 0.4)',
    accent: 'bg-yellow-500 text-zinc-950',
    ribbon: 'from-yellow-600 to-amber-500 text-zinc-950 font-black',
    badge: 'bg-gradient-to-br from-yellow-400 to-amber-600 text-zinc-950 border-yellow-300'
  },
  {
    id: 'neon_ignite',
    name: 'Neon Ignite',
    bg: 'from-red-950/90 via-zinc-900 to-red-900/90',
    border: 'border-red-500 shadow-red-500/10',
    text: 'text-red-400',
    glow: 'rgba(239, 68, 68, 0.4)',
    accent: 'bg-red-500 text-white',
    ribbon: 'from-red-600 to-rose-500 text-white font-black',
    badge: 'bg-gradient-to-br from-red-500 to-rose-700 text-white border-red-400'
  },
  {
    id: 'emerald_mastery',
    name: 'Holo Emerald',
    bg: 'from-emerald-950/90 via-zinc-900 to-teal-950/90',
    border: 'border-emerald-500 shadow-emerald-500/10',
    text: 'text-emerald-400',
    glow: 'rgba(16, 185, 129, 0.4)',
    accent: 'bg-emerald-500 text-zinc-950',
    ribbon: 'from-emerald-600 to-teal-500 text-zinc-950 font-black',
    badge: 'bg-gradient-to-br from-emerald-400 to-teal-600 text-zinc-950 border-emerald-300'
  },
  {
    id: 'diamond_prestige',
    name: 'Diamond Prestige',
    bg: 'from-blue-950/90 via-zinc-900 to-sky-950/90',
    border: 'border-sky-400 shadow-sky-400/10',
    text: 'text-sky-400',
    glow: 'rgba(56, 189, 248, 0.4)',
    accent: 'bg-sky-400 text-zinc-950',
    ribbon: 'from-sky-500 to-blue-500 text-zinc-950 font-black',
    badge: 'bg-gradient-to-br from-sky-400 to-blue-600 text-zinc-950 border-sky-300'
  },
  {
    id: 'midnight_stealth',
    name: 'Carbon Stealth',
    bg: 'from-zinc-900/95 via-neutral-950 to-zinc-900/95',
    border: 'border-zinc-700 shadow-zinc-600/10',
    text: 'text-zinc-400',
    glow: 'rgba(255, 255, 255, 0.2)',
    accent: 'bg-zinc-700 text-white',
    ribbon: 'from-zinc-800 to-zinc-700 text-white font-bold',
    badge: 'bg-gradient-to-br from-zinc-600 to-zinc-800 text-white border-zinc-500'
  },
  {
    id: 'kinetic_power_titan',
    name: 'Kinetic Power Titan',
    bg: 'from-orange-950/90 via-zinc-900 to-amber-900/90',
    border: 'border-orange-500 shadow-orange-500/20',
    text: 'text-orange-400',
    glow: 'rgba(249, 115, 22, 0.5)',
    accent: 'bg-orange-600 text-white',
    ribbon: 'from-orange-700 to-amber-600 text-white font-black',
    badge: 'bg-gradient-to-br from-orange-500 to-amber-700 text-white border-orange-400'
  }
];

export const TrophyCardMaker: React.FC<TrophyCardMakerProps> = ({ report, currentUser, currentTime }) => {
  const extendedKeyframeList = useMemo(() => {
    const list = [...report.keyframeList];
    if (currentTime !== undefined) {
      const existing = list.find(f => Math.abs(f.timestamp - currentTime) < 0.05);
      if (!existing) {
        let matchingAllFrame = null;
        if (report.allFrames) {
          matchingAllFrame = report.allFrames.reduce((prev, curr) => {
            return (Math.abs(curr.timestamp - currentTime) < Math.abs(prev.timestamp - currentTime) ? curr : prev);
          }, report.allFrames[0]);
        }
        
        list.unshift({
          timestamp: currentTime,
          detectedPhase: '📸 Custom Snapshot',
          landmarks: matchingAllFrame?.landmarks || [],
          angles: matchingAllFrame?.angles || {},
          ruleResults: matchingAllFrame?.ruleResults || {},
          symmetryScore: matchingAllFrame?.symmetryScore || report.symmetryScore,
          kneeSafetyScore: matchingAllFrame?.kneeSafetyScore || report.kneeSafetyScore
        });
      }
    }
    return list;
  }, [report.keyframeList, report.allFrames, currentTime]);

  const [selectedFrameIdx, setSelectedFrameIdx] = useState<number>(0);
  const [athleteName, setAthleteName] = useState<string>(report.athleteName || currentUser?.name || 'Athlete #17');
  const [selectedTheme, setSelectedTheme] = useState<string>('vintage_gold');
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [celebrationCard, setCelebrationCard] = useState<TrophyCard | null>(null);
  
  const [isCollectionView, setIsCollectionView] = useState<boolean>(false);
  const [savedCards, setSavedCards] = useState<TrophyCard[]>([]);
  const [selectedCollectionIdx, setSelectedCollectionIdx] = useState<number>(0);

  // Load saved cards for collection view
  useEffect(() => {
    const loadCards = async () => {
      const cards = await get('klutchh_trophy_cabinet') || [];
      setSavedCards(cards);
    };
    loadCards();
  }, [celebrationCard, isCollectionView]);

  // Stats checkboxes
  const [statSymmetry, setStatSymmetry] = useState<boolean>(true);
  const [statKneeSafety, setStatKneeSafety] = useState<boolean>(true);
  const [statOverall, setStatOverall] = useState<boolean>(true);
  const [statTorque, setStatTorque] = useState<boolean>(false);
  const [statExplosiveness, setStatExplosiveness] = useState<boolean>(false);

  // Mouse hover skew states for 3D baseball card effect
  const [rotateX, setRotateX] = useState<number>(0);
  const [rotateY, setRotateY] = useState<number>(0);
  const [spinDegree, setSpinDegree] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hiddenVideoRef = useRef<HTMLVideoElement>(null);

  // Auto-select best pose (highest symmetry + safety + movement clarity)
  const bestFrameIdx = useMemo(() => {
    if (!extendedKeyframeList.length) return 0;
    let bestIdx = 0;
    let highestScore = -1;

    extendedKeyframeList.forEach((frame, idx) => {
      const sym = frame.symmetryScore || 0;
      const knee = frame.kneeSafetyScore || 0;
      const phaseBonus = (frame.detectedPhase && frame.detectedPhase !== 'Unknown' && !frame.detectedPhase.includes('📸')) ? 25 : 0;
      const total = sym + knee + phaseBonus;
      
      if (total > highestScore) {
        highestScore = total;
        bestIdx = idx;
      }
    });
    return bestIdx;
  }, [extendedKeyframeList]);

  // Set initial frame to best frame
  useEffect(() => {
    setSelectedFrameIdx(bestFrameIdx);
  }, [bestFrameIdx]);

  const activeFrame: FrameAnalysis = extendedKeyframeList[selectedFrameIdx] || extendedKeyframeList[0];

  // Sync hidden video currentTime to active keyframe timestamp
  useEffect(() => {
    const video = hiddenVideoRef.current;
    if (!video || !activeFrame) return;

    video.currentTime = activeFrame.timestamp || 0;
  }, [activeFrame, selectedFrameIdx]);

  // Use simulated SportRule object with keyframe details
  const mockSportRule = useMemo(() => ({
    id: report.sportId,
    name: report.sportName,
    iconName: '',
    category: '',
    description: '',
    kidFocus: '',
    techniques: [],
    phases: [],
    sequence: [],
    jointRules: []
  }), [report.sportId, report.sportName]);

  const draw = React.useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const video = hiddenVideoRef.current;
    let drawnVideoBackground = false;

    // Sync canvas internal resolution
    if (video && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
    } else {
      if (canvas.width !== 640 || canvas.height !== 480) {
        canvas.width = 640;
        canvas.height = 480;
      }
    }

    // Fill background explicitly with dark theme color so snapshot never has a white box
    ctx.fillStyle = '#050507';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw video
    if (video && video.readyState >= 2) {
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        drawnVideoBackground = true;
      } catch (e) {
        console.warn('Could not draw video background:', e);
      }
    }

    // Grid fallback
    if (!drawnVideoBackground) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 30;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }

    drawPoseSkeleton(
      ctx,
      canvas.width,
      canvas.height,
      activeFrame.landmarks,
      activeFrame.ruleResults || {},
      activeFrame.angles || {},
      mockSportRule as any,
      activeFrame.detectedPhase,
      false
    );
  }, [activeFrame, mockSportRule]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) draw(ctx, canvas);
    }
  }, [draw]);


  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;

    setRotateX(rotateX);
    setRotateY(rotateY);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  const handleCardClick = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setSpinDegree(prev => prev + 360);
    setTimeout(() => setIsSpinning(false), 700);
    setIsFlipped(!isFlipped);
  };

  // Compile chosen stats
  const getSelectedStatsList = () => {
    const list = [];
    const isTitan = selectedTheme === 'kinetic_power_titan' || selectedTheme === 'midnight_stealth' || selectedTheme === 'neon_ignite';
    
    const outOf10 = (val: number) => (val / 10).toFixed(1);

    if (statOverall) {
      const val = report.overallScore;
      list.push({ label: 'Precision', value: isTitan ? `${outOf10(val)}/10` : `${val}%`, icon: '🏆' });
    }
    if (statSymmetry) {
      const val = activeFrame.symmetryScore || report.symmetryScore;
      list.push({ label: 'Symmetry', value: isTitan ? `${outOf10(val)}/10` : `${val}%`, icon: '⚖️' });
    }
    if (statKneeSafety) {
      const val = activeFrame.kneeSafetyScore || report.kneeSafetyScore;
      list.push({ label: 'Knee Align', value: isTitan ? `${outOf10(val)}/10` : `${val}%`, icon: '🛡️' });
    }
    if (statTorque) {
      const torque = report.dynamicMetrics?.estimatedPeakTorque || 180;
      list.push({ label: 'Peak Torque', value: `${torque} Nm`, icon: '⚡' });
    }
    if (statExplosiveness) {
      const expl = report.dynamicMetrics?.explosivenessScore || 82;
      list.push({ label: 'Explosiveness', value: isTitan ? `${outOf10(expl)}/10` : `${expl}`, icon: '🔥' });
    }
    return list.slice(0, 3); // cap at 3 highlights
  };

  // Calculate Card Power Points
  const calculateCardPower = () => {
    const base = report.overallScore * 10;
    const sym = (activeFrame.symmetryScore || report.symmetryScore) * 8;
    const knee = (activeFrame.kneeSafetyScore || report.kneeSafetyScore) * 7;
    return Math.round(base + sym + knee);
  };

  const handleSaveCard = async () => {
    setIsSaving(true);
    
    // Capture exact visual artwork from the canvas
    const canvas = canvasRef.current;
    let capturedImage: string | undefined = undefined;
    if (canvas) {
      try {
        capturedImage = canvas.toDataURL('image/jpeg', 0.85);
      } catch (e) {
        console.warn('Canvas toDataURL failed (possibly tainted):', e);
      }
    }
    const savedSportAttributes = getSportAttributes();

    const newCard: TrophyCard = {
      id: `card-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: currentUser?.id || 'offline_athlete',
      athleteId: report.athleteId,
      athleteName: athleteName.trim() || 'Athlete',
      sportId: report.sportId,
      sportName: report.sportName,
      movementPhase: activeFrame.detectedPhase || 'Performance Capture',
      grade: report.overallGrade || 'A',
      score: report.overallScore,
      cardStyle: selectedTheme as any,
      selectedStats: getSelectedStatsList(),
      landmarks: activeFrame.landmarks,
      ruleResults: activeFrame.ruleResults,
      calculatedAngles: activeFrame.angles,
      coachingCue: report.report.injuryRiskAssessment.explanation || 'Maintain dynamic stability and complete complete action sequence.',
      createdAt: new Date().toISOString(),
      capturedImage,
      sportAttributes: savedSportAttributes as any
    };

    try {
      const existingCards = await get('klutchh_trophy_cabinet') || [];
      const updated = [newCard, ...existingCards];
      await set('klutchh_trophy_cabinet', updated);
    } catch(e) {
      console.error("Failed to save trophy card to IndexedDB:", e);
    }

    setIsSaving(false);
    setCelebrationCard(newCard); // trigger confetti celebration!
    setIsCollectionView(true); // Jump to collection to see it rotating!
  };

  const currentViewCard = isCollectionView && savedCards.length > 0 
    ? savedCards[selectedCollectionIdx] 
    : null;

  const themeId = currentViewCard ? currentViewCard.cardStyle : selectedTheme;
  const themeObj = CARD_THEMES.find(t => t.id === themeId) || CARD_THEMES[0];

  // FIFA Ultimate Team Style calculated stats
  const baseScore = currentViewCard ? currentViewCard.score : (report.overallScore || 85);
  const symmetryScore = currentViewCard ? (currentViewCard.selectedStats.find(s => s.label === 'Symmetry')?.value.replace('%', '') || 88) : (activeFrame?.symmetryScore || report.symmetryScore || 88);
  const safetyScore = currentViewCard ? (currentViewCard.selectedStats.find(s => s.label === 'Knee Align')?.value.replace('%', '') || 90) : (activeFrame?.kneeSafetyScore || report.kneeSafetyScore || 90);
  const peakTorqueVal = currentViewCard ? (currentViewCard.selectedStats.find(s => s.label === 'Peak Torque')?.value.replace(' Nm', '') || 180) : (report.dynamicMetrics?.estimatedPeakTorque || 180);
  const speedVal = report.dynamicMetrics?.peakAngularVelocity || 220;

  const getSportAttributes = () => {
    if (currentViewCard?.sportAttributes) return currentViewCard.sportAttributes;

    // Helper: Normalize 0-100 values directly, or scale raw values to 0-99
    const norm = (val: number) => Math.min(99, Math.max(0, Math.round(val)));
    const outOf10 = (val: number) => (Math.min(99, Math.max(0, Number(val))) / 10).toFixed(1);
    
    // Use metrics from activeFrame if available, otherwise fallback to report-wide metrics
    const frameVelocities = activeFrame?.velocity ? Object.values(activeFrame.velocity) : [];
    const frameTorques = activeFrame?.torque ? Object.values(activeFrame.torque) : [];
    
    const frameMaxVelocity = frameVelocities.length > 0 ? Math.max(...frameVelocities) : 0;
    const frameMaxTorque = frameTorques.length > 0 ? Math.max(...frameTorques) : 0;

    const explosiveness = frameMaxVelocity > 0 ? (frameMaxVelocity / 4) : (report.dynamicMetrics?.explosivenessScore || 0);
    const peakTorque = frameMaxTorque > 0 ? frameMaxTorque : (report.dynamicMetrics?.estimatedPeakTorque || 0);
    const peakVelocity = frameMaxVelocity > 0 ? frameMaxVelocity : (report.dynamicMetrics?.peakAngularVelocity || 0);
    
    // Basic scaling for non-normalized raw data (assuming standard ranges for athletes)
    const pwr = norm((peakTorque / 300) * 100); 
    const spd = norm((peakVelocity / 500) * 100);
    const exp = norm(explosiveness);
    const sym = norm(activeFrame?.symmetryScore || report.symmetryScore || 0);
    const sft = norm(activeFrame?.kneeSafetyScore || report.kneeSafetyScore || 0);
    const base = norm(report.overallScore || 0);

    const isTitan = selectedTheme === 'kinetic_power_titan' || selectedTheme === 'midnight_stealth' || selectedTheme === 'neon_ignite';

    switch (report.sportId) {
      case 'rugby':
        return [
          { label: 'POW', value: isTitan ? outOf10(pwr) : pwr, name: 'Power' },
          { label: 'TCK', value: isTitan ? outOf10(sft) : sft, name: 'Tackling Core' },
          { label: 'RUN', value: isTitan ? outOf10(spd) : spd, name: 'Running Velocity' },
          { label: 'KIC', value: isTitan ? outOf10(exp) : exp, name: 'Kicking Explosiveness' },
          { label: 'PAS', value: isTitan ? outOf10(sym) : sym, name: 'Passing Symmetry' },
          { label: 'RES', value: isTitan ? outOf10(base) : base, name: 'Resilience' }
        ];
      case 'soccer':
        return [
          { label: 'PAC', value: isTitan ? outOf10(spd) : spd, name: 'Pace' },
          { label: 'DRI', value: isTitan ? outOf10(sym) : sym, name: 'Dribbling Symmetry' },
          { label: 'SHO', value: isTitan ? outOf10(exp) : exp, name: 'Shooting Power' },
          { label: 'DEF', value: isTitan ? outOf10(sft) : sft, name: 'Defending Joint Safety' },
          { label: 'PAS', value: isTitan ? outOf10(base) : base, name: 'Passing Precision' },
          { label: 'PHY', value: isTitan ? outOf10(pwr) : pwr, name: 'Physical Torque' }
        ];
      case 'netball':
        return [
          { label: 'SPD', value: isTitan ? outOf10(spd) : spd, name: 'Speed' },
          { label: 'INT', value: isTitan ? outOf10(sft) : sft, name: 'Interception Reach' },
          { label: 'SHT', value: isTitan ? outOf10(base) : base, name: 'Shooting Form' },
          { label: 'PAS', value: isTitan ? outOf10(sym) : sym, name: 'Passing Stability' },
          { label: 'AGY', value: isTitan ? outOf10(exp) : exp, name: 'Agility' },
          { label: 'BAL', value: isTitan ? outOf10(pwr) : pwr, name: 'Balance Core' }
        ];
      case 'hockey':
        return [
          { label: 'SPD', value: isTitan ? outOf10(spd) : spd, name: 'Speed' },
          { label: 'CTL', value: isTitan ? outOf10(sym) : sym, name: 'Stick Control' },
          { label: 'SHT', value: isTitan ? outOf10(exp) : exp, name: 'Shooting Power' },
          { label: 'DEF', value: isTitan ? outOf10(sft) : sft, name: 'Defending Safety' },
          { label: 'PAS', value: isTitan ? outOf10(base) : base, name: 'Passing Accuracy' },
          { label: 'PHY', value: isTitan ? outOf10(pwr) : pwr, name: 'Physical Core' }
        ];
      case 'cricket':
        return [
          { label: 'RUN', value: isTitan ? outOf10(spd) : spd, name: 'Running Velocity' },
          { label: 'POW', value: isTitan ? outOf10(pwr) : pwr, name: 'Power/Striking' },
          { label: 'ACC', value: isTitan ? outOf10(base) : base, name: 'Bowling Accuracy' },
          { label: 'FLD', value: isTitan ? outOf10(sym) : sym, name: 'Fielding Symmetry' },
          { label: 'PAS', value: isTitan ? outOf10(sft) : sft, name: 'Throwing Safety' },
          { label: 'PHY', value: isTitan ? outOf10(exp) : exp, name: 'Core Stamina' }
        ];
      case 'basketball':
        return [
          { label: 'SPD', value: isTitan ? outOf10(spd) : spd, name: 'Speed' },
          { label: 'DRI', value: isTitan ? outOf10(sym) : sym, name: 'Dribbling Flow' },
          { label: 'SHT', value: isTitan ? outOf10(base) : base, name: 'Shooting Alignment' },
          { label: 'DEF', value: isTitan ? outOf10(sft) : sft, name: 'Defense Joint Armor' },
          { label: 'PAS', value: isTitan ? outOf10(base) : base, name: 'Passing Accuracy' },
          { label: 'JMP', value: isTitan ? outOf10(exp) : exp, name: 'Vertical Jump' }
        ];
      case 'tennis':
        return [
          { label: 'SPD', value: isTitan ? outOf10(spd) : spd, name: 'Speed' },
          { label: 'PWR', value: isTitan ? outOf10(pwr) : pwr, name: 'Power' },
          { label: 'SRV', value: isTitan ? outOf10(exp) : exp, name: 'Serving Speed' },
          { label: 'AGY', value: isTitan ? outOf10(sym) : sym, name: 'Court Agility' },
          { label: 'ACC', value: isTitan ? outOf10(base) : base, name: 'Shot Accuracy' },
          { label: 'STA', value: isTitan ? outOf10(pwr) : pwr, name: 'Stamina Core' }
        ];
      case 'golf':
        return [
          { label: 'DRV', value: isTitan ? outOf10(pwr) : pwr, name: 'Driving Distance' },
          { label: 'ACC', value: isTitan ? outOf10(base) : base, name: 'Clubface Accuracy' },
          { label: 'TEM', value: isTitan ? outOf10(sym) : sym, name: 'Swing Tempo' },
          { label: 'PWR', value: isTitan ? outOf10(exp) : exp, name: 'Power Translation' },
          { label: 'BAL', value: isTitan ? outOf10(sft) : sft, name: 'Base Balance' },
          { label: 'FOC', value: isTitan ? outOf10(pwr) : pwr, name: 'Focus Torque' }
        ];
      default:
        return [
          { label: 'PAC', value: isTitan ? outOf10(spd) : spd, name: 'Pace' },
          { label: 'DRI', value: isTitan ? outOf10(sym) : sym, name: 'Dribbling' },
          { label: 'SHO', value: isTitan ? outOf10(exp) : exp, name: 'Power' },
          { label: 'DEF', value: isTitan ? outOf10(sft) : sft, name: 'Safety' },
          { label: 'PAS', value: isTitan ? outOf10(base) : base, name: 'Precision' },
          { label: 'PHY', value: isTitan ? outOf10(pwr) : pwr, name: 'Core' }
        ];
    }
  };

  const sportAttributes = getSportAttributes();

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Introduction Banner */}
      <div className="bg-gradient-to-r from-red-950/40 via-zinc-900 to-amber-950/20 border border-zinc-800 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="bg-amber-500/10 text-amber-400 p-3.5 rounded-2xl border border-amber-500/20 shrink-0">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase italic text-white tracking-wide">
              🏆 Collectible Athlete Trading Cards
            </h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed">
              Mint your high-performance biomechanics keyframes into custom collectible trading cards! Personalize your name, select your background aura, highlight critical power stats, and showcase them in your private **Trophy Cabinet**.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCollectionView(!isCollectionView)}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border ${
              isCollectionView 
                ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/20' 
                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-900'
            }`}
          >
            {isCollectionView ? <Sparkles className="w-4 h-4" /> : <Trophy className="w-4 h-4" />}
            <span>{isCollectionView ? 'Back to Designer' : 'View My Cabinet'}</span>
          </button>
          <div className="hidden sm:flex items-center gap-2.5 bg-zinc-950/80 border border-zinc-800/80 px-4 py-2.5 rounded-xl text-xs font-mono">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-zinc-400">Cabinet:</span>
            <strong className="text-white font-bold">{savedCards.length} Cards</strong>
          </div>
        </div>
      </div>

      {/* Main Drafting Workspace */}
      {report.videoUrl && (
        <video
          ref={hiddenVideoRef}
          src={report.videoUrl}
          style={{ display: 'none', position: 'absolute', width: '1px', height: '1px', opacity: 0, pointerEvents: 'none' }}
          muted
          playsInline
          preload="auto"
          onError={(e: any) => {
            console.warn("TrophyCard video frame preload handled:", e?.type || 'error event');
          }}
          onSeeked={() => {
            const canvas = canvasRef.current;
            if (canvas) {
              const ctx = canvas.getContext('2d');
              if (ctx) draw(ctx, canvas);
            }
          }}
        />
      )}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Options & Customization Plaquette (Lg: 5cols) */}
        <div className="lg:col-span-5 bg-zinc-950/60 border border-zinc-800 p-5 rounded-2xl flex flex-col gap-5">
          {isCollectionView ? (
            <div className="flex flex-col gap-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <h3 className="text-sm font-black uppercase text-white tracking-wider">My Collection</h3>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">{savedCards.length} Minted</span>
              </div>

              {savedCards.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-700">
                    <Award className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Cabinet is empty</p>
                  <button 
                    onClick={() => setIsCollectionView(false)}
                    className="text-[10px] text-amber-500 underline"
                  >
                    Go Mint Your First Card
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-1 no-scrollbar">
                  {savedCards.map((card, idx) => (
                    <button
                      key={card.id}
                      onClick={() => setSelectedCollectionIdx(idx)}
                      className={`w-full p-3 rounded-xl border flex items-center gap-3 transition-all ${
                        selectedCollectionIdx === idx 
                          ? 'bg-zinc-900 border-amber-500/50 shadow-lg' 
                          : 'bg-zinc-950/40 border-zinc-900 hover:border-zinc-800'
                      }`}
                    >
                      <div className={`w-10 h-14 rounded bg-gradient-to-br ${CARD_THEMES.find(t => t.id === card.cardStyle)?.bg} border border-white/10 shrink-0 overflow-hidden relative`}>
                        {card.capturedImage && <img src={card.capturedImage} className="w-full h-full object-cover opacity-60" alt="Thumb" />}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black text-white uppercase truncate max-w-[120px]">{card.athleteName}</span>
                          <span className="text-[9px] font-mono text-amber-500">{card.score}%</span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[9px] text-zinc-500 uppercase">{card.sportName}</span>
                          <span className="text-[8px] text-zinc-600">{new Date(card.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {savedCards.length > 0 && (
                <button
                  onClick={async () => {
                    const updated = savedCards.filter((_, idx) => idx !== selectedCollectionIdx);
                    await set('klutchh_trophy_cabinet', updated);
                    setSavedCards(updated);
                    if (selectedCollectionIdx >= updated.length) setSelectedCollectionIdx(Math.max(0, updated.length - 1));
                  }}
                  className="mt-2 w-full py-2.5 bg-red-950/20 border border-red-900/30 text-red-400 hover:bg-red-900/30 text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Burn This Card</span>
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
                <Award className="w-5 h-5 text-red-500" />
                <h3 className="text-sm font-black uppercase text-white tracking-wider">Trading Card Designer</h3>
              </div>

              {/* Option 2: Athlete Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                  2. Custom Athlete Name
                </label>
                <input
                  type="text"
                  value={athleteName}
                  onChange={(e) => setAthleteName(e.target.value)}
                  placeholder="Enter Athlete Name..."
                  maxLength={18}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 font-bold"
                />
              </div>

              {/* Option 3: Card Aura Theme */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                  3. Select Card Theme Style
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CARD_THEMES.map((theme) => {
                    const isSelected = selectedTheme === theme.id;
                    return (
                      <button
                        key={theme.id}
                        onClick={() => setSelectedTheme(theme.id)}
                        className={`px-3 py-2.5 rounded-xl border text-xs font-bold text-left flex items-center gap-2 transition-all ${
                          isSelected
                            ? 'bg-zinc-900 border-white text-white ring-1 ring-white/20'
                            : 'bg-zinc-900/40 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full bg-gradient-to-br ${theme.bg} border ${theme.border}`} />
                        <span>{theme.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Option 4: Showcase Stats */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                  4. Choose Highlight Stats (Max 3)
                </label>
                <div className="flex flex-col gap-1.5 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/60">
                  <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer py-1">
                    <input
                      type="checkbox"
                      checked={statOverall}
                      onChange={(e) => setStatOverall(e.target.checked)}
                      className="rounded border-zinc-800 bg-zinc-950 text-red-600 focus:ring-red-500"
                    />
                    <span>Overall Precision Score ({report.overallScore}%)</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer py-1">
                    <input
                      type="checkbox"
                      checked={statSymmetry}
                      onChange={(e) => setStatSymmetry(e.target.checked)}
                      className="rounded border-zinc-800 bg-zinc-950 text-red-600 focus:ring-red-500"
                    />
                    <span>Symmetry Alignment ({activeFrame.symmetryScore || report.symmetryScore}%)</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer py-1">
                    <input
                      type="checkbox"
                      checked={statKneeSafety}
                      onChange={(e) => setStatKneeSafety(e.target.checked)}
                      className="rounded border-zinc-800 bg-zinc-950 text-red-600 focus:ring-red-500"
                    />
                    <span>Knee Valgus Safety ({activeFrame.kneeSafetyScore || report.kneeSafetyScore}%)</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer py-1">
                    <input
                      type="checkbox"
                      checked={statTorque}
                      onChange={(e) => setStatTorque(e.target.checked)}
                      className="rounded border-zinc-800 bg-zinc-950 text-red-600 focus:ring-red-500"
                    />
                    <span>Estimated Peak Torque ({report.dynamicMetrics?.estimatedPeakTorque || 180} Nm)</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer py-1">
                    <input
                      type="checkbox"
                      checked={statExplosiveness}
                      onChange={(e) => setStatExplosiveness(e.target.checked)}
                      className="rounded border-zinc-800 bg-zinc-950 text-red-600 focus:ring-red-500"
                    />
                    <span>Explosiveness Factor ({report.dynamicMetrics?.explosivenessScore || 82})</span>
                  </label>
                </div>
              </div>

              {/* Action Footer */}
              <div className="flex flex-col gap-2 mt-2">
                <button
                  onClick={handleSaveCard}
                  disabled={isSaving}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/15 disabled:opacity-50 hover:scale-[1.01] active:scale-95 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Minting Card...' : 'Mint & Save to Trophy Cabinet'}</span>
                </button>
                <p className="text-[10px] text-zinc-500 text-center">
                  * Minting cards automatically syncs them with your cloud account and saves your local progress.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Right: Interactive 3D Baseball Card Showcase (Lg: 7cols) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center gap-6 py-6 bg-zinc-950/30 border border-zinc-900 rounded-2xl">
          
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Hover card to trigger holographic skew. Flip to view coaching details.
          </span>

          {/* Outer perspective wrapper */}
          <div className="perspective-1000 w-[280px] h-[420px] sm:w-[290px] sm:h-[440px] cursor-pointer">
            
            {/* The 3D Card Rotator */}
            <div
              className="w-full h-full relative duration-700 preserve-3d"
              style={{
                transform: `rotateY(${isFlipped ? 180 + spinDegree : spinDegree}deg) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
                transformStyle: 'preserve-3d',
                transition: isSpinning ? 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)' : (isFlipped ? 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)' : 'transform 0.1s ease-out')
              }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onClick={handleCardClick}
            >
              
              {/* FRONT OF THE CARD */}
              <div 
                className={`absolute inset-0 bg-gradient-to-b ${themeObj.bg} border-2 ${themeObj.border} rounded-2xl overflow-hidden flex flex-col p-4 shadow-2xl backface-hidden`}
                style={{
                  boxShadow: `0 25px 50px -12px ${themeObj.glow}`
                }}
              >
                
                {/* Holographic Glint & Sheen Effect */}
                <div className="absolute inset-0 w-[200%] h-[200%] -top-1/2 -left-1/2 bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none animate-glint z-20" />

                {/* Visual Glimmer Overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none mix-blend-overlay z-10" />

                {/* Card Top Information */}
                <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5 z-10">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-black text-amber-400">★</span>
                    <h3 className="text-xs font-black text-white uppercase truncate max-w-[150px] tracking-wide">
                      {currentViewCard ? currentViewCard.athleteName : athleteName}
                    </h3>
                  </div>
                  <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest">{report.sportId === 'rugby' ? 'TCK' : report.sportId === 'swim' ? 'SWM' : 'ATH'} // GEN-3</span>
                </div>

                {/* FIFA Middle Area: Left Rating, Right Volumetric Skeleton */}
                <div className="flex flex-1 gap-2 items-center my-3 z-10 min-h-[220px]">
                  
                  {/* Left Column: FIFA Badge */}
                  <div className="flex flex-col items-center justify-center text-center select-none w-[64px] py-1 border-r border-white/5 shrink-0">
                    <span className={`text-4xl font-extrabold tracking-tighter ${themeObj.text} block leading-none`}>
                      {baseScore}
                    </span>
                    <span className="text-[11px] font-black uppercase text-white tracking-widest mt-1 block">
                      {report.sportId === 'rugby' ? 'TCK' : report.sportId === 'swim' ? 'SWM' : 'ATH'}
                    </span>
                    
                    <div className="w-8 h-px bg-white/10 my-2" />

                    {/* Miniature Sport Crest Shield */}
                    <div className="relative w-8 h-9 border border-white/20 bg-black/40 rounded flex flex-col items-center justify-center text-[10px] shadow">
                      <span className="text-zinc-400 block leading-none">🏆</span>
                      <span className="text-[7px] font-mono text-white mt-1 leading-none">PRO</span>
                    </div>

                    <div className="w-8 h-px bg-white/10 my-2" />

                    {/* Team Nation Flag representation */}
                    <div className="text-sm font-bold">🇺🇸</div>
                  </div>

                  {/* Right Column: Dynamic Frame Skeleton Canvas overlaying background */}
                  <div className="relative flex-1 bg-zinc-950/90 border border-white/10 rounded-xl overflow-hidden flex items-center justify-center h-full">
                    {/* Visual Radial Scanner Ring */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)] pointer-events-none" />
                    
                    {currentViewCard?.capturedImage ? (
                      <img src={currentViewCard.capturedImage} className="w-full h-full object-cover" alt="Captured" />
                    ) : (
                      <canvas
                        ref={canvasRef}
                        width={320}
                        height={180}
                        className="w-full h-full object-cover"
                      />
                    )}

                    {/* Tiny Phase Moment Overlay */}
                    <div className="absolute bottom-1.5 left-1.5 bg-black/80 backdrop-blur border border-white/10 px-1.5 py-0.5 rounded text-[8px] font-mono text-zinc-400 uppercase truncate max-w-[140px]">
                      {currentViewCard ? currentViewCard.movementPhase : activeFrame.detectedPhase}
                    </div>
                  </div>

                </div>

                {/* FIFA Bottom 6-Attribute Attributes Panel */}
                <div className="bg-black/60 border border-white/10 p-2.5 rounded-xl z-10 grid grid-cols-2 gap-x-4 gap-y-1 mt-auto font-mono text-[10px]">
                  {getSportAttributes().map((stat, sIdx) => (
                    <div key={sIdx} className="flex justify-between items-center border-b border-white/5 pb-0.5">
                      <span className="text-zinc-500 font-bold uppercase" title={stat.name}>{stat.label}</span>
                      <strong className="text-white font-black">{stat.value}</strong>
                    </div>
                  ))}
                </div>

                {/* Footer Ribbon with bar decoration */}
                <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-white/10 text-[8px] font-mono text-zinc-500 z-10 leading-none">
                  <span className="flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-500 animate-pulse" />
                    <strong className="text-zinc-400">TOTAL PK: {calculateCardPower()}</strong>
                  </span>
                  <span>KLUTCHH PRO LAB // CORE</span>
                </div>
              </div>

              {/* BACK OF THE CARD */}
              <div 
                className="absolute inset-0 bg-zinc-950 border-2 border-zinc-800 rounded-2xl flex flex-col p-5 shadow-2xl backface-hidden"
                style={{
                  transform: 'rotateY(180deg)'
                }}
              >
                <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    <h3 className="text-xs font-black uppercase text-white tracking-wider">Biomechanical DNA</h3>
                  </div>
                  <span className="text-[9px] font-mono text-zinc-500">AUTHENTIC CAPTURE</span>
                </div>

                {/* Profile Biometrics Grid */}
                <div className="flex flex-col gap-4 my-5 flex-grow justify-center">
                  <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800">
                    <h4 className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider">Technique Rating</h4>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="h-2 bg-zinc-950 rounded-full flex-1 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-red-500 to-amber-500 rounded-full"
                          style={{ width: `${report.overallScore}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-white font-bold">{report.overallScore}%</span>
                    </div>
                  </div>

                  <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800 flex flex-col gap-1">
                    <h4 className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider">Coaching Advice</h4>
                    <p className="text-[11px] text-zinc-300 leading-normal italic font-medium mt-1">
                      &quot;{currentViewCard ? currentViewCard.coachingCue : (report.report.injuryRiskAssessment.explanation || 'Maintain dynamic knee stability and engage core musculature.')}&quot;
                    </p>
                  </div>

                  <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800">
                    <h4 className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider">Action Plan Recommended</h4>
                    <div className="flex items-center gap-2 mt-2 text-[11px] text-zinc-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate">
                        {currentViewCard ? 'Biomechanic Recovery Drills' : (report.report.funCorrectiveDrills?.[0]?.name || 'Single-Leg Drop Landings')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Back Barcode & Footer */}
                <div className="mt-auto border-t border-zinc-900 pt-3 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="h-6 bg-white rounded-md flex items-center justify-around px-2 opacity-80 overflow-hidden">
                      {/* Simulated barcode */}
                      {[...Array(24)].map((_, idx) => (
                        <div 
                          key={idx} 
                          className="bg-black h-4" 
                          style={{ width: `${(idx % 3 === 0 ? 3 : idx % 2 === 0 ? 1 : 2)}px` }} 
                        />
                      ))}
                    </div>
                  </div>
                  <div className="text-right text-[8px] font-mono text-zinc-500 leading-snug">
                    <p>MINT DATE: {new Date().toLocaleDateString()}</p>
                    <p>SYSTEM CODE: MP-POSE-LND</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <button
            onClick={() => setIsFlipped(!isFlipped)}
            className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-bold uppercase flex items-center gap-2 transition-all hover:bg-zinc-800 active:scale-95"
          >
            <FlipHorizontal className="w-4 h-4 text-red-500" />
            <span>Flip Card to View Biometrics</span>
          </button>
        </div>

      </div>

      {/* CONFETTI CELEBRATION MODAL */}
      <AnimatePresence>
        {celebrationCard && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            
            {/* Celebration backdrop aura */}
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
              <div className="w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-[120px] animate-pulse" />
              <div className="w-[300px] h-[300px] bg-red-500/10 rounded-full blur-[80px] animate-pulse" />
            </div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 max-w-sm w-full text-center flex flex-col items-center gap-5 relative shadow-2xl"
            >
              
              {/* Confetti Explosion Animation */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
                {[...Array(40)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#ec4899'][i % 5],
                      top: '50%',
                      left: '50%'
                    }}
                    animate={{
                      x: (Math.random() - 0.5) * 400,
                      y: (Math.random() - 0.5) * 400 - 100,
                      scale: [0, 1, 0],
                      opacity: [1, 1, 0]
                    }}
                    transition={{
                      duration: 1.5,
                      ease: 'easeOut',
                      delay: (i % 8) * 0.05
                    }}
                  />
                ))}
              </div>

              <div className="w-14 h-14 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-amber-400 animate-spin" />
              </div>

              <div>
                <h2 className="text-xl font-black uppercase italic text-white tracking-wider">Trading Card Minted!</h2>
                <p className="text-xs text-zinc-400 mt-1">Your high-performance collectable is active in your Trophy Cabinet!</p>
              </div>

              {/* Miniature card style card showcase */}
              <div className="py-1">
                <UnifiedTradingCard card={celebrationCard} size="sm" interactive={false} />
              </div>

              <div className="flex items-center gap-2 bg-zinc-950 px-4 py-2 rounded-xl border border-zinc-800/80 text-xs font-mono">
                <span className="text-amber-400 font-bold">🎯 ATHLETE POWER: +150 XP</span>
              </div>

              <button
                onClick={() => setCelebrationCard(null)}
                className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-750 text-white rounded-xl text-xs font-bold uppercase transition-all"
              >
                Awesome, View My Cabinet
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
