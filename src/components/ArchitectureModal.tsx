import React, { useState } from 'react';
import { copyToClipboard } from '../utils/platform';
import {
  X,
  Cpu,
  Smartphone,
  Zap,
  ServerOff,
  Code2,
  Check,
  Copy,
  Boxes,
  ShieldCheck,
  Layers,
  Activity
} from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [copiedCmds, setCopiedCmds] = useState(false);

  if (!isOpen) return null;

  const capacitorConfig = `{
  "appId": "com.klutchh.biomechanics",
  "appName": "Klutchh Biometrics",
  "webDir": "dist",
  "server": {
    "androidScheme": "https"
  },
  "plugins": {
    "Camera": {
      "permissions": ["camera"]
    }
  }
}`;

  const capacitorCmds = `# 1. Install Capacitor Core & CLI
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android

# 2. Initialize Capacitor Project
npx cap init "Klutchh Biometrics" "com.klutchh.biomechanics" --web-dir dist

# 3. Build Web Bundle
npm run build

# 4. Add iOS & Android Native Platforms
npx cap add ios
npx cap add android

# 5. Open in Xcode / Android Studio
npx cap open ios
npx cap open android`;

  const handleCopy = (text: string, setCopied: (v: boolean) => void) => {
    copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative my-8 text-zinc-100 flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-600/20 text-red-500 p-2.5 rounded-xl border border-red-500/30">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                  Local Processing Pipeline
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                  30 FPS • 200 Rules Engine
                </span>
              </div>
              <h2 className="text-xl font-black uppercase italic tracking-wide text-white mt-1">
                Local Pipeline & Skeleton Estimation Architecture
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2 hover:bg-zinc-800 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Pillar 1: WebCodecs + MP4Box.js Native GPU Pipeline */}
          <div className="bg-zinc-950/90 border border-amber-500/40 p-4 rounded-xl flex flex-col gap-2.5 shadow-lg shadow-amber-500/5">
            <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs uppercase tracking-wider">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>WebCodecs + MP4Box GPU Engine</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Bypasses the HTML5 &lt;video&gt; player completely. MP4Box.js demuxes the MP4 container into raw NAL units, and VideoDecoder decodes H.264/HEVC directly on GPU hardware.
            </p>
            <ul className="text-[11px] text-zinc-400 flex flex-col gap-1 list-disc list-inside mt-1 font-mono">
              <li>Direct GPU Hardware Decoding</li>
              <li>Zero Seeking Lag & Snap Free</li>
              <li>Exact Microsecond Timestamps</li>
            </ul>
          </div>

          {/* Pillar 2: Local 30 FPS Inference */}
          <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-xl flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs uppercase tracking-wider">
              <Boxes className="w-4 h-4 text-red-500" />
              <span>Local Pipeline (30 FPS)</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Both Live Camera feeds and Uploaded Videos are dispatched to the local processing pipeline, decoded frame-by-frame at 30 FPS, and processed through MediaPipe BlazePose to calculate 33 keypoint 3D spatial vectors.
            </p>
            <ul className="text-[11px] text-zinc-400 flex flex-col gap-1 list-disc list-inside mt-1 font-mono">
              <li>30 FPS frame-rate synchronization</li>
              <li>33 3D joint landmark extraction</li>
              <li>200 Biomechanical rule evaluation</li>
            </ul>
          </div>

          {/* Pillar 3: Live & Upload Dual Integration */}
          <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-xl flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs uppercase tracking-wider">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Live & Upload Stream Processing</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Real-time video input from webcams and native smartphone cameras, or pre-recorded MP4/MOV clips, undergo identical 30 FPS skeletal keypoint extraction and instant rule analysis.
            </p>
            <ul className="text-[11px] text-zinc-400 flex flex-col gap-1 list-disc list-inside mt-1 font-mono">
              <li>Unified stream processing model</li>
              <li>Sub-second feedback loops</li>
              <li>Automated keyframe bookmarking</li>
            </ul>
          </div>

        </div>

        {/* Capacitor Integration Code Snippet */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-yellow-400" />
              Capacitor Native Configuration (<code className="font-mono text-yellow-400">capacitor.config.json</code>)
            </h3>
            <button
              onClick={() => handleCopy(capacitorConfig, setCopiedConfig)}
              className="text-xs font-bold bg-zinc-800 hover:bg-zinc-700 px-3 py-1 rounded-lg text-zinc-300 flex items-center gap-1.5 transition-all"
            >
              {copiedConfig ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedConfig ? 'Copied Config!' : 'Copy Config'}</span>
            </button>
          </div>

          <pre className="bg-black/90 border border-zinc-800/90 rounded-xl p-3.5 text-xs text-emerald-400 font-mono overflow-x-auto leading-relaxed">
            {capacitorConfig}
          </pre>
        </div>

        {/* Native CLI Commands */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-red-500" />
              Capacitor CLI Wrap Commands
            </h3>
            <button
              onClick={() => handleCopy(capacitorCmds, setCopiedCmds)}
              className="text-xs font-bold bg-zinc-800 hover:bg-zinc-700 px-3 py-1 rounded-lg text-zinc-300 flex items-center gap-1.5 transition-all"
            >
              {copiedCmds ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCmds ? 'Copied Commands!' : 'Copy Commands'}</span>
            </button>
          </div>

          <pre className="bg-black/90 border border-zinc-800/90 rounded-xl p-3.5 text-xs text-yellow-300 font-mono overflow-x-auto leading-relaxed">
            {capacitorCmds}
          </pre>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>PWA Manifest & Service Worker Active</span>
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-500 text-white font-black px-6 py-2 rounded-xl uppercase tracking-wider transition-all"
          >
            Close & Continue Analysis
          </button>
        </div>

      </div>
    </div>
  );
};
