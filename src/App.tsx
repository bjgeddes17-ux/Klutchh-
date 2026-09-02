import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SPORTS_RULES } from './data/sportsRules';
import { SportId, AthleteCategory, SkillLevel, FrameAnalysis, UserAccount, SavedReport, AICoachingReport, AnalysisResult } from './types';
import { Header } from './components/Header';
import { BiometricPanel } from './components/BiometricPanel';
import { KeyframeTimeline } from './components/KeyframeTimeline';
import { UnifiedSetupCard } from './components/UnifiedSetupCard';
import { SavedReportsModal } from './components/SavedReportsModal';
import { AnalysisReportPage } from './components/AnalysisReportPage';
import ProgressDashboard from './components/ProgressDashboard';
import { BiometricDrillsLibrary } from './components/BiometricDrillsLibrary';
import { DrillItem, COMPREHENSIVE_DRILL_LIBRARY } from './data/drillLibrary';
import { injectDrillThresholds } from './utils/thresholdEngine';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Play, FileText, Bookmark, ShieldAlert, AlertCircle } from 'lucide-react';
import { set, get, del } from 'idb-keyval';
import { autoPurgeExpiredLocalVideos, saveLocalVideoWithTTL, getLocalVideo } from './utils/privacyStorage';

import { MagicProcessingScreen } from './components/MagicProcessingScreen';
import { VideoCropAndScrubber } from './components/VideoCropAndScrubber';
import { PinPromptModal } from './components/PinPromptModal';
import { parseZeroKnowledgeShareHash } from './utils/shareReportUrl';
import { resetPoseCache } from './utils/mediapipePose';
import { clearFrameCache } from './utils/frameExtractor';
import { calculateKlutchhScore } from './utils/klutchhAnalysis';

export default function AppWrapper() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

