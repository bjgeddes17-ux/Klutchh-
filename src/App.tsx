import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SPORTS_RULES } from './data/sportsRules';
import { SportId, AthleteCategory, SkillLevel, FrameAnalysis, UserAccount, SavedReport, AICoachingReport, AnalysisResult } from './types';
import { Header } from './components/Header';
import { VideoPosePlayer } from './components/VideoPosePlayer';
import { BiometricPanel } from './components/BiometricPanel';
import { KeyframeTimeline } from './components/KeyframeTimeline';
import { UnifiedSetupCard } from './components/UnifiedSetupCard';
import { AuthModal } from './components/AuthModal';
import { SavedReportsModal } from './components/SavedReportsModal';
import { AnalysisReportPage } from './components/AnalysisReportPage';
import ProgressDashboard from './components/ProgressDashboard';
import { Play, FileText, Bookmark, Sparkles, CheckCircle2, TrendingUp, ShieldAlert, AlertCircle } from 'lucide-react';
import { auth, saveReportToFirestore, fetchUserSavedReports, deleteReportFromFirestore, logoutFirebase } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { set, get, del } from 'idb-keyval';
import { autoPurgeExpiredLocalVideos, saveLocalVideoWithTTL, getLocalVideo } from './utils/privacyStorage';

import { MagicProcessingScreen } from './components/MagicProcessingScreen';
import { detectCapableDevice } from './utils/videoAnalyzer';
import { PinPromptModal } from './components/PinPromptModal';
import { parseZeroKnowledgeShareHash } from './utils/shareReportUrl';

export default function App() {
  const [selectedSportId, setSelectedSportId] = useState<SportId>('rugby');
  const [athleteCategory, setAthleteCategory] = useState<AthleteCategory>('middle_school');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('grassroots');
  const [calibratedFps, setCalibratedFps] = useState<number>(30);
  const [selectedTechniqueId, setSelectedTechniqueId] = useState<string>(SPORTS_RULES[0].techniques[0]?.id || '');
  const [selectedMovementPhase, setSelectedMovementPhase] = useState<string>(SPORTS_RULES[0].phases[0]);
  const [customVideoUrl, setCustomVideoUrl] = useState<string | null>(null);
  const [customVideoFile, setCustomVideoFile] = useState<File | null>(null);
  const [targetAthleteAnchor, setTargetAthleteAnchor] = useState<'auto' | 'left' | 'center' | 'right'>('auto');

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

  const [viewMode, setViewMode] = useState<'workspace' | 'processing' | 'full_report' | 'progress'>('workspace');
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
    // Run privacy auto-purge for videos older than 30 days
    autoPurgeExpiredLocalVideos(30).catch(() => {});

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
        
        // Fetch saved reports from Firestore
        const remoteReports = await fetchUserSavedReports(fbUser.uid);
        if (remoteReports && remoteReports.length > 0) {
          setSavedReports(deduplicateReports(remoteReports));
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('klutchh_user_session', JSON.stringify(currentUser));
      if (auth.currentUser) {
        fetchUserSavedReports(currentUser.id).then((remote) => {
          if (remote && remote.length > 0) {
            setSavedReports(deduplicateReports(remote));
          }
        });
      }
    } else {
      localStorage.removeItem('klutchh_user_session');
    }
  }, [currentUser?.id]);

  useEffect(() => {
    localStorage.setItem('klutchh_saved_reports', JSON.stringify(savedReports));
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

    if (analysisCount >= maxAnalyses) {
      setLimitModal({
        isOpen: true,
        title: "Analysis Limit Reached",
        message: `You have reached the maximum limit of ${maxAnalyses} video analyses (${analysisCount}/${maxAnalyses} used). Further video analyses are blocked.`
      });
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

        if (currentUser) {
          saveReportToFirestore(targetReport, currentUser.id).catch(console.error);
        }
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

      if (useOptionBPipeline) {
        try {
          const arrayBuffer = await customVideoFile.arrayBuffer();
          const resp = await fetch('/api/upload-video-binary', {
            method: 'POST',
            headers: { 
              'Content-Type': customVideoFile.type || 'video/mp4',
              'x-video-name': encodeURIComponent(customVideoFile.name)
            },
            body: arrayBuffer
          });
          const data = await resp.json();
          if (data.success && data.cloudVideoUrl) {
            updatedReport.cloudVideoUrl = data.cloudVideoUrl;
            updatedReport.videoUrl = data.cloudVideoUrl;
            setSavedReports((prev) => prev.map((r) => r.id === updatedReport.id ? updatedReport : r));
            if (currentUser) {
              saveReportToFirestore(updatedReport, currentUser.id).catch(console.error);
            }
          }
        } catch (err) {
          console.warn('Option B Cloud Video upload error:', err);
        }
      }
    }
    const existingIndex = savedReports.findIndex((r) => r.id === updatedReport.id);
    if (existingIndex < 0 && savedReports.length >= 5) {
      setLimitModal({
        isOpen: true,
        title: "Save Limit Reached",
        message: "You have reached the maximum limit of 5 saved reports (5/5 used). Please delete an existing saved report from your library before saving a new one."
      });
      return;
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
    if (currentUser) {
      try {
        await saveReportToFirestore(updatedReport, currentUser.id);
      } catch (err) {
        console.error('Failed to save report to Firestore:', err);
      }
    }
  };

  const handleDeleteReport = async (id: string) => {
    setSavedReports((prev) => prev.filter((r) => r.id !== id));
    try {
      await deleteReportFromFirestore(id);
      await del(`video-${id}`);
    } catch (err) {
      console.error('Failed to delete report from Firestore:', err);
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
      if (!reportData || (reportData.type !== 'klutchh_biometric_report' && !reportData.aiReport && !reportData.sportId)) {
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
          localStorage.setItem('klutchh_user_session', JSON.stringify(updated));
        }}
        onLogout={handleLogout}
        onImportReport={handleImportKlutchhReport}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        
        {viewMode === 'processing' ? (
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

