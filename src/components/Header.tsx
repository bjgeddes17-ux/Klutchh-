import React, { useState, useEffect } from 'react';
import { SportId, SkillLevel, UserAccount, AthleteCategory } from '../types';
import { LogOut, User, Book, FileText, BookOpen, LogIn, WifiOff } from 'lucide-react';

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
  onOpenDrillsLibrary?: () => void;
  analysisCount: number;
  maxAnalyses: number;
  onUpdateUser: (updated: UserAccount) => void;
  onLogout: () => void;
  onImportReport?: (data: any) => void;
  viewMode: 'workspace' | 'crop_and_scrub' | 'processing' | 'full_report' | 'progress';
  onViewChange: (mode: 'workspace' | 'crop_and_scrub' | 'processing' | 'full_report' | 'progress') => void;
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
  onOpenDrillsLibrary,
  onLogout,
  viewMode,
  onViewChange
}) => {
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      {!isOnline && (
        <div className="bg-amber-950/90 border-b border-amber-500/50 text-amber-200 text-xs font-black py-1.5 px-4 text-center flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
          <span>Offline Mode Active</span>
        </div>
      )}
      
      <header className="bg-zinc-950 border-b border-zinc-900 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-4 group cursor-pointer" onClick={() => onViewChange('workspace')}>
              <div className="relative">
                <img 
                  src="/src/assets/images/klutchh_ultra_stylized_logo_1788069083135.jpg" 
                  alt="Klutchh Icon" 
                  className="w-12 h-12 rounded-2xl object-cover border border-zinc-800 shadow-2xl group-hover:scale-105 transition-all duration-500"
                />
                <div className="absolute -inset-1 bg-yellow-500/20 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-3xl font-black italic tracking-[-0.08em] uppercase text-white leading-none flex items-center">
                  KLUTCHH<span className="text-yellow-500 ml-0.5">.</span>
                </h1>
                <div className="flex items-center gap-1 mt-1">
                  <div className="h-[2px] w-4 bg-yellow-500" />
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em] leading-none">Biometrics</span>
                </div>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              <button 
                onClick={() => onViewChange('workspace')}
                className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                  viewMode === 'workspace' 
                    ? 'bg-zinc-900 text-red-500 border border-red-500/30' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Workspace
              </button>
              <button 
                onClick={() => onViewChange('progress')}
                className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                  viewMode === 'progress' 
                    ? 'bg-zinc-900 text-red-500 border border-red-500/30' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Dashboard
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
              <div className="flex items-center gap-1 px-2 border-r border-zinc-800">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter">FPS</span>
                <select 
                  value={calibratedFps}
                  onChange={(e) => onChangeCalibratedFps?.(Number(e.target.value))}
                  className="bg-transparent text-[10px] font-black text-red-400 outline-none cursor-pointer"
                >
                  <option value={30}>30</option>
                  <option value={60}>60</option>
                  <option value={120}>120</option>
                  <option value={240}>240</option>
                </select>
              </div>
              <div className="flex items-center gap-1 px-2">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter">LVL</span>
                <select 
                  value={skillLevel}
                  onChange={(e) => onChangeSkillLevel?.(e.target.value as any)}
                  className="bg-transparent text-[10px] font-black text-amber-400 outline-none cursor-pointer"
                >
                  <option value="beginner">BEG</option>
                  <option value="intermediate">INT</option>
                  <option value="pro">PRO</option>
                </select>
              </div>
            </div>

            <button 
              onClick={onOpenDrillsLibrary}
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-[10px] font-black uppercase text-zinc-300 transition-all"
            >
              <BookOpen className="w-3 h-3 text-red-500" />
              <span className="hidden sm:inline">Drills</span>
            </button>

            <div className="h-6 w-[1px] bg-zinc-800 mx-1 hidden sm:block" />

            {currentUser ? (
              <div className="flex items-center gap-3">
                <button 
                  onClick={onOpenCabinet}
                  className="relative p-2 text-zinc-400 hover:text-white transition-all"
                >
                  <FileText className="w-5 h-5" />
                  {savedReportsCount > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-zinc-950">
                      {savedReportsCount}
                    </span>
                  )}
                </button>
                <div className="flex flex-col items-end leading-none">
                  <span className="text-xs font-black text-white uppercase italic">{currentUser.name}</span>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">Premium Access</span>
                </div>
                <button 
                  onClick={onLogout}
                  className="p-2 text-zinc-500 hover:text-red-500 transition-all"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={onOpenAuth}
                className="flex items-center gap-2 px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-wider rounded-lg shadow-lg shadow-red-600/20 transition-all active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>
    </>
  );
};