function App() {
  const [selectedSportId, setSelectedSportId] = useState<SportId>('rugby');
  const [athleteCategory, setAthleteCategory] = useState<AthleteCategory>('middle_school');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('grassroots');
  const [calibratedFps, setCalibratedFps] = useState<number>(30);
  const [selectedTechniqueId, setSelectedTechniqueId] = useState<string>(SPORTS_RULES[0].techniques[0]?.id || '');
  const [selectedMovementPhase, setSelectedMovementPhase] = useState<string>(SPORTS_RULES[0].phases[0]);
  const [selectedDrillId, setSelectedDrillId] = useState<string | null>(null);
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

  // User Auth & Saved Reports State (100% Local)
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('klutchh_user_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    const defaultUser: UserAccount = {
      id: 'local-coach-' + Math.random().toString(36).substring(2, 9),
      name: 'Local Coach',
      email: 'coach@local.klutchh',
      role: 'Coach',
      clubOrSchool: 'Local Institution'
    };
    localStorage.setItem('klutchh_user_session', JSON.stringify(defaultUser));
    return defaultUser;
  });

  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [viewMode, setViewMode] = useState<'workspace' | 'crop_and_scrub' | 'processing' | 'full_report' | 'progress'>('workspace');
  const [isSavedReportsOpen, setIsSavedReportsOpen] = useState(false);
  const [savedReportsTab, setSavedReportsTab] = useState<'folders' | 'all' | 'cards' | 'roster'>('folders');
  const [currentSequenceComparison, setCurrentSequenceComparison] = useState<any>(null);
  const [currentDynamicMetrics, setCurrentDynamicMetrics] = useState<any>(null);
  const [currentOverallSymmetry, setCurrentOverallSymmetry] = useState<number | undefined>(undefined);
  const [currentOverallKneeSafety, setCurrentOverallKneeSafety] = useState<number | undefined>(undefined);
  const [currentStartTime, setCurrentStartTime] = useState<number>(0);
  const [currentEndTime, setCurrentEndTime] = useState<number | undefined>(undefined);
  const [currentCropBox, setCurrentCropBox] = useState<{ x: number; y: number; width: number; height: number } | undefined>(undefined);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [isPinPromptOpen, setIsPinPromptOpen] = useState(false);
  const [isDrillsLibraryOpen, setIsDrillsLibraryOpen] = useState(false);
  const [showWorkspaceUploader, setShowWorkspaceUploader] = useState(!customVideoUrl);

  const maxAnalyses = 1000;
  const currentSportRule = SPORTS_RULES.find((s) => s.id === selectedSportId) || SPORTS_RULES[0];

  const handleSportChange = (id: SportId) => {
    setSelectedSportId(id);
    setSelectedDrillId(null);
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
    setCustomVideoUrl(null);
    setKeyframeList([]);
  };

  const handleVideoSelected = (url: string, file?: File) => {
    if (analysisCount >= maxAnalyses) {
      setLimitModal({
        isOpen: true,
        title: "Analysis Limit Reached",
        message: `You have reached the maximum limit of ${maxAnalyses} video analyses (${analysisCount}/${maxAnalyses} used). Further video analyses are blocked.`
      });
      return;
    }
    if (customVideoUrl && customVideoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(customVideoUrl);
    }
    resetPoseCache();
    clearFrameCache();
    setCurrentAnalysis(null);
    setKeyframeList([]);
    setAllFrames([]);
    setCurrentAIReport(null);
    setCurrentSequenceComparison(null);
    setCurrentDynamicMetrics(null);
    setCurrentOverallSymmetry(undefined);
    setCurrentOverallKneeSafety(undefined);
    setActiveReportId(null);
    setCurrentStartTime(0);
    setCurrentEndTime(undefined);
    setCurrentCropBox(undefined);
    setAnalysisCount((prev) => prev + 1);
    setCustomVideoUrl(url);
    if (file) setCustomVideoFile(file);
    setShowWorkspaceUploader(false);
    setViewMode('processing');
  };

  const handleProcessingMagicComplete = useCallback((res?: AnalysisResult) => {
    if (res && res.aiReport) {
      // Inject drill-specific thresholds if a drill was selected
      let finalRes = res;
      if (selectedDrillId) {
        const drill = COMPREHENSIVE_DRILL_LIBRARY.find(d => d.id === selectedDrillId);
        if (drill) {
          finalRes = injectDrillThresholds(res, drill);
        }
      }

      const newReportId = `report-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      setActiveReportId(newReportId);
      if (finalRes.keyframes && finalRes.keyframes.length > 0) setKeyframeList(finalRes.keyframes);
      if (finalRes.allFrames && finalRes.allFrames.length > 0) setAllFrames(finalRes.allFrames);
      if (finalRes.aiReport) setCurrentAIReport(finalRes.aiReport);
      if (finalRes.sequenceComparison) setCurrentSequenceComparison(finalRes.sequenceComparison);
      if (finalRes.dynamicMetrics) setCurrentDynamicMetrics(finalRes.dynamicMetrics);
      setCurrentOverallSymmetry(finalRes.overallSymmetry);
      setCurrentOverallKneeSafety(finalRes.overallKneeSafety);
      setCurrentStartTime(finalRes.startTime || 0);
      setCurrentEndTime(finalRes.endTime);
      setCurrentCropBox(finalRes.cropBox);
      setViewMode('full_report');
    } else {
      alert("Analysis failed. Unable to extract valid biomechanical telemetry from video.");
      setViewMode('workspace');
    }
  }, [selectedDrillId]);

  const handleBackToWorkspace = () => {
    if (customVideoUrl && customVideoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(customVideoUrl);
    }
    setCustomVideoUrl(null);
    setCustomVideoFile(null);
    setCurrentAIReport(null);
    setKeyframeList([]);
    setAllFrames([]);
    setCurrentSequenceComparison(null);
    setCurrentDynamicMetrics(null);
    setActiveReportId(null);
    setCurrentStartTime(0);
    setCurrentEndTime(undefined);
    setCurrentCropBox(undefined);
    setViewMode('workspace');
    setShowWorkspaceUploader(true);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      <Header 
        selectedSportId={selectedSportId}
        onSelectSport={handleSportChange}
        athleteCategory={athleteCategory}
        onChangeAthleteCategory={setAthleteCategory}
        skillLevel={skillLevel}
        onChangeSkillLevel={setSkillLevel}
        calibratedFps={calibratedFps}
        onChangeCalibratedFps={setCalibratedFps}
        currentUser={currentUser}
        onOpenAuth={() => setIsPinPromptOpen(true)}
        savedReportsCount={savedReports.length}
        onOpenSavedReports={() => { setSavedReportsTab('folders'); setIsSavedReportsOpen(true); }}
        onOpenCabinet={() => { setSavedReportsTab('cards'); setIsSavedReportsOpen(true); }}
        onOpenDashboard={() => setViewMode('progress')}
        onOpenDrillsLibrary={() => setIsDrillsLibraryOpen(true)}
        analysisCount={analysisCount}
        maxAnalyses={maxAnalyses}
        onUpdateUser={setCurrentUser}
        onLogout={() => { setCurrentUser(null); localStorage.removeItem('klutchh_user_session'); }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        {viewMode === 'workspace' && (
          <UnifiedSetupCard 
            selectedSportId={selectedSportId}
            onSelectSport={handleSportChange}
            selectedTechniqueId={selectedTechniqueId}
            onSelectTechnique={setSelectedTechniqueId}
            selectedMovementPhase={selectedMovementPhase}
            onChangeMovementPhase={setSelectedMovementPhase}
            onVideoSelected={handleVideoSelected}
            customVideoUrl={customVideoUrl}
            analysisCount={analysisCount}
            maxAnalyses={maxAnalyses}
            currentUser={currentUser}
            onOpenAuth={() => setIsPinPromptOpen(true)}
            targetAthleteAnchor={targetAthleteAnchor}
            onSelectAthleteAnchor={setTargetAthleteAnchor}
          />
        )}

        {viewMode === 'processing' && customVideoUrl && (
          <MagicProcessingScreen 
            sportRule={currentSportRule}
            videoUrl={customVideoUrl}
            skillLevel={skillLevel}
            athleteCategory={athleteCategory}
            calibratedFps={calibratedFps}
            onComplete={handleProcessingMagicComplete}
            targetAthleteAnchor={targetAthleteAnchor}
            onCancel={handleBackToWorkspace}
          />
        )}

        {viewMode === 'full_report' && (
          <AnalysisReportPage 
            sportRule={currentSportRule}
            videoUrl={customVideoUrl}
            keyframeList={keyframeList}
            allFrames={allFrames}
            aiReport={currentAIReport}
            sequenceComparison={currentSequenceComparison}
            dynamicMetrics={currentDynamicMetrics}
            overallSymmetry={currentOverallSymmetry}
            overallKneeSafety={currentOverallKneeSafety}
            currentUser={currentUser}
            calibratedFps={calibratedFps}
            athleteCategory={athleteCategory}
            activeReportId={activeReportId}
            videoFile={customVideoFile}
            onSaveReport={(report) => setSavedReports(prev => [report, ...prev])}
            onBack={handleBackToWorkspace}
            onOpenDrillsLibrary={() => setIsDrillsLibraryOpen(true)}
            startTime={currentStartTime}
            endTime={currentEndTime}
            cropBox={currentCropBox}
          />
        )}

        {viewMode === 'progress' && (
          <ProgressDashboard 
            reports={savedReports}
            onBack={handleBackToWorkspace}
            onSelectReport={(report) => {
              // Load report logic
              setViewMode('full_report');
            }}
            currentUser={currentUser}
          />
        )}
      </main>

      {isDrillsLibraryOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <BiometricDrillsLibrary 
            selectedSportId={selectedSportId}
            onSelectSport={handleSportChange}
            onSelectDrillAsRule={(drill) => {
              setSelectedDrillId(drill.id);
              if (drill.sportId) {
                handleSportChange(drill.sportId);
                // Note: handleSportChange clears selectedDrillId, so we set it after
                setSelectedDrillId(drill.id);
              }
              if (drill.techniqueId) {
                setSelectedTechniqueId(drill.techniqueId);
              }
              if (drill.phase) {
                setSelectedMovementPhase(drill.phase);
              }
              setIsDrillsLibraryOpen(false);
            }}
            onClose={() => setIsDrillsLibraryOpen(false)}
          />
        </div>
      )}

      {limitModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-900 border border-red-500/50 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-zinc-100 flex flex-col gap-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase italic tracking-wider">{limitModal.title}</h3>
              <p className="text-xs text-zinc-300 mt-2 leading-relaxed">{limitModal.message}</p>
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

      <SavedReportsModal 
        isOpen={isSavedReportsOpen}
        onClose={() => setIsSavedReportsOpen(false)}
        savedReports={savedReports}
        onSelectReport={(report) => { /* Load report logic */ }}
        onDeleteReport={(id) => setSavedReports(prev => prev.filter(r => r.id !== id))}
        initialTab={savedReportsTab}
      />

      <PinPromptModal 
        isOpen={isPinPromptOpen}
        onClose={() => setIsPinPromptOpen(false)}
        onSuccess={(report) => {
          setSavedReports(prev => [report, ...prev]);
          setIsPinPromptOpen(false);
        }}
      />

      <footer className="border-t border-zinc-900 py-4 text-center text-xs text-zinc-500 font-medium">
        Klutchh • 320-Rule Biometric MediaPipe Engine for Elite Sports
      </footer>
    </div>
  );
}
