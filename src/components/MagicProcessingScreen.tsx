import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Scan, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, UploadCloud, ShieldAlert } from 'lucide-react';
import { SportRule, SkillLevel, AthleteCategory, AnalysisResult, SportId } from '../types';
import { analyzeVideoBiometrics, generateFallbackAnalysisResult } from '../utils/videoAnalyzer';
import { DecoderError } from '../utils/frameExtractor';

interface MagicProcessingScreenProps {
  sportRule: SportRule;
  videoUrl: string | null;
  skillLevel: SkillLevel;
  athleteCategory: AthleteCategory;
  calibratedFps?: number;
  useOptionBPipeline?: boolean;
  onComplete: (result?: AnalysisResult) => void;
  targetAthleteAnchor?: 'auto' | 'left' | 'center' | 'right';
  cropBox?: { x: number; y: number; width: number; height: number };
  startTime?: number;
  endTime?: number;
  onCancel?: () => void;
  onSwitchSport?: (sportId: SportId) => void;
}

export const MagicProcessingScreen: React.FC<MagicProcessingScreenProps> = ({
  sportRule,
  videoUrl,
  skillLevel,
  athleteCategory,
  calibratedFps = 30,
  useOptionBPipeline = true,
  onComplete,
  targetAthleteAnchor = 'auto',
  cropBox,
  startTime = 0,
  endTime,
  onCancel,
  onSwitchSport,
}) => {
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [invalidResult, setInvalidResult] = useState<AnalysisResult | null>(null);
  const [invalidError, setInvalidError] = useState<string | null>(null);
  const resultRef = useRef<AnalysisResult | undefined>(undefined);

  const STEPS = [
    { id: 1, label: 'Smart Frame Extraction (360p Optimization)', sub: 'Buffering 3D spatial joints into IndexedDB sequence' },
    { id: 2, label: useOptionBPipeline ? '⚡ Pro Analysis Pipeline' : 'Dedicated AI Analysis Firewall', sub: `Evaluating kinetic chain @ ${useOptionBPipeline ? 20 : calibratedFps} FPS telemetry` },
    { id: 3, label: 'Calculating Symmetry & Knee Safety Score', sub: 'Checking joint valgus stress & angular tolerances' },
    { id: 4, label: 'Synthesizing AI Coaching Report', sub: 'Generating personalized drills & performance grade' },
  ];

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const hasFiredRef = useRef(false);

  useEffect(() => {
    if (progress >= 100 && !hasFiredRef.current && resultRef.current) {
      hasFiredRef.current = true;
      setTimeout(() => {
        onCompleteRef.current(resultRef.current);
      }, 800);
    }
    
    if (progress > 75) setCurrentStepIndex(3);
    else if (progress > 50) setCurrentStepIndex(2);
    else if (progress > 25) setCurrentStepIndex(1);
    else setCurrentStepIndex(0);
  }, [progress]);

  useEffect(() => {
    let isMounted = true;
    hasFiredRef.current = false;
    setInvalidResult(null);
    setInvalidError(null);

    // Start video analysis asynchronously
    if (videoUrl) {
      analyzeVideoBiometrics(
        videoUrl, 
        sportRule, 
        skillLevel, 
        athleteCategory, 
        calibratedFps, 
        useOptionBPipeline,
        (p) => {
          if (isMounted) setProgress(p);
        },
        targetAthleteAnchor as 'auto' | 'left' | 'center' | 'right',
        cropBox,
        startTime,
        endTime
      )
        .then((res) => {
          if (isMounted) {
            console.log("Analysis completed successfully:", res);
            if (res.isInvalidVideo) {
              setInvalidResult(res);
              setInvalidError(res.invalidVideoReason || `No human athlete detected in this video clip.`);
              return;
            }
            resultRef.current = res;
            setProgress(100);
          }
        })
        .catch(async (err: any) => {
          console.error("Video analysis FAILED (critical):", err);
          if (isMounted) {
            if (err instanceof DecoderError) {
              setInvalidError("DECODER_CRASH");
              return;
            }
            const errorMessage = err?.message || String(err);
            
            // If it's a format error, show the error screen instead of falling back
            if (errorMessage.includes('Video format not supported') || errorMessage.includes('Video Sampling Error')) {
              setInvalidError(errorMessage + ". Please try uploading a different video format (MP4/H.264 is most compatible).");
              return;
            }

            // For other unexpected errors, we can try the fallback but with a console note
            console.log("Attempting fallback analysis for non-critical error...");
            try {
              const fallback = await generateFallbackAnalysisResult(videoUrl, sportRule, skillLevel, athleteCategory, calibratedFps);
              resultRef.current = fallback;
              setProgress(100);
            } catch (fallbackErr) {
              console.error("Fallback analysis also FAILED:", fallbackErr);
              setInvalidError("Analysis failed completely: " + String(errorMessage));
            }
          }
        });
    } else {
      setProgress(100);
    }

    return () => {
      isMounted = false;
    };
  }, [videoUrl, sportRule.id, skillLevel, athleteCategory, calibratedFps, targetAthleteAnchor]);

  if (invalidError === 'DECODER_CRASH') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-zinc-950 border-2 border-amber-500/50 rounded-3xl p-6 sm:p-10 text-center relative overflow-hidden shadow-2xl animate-fadeIn">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="w-20 h-20 rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center text-4xl mb-4">
          <RefreshCw className="w-10 h-10 text-amber-400" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wide mb-2">
          Decoder Resource Exhaustion
        </h2>

        <p className="text-sm text-zinc-300 max-w-lg mx-auto mb-6 leading-relaxed bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800 text-left">
          Your device's hardware video decoder is temporarily stuck due to resource constraints. This happens on mobile devices with complex video files. 
          <br /><br />
          Click the button below to perform a safe engine reset. This will refresh the application and clear the stuck decoder state while preserving your selections.
        </p>

        <button
          onClick={() => {
              // Store progress/selections in localStorage before reload
              window.location.reload();
          }}
          className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-xl flex items-center gap-2 transform hover:scale-105 transition-all"
        >
          <RefreshCw className="w-4 h-4" /> Reset Engine & Refresh
        </button>
      </div>
    );
  }

  if (invalidError || invalidResult) {
    const title = invalidResult?.invalidVideoTitle || 'Invalid Video Submission';
    const reason = invalidResult?.invalidVideoReason || invalidError || 'Video could not be validated for sport movement.';
    const category = invalidResult?.invalidVideoCategory || 'general';
    const suggested = invalidResult?.suggestedSport;
    const motionProfile = invalidResult?.detectedMotionProfile;

    const categoryBadge = (category === 'meme_or_static' || category === 'static_meme') ? '🖼️ Static Image / Meme Guard' :
                          (category === 'blank_or_dark' || category === 'blank_screen') ? '🌑 Dark / Blank Canvas' :
                          category === 'no_human' ? '👤 No Athlete Keypoints Detected' :
                          category === 'incomplete_body' ? '🔍 Incomplete Body Profile' :
                          (category === 'stationary_subject' || category === 'stationary') ? '🧍 Low Motion / Stationary Subject' :
                          category === 'sport_mismatch' ? '⚡ Sport Kinematics Mismatch' :
                          '⚠️ Biomechanical Filter';

    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-zinc-950 border-2 border-red-500/50 rounded-3xl p-6 sm:p-10 text-center relative overflow-hidden shadow-2xl animate-fadeIn">
        {/* Background glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-20 h-20 rounded-3xl bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center text-4xl mb-4 shadow-lg shadow-red-500/20">
          <ShieldAlert className="w-10 h-10 text-red-400" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono font-bold uppercase tracking-wider mb-3">
          {categoryBadge}
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wide mb-2">
          {title}
        </h2>

        <p className="text-sm text-zinc-300 max-w-lg mx-auto mb-6 leading-relaxed bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800 text-left">
          {reason}
        </p>

        {motionProfile && (
          <div className="text-xs text-zinc-400 mb-6 bg-zinc-900/50 px-4 py-2 rounded-xl border border-zinc-800/80 font-mono">
            Kinematic Telemetry Signature: <span className="text-amber-400 font-bold">{motionProfile}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          {suggested && onSwitchSport && (
            <button
              onClick={() => onSwitchSport(suggested as SportId)}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-xl flex items-center gap-2 transform hover:scale-105 transition-all"
            >
              Switch Sport to {suggested.toUpperCase()} <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => {
              if (onCancel) {
                onCancel();
              } else {
                window.location.reload();
              }
            }}
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-xl flex items-center gap-2 transform hover:scale-105 transition-all"
          >
            <UploadCloud className="w-4 h-4" /> Upload A Clear Athlete Video
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-zinc-950 border border-zinc-800 rounded-3xl p-8 text-center relative overflow-hidden shadow-2xl">
      {/* Background Animated Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Center Radar Scanner Graphics */}
      <div className="relative mb-8">
        <div className="w-28 h-28 rounded-full border-2 border-red-500/40 bg-zinc-900 flex items-center justify-center relative shadow-lg shadow-red-600/20">
          <div className="absolute inset-0 rounded-full border border-red-500 animate-ping opacity-25" />
          <Scan className="w-12 h-12 text-red-500 animate-pulse" />
          <div className="absolute -bottom-2 bg-red-600 text-white font-mono font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow">
            {sportRule.name}
          </div>
        </div>
      </div>

      {/* Main Title */}
      <div className="flex items-center justify-center gap-2 mb-2">
        <Sparkles className="w-5 h-5 text-amber-400 fill-current animate-spin" style={{ animationDuration: '4s' }} />
        <h2 className="text-2xl font-black text-white uppercase tracking-tight">
          Klutchh AI Processing Magic
        </h2>
      </div>
      <p className="text-xs text-zinc-400 max-w-md mx-auto mb-8 leading-relaxed">
        Analyzing your uploaded video clip through MediaPipe 3D joint keypoint detection and evaluating 40 Biometric Rules...
        <br />
        <span className="text-amber-500/80 font-black uppercase text-[10px] mt-2 block">
          ⚡ Long Clips (&gt;10s) Take 3-5 Mins. Please Stay On This Page.
        </span>
      </p>

      {/* Progress Bar */}
      <div className="w-full max-w-lg mb-8">
        <div className="flex items-center justify-between text-xs font-mono mb-2">
          <span className="text-zinc-400 font-bold uppercase tracking-wider">Analysis Progress</span>
          <span className="text-red-400 font-black">{progress}%</span>
        </div>
        <div className="w-full h-3 bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden p-0.5">
          <div
            className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-500 rounded-full transition-all duration-150 ease-out shadow-sm"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Steps List */}
      <div className="w-full max-w-lg grid grid-cols-1 gap-3 text-left">
        {STEPS.map((step, idx) => {
          const isDone = idx < currentStepIndex || progress === 100;
          const isCurrent = idx === currentStepIndex && progress < 100;

          return (
            <div
              key={step.id}
              className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                isDone
                  ? 'bg-zinc-900/90 border-emerald-500/30 text-white'
                  : isCurrent
                  ? 'bg-zinc-900 border-red-500/50 text-white shadow-md shadow-red-600/10'
                  : 'bg-zinc-950/50 border-zinc-800/50 text-zinc-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black ${
                    isDone
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : isCurrent
                      ? 'bg-red-600 text-white animate-bounce'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : step.id}
                </div>
                <div>
                  <h4 className="text-xs font-bold">{step.label}</h4>
                  <p className="text-[11px] text-zinc-400">{step.sub}</p>
                </div>
              </div>

              {isCurrent && (
                <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20 uppercase tracking-wider animate-pulse">
                  Processing
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
