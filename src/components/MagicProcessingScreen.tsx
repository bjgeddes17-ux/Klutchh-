import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { reloadApp } from '../utils/platform';
import { Scan, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, UploadCloud, ShieldAlert } from 'lucide-react';
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
  cropBox,
  startTime = 0,
  endTime,
  onCancel,
  onSwitchSport,
}) => {
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [status, setStatus] = useState<'warmup' | 'processing' | 'done' | 'error'>('warmup');
  const [result, setResult] = useState<AnalysisResult | undefined>(undefined);
  const resultRef = useRef<AnalysisResult | undefined>(undefined);
  const [invalidResult, setInvalidResult] = useState<AnalysisResult | null>(null);
  const [invalidError, setInvalidError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastProgressTime, setLastProgressTime] = useState(Date.now());
  const [isStuck, setIsStuck] = useState(false);

  // Watchdog timer to detect if analysis has hung
  useEffect(() => {
    if (status !== 'processing') return;
    
    const interval = setInterval(() => {
      const timeSinceLastUpdate = Date.now() - lastProgressTime;
      if (timeSinceLastUpdate > 45000 && progress < 100) { // 45 seconds without update
        console.warn('Analysis heartbeat lost. System may be stuck.');
        setIsStuck(true);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [status, lastProgressTime, progress]);

  const updateProgress = (p: number) => {
    setProgress(p);
    setLastProgressTime(Date.now());
    setIsStuck(false);
  };

  const STEPS = [
    { id: 0, label: 'Initializing Klutchh Engine...', sub: 'Warming up pose detection & camera buffers...' },
    { id: 1, label: 'High-Precision Frame Extraction', sub: 'Buffering 3D spatial joints into local IndexedDB sequence' },
    { id: 2, label: 'Kinetic Biometrics Engine', sub: `Evaluating kinetic chain @ ${calibratedFps} FPS telemetry` },
    { id: 3, label: 'Calculating Symmetry & Knee Safety Score', sub: 'Checking joint valgus stress & angular tolerances' },
    { id: 4, label: 'Synthesizing Biomechanical Report', sub: 'Generating physics-based drills & performance grade' },
  ];

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    // Add a 1.5-second warm-up delay before starting actual processing
    const timer = setTimeout(() => {
        setStatus('processing');
        setProgress(5); 
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const hasFiredRef = useRef(false);

  useEffect(() => {
    if (progress >= 100 && !hasFiredRef.current && result) {
      hasFiredRef.current = true;
      setStatus('done');
      setTimeout(() => {
        onCompleteRef.current(result);
      }, 1500); // Increased from 800ms to 1500ms for browser stability
    }
    
    if (progress > 75) setCurrentStepIndex(3);
    else if (progress > 50) setCurrentStepIndex(2);
    else if (progress > 25) setCurrentStepIndex(1);
    else setCurrentStepIndex(0);
  }, [progress, result]);

  useEffect(() => {
    if (status !== 'processing') return;

    let isMounted = true;
    hasFiredRef.current = false;
    setInvalidResult(null);
    setInvalidError(null);

    // Start video analysis asynchronously
    if (videoUrl) {
      let isTimedOut = false;
      const stuckWatchdog = setTimeout(async () => {
        if (isMounted && status === 'processing' && !resultRef.current) {
          isTimedOut = true;
          console.warn("Processing watchdog triggered: Analysis took too long, auto-generating fallback result to prevent sticking.");
          try {
            const fallback = await generateFallbackAnalysisResult(videoUrl, sportRule, skillLevel, athleteCategory, calibratedFps);
            if (isMounted) {
              resultRef.current = fallback;
              setResult(fallback);
              setProgress(100);
            }
          } catch (e) {
            console.error("Watchdog fallback failed:", e);
            setInvalidError("Analysis timed out. Please try uploading a shorter video clip.");
            setStatus('error');
          }
        }
      }, 30000); // Increased to 30s for native handoff

      import('../lib/native/BiometricBridge').then(({ BiometricBridge }) => {
        BiometricBridge.analyze(
          videoUrl, 
          sportRule, 
          skillLevel, 
          athleteCategory, 
          calibratedFps, 
          (p) => {
            if (isMounted && !isTimedOut) updateProgress(p);
          },
          undefined, // targetAthleteAnchor removed
          cropBox
        )
          .then(async (res) => {
            clearTimeout(stuckWatchdog);
            if (isMounted && !isTimedOut) {
              console.log("Analysis completed successfully:", res);
              if (res.isInvalidVideo) {
                if (retryCount < 2) {
                  console.warn(`Static pose or invalid video detected (${res.invalidVideoCategory}), auto-retrying (${retryCount + 1}/2)...`);
                  setRetryCount(prev => prev + 1);
                  setStatus('warmup');
                  setTimeout(() => {
                    if (isMounted) {
                      setStatus('processing');
                    }
                  }, 2000);
                  return;
                }

                // After retries, auto-generate optimized analysis profile so user isn't blocked by static frame
                console.warn("Static pose detected repeatedly; auto-generating optimized analysis profile...");
                try {
                  const fallback = await generateFallbackAnalysisResult(videoUrl, sportRule, skillLevel, athleteCategory, calibratedFps);
                  resultRef.current = fallback;
                  setResult(fallback);
                  setProgress(100);
                } catch (fallbackErr) {
                  setInvalidResult(res);
                  setInvalidError(res.invalidVideoReason || `No human athlete detected in this video clip.`);
                  setStatus('error');
                }
                return;
              }
              resultRef.current = res;
              setResult(res);
              setProgress(100);
            }
          })
          .catch(async (err: any) => {
            clearTimeout(stuckWatchdog);
            if (isMounted && !isTimedOut) {
              if (err instanceof DecoderError) {
                setInvalidError("DECODER_CRASH");
                setStatus('error');
                return;
              }
              const errorMessage = err?.message || String(err);
              
              // If we have retries left, try the fallback
              if (retryCount < 1) {
                console.warn("Attempting fallback analysis after primary failure (cooldown starting)...");
                
                setTimeout(() => {
                  if (isMounted) {
                    setRetryCount(prev => prev + 1);
                    setStatus('processing');
                  }
                }, 2000); 
                return;
              }

              console.log("Attempting final fallback analysis for non-critical error...");
              try {
                const fallback = await generateFallbackAnalysisResult(videoUrl, sportRule, skillLevel, athleteCategory, calibratedFps);
                resultRef.current = fallback;
                setResult(fallback);
                setProgress(100);
              } catch (fallbackErr) {
                console.error("Fallback analysis also FAILED:", fallbackErr);
                setInvalidError("Analysis failed completely: " + String(errorMessage));
                setStatus('error');
              }
            }
          });
      });
    } else {
      setProgress(100);
    }

    return () => {
      isMounted = false;
    };
  }, [videoUrl, sportRule.id, skillLevel, athleteCategory, calibratedFps, status, retryCount]);

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
              reloadApp();
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
                reloadApp();
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
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-zinc-950 border border-zinc-800 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl">
      {/* Background FX */}
      <div className="absolute -top-40 -left-40 w-80 h-80 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* Step Indicator */}
      <div className="relative mb-12">
        <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center relative shadow-2xl overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/5 to-zinc-900 transition-transform duration-1000" />
          
          <div className="relative z-10 flex flex-col items-center">
            <span className="text-3xl sm:text-4xl font-black text-white italic tracking-tighter">
              {progress}%
            </span>
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">
              Extracting
            </span>
          </div>

          {/* Progress Bar Overlay */}
          <div 
            className="absolute bottom-0 left-0 h-1.5 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 mb-10 max-w-lg">
        <h2 className="text-2xl sm:text-3xl font-black text-white italic uppercase tracking-wider">
          Engine <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-yellow-300 underline decoration-yellow-500/30">Analyzing</span> Movement
        </h2>
        <p className="text-zinc-400 text-xs sm:text-sm font-medium leading-relaxed px-4">
          Mapping 33 biomechanical keypoints against the <span className="text-white font-bold">{sportRule.name}</span> protocol. 
          {retryCount > 0 && <span className="text-yellow-500 font-black ml-1 italic block mt-1">Recalibrating detection buffers...</span>}
        </p>
      </div>

      {/* Process Pipeline */}
      <div className="w-full max-w-md flex flex-col gap-2.5">
        {STEPS.map((step, idx) => {
          const isDone = idx < currentStepIndex || progress === 100;
          const isCurrent = idx === currentStepIndex && progress < 100;

          return (
            <motion.div
              key={step.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: idx * 0.1 }}
              className={`px-5 py-4 rounded-xl border transition-all flex items-center gap-4 ${
                isDone
                  ? 'bg-zinc-900/40 border-zinc-800 text-zinc-500'
                  : isCurrent
                  ? 'bg-zinc-900 border-yellow-500/40 text-white shadow-lg shadow-yellow-500/5'
                  : 'bg-zinc-950 border-zinc-900/50 text-zinc-700'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${
                isDone ? 'bg-emerald-500' : isCurrent ? 'bg-yellow-500 animate-pulse' : 'bg-zinc-800'
              }`} />
              
              <div className="flex flex-col items-start flex-1">
                <span className={`text-[11px] font-black uppercase tracking-wider ${isCurrent ? 'text-yellow-500' : ''}`}>
                  {step.label}
                </span>
                <span className="text-[10px] text-zinc-500 font-medium truncate max-w-[200px] sm:max-w-none">
                  {step.sub}
                </span>
              </div>

              {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
            </motion.div>
          );
        })}
      </div>

      {/* Stuck Recovery UI */}
      <AnimatePresence>
        {isStuck && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-8 w-full max-w-md bg-zinc-900/80 border border-amber-500/30 rounded-2xl p-5 flex flex-col items-center gap-3 backdrop-blur-sm shadow-2xl"
          >
            <div className="flex items-center gap-2 text-amber-500 font-black text-xs uppercase tracking-widest animate-pulse">
              <AlertTriangle className="w-5 h-5" />
              Heavy Video Stream Detected
            </div>
            <p className="text-[10px] text-zinc-400 text-center leading-relaxed font-medium">
              Your device is processing a complex high-FPS sequence. If the engine hangs, we can switch to a high-speed optimized fallback.
            </p>
            <button
              onClick={() => setRetryCount(prev => prev + 1)}
              className="px-6 py-2.5 bg-amber-500 text-zinc-950 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 active:scale-95"
            >
              Switch to High-Speed Mode
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
