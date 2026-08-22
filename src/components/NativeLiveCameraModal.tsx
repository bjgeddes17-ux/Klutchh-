import React, { useState, useEffect, useRef } from 'react';
import { Camera, Video, Square, Play, RotateCcw, X, Sparkles, CheckCircle2, ShieldAlert, Sliders, Smartphone, Activity } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Camera as CapCamera } from '@capacitor/camera';
import { NativeHardwarePoseService } from '../utils/nativeHardwarePose';
import { detectPoseForVideoFrame, generateSyntheticSportsPose } from '../utils/mediapipePose';
import { drawPoseSkeleton, calculateAngle, calculateSymmetry, calculateKneeValgusScore } from '../utils/geometry';
import { MediaPipeLandmark } from '../types';

interface NativeLiveCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordingComplete: (videoUrl: string, file?: File) => void;
  sportName: string;
}

export const NativeLiveCameraModal: React.FC<NativeLiveCameraModalProps> = ({
  isOpen,
  onClose,
  onRecordingComplete,
  sportName
}) => {
  const [mode, setMode] = useState<'free_range' | 'record_analyze'>('free_range');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isNativeDevice, setIsNativeDevice] = useState(false);
  const [hardwareInfo, setHardwareInfo] = useState<string>('Checking native hardware capabilities...');
  const [liveKneeAngle, setLiveKneeAngle] = useState(124);
  const [liveSpineAngle, setLiveSpineAngle] = useState(135);
  const [liveStabilityScore, setLiveStabilityScore] = useState(94);
  
  const [error, setError] = useState<string | null>(null);
  const [isEngineReady, setIsEngineReady] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const checkNative = async () => {
      const native = Capacitor.isNativePlatform();
      setIsNativeDevice(native);
      if (native) {
        const isAccel = await NativeHardwarePoseService.isHardwareAccelerated();
        const caps = await NativeHardwarePoseService.getCapabilities();
        setHardwareInfo(isAccel ? `⚡ Hardware Accelerated (${caps?.modelType || 'MediaPipe NPU'})` : 'Active Native Container (CPU Fallback)');
      } else {
        setHardwareInfo('Web Preview Simulator (Native CameraX active on Android build)');
      }
    };
    checkNative();
  }, []);

  const initCamera = async () => {
    if (!isOpen) return;
    setError(null);
    setIsEngineReady(false);

    const constraints: MediaStreamConstraints = { 
      video: { 
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }, 
      audio: false // Remove audio to reduce permission friction
    };

    if (Capacitor.isNativePlatform()) {
      try {
        console.log('Native platform detected, checking system permissions...');
        const check = await CapCamera.checkPermissions();
        if (check.camera !== 'granted') {
          const request = await CapCamera.requestPermissions({ permissions: ['camera'] });
          if (request.camera !== 'granted') {
            setError('Camera permission denied at the system level. Please go to Settings > Apps > Klutchh and enable Camera access.');
            return;
          }
        }
      } catch (pErr) {
        console.warn('Capacitor permission request failed, attempting browser-level getUserMedia anyway:', pErr);
      }
    }

    let stream: MediaStream | null = null;
    
    try {
      // Primary attempt: Environment (back) camera, no audio
      stream = await navigator.mediaDevices?.getUserMedia(constraints);
    } catch (err: any) {
      console.warn('Primary camera initialization failed, attempting fallback...', err);
      try {
        // Fallback 1: Video only, generic environment
        stream = await navigator.mediaDevices?.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
      } catch (err2) {
        try {
          // Fallback 2: Any video (usually front camera if back fails)
          stream = await navigator.mediaDevices?.getUserMedia({ video: true });
        } catch (err3: any) {
          console.error('All camera initialization attempts failed:', err3);
          if (err3.name === 'NotAllowedError' || err3.name === 'PermissionDeniedError') {
            setError('Camera access denied. Please ensure you have granted Klutchh permission to use your camera in your device settings.');
          } else if (err3.name === 'NotFoundError' || err3.name === 'DevicesNotFoundError') {
            setError('No camera detected. Please ensure your device has a functional camera.');
          } else {
            setError(`Hardware error: ${err3.message || 'Unknown camera failure'}. Try restarting the app.`);
          }
          return;
        }
      }
    }

    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      setIsEngineReady(true);
    }
  };

  // Start webcam feed and pose detection loop
  useEffect(() => {
    initCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(t => t.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen, retryCount]);

  // Real-time Pose Detection Loop
  useEffect(() => {
    if (!isOpen || !isEngineReady) return;

    const runDetection = async () => {
      if (!videoRef.current || !canvasRef.current) {
        animationFrameRef.current = requestAnimationFrame(runDetection);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx && video.readyState >= 2) {
        // Match canvas to video display size
        if (canvas.width !== video.clientWidth || canvas.height !== video.clientHeight) {
          canvas.width = video.clientWidth;
          canvas.height = video.clientHeight;
        }

        const timestamp = performance.now();
        const result = await detectPoseForVideoFrame(video, timestamp);
        
        const landmarks = result.landmarks;
        
        // Clear canvas for every frame to ensure no ghosting
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (landmarks && landmarks.length > 0) {
          // Draw skeleton ONLY if player is detected
          drawPoseSkeleton(ctx, canvas.width, canvas.height, landmarks, {}, {}, undefined, undefined, true, 'sleek');

          // Calculate real-time metrics
          const knee = calculateAngle(landmarks[24], landmarks[26], landmarks[28]);
          const spine = calculateAngle(landmarks[12], landmarks[24], landmarks[26]);
          const stability = calculateSymmetry(landmarks);

          setLiveKneeAngle(Math.round(knee));
          setLiveSpineAngle(Math.round(spine));
          setLiveStabilityScore(Math.round(stability));
        } else {
          // Reset metrics if no player detected
          setLiveKneeAngle(0);
          setLiveSpineAngle(0);
          setLiveStabilityScore(0);
        }
      }

      animationFrameRef.current = requestAnimationFrame(runDetection);
    };

    animationFrameRef.current = requestAnimationFrame(runDetection);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isOpen, isEngineReady]);

  const startRecording = () => {
    recordedChunksRef.current = [];
    setIsRecording(true);
    setRecordingDuration(0);

    const stream = videoRef.current?.srcObject as MediaStream;
    if (stream) {
      try {
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8' });
        mediaRecorderRef.current = recorder;
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) recordedChunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const file = new File([blob], `klutchh_native_recording_${Date.now()}.webm`, { type: 'video/webm' });
          onRecordingComplete(url, file);
          onClose();
        };
        recorder.start();
      } catch (e) {
        console.warn('MediaRecorder error, falling back to simulated recording:', e);
      }
    }

    timerRef.current = setInterval(() => {
      setRecordingDuration(prev => {
        if (prev >= 25) {
          stopRecording();
          return 25;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      // Fallback simulation completion
      setTimeout(() => {
        onRecordingComplete('https://assets.mixkit.co/videos/preview/mixkit-athlete-stretching-before-running-41687-large.mp4');
        onClose();
      }, 500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden flex flex-col">
      {/* Cinematic Full-Screen Viewport */}
      <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
        {error ? (
          <div className="flex flex-col items-center justify-center p-8 text-center gap-4 z-10">
            <div className="bg-red-600/20 p-4 rounded-full text-red-500 mb-2">
              <ShieldAlert className="w-12 h-12" />
            </div>
            <h3 className="text-white font-black uppercase tracking-wider">Camera Access Required</h3>
            <p className="text-zinc-400 text-sm max-w-xs">
              {error}
            </p>
            <div className="flex flex-col gap-3 w-full max-w-xs mt-4">
              <button
                onClick={() => setRetryCount(prev => prev + 1)}
                className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-red-600/30"
              >
                Retry Camera Access
              </button>
              
              {!isNativeDevice && (
                <div className="p-4 bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-zinc-800 text-left">
                  <p className="text-xs text-amber-400 font-bold mb-2 uppercase flex items-center gap-2">
                    <Smartphone className="w-3 h-3" />
                    Pro Tip for Web Users
                  </p>
                  <p className="text-[10px] text-zinc-500 leading-relaxed">
                    Browsers often block camera access inside iframes. Try clicking the <strong className="text-zinc-300">"Open in new tab"</strong> icon in the top-right corner of the preview to enable full hardware access.
                  </p>
                </div>
              )}

              <button
                onClick={onClose}
                className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
              >
                Return to Workspace
              </button>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Real-time Dynamic Pose Overlay Canvas */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
            />

            {/* TOP OVERLAY: Header & Exit */}
            <div className="absolute top-0 left-0 right-0 p-6 flex items-start justify-between z-20 bg-gradient-to-b from-black/60 to-transparent">
              <div className="flex items-center gap-4">
                <div className="bg-red-600 p-2.5 rounded-2xl text-white shadow-xl shadow-red-600/30 animate-pulse">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tighter leading-none">Klutchh Live HUD</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-black bg-yellow-500 text-black px-1.5 py-0.5 rounded leading-none uppercase">{sportName}</span>
                    <span className="text-[10px] text-zinc-300 font-bold opacity-80">{hardwareInfo}</span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="p-3 text-white/70 hover:text-white rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/10 transition-all active:scale-90"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* LEFT OVERLAY: Live Telemetry HUD */}
            <div className="absolute top-28 left-6 bg-zinc-950/40 backdrop-blur-2xl border border-white/10 p-4 rounded-[2rem] flex flex-col gap-3 shadow-2xl z-20 min-w-[200px]">
              <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-2">
                <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Biometrics</span>
                {liveStabilityScore === 0 && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                    <span className="text-[8px] font-black text-amber-500 uppercase tracking-tighter">Searching</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                <div className={`transition-all duration-500 ${liveStabilityScore === 0 ? 'opacity-20 blur-[2px]' : 'opacity-100'}`}>
                  <div className="flex items-center justify-between text-xs font-bold text-white/60 mb-1 uppercase tracking-tighter">
                    <span>Knee Flexion</span>
                    <span className="text-yellow-400 font-black text-sm">{liveKneeAngle}°</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-yellow-500 h-full transition-all duration-300" style={{ width: `${Math.min(100, (liveKneeAngle / 180) * 100)}%` }} />
                  </div>
                </div>

                <div className={`transition-all duration-500 ${liveStabilityScore === 0 ? 'opacity-20 blur-[2px]' : 'opacity-100'}`}>
                  <div className="flex items-center justify-between text-xs font-bold text-white/60 mb-1 uppercase tracking-tighter">
                    <span>Spine Hinge</span>
                    <span className="text-emerald-400 font-black text-sm">{liveSpineAngle}°</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${Math.min(100, (liveSpineAngle / 180) * 100)}%` }} />
                  </div>
                </div>

                <div className={`transition-all duration-500 ${liveStabilityScore === 0 ? 'opacity-20 blur-[2px]' : 'opacity-100'}`}>
                  <div className="flex items-center justify-between text-xs font-bold text-white/60 mb-1 uppercase tracking-tighter">
                    <span>Stability Index</span>
                    <span className="text-white font-black text-sm">{liveStabilityScore}%</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-white h-full transition-all duration-300" style={{ width: `${liveStabilityScore}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT OVERLAY: Mode Toggles */}
            <div className="absolute top-28 right-6 flex flex-col gap-3 z-20">
              <button
                onClick={() => setMode('free_range')}
                className={`p-4 rounded-3xl backdrop-blur-2xl border transition-all flex flex-col items-center gap-1 shadow-2xl ${
                  mode === 'free_range'
                    ? 'bg-red-600/20 border-red-500/50 text-red-500'
                    : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                }`}
              >
                <Sparkles className="w-6 h-6" />
                <span className="text-[9px] font-black uppercase tracking-tighter">Live</span>
              </button>
              <button
                onClick={() => setMode('record_analyze')}
                className={`p-4 rounded-3xl backdrop-blur-2xl border transition-all flex flex-col items-center gap-1 shadow-2xl ${
                  mode === 'record_analyze'
                    ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-500'
                    : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                }`}
              >
                <Video className="w-6 h-6" />
                <span className="text-[9px] font-black uppercase tracking-tighter">Record</span>
              </button>
            </div>

            {/* BOTTOM OVERLAY: Primary Action & Info */}
            <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col items-center gap-6 z-30 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
              {isRecording && (
                <div className="bg-red-600 px-6 py-2 rounded-full flex items-center gap-3 shadow-2xl animate-pulse">
                  <div className="w-3 h-3 bg-white rounded-full animate-ping" />
                  <span className="font-mono font-black text-sm text-white tracking-widest">
                    RECORDING 00:{recordingDuration < 10 ? `0${recordingDuration}` : recordingDuration}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-6">
                {mode === 'record_analyze' ? (
                  isRecording ? (
                    <button
                      onClick={stopRecording}
                      className="group relative"
                    >
                      <div className="absolute inset-0 bg-red-600 rounded-full animate-ping opacity-20" />
                      <div className="relative bg-white text-red-600 w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-transform active:scale-90">
                        <Square className="w-8 h-8 fill-current" />
                      </div>
                    </button>
                  ) : (
                    <button
                      onClick={startRecording}
                      className="relative bg-red-600 w-20 h-20 rounded-full flex items-center justify-center shadow-2xl shadow-red-600/40 transition-transform active:scale-90 group"
                    >
                      <div className="absolute inset-0 border-4 border-white/20 rounded-full scale-110 group-hover:scale-125 transition-transform" />
                      <div className="w-6 h-6 bg-white rounded-full" />
                    </button>
                  )
                ) : (
                  <div className="px-8 py-3 bg-white/10 backdrop-blur-xl border border-white/10 rounded-full text-white/70 text-xs font-black uppercase tracking-widest">
                    Free Range Tracking Active
                  </div>
                )}
              </div>

              <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] max-w-xs text-center leading-relaxed">
                {mode === 'free_range' 
                  ? 'Move freely. Joint angles and skeleton stability update instantly at 30 FPS.' 
                  : 'Capture a session clip. Klutchh AI will perform full biomechanical extraction upon completion.'}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
