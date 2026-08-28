import React, { useState } from 'react';
import { COMPREHENSIVE_DRILL_LIBRARY, DrillItem } from '../data/drillLibrary';
import { SportId } from '../types';
import { Trophy, Search, CheckCircle2, Dumbbell, Sparkles, X, ArrowRight, Shield } from 'lucide-react';
import { motion } from 'motion/react';

interface BiometricDrillsLibraryProps {
  selectedSportId?: SportId;
  onSelectSport: (sportId: SportId) => void;
  onSelectDrillAsRule: (drill: DrillItem) => void;
  onClose?: () => void;
}

export const BiometricDrillsLibrary: React.FC<BiometricDrillsLibraryProps> = ({
  selectedSportId,
  onSelectSport,
  onSelectDrillAsRule,
  onClose,
}) => {
  const [activeSportFilter, setActiveSportFilter] = useState<string>(selectedSportId || 'all');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDrillModal, setSelectedDrillModal] = useState<DrillItem | null>(null);

  const sportsList = [
    { id: 'all', name: 'All Sports' },
    { id: 'rugby', name: 'Rugby' },
    { id: 'hockey', name: 'Hockey' },
    { id: 'netball', name: 'Netball' },
    { id: 'cricket', name: 'Cricket' },
  ];

  const categories = ['all', 'Mobility', 'Kinetic Chain', 'Strength & Power', 'Stability', 'Follow-Through'];

  const filteredDrills = COMPREHENSIVE_DRILL_LIBRARY.filter((drill) => {
    const matchesSport = activeSportFilter === 'all' || drill.sportId.toLowerCase().includes(activeSportFilter.toLowerCase());
    const matchesCategory = activeCategoryFilter === 'all' || drill.category === activeCategoryFilter;
    const matchesSearch = searchQuery === '' || 
      drill.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drill.coachingCue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drill.targetJoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drill.sportName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSport && matchesCategory && matchesSearch;
  });

  const handleApplyDrill = (drill: DrillItem) => {
    let mappedSportId: SportId = 'rugby';
    const sId = drill.sportId.toLowerCase();
    if (sId.includes('hockey')) mappedSportId = 'hockey';
    else if (sId.includes('netball')) mappedSportId = 'netball';
    else if (sId.includes('cricket')) mappedSportId = 'cricket';

    onSelectSport(mappedSportId);
    onSelectDrillAsRule(drill);
    if (onClose) onClose();
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-md flex flex-col gap-6 w-full max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="bg-gradient-to-r from-red-600 to-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-md">
              Biometric Drill & Rule Library
            </span>
            <span className="text-xs font-mono text-zinc-400">
              {filteredDrills.length} Professional Drills Available
            </span>
          </div>
          <h2 className="text-2xl font-black text-white italic uppercase tracking-tight mt-1.5 flex items-center gap-2">
            <Dumbbell className="w-6 h-6 text-amber-400" /> Select Drills to Set Movement Rules
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl font-medium">
            Browse our catalog of elite sports drills with high-resolution photography and verified biomechanical parameters. Select any drill to instantly configure your movement analysis rules.
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all self-start md:self-auto"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/80">
        
        {/* Sport Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-2 lg:pb-0 w-full">
          {sportsList.map((sport) => (
            <button
              key={sport.id}
              onClick={() => setActiveSportFilter(sport.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex-shrink-0 ${
                activeSportFilter === sport.id
                  ? 'bg-amber-400 text-zinc-950 shadow-md shadow-amber-400/20'
                  : 'bg-zinc-950/80 text-zinc-400 hover:text-white border border-zinc-800/80'
              }`}
            >
              {sport.name}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search drills, joints, cues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 transition-all font-medium"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2 w-full max-w-full">
        <span className="text-[11px] font-bold uppercase text-zinc-400 whitespace-nowrap shrink-0">Focus:</span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all whitespace-nowrap flex-shrink-0 ${
              activeCategoryFilter === cat
                ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            {cat === 'all' ? 'All Categories' : cat}
          </button>
        ))}
      </div>

      {/* Drill Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDrills.map((drill) => (
          <motion.div
            key={drill.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-zinc-900/80 border border-zinc-800 hover:border-amber-500/50 rounded-2xl overflow-hidden flex flex-col justify-between transition-all group shadow-xl"
          >
            <div>
              {/* Drill Image & Badges */}
              <div className="relative h-48 w-full overflow-hidden bg-zinc-950">
                <img
                  src={drill.photoUrl}
                  alt={drill.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                  <span className="bg-zinc-950/90 text-amber-400 border border-amber-500/40 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider backdrop-blur-md">
                    {drill.sportName}
                  </span>
                  <span className="bg-red-950/90 text-red-300 border border-red-500/40 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider backdrop-blur-md">
                    {drill.difficulty}
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 right-3">
                  <span className="text-[10px] font-mono text-zinc-300 uppercase tracking-widest bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-800 backdrop-blur-sm">
                    Target: {drill.targetJoint}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col gap-3">
                <h3 className="text-base font-black text-white uppercase italic tracking-tight group-hover:text-amber-400 transition-colors">
                  {drill.title}
                </h3>
                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed font-medium">
                  {drill.description}
                </p>

                {/* Coaching Cue Box */}
                <div className="bg-zinc-950/80 border border-zinc-800/80 p-3 rounded-xl">
                  <div className="text-[10px] font-bold uppercase text-amber-400 tracking-wider mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" /> Coach Cue
                  </div>
                  <p className="text-xs text-zinc-200 font-serif italic">
                    {drill.coachingCue}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-1">
                  <span>{drill.sets} • {drill.reps}</span>
                  <span className="text-amber-400 font-bold">{drill.category}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-5 pt-0 flex items-center gap-2">
              <button
                onClick={() => setSelectedDrillModal(drill)}
                className="flex-1 px-3.5 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider border border-zinc-800 transition-all"
              >
                View Steps
              </button>
              <button
                onClick={() => handleApplyDrill(drill)}
                className="flex-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-amber-400/20 flex items-center justify-center gap-1.5"
              >
                <span>Set Rule</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredDrills.length === 0 && (
        <div className="py-16 text-center flex flex-col items-center justify-center gap-3 bg-zinc-900/30 rounded-2xl border border-zinc-800/60">
          <Shield className="w-10 h-10 text-zinc-600" />
          <h4 className="text-base font-black text-white uppercase">No drills found</h4>
          <p className="text-xs text-zinc-400 max-w-md">
            Try adjusting your search keywords or sport filter to explore more corrective exercises.
          </p>
        </div>
      )}

      {/* Drill Details Modal */}
      {selectedDrillModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          >
            <div className="relative h-56 w-full">
              <img
                src={selectedDrillModal.photoUrl}
                alt={selectedDrillModal.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
              <button
                onClick={() => setSelectedDrillModal(null)}
                className="absolute top-4 right-4 p-2 bg-zinc-950/80 rounded-full text-white border border-zinc-800 hover:bg-zinc-900 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-6">
                <span className="bg-amber-400 text-zinc-950 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest mb-2 inline-block">
                  {selectedDrillModal.sportName} • {selectedDrillModal.difficulty}
                </span>
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">
                  {selectedDrillModal.title}
                </h3>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              <div>
                <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider mb-2">Description & Benefit</h4>
                <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                  {selectedDrillModal.description}
                </p>
                <p className="text-xs text-emerald-400 mt-2 font-semibold bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-xl">
                  💡 Biomechanical Benefit: {selectedDrillModal.biomechanicalBenefit}
                </p>
              </div>

              <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl">
                <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider mb-3">Step-by-Step Execution</h4>
                <div className="space-y-2.5">
                  {selectedDrillModal.steps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center text-[10px] font-mono shrink-0 mt-0.5 border border-amber-400/40">
                        {idx + 1}
                      </span>
                      <p className="text-xs text-zinc-300 font-medium leading-relaxed">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-zinc-500 block">Prescription</span>
                  <span className="text-xs font-black text-white">{selectedDrillModal.sets} • {selectedDrillModal.reps}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-zinc-500 block">Target Joint</span>
                  <span className="text-xs font-black text-amber-400">{selectedDrillModal.targetJoint}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-zinc-500 block">Category</span>
                  <span className="text-xs font-black text-red-400">{selectedDrillModal.category}</span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-zinc-800/80 bg-zinc-900/50 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedDrillModal(null)}
                className="px-5 py-2.5 rounded-xl bg-zinc-900 text-zinc-300 hover:text-white text-xs font-black uppercase tracking-wider border border-zinc-800 transition-all"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const drill = selectedDrillModal;
                  setSelectedDrillModal(null);
                  handleApplyDrill(drill);
                }}
                className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-amber-400/20 flex items-center gap-2"
              >
                <span>Set as Analysis Rule</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
