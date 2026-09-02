import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  SportRule,
  FrameAnalysis,
  AICoachingReport,
  SavedReport,
  UserAccount,
  MediaPipeLandmark,
  Drill
} from '../types';
import { KineticVideoPlayer } from './Report/KineticVideoPlayer';
import { CoachingInsightPanel } from './Report/CoachingInsightPanel';
import { TimelineScrubber } from './Report/TimelineScrubber';
import { ensureMinimumKeyframes } from '../utils/videoAnalyzer';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  Printer,
  Sparkles,
  ShieldCheck,
  Activity,
  Award,
  Calendar,
  User,
  Share2,
  Flame,
  Clock,
  Target,
  FileText,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  ArrowRight,
  Info,
  Zap,
  ShieldAlert,
  Layers,
  ChevronLeft,
  ChevronRight,
  X,
  Cloud,
  Download,
  HardDrive,
  FolderOpen,
  Search,
  Trophy,
  AlertCircle,
  BookOpen,
  Upload,
  Dumbbell,
  ExternalLink
} from 'lucide-react';
import { COMPREHENSIVE_DRILL_LIBRARY } from '../data/drillLibrary';
import { get } from 'idb-keyval';
import { calculateAngle, checkJointVisibilityOcclusion } from '../utils/geometry';
import { calculateKlutchhScore } from '../utils/klutchhAnalysis';

import { SequenceVerificationMatrix } from './SequenceVerificationMatrix';
import { KineticVelocityWave } from './KineticVelocityWave';
import { TrophyCardMaker } from './TrophyCardMaker';
import { BiomechanicalGameArena } from './BiomechanicalGameArena';
import { SaveToAthleteModal } from './SaveToAthleteModal';
import { GhostCorrectionVisualizer } from './GhostCorrectionVisualizer';
import { motion } from 'motion/react';

import monsterWalkImg from '../assets/images/monster_walk_drill_1786821620557.jpg';
import spineHingeImg from '../assets/images/spine_hinge_drill_1786821633655.jpg';
import trophyPoseImg from '../assets/images/trophy_pose_drill_1786821647464.jpg';
import chestOverBallImg from '../assets/images/chest_over_ball_drill_1786821658255.jpg';

interface AnalysisReportPageProps {
  sportRule: SportRule;
  videoUrl: string | null;
  keyframeList: FrameAnalysis[];
  allFrames?: FrameAnalysis[];
  aiReport: AICoachingReport | null;
  sequenceComparison?: {
    ideal: string[];
    actual: string[];
    isCorrect: boolean;
    feedback: string;
  } | null;
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
  dynamicMetrics?: {
    peakAngularVelocity: number;
    estimatedPeakTorque: number;
    explosivenessScore: number;
    overallBiometricScore?: number;
    overallSymmetry?: number;
    overallKneeSafety?: number;
    precisionScore?: number;
    kineticFlowScore?: number;
    jointArmorScore?: number;
  } | null;
  overallSymmetry?: number;
  overallKneeSafety?: number;
  currentUser: UserAccount | null;
  calibratedFps?: number;
  athleteCategory?: 'elementary' | 'middle_school' | 'high_school';
  onBack: () => void;
  onVideoSelected?: (url: string, file?: File) => void;
  onSaveReport?: (report: SavedReport) => void;
  onOpenDrillsLibrary?: () => void;
  initialCoachNotes?: string;
  activeReportId?: string | null;
  videoFile?: File | null;
  initialDrillProgress?: Record<number, 'pending' | 'completed' | 'mastered'>;
  onUpdateDrillProgress?: (progress: Record<number, 'pending' | 'completed' | 'mastered'>) => void;
  startTime?: number;
  endTime?: number;
  cropBox?: { x: number; y: number; width: number; height: number };
}

