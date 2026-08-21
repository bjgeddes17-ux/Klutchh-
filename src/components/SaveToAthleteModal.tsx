import React, { useState, useEffect } from 'react';
import { AthleteProfile, SavedReport, SportId, AthleteCategory } from '../types';
import { getCoachAthletes, saveCoachAthlete, formatAthleteFolderName } from '../utils/rosterStorage';
import {
  FolderPlus,
  Folder,
  UserCheck,
  Plus,
  Save,
  CheckCircle2,
  X,
  Share2,
  Download,
  Info,
  ShieldCheck
} from 'lucide-react';

interface SaveToAthleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSave: (athlete: { id: string; name: string; folderName: string }) => void;
  sportId: SportId;
  defaultAthleteCategory?: AthleteCategory;
  currentTitle: string;
}

export const SaveToAthleteModal: React.FC<SaveToAthleteModalProps> = ({
  isOpen,
  onClose,
  onConfirmSave,
  sportId,
  defaultAthleteCategory = 'middle_school',
  currentTitle
}) => {
  const [athletes, setAthletes] = useState<AthleteProfile[]>([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newAthleteName, setNewAthleteName] = useState('');
  const [newAthleteCategory, setNewAthleteCategory] = useState<AthleteCategory>(defaultAthleteCategory);
  const [newAthleteJersey, setNewAthleteJersey] = useState('');

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      getCoachAthletes().then((list) => {
        setAthletes(list);
        if (list.length > 0) {
          setSelectedAthleteId(list[0].id);
        } else {
          setIsCreatingNew(true);
        }
        setIsLoading(false);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    let athleteName = '';
    let athleteId = '';

    if (isCreatingNew || athletes.length === 0) {
      if (!newAthleteName.trim()) {
        alert('Please enter an athlete name.');
        return;
      }
      const newAth: AthleteProfile = {
        id: `ath_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: newAthleteName.trim(),
        category: newAthleteCategory,
        sportId: sportId,
        jerseyNumber: newAthleteJersey.trim() || undefined,
        createdAt: new Date().toISOString()
      };
      await saveCoachAthlete(newAth);
      athleteId = newAth.id;
      athleteName = newAth.name;
    } else {
      const existing = athletes.find((a) => a.id === selectedAthleteId);
      if (!existing) return;
      athleteId = existing.id;
      athleteName = existing.name;
    }

    const folderName = formatAthleteFolderName(athleteName);
    onConfirmSave({ id: athleteId, name: athleteName, folderName });
    onClose();
  };

  const selectedAthlete = athletes.find((a) => a.id === selectedAthleteId);
  const displayFolderName = isCreatingNew
    ? formatAthleteFolderName(newAthleteName || 'Athlete_Name')
    : formatAthleteFolderName(selectedAthlete?.name || 'Athlete');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-zinc-900 border-2 border-red-500/40 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative text-zinc-100 flex flex-col gap-5 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-600/20 text-red-500 p-3 rounded-2xl border border-red-500/30 shrink-0">
              <FolderPlus className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] bg-red-500/20 text-red-400 font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                Coach Roster & Folder System
              </span>
              <h2 className="text-lg font-black uppercase italic tracking-wider text-white mt-1">
                Save to Athlete Folder
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

        {/* Folder Destination Preview */}
        <div className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Folder className="w-5 h-5 text-yellow-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-zinc-400 font-mono uppercase">Target Device Folder</span>
              <p className="text-xs font-mono font-black text-amber-300 truncate">
                {displayFolderName}
              </p>
            </div>
          </div>
          <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-1 rounded font-mono shrink-0">
            Local Storage
          </span>
        </div>

        {/* Selection / Creation Mode Tabs */}
        <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 gap-1">
          <button
            type="button"
            onClick={() => setIsCreatingNew(false)}
            disabled={athletes.length === 0}
            className={`flex-1 py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              !isCreatingNew
                ? 'bg-zinc-800 text-white shadow-md'
                : 'text-zinc-400 hover:text-white opacity-60'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-red-400" />
            <span>Existing Athlete ({athletes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreatingNew(true)}
            className={`flex-1 py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              isCreatingNew
                ? 'bg-red-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Athlete Folder</span>
          </button>
        </div>

        {/* Form Body */}
        {!isCreatingNew && athletes.length > 0 ? (
          <div className="space-y-3">
            <label className="block text-xs font-bold text-zinc-300">
              Select Athlete:
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {athletes.map((ath) => (
                <div
                  key={ath.id}
                  onClick={() => setSelectedAthleteId(ath.id)}
                  className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                    selectedAthleteId === ath.id
                      ? 'bg-red-950/40 border-red-500 text-white'
                      : 'bg-zinc-950 border-zinc-800/80 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                      selectedAthleteId === ath.id ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-300'
                    }`}>
                      {ath.jerseyNumber ? `#${ath.jerseyNumber}` : ath.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-black">{ath.name}</p>
                      <p className="text-[10px] text-zinc-400 font-mono capitalize">
                        {ath.category.replace('_', ' ')} • {ath.sportId}
                      </p>
                    </div>
                  </div>
                  {selectedAthleteId === ath.id && (
                    <CheckCircle2 className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3.5 bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Athlete Full Name *
              </label>
              <input
                type="text"
                value={newAthleteName}
                onChange={(e) => setNewAthleteName(e.target.value)}
                placeholder="e.g. Marcus Johnson"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Age / School Category
                </label>
                <select
                  value={newAthleteCategory}
                  onChange={(e) => setNewAthleteCategory(e.target.value as AthleteCategory)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                >
                  <option value="elementary">Elementary (U10)</option>
                  <option value="middle_school">Middle School (U14)</option>
                  <option value="high_school">High School (U18)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Jersey / Squad #
                </label>
                <input
                  type="text"
                  value={newAthleteJersey}
                  onChange={(e) => setNewAthleteJersey(e.target.value)}
                  placeholder="e.g. 10"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Local Storage Notice */}
        <div className="space-y-2 bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
          <div className="flex items-center gap-2 text-[11px] text-zinc-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Stored securely on your device under <strong className="text-amber-300">📁 {displayFolderName}</strong></span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-red-600/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Confirm Athlete & Download .klutchh</span>
          </button>
        </div>

      </div>
    </div>
  );
};
