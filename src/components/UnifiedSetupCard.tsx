import React, { useRef, useState, useEffect } from 'react';
import { SPORTS_RULES } from '../data/sportsRules';
import { SportId, UserAccount } from '../types';
import {
  Upload,
  Camera,
  AlertCircle,
  CheckCircle2,
  Trophy,
  Activity,
  Target,
  Lock,
  FolderOpen,
  RotateCcw,
  Square,
  Sparkles,
  SwitchCamera,
  Timer
} from 'lucide-react';
import { motion } from 'motion/react';
import eliteHeroImage from '../assets/images/klutchh_elite_hero_1786393193958.jpg';

interface UnifiedSetupCardProps {
  selectedSportId: SportId;
  onSelectSport: (id: SportId) => void;
  selectedTechniqueId: string;
  onSelectTechnique: (id: string) => void;
  selectedMovementPhase: string;
  onChangeMovementPhase: (phase: string) => void;
  onVideoSelected: (url: string, file?: File) => void;
  customVideoUrl: string | null;
  analysisCount: number;
  maxAnalyses: number;
  currentUser: UserAccount | null;
  onOpenAuth: () => void;
  onImportReport?: (data: any) => void;
  targetAthleteAnchor?: 'auto' | 'left' | 'center' | 'right';
  onSelectAthleteAnchor?: (anchor: 'auto' | 'left' | 'center' | 'right') => void;
}

