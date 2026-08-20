import React, { useState } from 'react';
import { UserAccount } from '../types';
import { X, User, Shield, Briefcase, Trophy, LogIn, LogOut, Check, Save, Sparkles } from 'lucide-react';
import { updateUserProfileInFirestore } from '../lib/firebase';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  onUpdateUser: (updated: UserAccount) => void;
  onLogout: () => void;
  analysisCount: number;
  maxAnalyses: number;
}

const BADGE_OPTIONS = [
  { id: 'shield', name: 'Defender/Shield', color: 'from-blue-600 to-indigo-500', emoji: '🛡️' },
  { id: 'fire', name: 'Striker/Fire', color: 'from-red-600 to-amber-500', emoji: '🔥' },
  { id: 'zap', name: 'Speed/Lightning', color: 'from-yellow-500 to-amber-400', emoji: '⚡' },
  { id: 'crown', name: 'Elite/Crown', color: 'from-purple-600 to-pink-500', emoji: '👑' },
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  onLogout,
  analysisCount,
  maxAnalyses,
}) => {
  const [name, setName] = useState(currentUser?.name || '');
  const [role, setRole] = useState<'Coach' | 'Athlete' | 'Parent'>(currentUser?.role || 'Athlete');
  const [clubOrSchool, setClubOrSchool] = useState(currentUser?.clubOrSchool || '');
  const [selectedBadge, setSelectedBadge] = useState(() => {
    // Determine badge from avatar if matches, default to shield
    const found = BADGE_OPTIONS.find(b => currentUser?.avatar?.includes(b.id));
    return found ? found.id : 'shield';
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen || !currentUser) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    setSuccessMsg('');

    try {
      // Create modern avatar URL based on selected badge
      const avatarUrl = `badge:${selectedBadge}`;
      
      const updatedAccount: UserAccount = {
        ...currentUser,
        name: name.trim(),
        role: role,
        clubOrSchool: clubOrSchool.trim() || 'Klutchh Academy',
        avatar: avatarUrl
      };

      // Sync to Firestore
      await updateUserProfileInFirestore(currentUser.id, {
        name: updatedAccount.name,
        role: updatedAccount.role,
        clubOrSchool: updatedAccount.clubOrSchool
      });

      // Update parent state
      onUpdateUser(updatedAccount);
      
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const currentBadge = BADGE_OPTIONS.find(b => b.id === selectedBadge) || BADGE_OPTIONS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-zinc-100 flex flex-col gap-5">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 p-1.5 rounded-full transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${currentBadge.color} flex items-center justify-center text-xl shadow-lg shadow-black/40 shrink-0`}>
            {currentBadge.emoji}
          </div>
          <div>
            <h2 className="text-base font-black uppercase tracking-wider text-white">
              Athlete Profile Settings
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              Account ID: {currentUser.id.substring(0, 10)}...
            </p>
          </div>
        </div>

        {/* Profile Content */}
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          
          {/* User Account Details */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
              Connected Email Address
            </label>
            <div className="bg-zinc-950/80 border border-zinc-850 px-3.5 py-2.5 rounded-xl text-xs text-zinc-400 font-mono">
              {currentUser.email}
            </div>
          </div>

          {/* Name Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Coach Vance"
              required
              className="bg-zinc-950 border border-zinc-800 focus:border-red-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500 transition-all font-bold"
            />
          </div>

          {/* Role Choice */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
              Athletic Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Coach', 'Athlete', 'Parent'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`border py-2 px-1 rounded-xl text-xs font-bold uppercase transition-all ${
                    role === r
                      ? 'bg-red-600/10 border-red-500 text-red-400 shadow-md'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Club / School Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
              Club / School affiliation
            </label>
            <input
              type="text"
              value={clubOrSchool}
              onChange={(e) => setClubOrSchool(e.target.value)}
              placeholder="e.g. St. Jude Academy Rugby"
              className="bg-zinc-950 border border-zinc-800 focus:border-red-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500 transition-all font-semibold"
            />
          </div>

          {/* Badge selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
              Biomechanical Profile Badge
            </label>
            <div className="grid grid-cols-4 gap-2">
              {BADGE_OPTIONS.map((badge) => (
                <button
                  key={badge.id}
                  type="button"
                  onClick={() => setSelectedBadge(badge.id)}
                  className={`relative p-2 rounded-xl bg-zinc-950 border flex flex-col items-center justify-center gap-1 group transition-all ${
                    selectedBadge === badge.id
                      ? 'border-yellow-400/80 bg-zinc-900 shadow-lg shadow-yellow-400/5'
                      : 'border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${badge.color} flex items-center justify-center text-base shadow-sm group-hover:scale-105 transition-transform`}>
                    {badge.emoji}
                  </div>
                  <span className="text-[8px] font-bold text-zinc-400 text-center truncate w-full">
                    {badge.id.toUpperCase()}
                  </span>
                  {selectedBadge === badge.id && (
                    <div className="absolute -top-1 -right-1 bg-yellow-400 text-zinc-950 p-0.5 rounded-full">
                      <Check className="w-2 h-2 stroke-[4]" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Usage limit bar */}
          <div className="bg-zinc-950/80 border border-zinc-850 rounded-xl p-3 flex flex-col gap-2">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-zinc-400">
              <span>Klutchh Cloud Storage Usage</span>
              <span className="font-mono text-zinc-300">
                {analysisCount} / {maxAnalyses} clips
              </span>
            </div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-red-600 to-amber-500 h-full transition-all duration-500" 
                style={{ width: `${Math.min(100, (analysisCount / maxAnalyses) * 100)}%` }}
              />
            </div>
            <span className="text-[9px] text-zinc-500 leading-tight">
              Premium tier allows unlimited local caching and up to {maxAnalyses} durable cloud biomechanical records.
            </span>
          </div>

          {/* Success / Action buttons */}
          {successMsg && (
            <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs py-2 px-3.5 rounded-xl font-bold flex items-center gap-1.5 justify-center animate-fade-in">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="flex gap-2.5 mt-2">
            <button
              type="button"
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="bg-zinc-950 hover:bg-red-950/30 hover:text-red-400 border border-zinc-800 hover:border-red-500/30 text-zinc-400 font-bold text-xs px-4 py-2.5 rounded-xl uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-zinc-950 font-black text-xs py-2.5 rounded-xl uppercase tracking-wider shadow-lg shadow-yellow-400/10 flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
