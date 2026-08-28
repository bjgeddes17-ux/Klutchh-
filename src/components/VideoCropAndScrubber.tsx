import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Check, Scissors, Clock } from 'lucide-react';

interface VideoCropAndScrubberProps {
  videoUrl: string;
  onAnalyze: (startTime: number, endTime: number, cropBox?: { x: number; y: number; width: number; height: number }) => void;
  onCancel: () => void;
}

export const VideoCropAndScrubber: React.FC<VideoCropAndScrubberProps> = ({
  videoUrl,
  onAnalyze,
  onCancel,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoAspect, setVideoAspect] = useState<number>(16 / 9);

  // Video time trimming (Start & End time)
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);

  const [cropBox, setCropBox] = useState<{ x: number; y: number; width: number; height: number } | undefined>(undefined);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleCropStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    setIsDragging(true);
    setDragStart({ x, y });
    setCropBox({ x, y, width: 0, height: 0 });
  };

  const handleCropMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    let currentX = (clientX - rect.left) / rect.width;
    let currentY = (clientY - rect.top) / rect.height;
    
    // clamp
    currentX = Math.max(0, Math.min(1, currentX));
    currentY = Math.max(0, Math.min(1, currentY));

    setCropBox({
      x: Math.min(dragStart.x, currentX),
      y: Math.min(dragStart.y, currentY),
      width: Math.abs(currentX - dragStart.x),
      height: Math.abs(currentY - dragStart.y),
    });
  };

  const handleCropEnd = () => {
    setIsDragging(false);
    if (cropBox && (cropBox.width < 0.05 || cropBox.height < 0.05)) {
      setCropBox(undefined);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      const dur = video.duration || 5;
      setDuration(dur);
      setEndTime(dur);
      if (video.videoWidth && video.videoHeight) {
        setVideoAspect(video.videoWidth / video.videoHeight);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.currentTime >= endTime) {
        video.currentTime = startTime;
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [videoUrl, endTime, startTime]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      if (video.currentTime < startTime || video.currentTime >= endTime) {
        video.currentTime = startTime;
      }
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const handleConfirmAnalysis = () => {
    onAnalyze(startTime, endTime, cropBox);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl animate-fadeIn">
      
      {/* Header instructions */}
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-600/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider mb-2">
          <Scissors className="w-3.5 h-3.5" /> Video Pre-Processing & Multi-Person Suite
        </div>
        <h2 className="text-2xl font-black text-white uppercase tracking-tight">
          Isolate Movement & Target Athlete
        </h2>
        <p className="text-xs text-zinc-400 max-w-xl mx-auto mt-1">
          Trim the video to focus on the movement execution.
        </p>
      </div>

      {/* Native Aspect Ratio Video Container with Grid Overlay */}
      <div
        ref={containerRef}
        className="relative w-full max-h-[56vh] bg-black rounded-2xl overflow-hidden border-2 border-zinc-700 shadow-2xl select-none flex items-center justify-center mb-5 mx-auto cursor-crosshair touch-none"
        style={{ aspectRatio: videoAspect }}
        onMouseDown={handleCropStart}
        onMouseMove={handleCropMove}
        onMouseUp={handleCropEnd}
        onMouseLeave={handleCropEnd}
        onTouchStart={handleCropStart}
        onTouchMove={handleCropMove}
        onTouchEnd={handleCropEnd}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          playsInline
          muted
          className="w-full h-full object-fill pointer-events-none"
        />

        {/* Multi-Person Grid Column Guides (3-column view) */}
        <div className="absolute inset-0 pointer-events-none grid grid-cols-3">
          <div className="border-r border-dashed border-white/20 flex items-start justify-start p-2">
            <span className="bg-black/70 text-zinc-300 font-mono text-[9px] px-1.5 py-0.5 rounded border border-white/10 uppercase">Left Zone</span>
          </div>
          <div className="border-r border-dashed border-white/25 flex items-start justify-center p-2">
            <span className="bg-black/70 text-zinc-300 font-mono text-[9px] px-1.5 py-0.5 rounded border border-white/10 uppercase">Center Zone</span>
          </div>
          <div className="flex items-start justify-end p-2">
            <span className="bg-black/70 text-zinc-300 font-mono text-[9px] px-1.5 py-0.5 rounded border border-white/10 uppercase">Right Zone</span>
          </div>
        </div>

        {/* Spatial Crop Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {cropBox ? (
            <div 
              className="absolute border-2 border-amber-400 bg-amber-400/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] transition-all"
              style={{
                left: `${cropBox.x * 100}%`,
                top: `${cropBox.y * 100}%`,
                width: `${cropBox.width * 100}%`,
                height: `${cropBox.height * 100}%`
              }}
            >
              <div className="absolute top-1 left-1 bg-amber-400 text-zinc-950 font-black text-[10px] px-1.5 py-0.5 rounded shadow">ACTIVE CROP AREA</div>
            </div>
          ) : (
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 pointer-events-none">
              <div className="bg-black/75 px-4 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-2 backdrop-blur-md border border-zinc-700 shadow-xl">
                <Scissors className="w-4 h-4 text-emerald-400" />
                Select grid zone below or drag-to-crop athlete movement
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scrubber & Video Length Trimming Bar */}
      <div className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-3 mb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={togglePlay}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all shadow"
          >
            {isPlaying ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
            {isPlaying ? 'Pause Preview' : 'Play Segment'}
          </button>

          <div className="text-xs font-mono text-zinc-400 flex items-center gap-3">
            <span className="text-white font-bold bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-800">
              Current: {currentTime.toFixed(2)}s
            </span>
            <span>Duration: {duration.toFixed(2)}s</span>
          </div>
        </div>

        {/* Timeline Range Scrubber */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[10px] font-mono text-zinc-400 px-1">
            <span>Playhead Scrubber</span>
            <span>{((currentTime / (duration || 1)) * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min={startTime}
            max={endTime}
            step={0.02}
            value={currentTime}
            onChange={handleSeek}
            className="w-full accent-emerald-500 bg-zinc-800 h-2 rounded-lg cursor-pointer"
          />
        </div>

        {/* Video Length Trimming Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-zinc-800/80">
          <div className="flex items-center gap-3 bg-zinc-900/90 p-2.5 rounded-xl border border-zinc-800">
            <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="flex-1 flex flex-col">
              <div className="flex justify-between text-xs font-medium text-zinc-300">
                <span>Start Trim:</span>
                <span className="font-mono text-emerald-400 font-bold">{startTime.toFixed(2)}s</span>
              </div>
              <input
                type="range"
                min={0}
                max={endTime - 0.5}
                step={0.05}
                value={startTime}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setStartTime(val);
                  if (currentTime < val) {
                    setCurrentTime(val);
                    if (videoRef.current) videoRef.current.currentTime = val;
                  }
                }}
                className="w-full accent-emerald-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer mt-1"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 bg-zinc-900/90 p-2.5 rounded-xl border border-zinc-800">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="flex-1 flex flex-col">
              <div className="flex justify-between text-xs font-medium text-zinc-300">
                <span>End Trim:</span>
                <span className="font-mono text-amber-400 font-bold">{endTime.toFixed(2)}s</span>
              </div>
              <input
                type="range"
                min={startTime + 0.5}
                max={duration || 5}
                step={0.05}
                value={endTime}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setEndTime(val);
                  if (currentTime > val) {
                    setCurrentTime(val);
                    if (videoRef.current) videoRef.current.currentTime = val;
                  }
                }}
                className="w-full accent-amber-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer mt-1"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between w-full">
        <button
          onClick={onCancel}
          className="px-5 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
        >
          Cancel & Re-upload
        </button>

        <button
          onClick={handleConfirmAnalysis}
          className="px-8 py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-2xl flex items-center gap-2 transform hover:scale-105 transition-all"
        >
          <Check className="w-4 h-4" /> Confirm & Analyze Video
        </button>
      </div>

    </div>
  );
};
