import React, { useState, useEffect, useMemo } from 'react';
import { COMPREHENSIVE_DRILL_LIBRARY, DrillItem, getAllSportsList } from '../data/drillLibrary';
import { SPORTS_RULES } from '../data/sportsRules';
import { SportId } from '../types';
import { 
  Trophy, 
  Search, 
  CheckCircle2, 
  Dumbbell, 
  Sparkles, 
  X, 
  ArrowRight, 
  Shield, 
  Star, 
  Flame, 
  Activity, 
  Target, 
  Zap, 
  Bookmark, 
  Check, 
  Filter, 
  SlidersHorizontal,
  Compass,
  Award,
  Layers,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
  const [activeSportFilter, setActiveSportFilter] = useState<string>('all');
  const [activeTechniqueFilter, setActiveTechniqueFilter] = useState<string>('all');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [activeDifficultyFilter, setActiveDifficultyFilter] = useState<string>('all');
  const [activeJointGroupFilter, setActiveJointGroupFilter] = useState<string>('all');
  const [viewFilterMode, setViewFilterMode] = useState<'all' | 'favorites' | 'mastered'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDrillModal, setSelectedDrillModal] = useState<DrillItem | null>(null);

  // Persistence for Favorites & Mastered Drills
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('klutchh_favorite_drills');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [masteredDrills, setMasteredDrills] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('klutchh_mastered_drills');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('klutchh_favorite_drills', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('klutchh_mastered_drills', JSON.stringify(masteredDrills));
  }, [masteredDrills]);

  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleMastered = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setMasteredDrills(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const sportsList = getAllSportsList();

  // Dynamic techniques based on the selected sport
  const availableTechniques = useMemo(() => {
    if (activeSportFilter === 'all') {
      return [];
    }
    const sportRule = SPORTS_RULES.find(s => s.id === activeSportFilter);
    return sportRule?.techniques || [];
  }, [activeSportFilter]);

  const categories = [
    'all',
    'Kinetic Chain',
    'Stability',
    'Mobility',
    'Strength & Power',
    'Follow-Through',
    'Injury Prevention'
  ];

  const jointGroups = [
    { id: 'all', label: 'All Joints' },
    { id: 'knee', label: 'Knees & ACL' },
    { id: 'spine', label: 'Spine & Core' },
    { id: 'shoulder', label: 'Shoulders & Arms' },
    { id: 'hip', label: 'Hips & Pelvis' },
    { id: 'ankle', label: 'Ankles & Feet' },
  ];

  const filteredDrills = useMemo(() => {
    return COMPREHENSIVE_DRILL_LIBRARY.filter((drill) => {
      // Sport match
      const matchesSport = activeSportFilter === 'all' || drill.sportId === activeSportFilter;
      
      // Technique match
      const matchesTechnique = activeTechniqueFilter === 'all' || drill.techniqueId === activeTechniqueFilter;

      // Category match
      const matchesCategory = activeCategoryFilter === 'all' || drill.category === activeCategoryFilter;

      // Difficulty match
      const matchesDifficulty = activeDifficultyFilter === 'all' || drill.difficulty === activeDifficultyFilter;

      // Joint Group match
      let matchesJoint = true;
      if (activeJointGroupFilter !== 'all') {
        const j = drill.targetJoint.toLowerCase();
        if (activeJointGroupFilter === 'knee') matchesJoint = j.includes('knee') || j.includes('acl');
        else if (activeJointGroupFilter === 'spine') matchesJoint = j.includes('spine') || j.includes('torso') || j.includes('lumbar') || j.includes('core');
        else if (activeJointGroupFilter === 'shoulder') matchesJoint = j.includes('shoulder') || j.includes('elbow') || j.includes('wrist') || j.includes('arm');
        else if (activeJointGroupFilter === 'hip') matchesJoint = j.includes('hip') || j.includes('pelvi') || j.includes('adductor') || j.includes('glute');
        else if (activeJointGroupFilter === 'ankle') matchesJoint = j.includes('ankle') || j.includes('foot') || j.includes('feet');
      }

      // View filter (all vs favorites vs mastered)
      let matchesView = true;
      if (viewFilterMode === 'favorites') {
        matchesView = favorites.includes(drill.id);
      } else if (viewFilterMode === 'mastered') {
        matchesView = masteredDrills.includes(drill.id);
      }

      // Search match
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = q === '' ||
        drill.title.toLowerCase().includes(q) ||
        drill.coachingCue.toLowerCase().includes(q) ||
        drill.targetJoint.toLowerCase().includes(q) ||
        drill.sportName.toLowerCase().includes(q) ||
        (drill.techniqueName && drill.techniqueName.toLowerCase().includes(q)) ||
        drill.description.toLowerCase().includes(q) ||
        (drill.biomechanicalBenefit && drill.biomechanicalBenefit.toLowerCase().includes(q));

      return matchesSport && matchesTechnique && matchesCategory && matchesDifficulty && matchesJoint && matchesView && matchesSearch;
    });
  }, [
    activeSportFilter,
    activeTechniqueFilter,
    activeCategoryFilter,
    activeDifficultyFilter,
    activeJointGroupFilter,
    viewFilterMode,
    favorites,
    masteredDrills,
    searchQuery
  ]);

  const handleApplyDrill = (drill: DrillItem) => {
    onSelectSport(drill.sportId);
    onSelectDrillAsRule(drill);
    if (onClose) onClose();
  };

  const getSportIcon = (id: string) => {
    switch (id) {
      case 'rugby': return <Flame className="w-3.5 h-3.5 text-red-500" />;
      case 'soccer': return <Activity className="w-3.5 h-3.5 text-emerald-400" />;
      case 'netball': return <Target className="w-3.5 h-3.5 text-yellow-400" />;
      case 'hockey': return <Zap className="w-3.5 h-3.5 text-cyan-400" />;
      case 'cricket': return <Shield className="w-3.5 h-3.5 text-amber-400" />;
      case 'tennis': return <Trophy className="w-3.5 h-3.5 text-lime-400" />;
      case 'golf': return <Target className="w-3.5 h-3.5 text-amber-300" />;
      default: return <Trophy className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-md flex flex-col gap-5 w-full max-w-6xl max-h-[92vh] overflow-y-auto custom-scrollbar mx-auto">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-gradient-to-r from-red-600 to-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-md">
              Biometric Drill & Movement Catalog
            </span>
            <span className="text-xs font-mono text-zinc-400">
              {filteredDrills.length} of {COMPREHENSIVE_DRILL_LIBRARY.length} Drills Available
            </span>
            {masteredDrills.length > 0 && (
              <span className="text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                {masteredDrills.length} Mastered
              </span>
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white italic uppercase tracking-tight mt-1.5 flex items-center gap-2.5">
            <Dumbbell className="w-7 h-7 text-amber-400" /> Biomechanical Drills & Movement Rules
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-3xl font-medium leading-relaxed">
            Explore our unrestricted library of elite sports drills across all disciplines. Learn step-by-step kinetic sequencing, injury-prevention cues, and click <strong className="text-amber-400 font-bold">"Set Target Rule"</strong> to directly benchmark your video analysis against any movement.
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all self-start md:self-auto cursor-pointer"
            title="Close Drills Library"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Quick View Modes: All Drills | My Favorites | Mastered */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/60 p-2.5 rounded-2xl border border-zinc-800/80">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setViewFilterMode('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              viewFilterMode === 'all'
                ? 'bg-zinc-100 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Drills ({COMPREHENSIVE_DRILL_LIBRARY.length})</span>
          </button>

          <button
            onClick={() => setViewFilterMode('favorites')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              viewFilterMode === 'favorites'
                ? 'bg-amber-400 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${favorites.length > 0 ? 'text-amber-400 fill-amber-400' : ''}`} />
            <span>Favorites ({favorites.length})</span>
          </button>

          <button
            onClick={() => setViewFilterMode('mastered')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              viewFilterMode === 'mastered'
                ? 'bg-emerald-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Mastered ({masteredDrills.length})</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search drills, joints, cues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-8 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 transition-all font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Sport Selector Bar */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-400" /> Sport Discipline:
          </span>
          {activeSportFilter !== 'all' && (
            <button
              onClick={() => {
                setActiveSportFilter('all');
                setActiveTechniqueFilter('all');
              }}
              className="text-[10px] font-bold text-amber-400 hover:underline uppercase"
            >
              Show All Sports
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
          {sportsList.map((sport) => {
            const count = sport.id === 'all'
              ? COMPREHENSIVE_DRILL_LIBRARY.length
              : COMPREHENSIVE_DRILL_LIBRARY.filter(d => d.sportId === sport.id).length;
            const isSelected = activeSportFilter === sport.id;

            return (
              <button
                key={sport.id}
                onClick={() => {
                  setActiveSportFilter(sport.id);
                  setActiveTechniqueFilter('all');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2 shrink-0 border ${
                  isSelected
                    ? 'bg-amber-400 text-zinc-950 border-amber-400 shadow-lg shadow-amber-400/20'
                    : 'bg-zinc-900/80 text-zinc-300 hover:text-white border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {getSportIcon(sport.id)}
                <span>{sport.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                  isSelected ? 'bg-zinc-950/20 text-zinc-950 font-black' : 'bg-zinc-950 text-zinc-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Movement Technique Selector (Active when a specific sport is selected) */}
      {availableTechniques.length > 0 && (
        <div className="flex flex-col gap-2 bg-zinc-900/30 p-3 rounded-2xl border border-zinc-800/60 animate-fadeIn">
          <span className="text-[11px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Specific Technique / Movement:
          </span>
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
            <button
              onClick={() => setActiveTechniqueFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap shrink-0 border ${
                activeTechniqueFilter === 'all'
                  ? 'bg-red-600 text-white border-red-500'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white border-zinc-800'
              }`}
            >
              All Techniques
            </button>
            {availableTechniques.map((tech) => {
              const isSelected = activeTechniqueFilter === tech.id;
              const techCount = COMPREHENSIVE_DRILL_LIBRARY.filter(
                d => d.sportId === activeSportFilter && d.techniqueId === tech.id
              ).length;

              return (
                <button
                  key={tech.id}
                  onClick={() => setActiveTechniqueFilter(tech.id)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap shrink-0 border flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-red-600 text-white border-red-500 shadow-md'
                      : 'bg-zinc-950 text-zinc-400 hover:text-white border-zinc-800'
                  }`}
                >
                  <span>{tech.name}</span>
                  {techCount > 0 && (
                    <span className="text-[9px] bg-black/40 px-1.5 rounded text-zinc-300 font-mono">
                      {techCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Secondary Multi-Filters: Focus Category, Joint Group & Difficulty */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-zinc-900/40 p-3.5 rounded-2xl border border-zinc-800/80">
        
        {/* Category Focus */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Biomechanical Focus:</span>
          <select
            value={activeCategoryFilter}
            onChange={(e) => setActiveCategoryFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 font-medium focus:outline-none focus:border-amber-400"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Focus Categories' : cat}
              </option>
            ))}
          </select>
        </div>

        {/* Target Joint Group */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Target Joint Anatomy:</span>
          <select
            value={activeJointGroupFilter}
            onChange={(e) => setActiveJointGroupFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 font-medium focus:outline-none focus:border-amber-400"
          >
            {jointGroups.map((jg) => (
              <option key={jg.id} value={jg.id}>
                {jg.label}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty Level */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Difficulty Tier:</span>
          <select
            value={activeDifficultyFilter}
            onChange={(e) => setActiveDifficultyFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 font-medium focus:outline-none focus:border-amber-400"
          >
            <option value="all">All Difficulties</option>
            <option value="Beginner">Beginner / Grassroots</option>
            <option value="Intermediate">Intermediate / Academy</option>
            <option value="Elite">Elite / High Performance</option>
          </select>
        </div>
      </div>

      {/* Drill Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDrills.map((drill) => {
          const isFav = favorites.includes(drill.id);
          const isMastered = masteredDrills.includes(drill.id);

          return (
            <motion.div
              key={drill.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`bg-zinc-900/90 border rounded-2xl overflow-hidden flex flex-col justify-between transition-all group shadow-xl relative ${
                isMastered 
                  ? 'border-emerald-500/40 hover:border-emerald-400' 
                  : 'border-zinc-800 hover:border-amber-500/60'
              }`}
            >
              <div>
                {/* Drill Image & Overlays */}
                <div className="relative h-48 w-full overflow-hidden bg-zinc-950">
                  <img
                    src={drill.photoUrl}
                    alt={drill.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />
                  
                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[80%]">
                    <span className="bg-zinc-950/90 text-amber-400 border border-amber-500/40 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider backdrop-blur-md flex items-center gap-1">
                      {getSportIcon(drill.sportId)}
                      <span>{drill.sportName.split('/')[0]}</span>
                    </span>

                    <span className={`text-[10px] font-black px-2 py-0.8 rounded-lg uppercase tracking-wider backdrop-blur-md border ${
                      drill.difficulty === 'Elite'
                        ? 'bg-red-950/90 text-red-300 border-red-500/40'
                        : drill.difficulty === 'Intermediate'
                        ? 'bg-amber-950/90 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40'
                    }`}>
                      {drill.difficulty}
                    </span>
                  </div>

                  {/* Favorite & Mastered Action Buttons Top Right */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <button
                      onClick={(e) => toggleFavorite(drill.id, e)}
                      className={`p-2 rounded-xl backdrop-blur-md border transition-all ${
                        isFav 
                          ? 'bg-amber-400 text-zinc-950 border-amber-300' 
                          : 'bg-zinc-950/80 text-zinc-400 hover:text-amber-400 border-zinc-800'
                      }`}
                      title={isFav ? "Remove Favorite" : "Add to Favorites"}
                    >
                      <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-zinc-950' : ''}`} />
                    </button>

                    <button
                      onClick={(e) => toggleMastered(drill.id, e)}
                      className={`p-2 rounded-xl backdrop-blur-md border transition-all ${
                        isMastered
                          ? 'bg-emerald-500 text-zinc-950 border-emerald-400'
                          : 'bg-zinc-950/80 text-zinc-400 hover:text-emerald-400 border-zinc-800'
                      }`}
                      title={isMastered ? "Mastered Drill" : "Mark as Mastered"}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Target Joint Badge Bottom */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-zinc-300 uppercase tracking-wider bg-zinc-900/90 px-2.5 py-1 rounded-lg border border-zinc-800 backdrop-blur-md">
                      🎯 {drill.targetJoint}
                    </span>
                    {drill.techniqueName && (
                      <span className="text-[9px] font-bold text-amber-400 bg-black/70 px-2 py-0.5 rounded border border-amber-500/20 backdrop-blur-md truncate max-w-[120px]">
                        {drill.techniqueName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-black text-white uppercase italic tracking-tight group-hover:text-amber-400 transition-colors">
                      {drill.title}
                    </h3>
                  </div>

                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed font-medium">
                    {drill.description}
                  </p>

                  {/* Coaching Cue Box */}
                  <div className="bg-zinc-950/90 border border-zinc-800/90 p-3 rounded-xl">
                    <div className="text-[10px] font-black uppercase text-amber-400 tracking-wider mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-400" /> Coaching Cue
                    </div>
                    <p className="text-xs text-zinc-200 font-serif italic">
                      {drill.coachingCue}
                    </p>
                  </div>

                  {/* Prescription & Category */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-1 border-t border-zinc-800/60">
                    <span className="font-bold text-zinc-300">{drill.sets} • {drill.reps}</span>
                    <span className="text-red-400 font-bold bg-red-950/40 px-2 py-0.5 rounded border border-red-500/20 text-[10px]">
                      {drill.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-5 pt-0 flex items-center gap-2">
                <button
                  onClick={() => setSelectedDrillModal(drill)}
                  className="flex-1 px-3 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider border border-zinc-800 transition-all cursor-pointer"
                >
                  View Steps
                </button>
                <button
                  onClick={() => handleApplyDrill(drill)}
                  className="flex-1 px-3 py-2.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-amber-400/20 flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                  title="Apply this drill to your analysis workspace to calibrate movement targets"
                >
                  <span>Set Target</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredDrills.length === 0 && (
        <div className="py-16 text-center flex flex-col items-center justify-center gap-3 bg-zinc-900/30 rounded-2xl border border-zinc-800/60">
          <Shield className="w-12 h-12 text-zinc-600" />
          <h4 className="text-base font-black text-white uppercase">No matching drills found</h4>
          <p className="text-xs text-zinc-400 max-w-md">
            Try resetting your sport, category, or search filters to browse the complete library of 70+ professional biomechanical drills.
          </p>
          <button
            onClick={() => {
              setActiveSportFilter('all');
              setActiveTechniqueFilter('all');
              setActiveCategoryFilter('all');
              setActiveDifficultyFilter('all');
              setActiveJointGroupFilter('all');
              setViewFilterMode('all');
              setSearchQuery('');
            }}
            className="mt-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-black uppercase tracking-wider"
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* Drill Step-by-Step Details Modal */}
      <AnimatePresence>
        {selectedDrillModal && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Modal Image Header */}
              <div className="relative h-60 w-full overflow-hidden bg-black">
                <img
                  src={selectedDrillModal.photoUrl}
                  alt={selectedDrillModal.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent" />
                
                <button
                  onClick={() => setSelectedDrillModal(null)}
                  className="absolute top-4 right-4 p-2 bg-zinc-950/80 rounded-full text-white border border-zinc-800 hover:bg-zinc-900 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="absolute bottom-4 left-6 right-6">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="bg-amber-400 text-zinc-950 text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-widest inline-block">
                      {selectedDrillModal.sportName}
                    </span>
                    {selectedDrillModal.techniqueName && (
                      <span className="bg-red-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-widest inline-block">
                        {selectedDrillModal.techniqueName}
                      </span>
                    )}
                    <span className="bg-zinc-900/90 text-zinc-300 border border-zinc-700 text-[10px] font-mono px-2 py-0.5 rounded-md uppercase tracking-widest">
                      {selectedDrillModal.difficulty}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">
                    {selectedDrillModal.title}
                  </h3>
                </div>
              </div>

              {/* Modal Scrollable Body */}
              <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
                
                {/* Description & Biomechanical Benefit */}
                <div>
                  <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider mb-1.5">
                    Technical Mechanics & Objective
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                    {selectedDrillModal.description}
                  </p>
                  
                  <div className="mt-3 bg-emerald-950/40 border border-emerald-500/30 p-3.5 rounded-2xl flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider block">
                        Verified Biomechanical Impact
                      </span>
                      <p className="text-xs text-emerald-200 font-medium mt-0.5 leading-relaxed">
                        {selectedDrillModal.biomechanicalBenefit}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step-by-Step Protocol */}
                <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl">
                  <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider mb-3 flex items-center gap-2">
                    <Compass className="w-4 h-4" /> Step-by-Step Execution Protocol
                  </h4>
                  <div className="space-y-3">
                    {selectedDrillModal.steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center text-xs font-mono shrink-0 mt-0.5 border border-amber-400/40 font-black">
                          {idx + 1}
                        </span>
                        <p className="text-xs text-zinc-200 font-medium leading-relaxed">
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Coaching Cue Quote Box */}
                <div className="bg-zinc-900 border-l-4 border-amber-400 p-4 rounded-r-2xl">
                  <span className="text-[10px] font-black uppercase text-amber-400 tracking-widest block mb-1">
                    Coach Memory Anchor
                  </span>
                  <p className="text-xs text-zinc-100 font-serif italic">
                    {selectedDrillModal.coachingCue}
                  </p>
                </div>

                {/* Biometric Prescription Specs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-950 border border-zinc-800 p-4 rounded-2xl">
                  <div>
                    <span className="text-[9px] font-mono uppercase text-zinc-500 block">Prescription</span>
                    <span className="text-xs font-black text-white">{selectedDrillModal.sets} • {selectedDrillModal.reps}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono uppercase text-zinc-500 block">Target Joint</span>
                    <span className="text-xs font-black text-amber-400 truncate block">{selectedDrillModal.targetJoint}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono uppercase text-zinc-500 block">Focus Category</span>
                    <span className="text-xs font-black text-red-400">{selectedDrillModal.category}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono uppercase text-zinc-500 block">Equipment</span>
                    <span className="text-xs font-black text-zinc-300">{selectedDrillModal.equipment || 'Standard Gear'}</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="p-5 border-t border-zinc-800/80 bg-zinc-900/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => toggleFavorite(selectedDrillModal.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 ${
                      favorites.includes(selectedDrillModal.id)
                        ? 'bg-amber-400 text-zinc-950 border-amber-300'
                        : 'bg-zinc-900 text-zinc-300 hover:text-white border-zinc-800'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${favorites.includes(selectedDrillModal.id) ? 'fill-zinc-950' : ''}`} />
                    <span>{favorites.includes(selectedDrillModal.id) ? 'Favorited' : 'Favorite'}</span>
                  </button>

                  <button
                    onClick={() => toggleMastered(selectedDrillModal.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 ${
                      masteredDrills.includes(selectedDrillModal.id)
                        ? 'bg-emerald-500 text-zinc-950 border-emerald-400'
                        : 'bg-zinc-900 text-zinc-300 hover:text-white border-zinc-800'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{masteredDrills.includes(selectedDrillModal.id) ? 'Mastered' : 'Mark Done'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => setSelectedDrillModal(null)}
                    className="px-4 py-2.5 rounded-xl bg-zinc-900 text-zinc-300 hover:text-white text-xs font-black uppercase tracking-wider border border-zinc-800 transition-all cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      const drill = selectedDrillModal;
                      setSelectedDrillModal(null);
                      handleApplyDrill(drill);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-amber-400/20 flex items-center gap-2 cursor-pointer font-sans"
                  >
                    <span>Set Target Movement</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
