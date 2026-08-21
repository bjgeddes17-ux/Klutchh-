import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SPORTS_RULES } from './data/sportsRules';
import { SportId, AthleteCategory, SkillLevel, FrameAnalysis, UserAccount, SavedReport, AICoachingReport, AnalysisResult, TrophyCard } from './types';
import { Header } from './components/Header';
import { VideoPosePlayer } from './components/VideoPosePlayer';
import { BiometricPanel } from './components/BiometricPanel';
import { UnifiedSetupCard } from './components/UnifiedSetupCard';
import { AuthModal } from './components/AuthModal';
import { SavedReportsModal } from './components/SavedReportsModal';
import { AnalysisReportPage } from './components/AnalysisReportPage';
import ProgressDashboard from './components/ProgressDashboard';
import { Play, FileText, Bookmark, Sparkles, CheckCircle2, TrendingUp, ShieldAlert, AlertCircle } from 'lucide-react';
import { auth, logoutFirebase } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { set, get, del } from 'idb-keyval';
import { autoPurgeExpiredLocalVideos, saveLocalVideoWithTTL, getLocalVideo, safeJsonStringify } from './utils/privacyStorage';
import { syncReportToPersonalCloud, syncAthleteFolderToPersonalCloud, getPersonalCloudConfig } from './utils/personalCloudStorage';
import { getCoachAthletes, formatAthleteFolderName, saveCoachAthlete } from './utils/rosterStorage';

import { MagicProcessingScreen } from './components/MagicProcessingScreen';
import { VideoCropAndScrubber } from './components/VideoCropAndScrubber';
import { detectCapableDevice } from './utils/videoAnalyzer';
import { PinPromptModal } from './components/PinPromptModal';
import { parseZeroKnowledgeShareHash } from './utils/shareReportUrl';

