import React, { useRef, useState } from 'react';
import { Upload, Film, CheckCircle2, AlertCircle } from 'lucide-react';

interface VideoUploaderProps {
  onVideoSelected: (url: string, file?: File) => void;
  customVideoUrl: string | null;
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({ onVideoSelected, customVideoUrl }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const processVideoFile = (file: File) => {
    setFileError(null);
    if (!file.type.startsWith('video/')) {
      setFileError('Please select a valid video file (MP4, MOV, WebM, AVI).');
      return;
    }

    const url = URL.createObjectURL(file);
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = url;
    tempVideo.load();

    tempVideo.onloadedmetadata = () => {
      if (tempVideo.duration > 30.5) {
        setFileError(`Selected video is ${Math.round(tempVideo.duration)}s long. Maximum allowed video length is 30 seconds for standard analysis.`);
        URL.revokeObjectURL(url);
        
        // Cleanup
        tempVideo.onloadedmetadata = null;
        tempVideo.onerror = null;
        tempVideo.src = '';
        tempVideo.load();
        return;
      }
      setFileName(file.name);
      onVideoSelected(url, file);
      
      // Cleanup
      tempVideo.onloadedmetadata = null;
      tempVideo.onerror = null;
    };

    tempVideo.onerror = () => {
      setFileError('The selected video format is not supported by your browser. Please try an MP4 or WebM file.');
      URL.revokeObjectURL(url);
      
      // Cleanup
      tempVideo.onloadedmetadata = null;
      tempVideo.onerror = null;
      tempVideo.src = '';
      tempVideo.load();
    };
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
    <div className="flex flex-col gap-5">
      {/* Primary Upload Dropzone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="bg-zinc-950 border-2 border-dashed border-red-900/60 hover:border-red-500 rounded-2xl p-8 shadow-2xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-4 group"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="video/*"
          className="hidden"
        />

        <div className="bg-gradient-to-tr from-red-600 to-yellow-500 p-4 rounded-2xl text-zinc-950 font-black group-hover:scale-110 transition-transform shadow-lg shadow-red-600/30">
          <Upload className="w-8 h-8 stroke-[3]" />
        </div>

        <div>
          <h3 className="text-base font-black text-white uppercase tracking-wider">
            {customVideoUrl ? `Loaded: ${fileName || 'Custom Athlete Video'}` : 'Upload Klutchh Athlete Video'}
          </h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
            Drag & drop any athlete video clip (MP4, WebM, MOV up to 30s) or <span className="text-yellow-400 font-bold underline">browse files</span>. Pose detection & biometrics will process automatically.
          </p>
        </div>

        {fileError && (
          <div className="bg-red-950/80 border border-red-500 text-red-300 text-xs px-4 py-2 rounded-xl flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{fileError}</span>
          </div>
        )}

        {customVideoUrl && !fileError && (
          <div className="bg-yellow-400/10 border border-yellow-400/40 text-yellow-300 text-xs px-4 py-2 rounded-xl flex items-center gap-2 font-black shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-yellow-400" />
            <div className="flex flex-col">
              <span>Video Loaded • MediaPipe Skeleton Analysis Ready</span>
              <span className="text-amber-500/80 text-[9px] italic">Longer clips (&gt;10s) require 3-5 mins processing.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

