import React from 'react';
import { SPORTS_RULES } from '../data/sportsRules';
import { SportId } from '../types';
import { Trophy, Target, Camera, Upload, CheckCircle2, ArrowRight } from 'lucide-react';

interface SportMovementSelectorProps {
  selectedSportId: SportId;
  onSelectSport: (id: SportId) => void;
  selectedMovementPhase: string;
  onSelectMovementPhase: (phase: string) => void;
  activeMode: 'upload' | 'camera';
  onChangeMode: (mode: 'upload' | 'camera') => void;
  hasUploadedVideo: boolean;
  onTriggerUpload?: () => void;
}

export const SportMovementSelector: React.FC<SportMovementSelectorProps> = ({
  selectedSportId,
  onSelectSport,
  selectedMovementPhase,
  onSelectMovementPhase,
  activeMode,
  onChangeMode,
  hasUploadedVideo,
  onTriggerUpload
}) => {
  const currentSport = SPORTS_RULES.find((s) => s.id === selectedSportId) || SPORTS_RULES[0];
  const isMovementSelected = selectedMovementPhase && selectedMovementPhase !== 'Auto-Detect';

  return (
    <div className="bg-zinc-950/90 border border-zinc-800/80 rounded-2xl p-5 shadow-2xl backdrop-blur-md flex flex-col gap-4">
      
      {/* Workflow Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-red-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded uppercase tracking-wider">
              Step 1 & 2 Setup
            </span>
            <h2 className="text-base font-black text-white uppercase italic tracking-tight">
              Select Sport & Biometric Technique
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5 font-medium">
            Choose your target sport discipline and specific movement phase to load biometric joint rules.
          </p>
        </div>

        {/* Active Selection Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <div className={`px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-2 ${
            isMovementSelected
              ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
              : 'bg-amber-950/80 border-amber-500/60 text-amber-300'
          }`}>
            <CheckCircle2 className={`w-4 h-4 ${isMovementSelected ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span>
              {isMovementSelected
                ? `${currentSport.name} • ${selectedMovementPhase}`
                : `Target Technique for ${currentSport.name}`}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: 3 Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* STEP 1: SPORT */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3.5 flex flex-col gap-2.5">
          <div className="flex items-center gap-2 text-xs font-black uppercase text-amber-400 tracking-wider">
            <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center text-[10px] border border-amber-400/40">1</span>
            <Trophy className="w-4 h-4" />
            <span>Target Sport</span>
          </div>

          <div className="grid grid-cols-1 gap-1.5">
            {SPORTS_RULES.map((sport) => {
              const isSelected = sport.id === selectedSportId;
              return (
                <button
                  key={sport.id}
                  onClick={() => {
                    onSelectSport(sport.id);
                    if (sport.phases.length > 0) {
                      onSelectMovementPhase(sport.phases[0]);
                    }
                  }}
                  className={`px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-between border transition-all text-left ${
                    isSelected
                      ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-600/20'
                      : 'bg-zinc-950/80 text-zinc-300 hover:bg-zinc-800 border-zinc-800/80'
                  }`}
                >
                  <span className="truncate">{sport.name}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    isSelected ? 'bg-red-700 text-amber-300' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {sport.jointRules.length} Rules
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* STEP 2: MOVEMENT / TECHNIQUE */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3.5 flex flex-col gap-2.5">
          <div className="flex items-center gap-2 text-xs font-black uppercase text-amber-400 tracking-wider">
            <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center text-[10px] border border-amber-400/40">2</span>
            <Target className="w-4 h-4" />
            <span>Movement Phase</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="text-[11px] text-zinc-400 italic mb-0.5">
              {currentSport.name} Phases:
            </p>
            {currentSport.phases.map((phase) => {
              const isSelected = selectedMovementPhase === phase;
              return (
                <button
                  key={phase}
                  onClick={() => onSelectMovementPhase(phase)}
                  className={`px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-between border transition-all ${
                    isSelected
                      ? 'bg-amber-400 text-zinc-950 border-amber-300 shadow-md shadow-amber-400/20'
                      : 'bg-zinc-950/80 text-zinc-300 hover:bg-zinc-800 border-zinc-800/80'
                  }`}
                >
                  <span>{phase}</span>
                  {isSelected && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              );
            })}

            <button
              onClick={() => onSelectMovementPhase('Auto-Detect')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold uppercase tracking-wider border transition-all mt-1 ${
                selectedMovementPhase === 'Auto-Detect'
                  ? 'bg-zinc-800 text-amber-400 border-amber-400/50'
                  : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border-zinc-800/80'
              }`}
            >
              ⚡ Auto-Detect Movement
            </button>
          </div>
        </div>

        {/* STEP 3: LIVE CAM OR UPLOAD */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3.5 flex flex-col gap-2.5">
          <div className="flex items-center gap-2 text-xs font-black uppercase text-amber-400 tracking-wider">
            <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center text-[10px] border border-amber-400/40">3</span>
            <Camera className="w-4 h-4" />
            <span>Analysis Source</span>
          </div>

          <div className="flex flex-col gap-2.5 h-full justify-center">
            {/* Live Camera Button */}
            <button
              onClick={() => onChangeMode('camera')}
              className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                activeMode === 'camera'
                  ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/30'
                  : 'bg-zinc-950/80 border-zinc-800/80 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              <div className="flex items-center gap-2.5 text-left">
                <div className="bg-zinc-900 p-2 rounded-lg text-amber-400">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider">Live Camera Stream</div>
                  <div className="text-[10px] text-zinc-400">30 FPS Real-Time MediaPipe</div>
                </div>
              </div>
              {activeMode === 'camera' && <CheckCircle2 className="w-5 h-5 text-amber-400" />}
            </button>

            {/* Video Upload Button */}
            <button
              onClick={() => {
                onChangeMode('upload');
                if (onTriggerUpload) onTriggerUpload();
              }}
              className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                activeMode === 'upload'
                  ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/30'
                  : 'bg-zinc-950/80 border-zinc-800/80 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              <div className="flex items-center gap-2.5 text-left">
                <div className="bg-zinc-900 p-2 rounded-lg text-amber-400">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider">Upload Video Clip</div>
                  <div className="text-[10px] text-zinc-400">
                    {hasUploadedVideo ? 'Video Clip Ready' : 'Max 30s Clip • MP4 / MOV'}
                  </div>
                </div>
              </div>
              {activeMode === 'upload' && hasUploadedVideo && <CheckCircle2 className="w-5 h-5 text-amber-400" />}
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