export default function App() {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [selectedSportId, setSelectedSportId] = useState<SportId>('rugby');
  const [athleteCategory, setAthleteCategory] = useState<AthleteCategory>('middle_school');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('grassroots');
  const [calibratedFps, setCalibratedFps] = useState<number>(30);
  const [selectedTechniqueId, setSelectedTechniqueId] = useState<string>(SPORTS_RULES[0].techniques[0]?.id || '');
  const [selectedMovementPhase, setSelectedMovementPhase] = useState<string>(SPORTS_RULES[0].phases[0]);
  const [customVideoUrl, setCustomVideoUrl] = useState<string | null>(null);
  const [customVideoFile, setCustomVideoFile] = useState<File | null>(null);
  const [targetAthleteAnchor, setTargetAthleteAnchor] = useState<'auto' | 'left' | 'center' | 'right'>('auto');

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 2800); // Elegantly show animated loading logo for 2.8s
    return () => clearTimeout(timer);
  }, []);

  const [currentAnalysis, setCurrentAnalysis] = useState<FrameAnalysis | null>(null);
  const [keyframeList, setKeyframeList] = useState<FrameAnalysis[]>([]);
  const [allFrames, setAllFrames] = useState<FrameAnalysis[]>([]);
  const [currentAIReport, setCurrentAIReport] = useState<AICoachingReport | null>(null);
  const [analysisCount, setAnalysisCount] = useState<number>(() => {
    const saved = localStorage.getItem('klutchh_analysis_count');
    return saved ? parseInt(saved, 10) || 0 : 0;
  });

  useEffect(() => {
    localStorage.setItem('klutchh_analysis_count', analysisCount.toString());
  }, [analysisCount]);

  const [limitModal, setLimitModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  } | null>(null);

  // User Auth & Saved Reports State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('klutchh_user_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email !== 'marcus.vance@klutchh.app') {
          return parsed;
        }
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const maxAnalyses = currentUser?.email === 'bjgeddes17@gmail.com' 
    ? 1000 
    : (currentUser?.email?.includes('@klutchh.demo') || currentUser?.id?.startsWith('demo-coach-'))
      ? 100 
      : 10;

  const deduplicateReports = (reports: SavedReport[]): SavedReport[] => {
    if (!Array.isArray(reports)) return [];
    const seenIds = new Set<string>();
    const seenFingerprints = new Set<string>();
    return reports.filter((r) => {
      if (!r || !r.id || seenIds.has(r.id)) return false;
      
      // Deduplicate near-identical reports created within 3 seconds of each other
      const createdMs = new Date(r.createdAt || 0).getTime();
      const timeBucket = Math.floor(createdMs / 3000);
      const fingerprint = `${r.sportId || ''}-${r.title || ''}-${timeBucket}`;
      
      if (seenFingerprints.has(fingerprint)) return false;

      seenIds.add(r.id);
      seenFingerprints.add(fingerprint);
      return true;
    });
  };

  const [savedReports, setSavedReports] = useState<SavedReport[]>(() => {
    const saved = localStorage.getItem('klutchh_saved_reports');
    if (!saved) return [];
    try {
      return deduplicateReports(JSON.parse(saved));
    } catch {
      return [];
    }
  });

  const [viewMode, setViewMode] = useState<'workspace' | 'crop_and_scrub' | 'processing' | 'full_report' | 'progress'>('workspace');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSavedReportsOpen, setIsSavedReportsOpen] = useState(false);
  const [savedReportsTab, setSavedReportsTab] = useState<'folders' | 'all' | 'cards' | 'roster'>('folders');
  const [currentSequenceComparison, setCurrentSequenceComparison] = useState<{
    ideal: string[];
    actual: string[];
    isCorrect: boolean;
    feedback: string;
  } | null>(null);
  const [currentDynamicMetrics, setCurrentDynamicMetrics] = useState<{
    peakAngularVelocity: number;
    estimatedPeakTorque: number;
    explosivenessScore: number;
  } | null>(null);
  const useOptionBPipeline = false;
  const [currentStartTime, setCurrentStartTime] = useState<number>(0);
  const [currentEndTime, setCurrentEndTime] = useState<number | undefined>(undefined);
  const [currentCropBox, setCurrentCropBox] = useState<{ x: number; y: number; width: number; height: number } | undefined>(undefined);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [isPinPromptOpen, setIsPinPromptOpen] = useState(false);

  const currentSport = SPORTS_RULES.find((s) => s.id === selectedSportId) || SPORTS_RULES[0];

  // Zero-Knowledge Hash Listener for Instant Report Opening
  useEffect(() => {
    const handleUrlHash = () => {
      const hash = window.location.hash;
      if (hash && hash.includes('report=')) {
        const parseRes = parseZeroKnowledgeShareHash(hash);
        if (parseRes.isLocked) {
          setIsPinPromptOpen(true);
        } else if (parseRes.success && parseRes.report) {
          // Open report immediately
          handleLoadSavedReport(parseRes.report);
          // Clean hash to keep address bar clean
          history.replaceState(null, '', window.location.pathname);
        } else if (parseRes.isExpired) {
          alert('This shared report link has expired. Please ask the coach for a new link.');
        }
      }
    };

    handleUrlHash();
    window.addEventListener('hashchange', handleUrlHash);
    return () => window.removeEventListener('hashchange', handleUrlHash);
  }, []);

  // Firebase Auth listener & Local Storage Privacy Housekeeping
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const updatedUser: UserAccount = {
          id: fbUser.uid,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Athlete',
          email: fbUser.email || '',
          role: 'Coach',
          clubOrSchool: 'Klutchh Sports Member',
          avatar: fbUser.photoURL || undefined
        };
        setCurrentUser(updatedUser);
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser) {
      try {
        localStorage.setItem('klutchh_user_session', safeJsonStringify(currentUser));
      } catch (e) {
        console.warn('Failed to persist user session:', e);
      }
    } else {
      localStorage.removeItem('klutchh_user_session');
    }
  }, [currentUser?.id]);

  useEffect(() => {
    try {
      localStorage.setItem('klutchh_saved_reports', safeJsonStringify(savedReports));
    } catch (e) {
      console.warn('Failed to persist saved reports:', e);
    }
  }, [savedReports]);

  const handleSelectSport = (id: SportId) => {
    setSelectedSportId(id);
    const newSport = SPORTS_RULES.find((s) => s.id === id) || SPORTS_RULES[0];
    if (newSport.techniques && newSport.techniques.length > 0) {
      setSelectedTechniqueId(newSport.techniques[0].id);
      if (newSport.techniques[0].phases && newSport.techniques[0].phases.length > 0) {
        setSelectedMovementPhase(newSport.techniques[0].phases[0]);
      }
    } else if (newSport.phases.length > 0) {
      setSelectedMovementPhase(newSport.phases[0]);
    } else {
      setSelectedMovementPhase('Auto-Detect');
    }
    setCustomVideoUrl(null); // Clear video on sport switch
    setKeyframeList([]); // Clear keyframes
  };

  const handleFrameUpdate = (analysis: FrameAnalysis) => {
    setCurrentAnalysis(analysis);
  };

  const handleBookmarkKeyframe = (analysis: FrameAnalysis) => {
    setKeyframeList((prev) => [analysis, ...prev.slice(0, 5)]); // Store up to 6 keyframes
  };

  const handleRemoveKeyframe = (index: number) => {
    setKeyframeList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearKeyframes = () => {
    setKeyframeList([]);
  };

  const [showWorkspaceUploader, setShowWorkspaceUploader] = useState(!customVideoUrl);

  const handleVideoSelected = (url: string, file?: File) => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }

    // Reset old analysis state before starting new one
    setCurrentAnalysis(null);
    setKeyframeList([]);
    setAllFrames([]);
    setCurrentAIReport(null);
    setCurrentSequenceComparison(null);
    setCurrentDynamicMetrics(null);
    setActiveReportId(null);

    setAnalysisCount((prev) => prev + 1);
    setCustomVideoUrl(url);
    if (file) setCustomVideoFile(file);
    setShowWorkspaceUploader(false);
    setViewMode('processing');
  };

  const handleProcessingMagicComplete = useCallback((res?: AnalysisResult) => {
    console.log("MagicProcessingComplete called with:", res);
    if (res && res.aiReport) {
      const newReportId = `report-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      setActiveReportId(newReportId);

      if (res.keyframes && res.keyframes.length > 0) {
        setKeyframeList(res.keyframes);
      }
      if (res.allFrames && res.allFrames.length > 0) {
        setAllFrames(res.allFrames);
      }
      if (res.aiReport) {
        setCurrentAIReport(res.aiReport);
      }
      if (res.sequenceComparison) {
        setCurrentSequenceComparison(res.sequenceComparison);
      }
      if (res.dynamicMetrics) {
        setCurrentDynamicMetrics(res.dynamicMetrics);
      }
      setCurrentStartTime(res.startTime || 0);
      setCurrentEndTime(res.endTime);
      setCurrentCropBox(res.cropBox);

      setViewMode('full_report');
    } else {
      console.error("Analysis complete callback failed, invalid result:", res);
      alert("Analysis failed. Unable to extract valid biomechanical telemetry from video.");
      setViewMode('workspace');
      setShowWorkspaceUploader(true);
    }
  }, [currentSport, selectedMovementPhase, customVideoUrl, currentUser]);

  const handleUpdateDrillProgress = (updatedProgress: Record<number, 'pending' | 'completed' | 'mastered'>, customReportId?: string | null) => {
    const targetId = customReportId || activeReportId;
    if (!targetId) return;

    setSavedReports((prev) => {
      const existingIndex = prev.findIndex((r) => r.id === targetId);
      if (existingIndex >= 0) {
        const updatedReports = [...prev];
        const targetReport = { ...updatedReports[existingIndex], drillProgress: updatedProgress };
        updatedReports[existingIndex] = targetReport;

        return deduplicateReports(updatedReports);
      }
      return prev;
    });
  };

  const handleSaveReport = async (report: SavedReport) => {
    const updatedReport: SavedReport = {
      ...report,
      isPro30FpsPipeline: useOptionBPipeline,
      processingMode: useOptionBPipeline ? 'pro_30fps_cloud' : 'standard_client'
    };

    if (customVideoFile) {
      try {
        await saveLocalVideoWithTTL(report.id, customVideoFile);
      } catch(e) {
        console.warn('Failed to save video with TTL to IDB', e);
      }
    }
    setActiveReportId(updatedReport.id);
    setSavedReports((prev) => {
      const idx = prev.findIndex((r) => r.id === updatedReport.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedReport;
        return deduplicateReports(copy);
      }
      return deduplicateReports([updatedReport, ...prev]);
    });
  };

  const handleSyncReportToCloud = async (report: SavedReport) => {
    const cloudConfig = getPersonalCloudConfig();
    try {
      const res = await syncReportToPersonalCloud(report, cloudConfig);
      if (res.success) {
        const updatedReport: SavedReport = {
          ...report,
          cloudSynced: true,
          cloudSyncedAt: new Date().toISOString()
        };
        setSavedReports((prev) => prev.map((r) => r.id === report.id ? updatedReport : r));
        alert(res.message);
      } else {
        alert(`Personal API Sync Note: ${res.message}`);
      }
    } catch (err: any) {
      alert(`Personal API Sync error: ${err.message || 'Check connection'}`);
    }
  };

  const handleSyncFolderToCloud = async (athleteId: string, reportsInFolder: SavedReport[]) => {
    const athletesList = await getCoachAthletes();
    const athlete = athletesList.find((a) => a.id === athleteId) || {
      id: athleteId,
      name: reportsInFolder[0]?.athleteName || 'Athlete',
      sport: selectedSportId,
      category: athleteCategory,
      folderName: formatAthleteFolderName(reportsInFolder[0]?.athleteName || 'Athlete'),
      totalReports: reportsInFolder.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const folderGroup = {
      athlete,
      folderName: formatAthleteFolderName(athlete.name),
      reports: reportsInFolder,
      trophyCards: []
    };

    const cloudConfig = getPersonalCloudConfig();
    try {
      const res = await syncAthleteFolderToPersonalCloud(folderGroup, cloudConfig);
      if (res.success) {
        const now = new Date().toISOString();
        setSavedReports((prev) => prev.map((r) => {
          const match = reportsInFolder.find((f) => f.id === r.id);
          return match ? { ...r, cloudSynced: true, cloudSyncedAt: now } : r;
        }));
        alert(res.message);
      } else {
        alert(`Personal API Sync: ${res.message}`);
      }
    } catch (err: any) {
      alert(`Personal API Sync error: ${err.message || 'Check connection'}`);
    }
  };

  const handleDeleteReport = async (id: string) => {
    setSavedReports((prev) => prev.filter((r) => r.id !== id));
    try {
      await del(`video-${id}`);
    } catch (err) {
      console.warn('Local video cleanup error:', err);
    }
  };

  const handleDeleteTrophyCard = async (id: string) => {
    try {
      const cards = await get('klutchh_trophy_cabinet') || [];
      const filtered = cards.filter((c: any) => c.id !== id);
      await set('klutchh_trophy_cabinet', filtered);
    } catch (e) {
      console.error('Failed to delete trophy card:', e);
    }
  };

  const handleLoadSavedReport = async (report: SavedReport) => {
    setActiveReportId(report.id);
    setSelectedSportId(report.sportId);
    let targetVideoUrl = report.cloudVideoUrl || report.videoUrl || null;

    if (report.keyframeList) setKeyframeList(report.keyframeList);
    if (report.allFrames) setAllFrames(report.allFrames);
    if (report.report) setCurrentAIReport(report.report);
    setCurrentStartTime(report.startTime || 0);
    setCurrentEndTime(report.endTime);
    setCurrentCropBox(report.cropBox);
    if (report.sequenceComparison) setCurrentSequenceComparison(report.sequenceComparison);
    if (report.dynamicMetrics) setCurrentDynamicMetrics(report.dynamicMetrics);

    try {
      const file = await get(`video-${report.id}`);
      if (file) {
        targetVideoUrl = URL.createObjectURL(file as Blob);
        setCustomVideoFile(file as File);
      }
    } catch(e) {
      console.warn('Failed to load video file from IDB:', e);
    }

    if (targetVideoUrl) {
      setCustomVideoUrl(targetVideoUrl);
    }
    setViewMode('full_report');
  };

  const handleImportKlutchhReport = async (reportData: any) => {
    try {
      if (!reportData) return;

      // Handle Athlete Folder Bundle or Full Library Bundle (Version 1.2+)
      if (reportData.type === 'klutchh_athlete_folder_bundle' || reportData.type === 'klutchh_full_library_bundle' || (reportData.reports && reportData.athlete)) {
        // 1. Save/Merge Athletes to Roster
        if (reportData.type === 'klutchh_full_library_bundle' && reportData.athletes) {
           for (const ath of reportData.athletes) {
             await saveCoachAthlete(ath);
           }
        } else if (reportData.athlete) {
          await saveCoachAthlete(reportData.athlete);
        }

        // 2. Merge Reports into local state and localStorage
        if (reportData.reports && Array.isArray(reportData.reports)) {
          setSavedReports(prev => {
            const merged = [...reportData.reports, ...prev];
            const unique = deduplicateReports(merged);
            localStorage.setItem('klutchh_saved_reports', safeJsonStringify(unique));
            return unique;
          });
        }

        // 3. Merge Trophy Cards into IndexedDB
        if (reportData.trophyCards && Array.isArray(reportData.trophyCards)) {
          const existingCards = await get<TrophyCard[]>('klutchh_trophy_cabinet') || [];
          const merged = [...reportData.trophyCards, ...existingCards];
          // Deduplicate trophies by ID
          const uniqueTrophies = merged.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
          await set('klutchh_trophy_cabinet', uniqueTrophies);
        }

        const msg = reportData.type === 'klutchh_full_library_bundle' 
          ? `Full Library Restored! Imported ${reportData.athletes?.length || 0} athletes, ${reportData.reports?.length || 0} reports, and ${reportData.trophyCards?.length || 0} trophy cards.`
          : `Success! Imported ${reportData.athlete?.name || 'Athlete'}'s full folder with ${reportData.reports?.length || 0} reports and ${reportData.trophyCards?.length || 0} trophies.`;
        
        alert(msg);
        setIsSavedReportsOpen(true);
        setSavedReportsTab('folders');
        return;
      }

      // Existing single report logic
      if (reportData.type !== 'klutchh_biometric_report' && !reportData.aiReport && !reportData.sportId) {
        alert('Invalid .klutchh report file format.');
        return;
      }
      if (reportData.sportId) {
        setSelectedSportId(reportData.sportId);
      }
      if (reportData.calibratedFps) {
        setCalibratedFps(reportData.calibratedFps);
      }

      if (reportData.videoData) {
        try {
          const res = await fetch(reportData.videoData);
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          setCustomVideoUrl(url);
          setCustomVideoFile(new File([blob], reportData.videoName || "imported_video.mp4", { type: blob.type }));
        } catch (err) {
          console.warn("Failed to load embedded video data:", err);
          setCustomVideoUrl(reportData.videoUrl || null);
        }
      } else {
        setCustomVideoUrl(reportData.videoUrl || null);
        setCustomVideoFile(null);
      }

      setKeyframeList(reportData.keyframeList || []);
      setAllFrames(reportData.allFrames || []);
      setCurrentAIReport(reportData.aiReport || null);
      setCurrentSequenceComparison(reportData.sequenceComparison || null);
      setCurrentDynamicMetrics(reportData.dynamicMetrics || null);
      setActiveReportId(reportData.id || `imported-${Date.now()}`);
      setViewMode('full_report');
    } catch (e) {
      console.error('Error importing Klutchh report:', e);
      alert('Failed to parse .klutchh report file.');
    }
  };

  const handleExitReportMode = () => {
    // Zero-server-cost memory purge: clear all active session report & video state immediately on exit
    setCustomVideoUrl(null);
    setCustomVideoFile(null);
    setCurrentAIReport(null);
    setKeyframeList([]);
    setAllFrames([]);
    setCurrentSequenceComparison(null);
    setCurrentDynamicMetrics(null);
    setActiveReportId(null);
    setViewMode('workspace');
  };

  const handleLogout = async () => {
    try {
      await logoutFirebase();
    } catch (e) {
      console.warn('Firebase logout failed:', e);
    }
    setCurrentUser(null);
    localStorage.removeItem('klutchh_user_session');
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center relative overflow-hidden select-none">
        {/* Animated Cybergrid background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.15)_0%,transparent_75%)]" />
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#ef4444_1px,transparent_1px),linear-gradient(to_bottom,#ef4444_1px,transparent_1px)] bg-[size:32px_32px]" />
        
        {/* Animated logo scanner */}
        <div className="relative flex flex-col items-center gap-6 z-10">
          <div className="relative">
            {/* Glowing rings */}
            <div className="absolute inset-0 bg-gradient-to-tr from-red-600 to-amber-500 rounded-3xl blur-2xl opacity-40 animate-pulse" />
            
            <div className="relative bg-zinc-900 border-2 border-red-500/40 p-6 rounded-3xl flex items-center justify-center shadow-2xl shadow-red-600/20">
              <div className="flex items-center -space-x-2 bg-zinc-950/80 px-4 py-3 border border-zinc-800/80 rounded-2xl">
                {/* Modern visual representation of Klutchh Icon: A stylized speed gauge + kinetic peak vector */}
                <svg className="w-12 h-12 text-red-500 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4.5 16.5c-1.5-1.5-2.5-3.5-2.5-6s2-6 6-6s6 2 6 6s-1 4.5-2.5 6" />
                  <path d="m12 12 4-4 4 4-4 4z" />
                </svg>
              </div>
            </div>
            {/* Biometric Scanning horizontal red bar */}
            <div className="absolute -left-6 right-6 h-0.5 bg-red-500 shadow-[0_0_12px_#ef4444] animate-bounce top-1/2" />
          </div>

          <div className="text-center">
            <h1 className="text-4xl font-black tracking-widest uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-400 to-yellow-300">
              Klutchh
            </h1>
            <p className="text-[10px] font-black tracking-widest uppercase text-zinc-400 mt-2 flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
              <span>Initializing Biometrics Rule Engine...</span>
            </p>
          </div>
        </div>

        {/* Footer status bar */}
        <div className="absolute bottom-6 left-6 right-6 flex justify-between text-[8px] font-mono text-zinc-600 uppercase">
          <span>Ver: 3.2.0-Production</span>
          <span>System active</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      
      {/* Top Navigation Header */}
      <Header
        selectedSportId={selectedSportId}
        onSelectSport={handleSelectSport}
        athleteCategory={athleteCategory}
        onChangeAthleteCategory={setAthleteCategory}
        skillLevel={skillLevel}
        onChangeSkillLevel={setSkillLevel}
        calibratedFps={calibratedFps}
        onChangeCalibratedFps={setCalibratedFps}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        savedReportsCount={savedReports.length}
        onOpenSavedReports={() => {
          setSavedReportsTab('folders');
          setIsSavedReportsOpen(true);
        }}
        onOpenCabinet={() => {
          setSavedReportsTab('cards');
          setIsSavedReportsOpen(true);
        }}
        onOpenDashboard={() => setViewMode('progress')}
        analysisCount={analysisCount}
        maxAnalyses={maxAnalyses}
        onUpdateUser={(updated) => {
          setCurrentUser(updated);
          try {
            localStorage.setItem('klutchh_user_session', safeJsonStringify(updated));
          } catch (e) {
            console.warn('Failed to save user session:', e);
          }
        }}
        onLogout={handleLogout}
        onImportReport={handleImportKlutchhReport}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        
        {viewMode === 'crop_and_scrub' && customVideoUrl ? (
          /* VIDEO CROP AND SCRUBBER VIEW */
          <VideoCropAndScrubber
            sportRule={currentSport}
            videoUrl={customVideoUrl}
            videoFile={customVideoFile}
            skillLevel={skillLevel}
            athleteCategory={athleteCategory}
            calibratedFps={calibratedFps}
            useOptionBPipeline={useOptionBPipeline}
            onComplete={handleProcessingMagicComplete}
            targetAthleteAnchor={targetAthleteAnchor}
            onTargetAthleteAnchorChange={setTargetAthleteAnchor}
            onCancel={() => {
              setCustomVideoUrl(null);
              setViewMode('workspace');
              setShowWorkspaceUploader(true);
            }}
            onSwitchSport={(newSportId) => {
              handleSelectSport(newSportId);
              setViewMode('crop_and_scrub');
            }}
          />
        ) : viewMode === 'processing' ? (
          /* MAGIC AI & BIOMETRIC PROCESSING SCREEN */
          <MagicProcessingScreen
            sportRule={currentSport}
            videoUrl={customVideoUrl}
            skillLevel={skillLevel}
            athleteCategory={athleteCategory}
            calibratedFps={calibratedFps}
            useOptionBPipeline={useOptionBPipeline}
            onComplete={handleProcessingMagicComplete}
            targetAthleteAnchor={targetAthleteAnchor}
            onCancel={() => {
              setCustomVideoUrl(null);
              setViewMode('workspace');
              setShowWorkspaceUploader(true);
            }}
            onSwitchSport={(newSportId) => {
              handleSelectSport(newSportId);
              setViewMode('processing');
            }}
          />
        ) : viewMode === 'full_report' ? (
          /* DEDICATED FULL REPORT SCRUBBER PAGE */
          <AnalysisReportPage
            sportRule={currentSport}
            videoUrl={customVideoUrl}
            keyframeList={keyframeList}
            allFrames={allFrames}
            aiReport={currentAIReport}
            sequenceComparison={currentSequenceComparison}
            dynamicMetrics={currentDynamicMetrics}
            currentUser={currentUser}
            calibratedFps={calibratedFps}
            athleteCategory={athleteCategory}
            activeReportId={activeReportId}
            videoFile={customVideoFile}
            initialDrillProgress={savedReports.find((r) => r.id === activeReportId)?.drillProgress || {}}
            onUpdateDrillProgress={(progress) => handleUpdateDrillProgress(progress, activeReportId)}
            onSaveReport={handleSaveReport}
            onBack={handleExitReportMode}
            onVideoSelected={handleVideoSelected}
            startTime={currentStartTime}
            endTime={currentEndTime}
            cropBox={currentCropBox}
          />
        ) : viewMode === 'progress' ? (
          /* HISTORICAL PROGRESS DASHBOARD */
          <ProgressDashboard 
            reports={savedReports} 
            onBack={() => setViewMode('workspace')}
            onUpdateDrillProgress={(reportId, progress) => handleUpdateDrillProgress(progress, reportId)}
            onSelectReport={handleLoadSavedReport}
            currentUser={currentUser}
          />
        ) : (
          /* UNIFIED CLEAN SETUP WORKSPACE */
          <UnifiedSetupCard
            selectedSportId={selectedSportId}
            onSelectSport={handleSelectSport}
            selectedTechniqueId={selectedTechniqueId}
            onSelectTechnique={setSelectedTechniqueId}
            selectedMovementPhase={selectedMovementPhase}
            onChangeMovementPhase={setSelectedMovementPhase}
            onVideoSelected={handleVideoSelected}
            customVideoUrl={customVideoUrl}
            analysisCount={analysisCount}
            maxAnalyses={maxAnalyses}
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthOpen(true)}
            onImportReport={handleImportKlutchhReport}
            targetAthleteAnchor={targetAthleteAnchor}
            onSelectAthleteAnchor={setTargetAthleteAnchor}
          />
        )}

      </main>

      {/* Limit Reached Modal */}
      {limitModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-900 border border-red-500/50 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-zinc-100 flex flex-col gap-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase italic tracking-wider">
                {limitModal.title}
              </h3>
              <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
                {limitModal.message}
              </p>
            </div>
            <button
              onClick={() => setLimitModal(null)}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-black text-xs py-2.5 rounded-xl uppercase tracking-wider transition-all shadow-lg shadow-red-600/20"
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* Login & User Profile Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={(user) => setCurrentUser(user)}
        onLogout={() => setCurrentUser(null)}
      />

      {/* Saved Reports Library Modal */}
      <SavedReportsModal
        isOpen={isSavedReportsOpen}
        onClose={() => setIsSavedReportsOpen(false)}
        savedReports={savedReports}
        onSelectReport={handleLoadSavedReport}
        onDeleteReport={handleDeleteReport}
        onImportReport={handleImportKlutchhReport}
        onDeleteTrophyCard={handleDeleteTrophyCard}
        onSyncReportToCloud={handleSyncReportToCloud}
        onSyncFolderToCloud={handleSyncFolderToCloud}
        initialTab={savedReportsTab}
      />

      {/* Zero-Knowledge PIN Prompt Modal */}
      <PinPromptModal
        isOpen={isPinPromptOpen}
        onClose={() => setIsPinPromptOpen(false)}
        onSuccess={(report) => {
          handleLoadSavedReport(report);
        }}
      />

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-4 text-center text-xs text-zinc-500 font-medium">
        Klutchh • 320-Rule Biometric MediaPipe Engine for Rugby, Soccer, Netball, Hockey, Cricket, Basketball, Tennis & Golf
      </footer>

    </div>
  );
}