export const AnalysisReportPage: React.FC<AnalysisReportPageProps> = ({
  sportRule,
  videoUrl,
  keyframeList,
  allFrames = [],
  aiReport,
  sequenceComparison,
  kineticSequence,
  dynamicMetrics,
  overallSymmetry,
  overallKneeSafety,
  currentUser,
  calibratedFps = 30,
  athleteCategory = 'middle_school',
  onBack,
  onVideoSelected,
  onSaveReport,
  onOpenDrillsLibrary,
  initialCoachNotes = '',
  activeReportId,
  videoFile,
  initialDrillProgress,
  onUpdateDrillProgress,
  startTime = 0,
  endTime,
  cropBox
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const stageContainerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [coachNotes, setCoachNotes] = useState(initialCoachNotes);
  const [showUploader, setShowUploader] = useState(false);
  const [showSaveAthleteModal, setShowSaveAthleteModal] = useState(false);
  const [showExportSuccess, setShowExportSuccess] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'game' | 'drills' | 'notes' | 'trading_card' | 'sequence' | 'joint_audit'>('overview');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [localSequenceComparison, setLocalSequenceComparison] = useState(sequenceComparison);
  const [activeQuestDrill, setActiveQuestDrill] = useState<any | null>(null);
  const [activeExplainerMetric, setActiveExplainerMetric] = useState<{ label: string; score: number; meaning: string; formula: string } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [activeQuestIndex, setActiveQuestIndex] = useState<number | null>(null);
  const [questReps, setQuestReps] = useState(0);
  const [questGoalReps, setQuestGoalReps] = useState(8);
  const [questXpEarned, setQuestXpEarned] = useState(0);
  const [questVictory, setQuestVictory] = useState(false);
  const [showStorageNoticeModal, setShowStorageNoticeModal] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'student' | 'coach'>('student');
  const [isDataReady, setIsDataReady] = useState(false);
  const [readyingProgress, setReadyingProgress] = useState(0);

  // Barrier: Ensure everything is ready before showing the report
  useEffect(() => {
    if (isDataReady) return;

    let mounted = true;
    let timeoutId: any;
    let attempts = 0;

    const checkReady = async () => {
      attempts++;
      const hasFrames = allFrames && allFrames.length > 0;
      const isReadyEnough = attempts > 5;

      if (!isReadyEnough || !hasFrames) {
        if (mounted) {
          setReadyingProgress(prev => Math.min(prev + 5, 75));
          timeoutId = setTimeout(checkReady, 300);
        }
        return;
      }

      if (mounted) setReadyingProgress(95);
      await new Promise(r => setTimeout(r, 800));

      if (mounted) {
        setReadyingProgress(100);
        setIsDataReady(true);
      }
    };

    const safetyTimeout = setTimeout(() => {
      if (mounted && !isDataReady) {
        setIsDataReady(true);
      }
    }, 4500);

    checkReady();
    return () => { 
      mounted = false; 
      if (timeoutId) clearTimeout(timeoutId);
      clearTimeout(safetyTimeout);
    };
  }, [videoUrl, allFrames, isDataReady]);

  useEffect(() => {
    setLocalSequenceComparison(sequenceComparison);
  }, [sequenceComparison]);

  const [drillProgress, setDrillProgress] = useState<Record<number, 'pending' | 'completed' | 'mastered'>>(initialDrillProgress || {});
  const drillSectionRef = useRef<HTMLDivElement>(null);

  const safeKeyframeList = useMemo(() => {
    return ensureMinimumKeyframes(keyframeList || [], allFrames || [], sportRule, 'grassroots', calibratedFps, 6);
  }, [keyframeList, allFrames, sportRule, calibratedFps]);

  const hasAnyOcclusion = useMemo(() => {
    const framesToCheck = allFrames && allFrames.length > 0 ? allFrames : keyframeList;
    return framesToCheck.some(f => checkJointVisibilityOcclusion(f.landmarks).hasOcclusion);
  }, [allFrames, keyframeList]);

  const titanRating = useMemo(() => {
    if (dynamicMetrics?.overallBiometricScore && dynamicMetrics.overallBiometricScore > 0) {
      return dynamicMetrics.overallBiometricScore;
    }
    if (aiReport?.overallGrade) {
      const g = aiReport.overallGrade.toUpperCase();
      if (g.startsWith('A+')) return 9.6;
      if (g.startsWith('A')) return 9.0;
      if (g.startsWith('B+')) return 8.4;
      if (g.startsWith('B')) return 7.8;
      if (g.startsWith('C+')) return 7.0;
      if (g.startsWith('C')) return 6.2;
    }
    const calcScore = calculateKlutchhScore(safeKeyframeList[0]?.ruleResults);
    return calcScore || 8.2;
  }, [dynamicMetrics, aiReport, safeKeyframeList]);

  const explosivePower = useMemo(() => {
    if (dynamicMetrics?.explosivenessScore && dynamicMetrics.explosivenessScore > 0) {
      return dynamicMetrics.explosivenessScore;
    }
    if (dynamicMetrics?.peakAngularVelocity && dynamicMetrics.peakAngularVelocity > 0) {
      return Math.min(99, Math.max(30, Math.round(dynamicMetrics.peakAngularVelocity * 0.28)));
    }
    return Math.min(99, Math.max(30, Math.round(titanRating * 9.5)));
  }, [dynamicMetrics, titanRating]);

  const jointArmor = useMemo(() => {
    if (dynamicMetrics?.jointArmorScore && dynamicMetrics.jointArmorScore > 0) {
      return dynamicMetrics.jointArmorScore;
    }
    if (dynamicMetrics?.overallKneeSafety && dynamicMetrics.overallKneeSafety > 0) {
      return dynamicMetrics.overallKneeSafety;
    }
    if (overallKneeSafety && overallKneeSafety > 0) {
      return overallKneeSafety;
    }
    if (aiReport?.injuryRiskAssessment?.level) {
      return aiReport.injuryRiskAssessment.level === 'low' ? 92 : aiReport.injuryRiskAssessment.level === 'moderate' ? 76 : 58;
    }
    return 88;
  }, [dynamicMetrics, overallKneeSafety, aiReport]);

  const precision = useMemo(() => {
    if (dynamicMetrics?.precisionScore && dynamicMetrics.precisionScore > 0) {
      return dynamicMetrics.precisionScore;
    }
    return Math.min(99, Math.max(30, Math.round(titanRating * 10)));
  }, [dynamicMetrics, titanRating]);

  const kineticFlow = useMemo(() => {
    if (dynamicMetrics?.kineticFlowScore && dynamicMetrics.kineticFlowScore > 0) {
      return dynamicMetrics.kineticFlowScore;
    }
    if (dynamicMetrics?.overallSymmetry && dynamicMetrics.overallSymmetry > 0) {
      return dynamicMetrics.overallSymmetry;
    }
    if (overallSymmetry && overallSymmetry > 0) {
      return overallSymmetry;
    }
    if (kineticSequence?.sequenceEfficiency && kineticSequence.sequenceEfficiency > 0) {
      return kineticSequence.sequenceEfficiency;
    }
    return 85;
  }, [dynamicMetrics, overallSymmetry, kineticSequence]);

  useEffect(() => {
    if (initialDrillProgress) {
      setDrillProgress(initialDrillProgress);
    }
  }, [initialDrillProgress]);

  const toggleDrillStatus = (idx: number) => {
    setDrillProgress(prev => {
      const current = prev[idx] || 'pending';
      const nextStatus: 'pending' | 'completed' | 'mastered' = current === 'pending' ? 'completed' : current === 'completed' ? 'mastered' : 'pending';
      const updated: Record<number, 'pending' | 'completed' | 'mastered'> = { ...prev, [idx]: nextStatus };
      if (onUpdateDrillProgress) {
        onUpdateDrillProgress(updated);
      }
      return updated;
    });
  };

  const handleTapFault = (faultText: string, suggestedIndex: number) => {
    const drills = aiReport?.funCorrectiveDrills || sportRule.drills || [];
    let matchIdx = suggestedIndex % Math.max(1, drills.length);
    setActiveTab('drills');
    setTimeout(() => {
      if (drillSectionRef.current) {
        drillSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  // Auto-recover expired Blob URLs from IndexedDB
  useEffect(() => {
    if (videoError) {
      (async () => {
        if (activeReportId) {
          try {
            const file = await get(`video-${activeReportId}`);
            if (file && onVideoSelected) {
              const newUrl = URL.createObjectURL(file as Blob);
              onVideoSelected(newUrl, file as File);
              setVideoError(false);
            }
          } catch (e) {
            console.warn("Auto-reload from IDB failed:", e);
          }
        }
      })();
    }
  }, [videoError, activeReportId, onVideoSelected]);

  // Listen to fullscreen changes to keep UI state in sync
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!stageContainerRef.current) return;
    if (!document.fullscreenElement) {
      stageContainerRef.current.requestFullscreen().catch((err) => console.error(err));
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
    }
  };

  const averageAngles: Record<string, number> = {};
  sportRule.jointRules.forEach((rule) => {
    if (keyframeList.length > 0) {
      const vals = keyframeList.map((k) => {
        if (k.angles && k.angles[rule.id] !== undefined) return k.angles[rule.id];
        if (k.landmarks && rule.keypoints.length === 3) {
          const [p1, vertex, p3] = rule.keypoints;
          if (k.landmarks[p1] && k.landmarks[vertex] && k.landmarks[p3]) {
            return calculateAngle(k.landmarks[p1], k.landmarks[vertex], k.landmarks[p3]);
          }
        }
        return undefined;
      }).filter((v): v is number => v !== undefined && !isNaN(v));
      if (vals.length > 0) {
        averageAngles[rule.id] = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
      }
    }
    if (averageAngles[rule.id] === undefined) {
      averageAngles[rule.id] = Math.round((rule.idealMin + rule.idealMax) / 2);
    }
  });

  const sortedFrames = useMemo(() => {
    const list = allFrames && allFrames.length > 0 ? allFrames : keyframeList;
    if (!list || list.length === 0) return [];
    return [...list].sort((a, b) => a.timestamp - b.timestamp);
  }, [allFrames, keyframeList]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
  };

  const handleExportReport = async (athlete?: { id: string; name: string; folderName: string }) => {
    setIsExporting(true);
    try {
      const reportData = {
        version: "1.1",
        exportedAt: new Date().toISOString(),
        id: activeReportId || `report-${Date.now()}`,
        sportId: sportRule.id,
        sportName: sportRule.name,
        athleteName: athlete?.name,
        aiReport: aiReport || null,
        keyframeList: keyframeList || [],
        allFrames: allFrames || [],
        calibratedFps: calibratedFps || 30
      };
      const jsonString = JSON.stringify(reportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(athlete?.name || sportRule.name).toLowerCase().replace(/\s+/g, '_')}_klutchh_report.klutchh`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setShowExportSuccess(true);
      setTimeout(() => setShowExportSuccess(false), 5000);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl w-full mx-auto pb-12 relative">
      
      {!isDataReady && (
        <div className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-6">
            <div className="w-20 h-20 rounded-full border-4 border-zinc-800 border-t-red-600 animate-spin" />
            <div className="space-y-2">
              <h2 className="text-xl font-black text-white uppercase italic tracking-widest">Finalizing Biometrics...</h2>
              <p className="text-zinc-400 text-xs font-mono uppercase tracking-wider">Readying interactive telemetry buffers</p>
            </div>
            <div className="w-64 h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
              <motion.div className="h-full bg-gradient-to-r from-red-600 to-amber-500" initial={{ width: 0 }} animate={{ width: `${readyingProgress}%` }} />
            </div>
          </motion.div>
        </div>
      )}
      
      {showStorageNoticeModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border-2 border-amber-500/60 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative overflow-hidden flex flex-col gap-5 text-left animate-in fade-in zoom-in duration-300">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-red-600 text-zinc-950 flex items-center justify-center font-black shrink-0 shadow-lg">
                  <HardDrive className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-white uppercase italic tracking-wide mt-1">How Klutchh Stores Your Report</h3>
              </div>
              <button onClick={() => setShowStorageNoticeModal(false)} className="text-zinc-400 hover:text-white p-1 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 text-xs text-zinc-300 leading-relaxed font-medium bg-zinc-950/90 p-4 rounded-2xl border border-zinc-800">
              <p className="text-amber-200 font-bold">⚡ Biomechanical Analysis Complete!</p>
              <p>Reports are <strong>NOT stored on Klutchh servers</strong>. Export to keep your data.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
              <button onClick={() => handleExportReport()} className="w-full sm:w-auto flex-1 bg-gradient-to-r from-red-600 to-amber-500 text-white font-black text-xs py-3 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2"><Download className="w-4 h-4" /><span>Export .klutchh</span></button>
              <button onClick={() => setShowStorageNoticeModal(false)} className="w-full sm:w-auto bg-zinc-800 text-zinc-300 font-extrabold text-xs py-3 px-5 rounded-xl border border-zinc-700">View Report</button>
            </div>
          </div>
        </div>
      )}

      {hasAnyOcclusion && (
        <div className="bg-amber-500/10 border border-amber-500/40 p-4 rounded-2xl flex items-start gap-3 text-amber-200 text-xs">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="font-black uppercase tracking-wider text-amber-300">⚠️ Low Visibility Warning</span>
            <span>Some body parts were partially occluded. Calculations were approximated.</span>
          </div>
        </div>
      )}

      {aiReport?.drillThresholds && aiReport.drillThresholds.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 border-2 border-emerald-500/30 p-5 rounded-2xl flex flex-col sm:flex-row items-center gap-6 shadow-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-1 bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl border-l border-b border-emerald-500/20">
            Precision Target Mode Active
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Target className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-white font-black uppercase italic tracking-wider">Elite Biomechanical Targets</h3>
              <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-widest mt-0.5">Drill-Specific Requirements</p>
            </div>
          </div>
          
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
            {aiReport.drillThresholds.map((t, idx) => (
              <div key={idx} className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-black text-zinc-500 uppercase block tracking-tighter">{t.description}</span>
                  <span className="text-sm font-black text-white">{t.min}{t.unit} - {t.max}{t.unit}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Ideal</span>
                  <div className="w-1.5 h-6 bg-emerald-500/40 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 p-2 rounded-xl border border-zinc-700 transition-all"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <span className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">{viewMode === 'student' ? 'Hero Status' : 'Biometric Report'}</span>
            <h1 className="text-sm sm:text-lg lg:text-xl font-black uppercase italic tracking-wider text-white mt-0.5 truncate">{sportRule.name} Analysis</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 flex-wrap lg:flex-nowrap relative">
          <div className="bg-zinc-950 border border-zinc-800 p-1 rounded-xl flex items-center mr-2">
            <button onClick={() => setViewMode('student')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${viewMode === 'student' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-500 hover:text-zinc-300'}`}>🚀 Kid</button>
            <button onClick={() => setViewMode('coach')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${viewMode === 'coach' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>📋 Coach</button>
          </div>
          <button onClick={() => setShowSaveAthleteModal(true)} className="flex-1 lg:flex-none bg-gradient-to-r from-red-600 to-amber-500 text-white font-black text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-red-600/20"><Download className="w-4 h-4" /><span>Export .klutchh</span></button>
        </div>
      </div>

      {showSaveAthleteModal && (
        <SaveToAthleteModal
          isOpen={showSaveAthleteModal}
          onClose={() => setShowSaveAthleteModal(false)}
          sportId={sportRule.id}
          defaultAthleteCategory={athleteCategory}
          currentTitle={`${sportRule.name} Audit`}
          onConfirmSave={(athlete) => {
            if (onSaveReport) {
              onSaveReport({
                id: activeReportId || `report-${Date.now()}`,
                title: `${athlete.name} - ${sportRule.name} Audit`,
                createdAt: new Date().toISOString(),
                sportId: sportRule.id,
                sportName: sportRule.name,
                movementPhase: sportRule.phases[0] || 'Movement',
                athleteId: athlete.id,
                athleteName: athlete.name,
                folderName: athlete.folderName,
                videoUrl: videoUrl || undefined,
                duration: duration,
                overallGrade: aiReport?.overallGrade || 'A-',
                overallScore: 85,
                symmetryScore: kineticFlow,
                kneeSafetyScore: jointArmor,
                keyframeList: safeKeyframeList,
                allFrames: allFrames,
                report: aiReport || {
                  overallGrade: 'A-',
                  summaryTitle: sportRule.name + ' Analysis',
                  keyStrengths: [],
                  biomechanicInsights: [],
                  injuryRiskAssessment: { level: 'low', findings: [], preventionDrills: [] },
                  funCorrectiveDrills: [],
                  coachEncouragement: ''
                },
                authorName: currentUser?.name || 'Coach',
                coachNotes: coachNotes
              });
            }
            handleExportReport(athlete);
          }}
        />
      )}

      <div ref={stageContainerRef} className="relative w-full aspect-video max-h-[72vh] min-h-[220px] sm:min-h-[380px] bg-black border border-zinc-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl group flex items-center justify-center">
        <KineticVideoPlayer
          videoUrl={videoUrl || ''}
          sportRule={sportRule}
          sortedFrames={sortedFrames}
          cropBox={cropBox}
          isPlaying={isPlaying}
          currentTime={currentTime}
          onTimeUpdate={setCurrentTime}
          onDurationChange={setDuration}
          playbackRate={playbackSpeed}
          isDataReady={isDataReady}
          viewMode={viewMode}
          onTogglePlay={togglePlay}
          onToggleFullscreen={toggleFullscreen}
          isFullscreen={isFullscreen}
          onError={setVideoError}
        />
        <div className="absolute inset-x-0 bottom-0 z-30">
          <TimelineScrubber
            currentTime={currentTime}
            duration={duration}
            isPlaying={isPlaying}
            onTogglePlay={togglePlay}
            onSeek={handleSeek}
            onStepFrame={(delta) => handleSeek(currentTime + delta)}
            fps={calibratedFps}
            playbackSpeed={playbackSpeed}
            onPlaybackSpeedChange={setPlaybackSpeed}
            onToggleFullscreen={toggleFullscreen}
            isFullscreen={isFullscreen}
          />
        </div>
      </div>

      <div className="flex flex-col gap-6 mt-2 max-w-5xl mx-auto w-full">
          {(aiReport as any)?.proTipsAndCoolFacts && (aiReport as any).proTipsAndCoolFacts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {((aiReport as any).proTipsAndCoolFacts as any[]).map((card, cIdx) => (
                <div key={cIdx} className="relative overflow-hidden rounded-2xl p-5 border border-zinc-800 bg-zinc-900 shadow-xl transition-all hover:scale-[1.02]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center font-black text-xl border border-zinc-700 text-white">{card.icon || '✨'}</div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400">{card.phaseName || 'Insight'}</span>
                        <h4 className="text-sm font-black text-white tracking-wide">{card.title}</h4>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-200 leading-relaxed font-medium mt-3">{card.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* Section Tab Switcher */}
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
                activeTab === 'overview' ? 'bg-red-600 text-white shadow-lg' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              🎯 Top 3 Corrections
            </button>
            <button
              onClick={() => setActiveTab('sequence')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
                activeTab === 'sequence' ? 'bg-red-600 text-white shadow-lg' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              🧬 Kinetic Waves & Actions
            </button>
          </div>

          {activeTab === 'overview' && (
            <GhostCorrectionVisualizer
              keyframeList={safeKeyframeList}
              allFrames={allFrames}
              sportRule={sportRule}
              onSeekTimestamp={handleSeek}
              videoUrl={videoUrl}
            />
          )}

          {activeTab === 'sequence' && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              <KineticVelocityWave
                allFrames={allFrames}
                kineticSequence={kineticSequence as any}
                currentTime={currentTime}
                onSeek={handleSeek}
              />
              <SequenceVerificationMatrix
                sequenceComparison={localSequenceComparison}
                kineticSequence={kineticSequence}
                sportRule={sportRule}
                viewMode={viewMode}
                onUpdateSequenceComparison={setLocalSequenceComparison}
                drills={aiReport?.funCorrectiveDrills || sportRule.drills || []}
                drillProgress={drillProgress}
                onToggleDrillStatus={toggleDrillStatus}
                keyframes={keyframeList}
                currentTime={currentTime}
                onSeekVideo={handleSeek}
                onSelectKeyframe={(frame) => handleSeek(frame.timestamp)}
              />
            </div>
          )}
      </div>

      {activeQuestDrill && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border-2 border-amber-500/60 rounded-3xl p-6 max-w-xl w-full flex flex-col gap-5">
            <h3 className="text-base font-black text-white">{activeQuestDrill.name}</h3>
            <button onClick={() => setActiveQuestDrill(null)} className="w-full py-3 rounded-xl bg-amber-500 text-black font-black text-xs uppercase">Close Quest</button>
          </div>
        </div>
      )}

    </div>
  );
};