export const UnifiedSetupCard: React.FC<UnifiedSetupCardProps> = ({
  selectedSportId,
  onSelectSport,
  selectedTechniqueId,
  onSelectTechnique,
  selectedMovementPhase,
  onChangeMovementPhase,
  onVideoSelected,
  customVideoUrl,
  analysisCount,
  maxAnalyses,
  currentUser,
  onOpenAuth,
  onImportReport,
  targetAthleteAnchor = 'auto',
  onSelectAthleteAnchor,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectorTab, setSelectorTab] = useState<'upload' | 'camera'>('upload');
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Live Camera Recording State (Max 30s)
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedTimeSec, setRecordedTimeSec] = useState<number>(0);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [recordedFile, setRecordedFile] = useState<File | null>(null);

  const currentSportRule = SPORTS_RULES.find((s) => s.id === selectedSportId) || SPORTS_RULES[0];

  // When customVideoUrl is reset after an analysis, reset the selector so the previous video is removed
  useEffect(() => {
    if (!customVideoUrl) {
      setFileName(null);
      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl);
        setRecordedVideoUrl(null);
        setRecordedFile(null);
      }
    }
  }, [customVideoUrl]);

  // Clean up camera stream
  const stopCameraStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Start camera stream
  const startCameraStream = async (mode: 'user' | 'environment' = facingMode) => {
    setCameraError(null);
    stopCameraStream();
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera access is not supported on this browser.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      mediaStreamRef.current = stream;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play().catch((err) => console.error(err));
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Camera stream error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please enable camera access in your browser settings.'
          : 'Unable to start camera stream.'
      );
    }
  };

  // Manage camera on tab change
  useEffect(() => {
    if (selectorTab === 'camera' && currentUser && !recordedVideoUrl) {
      startCameraStream();
    } else {
      stopCameraStream();
    }
    return () => {
      stopCameraStream();
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [selectorTab, currentUser, recordedVideoUrl]);

  const toggleFacingMode = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCameraStream(nextMode);
  };

  // Start 30s recording
  const startRecording = () => {
    if (!mediaStreamRef.current) return;
    setCameraError(null);
    recordedChunksRef.current = [];
    setRecordedTimeSec(0);

    try {
      const mimeTypes = ['video/webm;codecs=vp9', 'video/webm', 'video/mp4'];
      let selectedMime = '';
      for (const m of mimeTypes) {
        if (MediaRecorder.isTypeSupported(m)) {
          selectedMime = m;
          break;
        }
      }

      const recorder = new MediaRecorder(
        mediaStreamRef.current,
        selectedMime ? { mimeType: selectedMime } : undefined
      );

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const mimeType = selectedMime || 'video/webm';
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
        const file = new File(
          [blob],
          `Live_${currentSportRule.name}_${Date.now()}.${ext}`,
          { type: mimeType }
        );
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
        setRecordedFile(file);
        stopCameraStream();
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);

      const startTime = Date.now();
      recordingTimerRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        if (elapsed >= 30.0) {
          stopRecording();
        } else {
          setRecordedTimeSec(elapsed);
        }
      }, 100);
    } catch (e: any) {
      console.error('Failed to start recording:', e);
      setCameraError('Failed to start live video recording.');
    }
  };

  const stopRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleRetake = () => {
    if (recordedVideoUrl) {
      URL.revokeObjectURL(recordedVideoUrl);
    }
    setRecordedVideoUrl(null);
    setRecordedFile(null);
    setRecordedTimeSec(0);
    startCameraStream();
  };

  const handleUseRecordedVideo = () => {
    if (recordedVideoUrl && recordedFile) {
      if (analysisCount >= maxAnalyses) {
        setFileError(`Analysis limit reached (${analysisCount}/${maxAnalyses}). Further video analyses are blocked.`);
        return;
      }
      setFileName(recordedFile.name);
      onVideoSelected(recordedVideoUrl, recordedFile);
    }
  };

  const processVideoFile = (file: File) => {
    setFileError(null);
    if (analysisCount >= maxAnalyses) {
      setFileError(`Analysis limit reached (${analysisCount}/${maxAnalyses}). Further video analyses are blocked.`);
      return;
    }
    if (!file.type.startsWith('video/')) {
      setFileError('Please select a valid video file (MP4, MOV, WebM, AVI).');
      return;
    }

    const url = URL.createObjectURL(file);
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'auto';
    tempVideo.muted = true;
    tempVideo.playsInline = true;

    tempVideo.onloadeddata = () => {
      if (tempVideo.duration > 30.5) {
        setFileError(`Selected video is ${Math.round(tempVideo.duration)}s long. Maximum allowed length is 30s.`);
        URL.revokeObjectURL(url);
        tempVideo.src = '';
        tempVideo.load();
        return;
      }
      setFileName(file.name);
      onVideoSelected(url, file);
      
      // Cleanup
      tempVideo.onloadeddata = null;
      tempVideo.onerror = null;
    };

    tempVideo.onerror = () => {
      setFileName(file.name);
      onVideoSelected(url, file);
      
      // Cleanup
      tempVideo.onloadeddata = null;
      tempVideo.onerror = null;
    };

    tempVideo.src = url;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processVideoFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processVideoFile(file);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="max-w-4xl w-full mx-auto my-4 flex flex-col gap-6"
    >
      
      {/* Hero Banner with Dynamic Branding */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1, ease: "backOut" }}
        className="relative overflow-hidden rounded-2xl shadow-2xl border border-zinc-800/80 group flex flex-col min-h-[16rem] sm:min-h-[18rem]"
      >
        <img 
          src={eliteHeroImage} 
          alt="Klutchh Elite Engine" 
          className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 z-0"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/95 via-zinc-950/80 sm:via-zinc-950/60 to-transparent z-10" />
        <div className="relative z-20 flex flex-col justify-center p-6 sm:p-10">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600/30 via-amber-500/30 to-transparent border-l-4 border-red-500 px-4 py-1.5 rounded-r-full text-amber-400 text-xs font-black uppercase tracking-wider mb-3 w-fit backdrop-blur-sm"
          >
            <span>YOUR JOURNEY TO GREATNESS</span>
          </motion.div>
          <motion.h2 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-3xl sm:text-4xl md:text-5xl font-black text-white italic uppercase tracking-tight max-w-lg leading-tight"
          >
            Unlocking <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-400 to-red-500">Elite Potential</span>
          </motion.h2>
          <motion.p 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-xs sm:text-sm text-zinc-300 max-w-lg mt-3 leading-relaxed font-medium"
          >
            Klutchh is the connection between your journey to being the greatest, and getting you there. Upload your clip and let our professional biomechanics engine extract real-time insights to refine your technique.
          </motion.p>
        </div>
      </motion.div>

      {analysisCount >= maxAnalyses && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-950/90 border border-red-500 text-red-200 text-xs p-4 rounded-2xl flex items-center gap-3 font-bold shadow-xl shadow-red-950/50"
        >
          <AlertCircle className="w-6 h-6 text-red-400 shrink-0" />
          <div>
            <p className="font-black uppercase tracking-wider text-sm">Analysis Limit Reached ({analysisCount}/{maxAnalyses})</p>
            <p className="text-[11px] text-red-300 font-normal mt-0.5">You have reached the maximum limit of {maxAnalyses} video analyses. Further video analyses are blocked.</p>
          </div>
        </motion.div>
      )}

      {/* Main Single Setup Card */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-6 relative overflow-hidden"
      >
        {/* Subtle background glow */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* STEP 1: SELECT SPORT */}
        <div className="flex flex-col gap-3 relative z-10">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-gradient-to-tr from-red-600 to-amber-500 text-zinc-950 font-black text-xs flex items-center justify-center shrink-0 shadow-lg shadow-red-600/20">
                1
              </span>
              <h3 className="text-xs font-black uppercase text-white tracking-wider">
                Select Sport Discipline
              </h3>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">
              {currentSportRule.jointRules.length} Joint Rules Active
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {SPORTS_RULES.map((s) => {
              const isSelected = s.id === selectedSportId;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    onSelectSport(s.id);
                    if (s.techniques && s.techniques.length > 0) {
                      onSelectTechnique(s.techniques[0].id);
                      if (s.techniques[0].phases && s.techniques[0].phases.length > 0) {
                        onChangeMovementPhase(s.techniques[0].phases[0]);
                      }
                    } else if (s.phases.length > 0) {
                      onChangeMovementPhase(s.phases[0]);
                    }
                  }}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-red-600/20 border-red-500 text-white shadow-lg shadow-red-600/10'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Trophy className={`w-4 h-4 shrink-0 ${isSelected ? 'text-amber-400' : 'text-zinc-500'}`} />
                    <span className="text-xs font-black uppercase tracking-wide truncate">{s.name.split(' ')[0]}</span>
                  </div>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-red-500 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* STEP 1.5: SELECT PRECISE TECHNIQUE / MOVEMENT */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500 text-zinc-950 font-black text-xs flex items-center justify-center shrink-0">
                1.5
              </span>
              <h3 className="text-xs font-black uppercase text-white tracking-wider">
                Select Precise Movement Technique
              </h3>
            </div>
            <span className="text-[10px] text-amber-400 font-mono">
              Ensures precise keyframe sequencing
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {currentSportRule.techniques?.map((tech) => {
              const isSelected = selectedTechniqueId === tech.id;
              return (
                <button
                  key={tech.id}
                  onClick={() => {
                    onSelectTechnique(tech.id);
                    if (tech.phases && tech.phases.length > 0) {
                      onChangeMovementPhase(tech.phases[0]);
                    }
                  }}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                    isSelected
                      ? 'bg-amber-400/20 border-amber-400 text-white shadow-lg shadow-amber-400/10'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-black uppercase tracking-wide truncate">{tech.name}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />}
                  </div>
                  <p className="text-[10px] text-zinc-400 line-clamp-1">{tech.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* STEP 1.7: MULTI-PERSON GRID SELECTOR */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-zinc-800 text-amber-400 font-black text-xs flex items-center justify-center shrink-0 border border-amber-500/30">
                1.7
              </span>
              <h3 className="text-xs font-black uppercase text-white tracking-wider">
                Multi-Person Selection
              </h3>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">
              Multiple athletes in frame? Select target zone.
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {(['auto', 'left', 'center', 'right'] as const).map((anchor) => {
              const isSelected = targetAthleteAnchor === anchor;
              return (
                <button
                  key={anchor}
                  onClick={() => onSelectAthleteAnchor?.(anchor)}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md shadow-amber-500/20'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase tracking-wide">
                    {anchor === 'auto' ? 'Auto / Primary' : `${anchor} Zone`}
                  </span>
                  {isSelected && <CheckCircle2 className={`w-4 h-4 ${isSelected ? 'text-zinc-950' : 'text-amber-400'}`} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* STEP 2: VIDEO SELECTOR (ONLY UPLOAD & LIVE CAMERA RECORD 30S) */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-red-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                2
              </span>
              <h3 className="text-xs font-black uppercase text-white tracking-wider">
                Video Ingestion (Max 30s)
              </h3>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                MAX 30 SECONDS
              </span>
            </div>
          </div>

          {/* Mode Switcher Tabs: Upload Video vs Live Camera Record */}
          <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800/80">
            <button
              type="button"
              onClick={() => setSelectorTab('upload')}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                selectorTab === 'upload'
                  ? 'bg-gradient-to-r from-red-600 to-amber-500 text-zinc-950 shadow-md font-extrabold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Upload Video</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectorTab('camera')}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                selectorTab === 'camera'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-zinc-950 shadow-md font-extrabold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Live Camera (30s)</span>
            </button>
          </div>

          {currentUser ? (
            <div>
              {/* TAB 1: UPLOAD VIDEO */}
              {selectorTab === 'upload' && (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-zinc-950 border-2 border-dashed border-zinc-800 hover:border-red-500 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 group"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="video/*"
                    className="hidden"
                  />

                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center text-zinc-950 shadow-lg shadow-red-600/20 group-hover:scale-110 transition-transform">
                    <Upload className="w-7 h-7 stroke-[2.5]" />
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">
                      {fileName ? `Selected: ${fileName}` : 'Drop Video File Here or Click to Browse'}
                    </h4>
                    <p className="text-xs text-zinc-400 mt-1">
                      Supports MP4, MOV, WebM (up to 30s). Pose detection & biometrics will calibrate automatically.
                    </p>
                  </div>

                  {fileError && (
                    <div className="bg-red-950/80 border border-red-500 text-red-300 text-xs px-4 py-2 rounded-xl flex items-center gap-2 font-bold">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>{fileError}</span>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: LIVE CAMERA RECORD (MAX 30S) */}
              {selectorTab === 'camera' && (
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center gap-4">
                  {/* Camera Viewfinder / Preview Player */}
                  <div className="relative w-full aspect-video max-h-[420px] bg-black rounded-2xl overflow-hidden border border-zinc-800 flex items-center justify-center">
                    {!recordedVideoUrl ? (
                      <>
                        <video
                          ref={videoPreviewRef}
                          playsInline
                          muted
                          autoPlay
                          className="w-full h-full object-cover"
                        />

                        {/* Camera Alignment Overlay Guide */}
                        <div className="absolute inset-0 pointer-events-none border-2 border-amber-400/20 rounded-2xl flex flex-col justify-between p-4">
                          <div className="flex justify-between items-center">
                            <span className="bg-black/70 text-amber-400 text-[10px] font-black px-2.5 py-1 rounded-lg border border-amber-400/30 flex items-center gap-1.5 uppercase">
                              <Sparkles className="w-3 h-3" />
                              Posture Guide Ready
                            </span>

                            {isRecording && (
                              <div className="bg-red-600 text-white text-xs font-black px-3 py-1 rounded-full animate-pulse flex items-center gap-1.5 shadow-[0_0_15px_rgba(220,38,38,0.8)]">
                                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                                REC: {recordedTimeSec.toFixed(1)}s / 30.0s
                              </div>
                            )}
                          </div>

                          {/* Center Silhouette Alignment Frame */}
                          <div className="self-center border-2 border-dashed border-white/20 rounded-3xl w-48 h-64 flex items-center justify-center text-white/30 text-[11px] font-bold uppercase tracking-wider text-center p-4">
                            Position Athlete Full Body In Frame
                          </div>

                          {/* 30s Recording Progress Bar */}
                          {isRecording && (
                            <div className="w-full bg-zinc-900/90 h-2.5 rounded-full overflow-hidden border border-zinc-700">
                              <div
                                className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 transition-all duration-100"
                                style={{ width: `${Math.min(100, (recordedTimeSec / 30.0) * 100)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      /* Recorded Footage Preview */
                      <video
                        src={recordedVideoUrl}
                        controls
                        playsInline
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>

                  {/* Camera Error Message */}
                  {cameraError && (
                    <div className="w-full bg-red-950/80 border border-red-500 text-red-300 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>{cameraError}</span>
                    </div>
                  )}

                  {/* Live Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-3 w-full border-t border-zinc-800/80 pt-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={toggleFacingMode}
                        disabled={isRecording || !!recordedVideoUrl}
                        className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-40"
                      >
                        <SwitchCamera className="w-4 h-4" />
                        <span className="hidden sm:inline">Flip Camera</span>
                      </button>

                      <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-1">
                        <Timer className="w-3.5 h-3.5 text-amber-400" />
                        <span>30.0s Limit</span>
                      </div>
                    </div>

                    {!recordedVideoUrl ? (
                      <div>
                        {!isRecording ? (
                          <button
                            type="button"
                            onClick={startRecording}
                            disabled={!isCameraActive}
                            className="bg-red-600 hover:bg-red-500 text-white font-black text-xs px-5 py-2.5 rounded-xl uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all active:scale-95 disabled:opacity-40"
                          >
                            <span className="w-3 h-3 rounded-full bg-white" />
                            <span>Start 30s Record</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={stopRecording}
                            className="bg-zinc-900 hover:bg-zinc-800 text-red-400 border border-red-500 font-black text-xs px-5 py-2.5 rounded-xl uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95 animate-pulse"
                          >
                            <Square className="w-3.5 h-3.5 fill-red-400" />
                            <span>Stop ({recordedTimeSec.toFixed(1)}s)</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleRetake}
                          className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Retake</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleUseRecordedVideo}
                          className="bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-zinc-950 font-black text-xs px-5 py-2.5 rounded-xl uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-red-600/20 transition-all active:scale-95"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Use for Biometric Analysis</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              onClick={onOpenAuth}
              className="bg-zinc-950/80 border-2 border-dashed border-zinc-800 hover:border-yellow-500/40 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-4 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center justify-center shadow-lg group-hover:border-yellow-400/40 group-hover:text-yellow-400 transition-all">
                <Lock className="w-5 h-5" />
              </div>

              <div className="max-w-sm">
                <h4 className="text-sm font-black text-white uppercase tracking-wider">
                  Authentication Required
                </h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Sign in to save your reports directly to your local profile. Pose detection and biometrics process instantly on your device.
                </p>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenAuth();
                }}
                className="bg-yellow-400 hover:bg-yellow-300 text-zinc-950 font-black text-xs px-5 py-2.5 rounded-xl uppercase tracking-wider shadow-lg shadow-yellow-400/10 transition-all active:scale-95"
              >
                Sign In to Upload or Record
              </button>
            </div>
          )}

          {/* Client-Owned Offline Storage File Re-Opener */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                <FolderOpen className="w-5 h-5" />
              </div>
              <div>
                <h5 className="text-xs font-black text-white uppercase tracking-wider">
                  Re-Open Exported .klutchh Report File
                </h5>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Have a saved <strong>.klutchh</strong> report file on your disk or Google Drive? Re-import it here to view instantly.
                </p>
              </div>
            </div>

            <label className="bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-extrabold text-xs px-4 py-2.5 rounded-xl border border-zinc-700 cursor-pointer flex items-center gap-2 shrink-0 transition-all">
              <span>Open .klutchh File</span>
              <input
                type="file"
                accept=".klutchh,.json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && onImportReport) {
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                      try {
                        const parsed = JSON.parse(evt.target?.result as string);
                        onImportReport(parsed);
                      } catch (err) {
                        alert("Invalid .klutchh report file format.");
                      }
                    };
                    reader.readAsText(file);
                  }
                  e.target.value = '';
                }}
              />
            </label>
          </div>

        </div>

      </motion.div>

    </motion.div>
  );
};
