import React, { useState, useEffect } from 'react';
import { SPORTS_RULES } from '../data/sportsRules';
import { SportId, AthleteCategory, SkillLevel, UserAccount } from '../types';
import { Flame, Shield, Target, BookOpen, LogIn, Gauge, TrendingUp, WifiOff, Wifi, Activity, Bookmark, Sparkles, ChevronsUp, ArrowUpRight, FolderOpen, Trophy } from 'lucide-react';
import { ArchitectureModal } from './ArchitectureModal';
import { ProfileModal } from './ProfileModal';

interface HeaderProps {
  selectedSportId: SportId;
  onSelectSport: (id: SportId) => void;
  athleteCategory: AthleteCategory;
  onChangeAthleteCategory: (cat: AthleteCategory) => void;
  skillLevel: SkillLevel;
  onChangeSkillLevel: (lvl: SkillLevel) => void;
  calibratedFps: number;
  onChangeCalibratedFps: (fps: number) => void;
  currentUser: UserAccount | null;
  onOpenAuth: () => void;
  savedReportsCount: number;
  onOpenSavedReports: () => void;
  onOpenCabinet: () => void;
  onOpenDashboard: () => void;
  analysisCount: number;
  maxAnalyses: number;
  onUpdateUser: (updated: UserAccount) => void;
  onLogout: () => void;
  onImportReport?: (data: any) => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedSportId,
  onSelectSport,
  athleteCategory,
  onChangeAthleteCategory,
  skillLevel,
  onChangeSkillLevel,
  calibratedFps,
  onChangeCalibratedFps,
  currentUser,
  onOpenAuth,
  savedReportsCount,
  onOpenSavedReports,
  onOpenCabinet,
  onOpenDashboard,
  analysisCount,
  maxAnalyses,
  onUpdateUser,
  onLogout,
  onImportReport,
}) => {
  const [isArchModalOpen, setIsArchModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    let lastY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // Scroll down past 100px: hide. Scroll up: show.
      if (currentScrollY > lastY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      lastY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const badgeEmojis: Record<string, string> = {
    shield: '🛡️',
    fire: '🔥',
    zap: '⚡',
    crown: '👑'
  };

  const getProfileEmoji = () => {
    if (!currentUser?.avatar) return '🛡️';
    const parts = currentUser.avatar.split(':');
    return badgeEmojis[parts[1]] || '🛡️';
  };

  return (
    <>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-scrolling {
          display: flex;
          width: max-content;
          animation: marquee 25s linear infinite;
        }
      `}</style>

      {!isOnline && (
        <div className="bg-amber-950/90 border-b border-amber-500/50 text-amber-200 text-xs font-bold py-1.5 px-4 text-center flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
          <span>Offline Mode Active — Viewing Cached Reports, Biomechanics & Drill Progress (Service Worker & Firestore Offline Engine)</span>
        </div>
      )}
      
      <header className={`bg-zinc-950/95 border-b border-zinc-800/80 text-zinc-100 sticky top-0 z-30 backdrop-blur-md shadow-2xl transition-transform duration-300 transform ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            
            {/* Logo & Brand Title */}
            <div className="flex items-center justify-between md:justify-start gap-3">
              <div className="flex items-center space-x-3">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-yellow-400 via-amber-500 to-red-600 rounded-xl blur-md opacity-60 group-hover:opacity-100 transition-opacity animate-pulse" />
                  <div className="relative bg-zinc-950 border border-zinc-800 p-2 rounded-xl flex items-center justify-center shrink-0">
                    <div className="flex items-center -space-x-1.5 bg-zinc-900/85 px-1.5 py-1 rounded-lg">
                      <TrendingUp className="w-4.5 h-4.5 text-red-500" />
                      <ChevronsUp className="w-4.5 h-4.5 text-yellow-400" />
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex flex-col">
                    <div className="flex items-baseline space-x-2">
                      <h1 className="text-2xl font-black tracking-tight uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-400 to-yellow-300">
                        Klutchh
                      </h1>
                      <span className="text-[9px] bg-red-600/10 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                        Interface Tech
                      </span>
                    </div>
                    <span className="text-[9px] font-bold text-zinc-400 flex items-center gap-1.5 leading-none mt-0.5">
                      <span>ENGINE:</span>
                      <span className="text-yellow-400 font-black tracking-wider flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5 text-yellow-400" /> KLUTCHH INTERFACE TECH
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mode Selector & Control Options */}
            <div className="flex flex-wrap items-center gap-2">
              
              {/* User Login/Profile Button */}
              {currentUser ? (
                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-yellow-500/30 text-zinc-200 font-bold text-xs px-3 py-2 sm:px-3.5 sm:py-2 rounded-xl flex items-center gap-2 transition-all shadow-md cursor-pointer"
                  title="Configure athlete profile & view subscription"
                >
                  <div className="w-5 h-5 rounded-lg bg-zinc-800 text-base flex items-center justify-center">
                    {getProfileEmoji()}
                  </div>
                  <span className="font-black text-yellow-400 hidden sm:inline">{currentUser.name}</span>
                  <span className="text-[9px] bg-zinc-850 px-1.5 py-0.5 rounded text-zinc-400 uppercase font-mono">{currentUser.role}</span>
                </button>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sign In</span>
                </button>
              )}

              {/* Saved Reports Library Button */}
              <button
                onClick={onOpenDashboard}
                className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold text-xs px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl flex items-center gap-1.5 transition-all"
                title="Historical Performance Dashboard"
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Progress</span>
              </button>

              <button
                onClick={onOpenSavedReports}
                className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold text-xs px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl flex items-center gap-1.5 transition-all"
                title="Library of Imported & Saved Biometric Reports"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Report Library</span>
                <span className="sm:hidden text-[10px]">Library</span>
              </button>

              <button
                onClick={onOpenCabinet}
                className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold text-xs px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl flex items-center gap-1.5 transition-all"
                title="Trophy Cabinet"
              >
                <Trophy className="w-3.5 h-3.5 text-red-500" />
                <span className="hidden sm:inline">Trophy Cabinet</span>
                <span className="sm:hidden text-[10px]">Cabinet</span>
              </button>

              <label
                className="bg-zinc-900 hover:bg-zinc-800 border border-amber-500/30 hover:border-amber-400 text-amber-300 font-extrabold text-xs px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                title="Open/Import an exported .klutchh report file stored on your device or Google Drive"
              >
                <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Open .klutchh Report</span>
                <span className="sm:hidden text-[10px]">Open .klutchh</span>
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

              {/* Monthly Analyses Used Badge */}
              <div 
                className="hidden sm:flex items-center bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs px-3 py-1.5 rounded-xl font-bold gap-1.5" 
                title={`Accounts receive 10 free video analyses per month (${analysisCount} used so far)`}
              >
                <Activity className="w-3.5 h-3.5 text-red-500" />
                <span>Analyses Used:</span>
                <span className={`font-mono font-black ${analysisCount >= maxAnalyses ? 'text-red-400' : 'text-amber-400'}`}>
                  {analysisCount}/{maxAnalyses} Free
                </span>
              </div>

              {/* FPS Calibration Selector */}
              <div
                className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1 gap-1 text-xs font-bold"
                title="FPS Calibration: Sets analysis sample rate & frame stepper resolution for high-speed or slo-mo clips"
              >
                <Gauge className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span className="text-[10px] text-zinc-400 uppercase font-mono hidden xl:inline">FPS Calib:</span>
                <select
                  value={calibratedFps}
                  onChange={(e) => onChangeCalibratedFps(Number(e.target.value))}
                  className="bg-zinc-900 text-red-400 font-extrabold focus:outline-none cursor-pointer text-xs"
                >
                  <option value={24}>24 FPS (Cinematic)</option>
                  <option value={30}>30 FPS (Standard Sports)</option>
                  <option value={60}>60 FPS (High-Speed Sport)</option>
                  <option value={120}>120 FPS (High Slo-Mo)</option>
                  <option value={240}>240 FPS (Ultra Slo-Mo)</option>
                </select>
              </div>

              <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1 gap-1 text-xs font-bold">
                <Target className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <select
                  value={skillLevel}
                  onChange={(e) => onChangeSkillLevel(e.target.value as SkillLevel)}
                  className="bg-zinc-900 text-amber-400 font-extrabold focus:outline-none cursor-pointer text-xs"
                >
                  <option value="grassroots">Grassroots Tier</option>
                  <option value="academy">Academy Tier</option>
                  <option value="elite_pro">Elite Pro Tier</option>
                </select>
              </div>
            </div>

          </div>
        </div>

        {/* Dynamic Biomechanical Telemetry scrolling ticker */}
        <div className="hidden sm:flex bg-zinc-950 border-t border-zinc-900 py-1.5 px-4 text-[9px] text-zinc-500 font-mono font-medium items-center gap-6 overflow-hidden">
          <div className="flex items-center gap-1.5 text-yellow-400 font-black uppercase shrink-0">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping shrink-0" />
            <span>[KLUTCHH INTERFACE TECH: ACTIVE]</span>
          </div>
          <div className="flex-1 overflow-hidden relative h-3.5 flex items-center">
            <div className="animate-marquee-scrolling flex gap-10 whitespace-nowrap">
              <span>• KLUTCHH INTEGRATED VERIFICATION KINETIC FEED: 320 JOINT ROTATION CHECKS CONSTANTLY PARSED</span>
              <span>• YOUR JOURNEY TO GREATNESS: UNLOCKING ELITE POTENTIAL ONE FRAME AT A TIME</span>
              <span>• MEDIAPIPE CORE SKINS: 33 THREE-DIMENSIONAL COORDINATES AUTOMATICALLY RESOLVED</span>
              <span>• ACTIVE DIFFICULTY CHECK: {skillLevel === 'elite_pro' ? 'ELITE PROFESSIONAL TIER (STRICTEST ERROR BOUNDS)' : skillLevel === 'academy' ? 'ACADEMY TIER (OPTIMIZED GAP)' : 'GRASSROOTS RECREATIONAL FORMULA'}</span>
              <span>• LIVE CORES: ANGULAR MOMENTUM, DECELERATION TORQUE, JOINT FORCE VECTOR INDEX</span>
              <span>• PERSONAL STORAGE SYNC: SECURELY MANAGED VIA YOUR PERSONAL CLOUD CONNECTOR</span>
              <span>• KLUTCHH INTEGRATED VERIFICATION KINETIC FEED: 320 JOINT ROTATION CHECKS CONSTANTLY PARSED</span>
              <span>• YOUR JOURNEY TO GREATNESS: UNLOCKING ELITE POTENTIAL ONE FRAME AT A TIME</span>
            </div>
          </div>
        </div>

      </header>

      {/* Profile Settings Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onUpdateUser={onUpdateUser}
        onLogout={onLogout}
        analysisCount={analysisCount}
        maxAnalyses={maxAnalyses}
      />

      {/* Zero-Cost Architecture Modal */}
      <ArchitectureModal
        isOpen={isArchModalOpen}
        onClose={() => setIsArchModalOpen(false)}
      />
    </>
  );
};
