import React, { useState, useEffect } from 'react';
import { get, set } from 'idb-keyval';
import { SavedReport, SportId, AthleteProfile, TrophyCard } from '../types';
import {
  X,
  BookOpen,
  Trash2,
  Calendar,
  Trophy,
  User,
  Search,
  Play,
  AlertCircle,
  FolderOpen,
  Folder,
  ChevronRight,
  ChevronDown,
  Download,
  Share2,
  Users,
  Plus,
  Send,
  ShieldCheck,
  CheckCircle2,
  Flame,
  CreditCard
} from 'lucide-react';
import {
  getCoachAthletes,
  saveCoachAthlete,
  deleteCoachAthlete,
  groupReportsByAthleteFolder,
  exportAthleteReportFile,
  formatAthleteFolderName
} from '../utils/rosterStorage';

interface SavedReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedReports: SavedReport[];
  onSelectReport: (report: SavedReport) => void;
  onDeleteReport: (id: string) => void;
  onImportReport?: (data: any) => void;
  onDeleteTrophyCard?: (id: string) => void;
  initialTab?: 'folders' | 'all' | 'cards' | 'roster';
}

import { TrophyCardViewerModal } from './TrophyCardViewerModal';
export const SavedReportsModal: React.FC<SavedReportsModalProps> = ({
  isOpen,
  onClose,
  savedReports,
  onSelectReport,
  onDeleteReport,
  onImportReport,
  onDeleteTrophyCard,
  initialTab = 'folders',
}) => {
  const [activeTab, setActiveTab] = useState<'folders' | 'all' | 'cards' | 'roster'>(initialTab);
  const [selectedCard, setSelectedCard] = useState<TrophyCard | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSport, setFilterSport] = useState<string>('all');
  const [athletes, setAthletes] = useState<AthleteProfile[]>([]);
  const [trophyCards, setTrophyCards] = useState<TrophyCard[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  
  // New Athlete form state in Roster tab
  const [newAthleteName, setNewAthleteName] = useState('');
  const [newAthleteSport, setNewAthleteSport] = useState<SportId>('rugby');
  const [newAthleteCategory, setNewAthleteCategory] = useState<'elementary' | 'middle_school' | 'high_school'>('middle_school');
  const [newAthleteJersey, setNewAthleteJersey] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getCoachAthletes().then((list) => {
        setAthletes(list);
        // Expand all folders by default for quick access
        const initialExpanded: Record<string, boolean> = {};
        list.forEach((a) => { initialExpanded[a.id] = true; });
        initialExpanded['unassigned'] = true;
        setExpandedFolders(initialExpanded);
      });

      // Load trophy cards
      get('klutchh_trophy_cabinet').then((cards) => {
        if (cards) {
          setTrophyCards(cards);
        } else {
          setTrophyCards([]);
        }
      }).catch(e => {
        console.error("Failed to load trophy cards:", e);
        setTrophyCards([]);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateAthlete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAthleteName.trim()) return;
    const newAth: AthleteProfile = {
      id: `ath_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: newAthleteName.trim(),
      category: newAthleteCategory,
      sportId: newAthleteSport,
      jerseyNumber: newAthleteJersey.trim() || undefined,
      createdAt: new Date().toISOString()
    };
    const updated = await saveCoachAthlete(newAth);
    setAthletes(updated);
    setNewAthleteName('');
    setNewAthleteJersey('');
  };

  const handleDeleteAthlete = async (athId: string) => {
    if (confirm('Remove this athlete from your roster? Existing reports will remain.')) {
      const updated = await deleteCoachAthlete(athId);
      setAthletes(updated);
    }
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const athleteFolderGroups = groupReportsByAthleteFolder(savedReports, athletes, trophyCards);

  const filteredReports = savedReports.filter((rep) => {
    const matchesSearch =
      rep.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rep.sportName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rep.athleteName && rep.athleteName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      rep.authorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSport = filterSport === 'all' || rep.sportId === filterSport;
    return matchesSearch && matchesSport;
  });


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 sm:rounded-3xl max-w-4xl w-full min-h-screen sm:min-h-0 p-4 sm:p-6 shadow-2xl relative text-zinc-100 flex flex-col gap-5 sm:my-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 pb-4 gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/20 text-amber-400 p-2 sm:p-3 rounded-2xl border border-amber-500/30 shrink-0">
              <Folder className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[9px] sm:text-[10px] bg-amber-500/20 text-amber-300 font-mono font-bold px-2 py-0.5 rounded uppercase whitespace-nowrap">
                  Klutchh Local
                </span>
                <span className="text-[9px] sm:text-[10px] bg-zinc-800 text-zinc-400 font-mono px-2 py-0.5 rounded whitespace-nowrap">
                  {savedReports.length} Reports
                </span>
              </div>
              <h2 className="text-base sm:text-xl font-black uppercase italic tracking-wider text-white mt-0.5 sm:mt-1 truncate">
                Athlete Folders
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto sm:overflow-visible pb-1 sm:pb-0">
            <button
              onClick={() => {
                alert("☁️ Klutchh Cloud Sync Space:\n\nYour app is currently running in Local Privacy Mode (0 cost, 100% on-device storage). \n\nTo sync athletes and reports to your personal Google Drive or Firebase cloud storage, configure your cloud credentials in Settings.");
              }}
              className="bg-zinc-800 hover:bg-zinc-700 text-sky-400 font-extrabold text-[10px] sm:text-xs px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl border border-zinc-700 cursor-pointer flex items-center gap-1.5 transition-all shadow-sm shrink-0"
              title="Cloud Sync Space"
            >
              <Share2 className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Cloud Sync</span>
            </button>

            <label className="bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-extrabold text-[10px] sm:text-xs px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl border border-zinc-700 cursor-pointer flex items-center gap-1.5 transition-all shrink-0">
              <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Import</span>
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
                        onClose();
                        onImportReport(parsed);
                      } catch (err) {
                        alert('Invalid .klutchh report file format.');
                      }
                    };
                    reader.readAsText(file);
                  }
                  e.target.value = '';
                }}
              />
            </label>

            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-2 hover:bg-zinc-800 rounded-xl transition-all ml-auto"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Mode Navigation Tabs */}
        <div className="flex bg-zinc-950 p-1 rounded-xl sm:rounded-2xl border border-zinc-800 gap-1 overflow-x-auto sm:overflow-visible no-scrollbar">
          <button
            onClick={() => setActiveTab('folders')}
            className={`min-w-max sm:flex-1 py-2 px-3 sm:px-0 text-[10px] sm:text-xs font-black rounded-lg sm:rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'folders'
                ? 'bg-amber-500 text-zinc-950 shadow-md font-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Folder className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Folders</span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`min-w-max sm:flex-1 py-2 px-3 sm:px-0 text-[10px] sm:text-xs font-black rounded-lg sm:rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'all'
                ? 'bg-amber-500 text-zinc-950 shadow-md font-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Reports ({savedReports.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('cards')}
            className={`min-w-max sm:flex-1 py-2 px-3 sm:px-0 text-[10px] sm:text-xs font-black rounded-lg sm:rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'cards'
                ? 'bg-amber-500 text-zinc-950 shadow-md font-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Cards ({trophyCards.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('roster')}
            className={`min-w-max sm:flex-1 py-2 px-3 sm:px-0 text-[10px] sm:text-xs font-black rounded-lg sm:rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'roster'
                ? 'bg-amber-500 text-zinc-950 shadow-md font-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Roster ({athletes.length})</span>
          </button>
        </div>

        {/* Search & Filter Bar (Only for folders & all) */}
        {activeTab !== 'roster' && (
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search athlete folders or reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <select
              value={filterSport}
              onChange={(e) => setFilterSport(e.target.value)}
              className="w-full sm:w-auto bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Sports</option>
              <option value="rugby">Rugby</option>
              <option value="soccer">Soccer</option>
              <option value="netball">Netball</option>
              <option value="hockey">Hockey</option>
              <option value="cricket">Cricket</option>
              <option value="tennis">Tennis</option>
              <option value="golf">Golf</option>
            </select>
          </div>
        )}

        {/* TAB 1: Athlete Folders Tree */}
        {activeTab === 'folders' && (
          <div className="flex flex-col gap-3 max-h-[55vh] overflow-y-auto pr-1">
            <div className="bg-zinc-950/60 border border-zinc-800 p-3 rounded-2xl flex items-center justify-between text-xs text-zinc-400">
              <div className="flex items-center gap-2 font-mono">
                <Folder className="w-4 h-4 text-amber-400" />
                <span>Root: <strong>📁 Klutchh /</strong></span>
              </div>
              <span className="text-[11px] text-zinc-500 font-mono">
                {athleteFolderGroups.length} Athlete Folders
              </span>
            </div>

            {athleteFolderGroups.map((group) => {
              const isExpanded = !!expandedFolders[group.athlete.id];
              const folderReports = group.reports.filter((rep) => {
                const matchesSearch =
                  rep.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  rep.sportName.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesSport = filterSport === 'all' || rep.sportId === filterSport;
                return matchesSearch && matchesSport;
              });

              if (searchTerm && folderReports.length === 0) return null;

              return (
                <div
                  key={group.athlete.id}
                  className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden transition-all"
                >
                  {/* Folder Header */}
                  <div
                    onClick={() => toggleFolder(group.athlete.id)}
                    className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-zinc-900/80 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-amber-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-zinc-500" />
                      )}
                      <Folder className={`w-5 h-5 ${folderReports.length > 0 ? 'text-amber-400 fill-amber-400/20' : 'text-zinc-600'}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-black text-white">{group.athlete.name}</h3>
                          <span className="text-[10px] font-mono bg-zinc-800 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                            {folderReports.length} {folderReports.length === 1 ? 'report' : 'reports'}
                          </span>
                          {group.trophyCards.length > 0 && (
                            <span className="text-[10px] font-mono bg-zinc-800 text-red-400 px-2 py-0.5 rounded-full font-bold">
                              {group.trophyCards.length} {group.trophyCards.length === 1 ? 'card' : 'cards'}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-500 font-mono">
                          📁 {group.folderName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {folderReports.length > 0 && (
                        <button
                          onClick={() => {
                            // Quick export latest report
                            exportAthleteReportFile(folderReports[0]);
                          }}
                          className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-amber-300 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-zinc-800 flex items-center gap-1 transition-all"
                          title="Export latest report to local folder"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Export .klutchh</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Folder Content / Reports & Cards List */}
                  {isExpanded && (
                    <div className="border-t border-zinc-900 bg-zinc-900/40 p-3 space-y-4">
                      {/* Reports Section */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 px-1 mb-1">
                          <BookOpen className="w-3 h-3 text-amber-500" />
                          <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Reports</span>
                        </div>
                        {folderReports.length === 0 ? (
                          <p className="text-[10px] text-zinc-600 italic px-3">No reports saved yet.</p>
                        ) : (
                          folderReports.map((report) => (
                            <div
                              key={report.id}
                              className="bg-zinc-950 border border-zinc-800/80 hover:border-amber-500/50 p-2.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                            >
                              <div className="flex items-start gap-3">
                                <div className="bg-red-600/20 text-yellow-400 font-black text-[10px] w-8 h-8 rounded-lg border border-red-500/30 flex items-center justify-center shrink-0">
                                  {report.overallGrade}
                                </div>
                                <div>
                                  <h4 className="text-[11px] font-black text-white">{report.title}</h4>
                                  <div className="flex items-center gap-3 text-[9px] text-zinc-500 font-mono mt-0.5">
                                    <span className="text-amber-500/80">{report.sportName}</span>
                                    <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={() => {
                                    onSelectReport(report);
                                    onClose();
                                  }}
                                  className="bg-red-600 hover:bg-red-500 text-white font-black text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                                >
                                  <Play className="w-2.5 h-2.5 fill-current" />
                                  <span>Open</span>
                                </button>
                                <button
                                  onClick={() => onDeleteReport(report.id)}
                                  className="bg-zinc-900 hover:bg-red-950 hover:text-red-400 border border-zinc-800 p-1.5 rounded-lg text-zinc-500 transition-all"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Trophy Cards Section */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 px-1 mb-1">
                          <Trophy className="w-3 h-3 text-red-500" />
                          <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Trading Cards</span>
                        </div>
                        {group.trophyCards.length === 0 ? (
                          <p className="text-[10px] text-zinc-600 italic px-3">No trading cards minted yet.</p>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {group.trophyCards.map((card) => (
                              <div
                                key={card.id}
                                className="bg-zinc-950 border border-zinc-800/80 p-2 rounded-xl flex flex-col gap-2 relative group overflow-hidden"
                              >
                                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (onDeleteTrophyCard) {
                                        onDeleteTrophyCard(card.id);
                                        setTrophyCards(prev => prev.filter(c => c.id !== card.id));
                                      }
                                    }}
                                    className="p-1 bg-red-600 text-white rounded-md hover:bg-red-500"
                                  >
                                    <Trash2 className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                                <div className="aspect-[3/4] bg-zinc-900 rounded-lg overflow-hidden relative border border-white/5">
                                  {card.capturedImage ? (
                                    <img src={card.capturedImage} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                                      <Trophy className="w-4 h-4 text-zinc-800" />
                                    </div>
                                  )}
                                  <div className="absolute top-1 left-1">
                                    <span className="bg-amber-500 text-zinc-950 text-[8px] font-black px-1 rounded">
                                      {card.grade}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-[9px] font-black text-white truncate">{card.movementPhase}</span>
                                  <span className="text-[8px] text-zinc-500 font-mono uppercase">{card.sportName}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: Flat List of All Reports */}
        {activeTab === 'all' && (
          <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto pr-1">
            {filteredReports.length === 0 ? (
              <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-8 text-center flex flex-col items-center gap-2 text-zinc-500">
                <BookOpen className="w-8 h-8 text-zinc-600" />
                <p className="text-xs font-bold">No saved analysis reports found.</p>
              </div>
            ) : (
              filteredReports.map((report) => (
                <div
                  key={report.id}
                  className="bg-zinc-950 border border-zinc-800 hover:border-amber-400/50 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-red-600/20 text-yellow-400 font-black text-sm w-10 h-10 rounded-xl border border-red-500/30 flex items-center justify-center shrink-0">
                      {report.overallGrade}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-black text-white">{report.title}</h3>
                        {report.athleteName && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono font-bold">
                            📁 {report.athleteName}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-400 mt-1 font-mono">
                        <span className="text-zinc-300">{report.sportName}</span>
                        <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                        <span>Coach: {report.authorName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => exportAthleteReportFile(report)}
                      className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 p-2 rounded-xl border border-zinc-800 text-xs transition-all"
                      title="Download .klutchh file"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        onSelectReport(report);
                        onClose();
                      }}
                      className="bg-red-600 hover:bg-red-500 text-white font-black text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-red-600/20 transition-all uppercase tracking-wider"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Open Scrubber</span>
                    </button>

                    <button
                      onClick={() => onDeleteReport(report.id)}
                      className="bg-zinc-900 hover:bg-red-950 hover:text-red-400 border border-zinc-800 p-2 rounded-xl text-zinc-500 transition-all"
                      title="Delete Saved Report"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: Trophy Card Collection */}
        {activeTab === 'cards' && (
          <div className="flex flex-col gap-4 max-h-[55vh] overflow-y-auto pr-1">
            {trophyCards.length === 0 ? (
              <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-12 text-center flex flex-col items-center gap-3 text-zinc-500">
                <Trophy className="w-10 h-10 text-zinc-700" />
                <p className="text-xs font-bold">Your Trophy Cabinet is empty.</p>
                <p className="text-[11px] text-zinc-600 max-w-sm">
                  Mint your achievements in the <strong>Trophy Card Maker</strong> to see them here!
                </p>
              </div>
            ) : (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 relative">
                {/* Shelf-like visual cues */}
                <div className="absolute top-0 left-0 right-0 h-4 bg-zinc-800 rounded-t-3xl border-b border-zinc-700"></div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 pt-6">
                  {trophyCards.filter(c => filterSport === 'all' || c.sportId === filterSport).map((card) => (
                    <div
                      key={card.id}
                      className="bg-zinc-950 border border-zinc-700 rounded-2xl p-3 flex flex-col gap-3 relative group transition-all hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10 cursor-pointer"
                      onClick={() => setSelectedCard(card)}
                    >
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                        <button
                          onClick={() => {
                            if (onDeleteTrophyCard) {
                              onDeleteTrophyCard(card.id);
                              setTrophyCards(prev => prev.filter(c => c.id !== card.id));
                            }
                          }}
                          className="bg-red-600 hover:bg-red-500 text-white p-1.5 rounded-lg shadow-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      
                      <div className="aspect-[3/4] rounded-xl overflow-hidden relative border border-white/5 bg-zinc-900 shadow-inner">
                        {card.capturedImage ? (
                          <img src={card.capturedImage} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Trophy className="w-6 h-6 text-zinc-800" />
                          </div>
                        )}
                        <div className="absolute top-2 left-2 bg-amber-500 text-zinc-950 text-[10px] font-black px-2 py-0.5 rounded shadow-lg">
                          {card.grade}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-black text-white truncate">{card.athleteName}</h4>
                        <div className="flex items-center justify-between mt-1 text-[9px] font-mono">
                          <span className="text-amber-500 font-bold uppercase">{card.sportName}</span>
                          <span className="text-zinc-500">{new Date(card.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Manage Athlete Roster */}
        {activeTab === 'roster' && (
          <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
            {/* Add Athlete Form */}
            <form onSubmit={handleCreateAthlete} className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-3">
              <h3 className="text-xs font-black uppercase text-amber-400 tracking-wide flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add New Athlete to Roster
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Athlete Full Name *"
                  value={newAthleteName}
                  onChange={(e) => setNewAthleteName(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
                  required
                />
                <select
                  value={newAthleteSport}
                  onChange={(e) => setNewAthleteSport(e.target.value as SportId)}
                  className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="rugby">Rugby</option>
                  <option value="soccer">Soccer</option>
                  <option value="netball">Netball</option>
                  <option value="hockey">Hockey</option>
                  <option value="cricket">Cricket</option>
                  <option value="tennis">Tennis</option>
                  <option value="golf">Golf</option>
                </select>
                <select
                  value={newAthleteCategory}
                  onChange={(e) => setNewAthleteCategory(e.target.value as any)}
                  className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="elementary">Elementary (U10)</option>
                  <option value="middle_school">Middle School (U14)</option>
                  <option value="high_school">High School (U18)</option>
                </select>
                <input
                  type="text"
                  placeholder="Jersey # (Optional)"
                  value={newAthleteJersey}
                  onChange={(e) => setNewAthleteJersey(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Athlete Folder</span>
                </button>
              </div>
            </form>

            {/* Roster List */}
            <div className="space-y-2">
              {athletes.map((ath) => {
                const reportCount = savedReports.filter((r) => r.athleteId === ath.id || r.athleteName?.toLowerCase() === ath.name.toLowerCase()).length;
                return (
                  <div
                    key={ath.id}
                    className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-2xl flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-black text-xs text-amber-300">
                        {ath.jerseyNumber ? `#${ath.jerseyNumber}` : ath.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-black text-white">{ath.name}</h4>
                          <span className="text-[10px] text-zinc-400 font-mono capitalize">
                            {ath.category.replace('_', ' ')} • {ath.sportId}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 font-mono">
                          📁 {formatAthleteFolderName(ath.name)} ({reportCount} saved reports)
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteAthlete(ath.id)}
                      className="bg-zinc-900 hover:bg-red-950 hover:text-red-400 border border-zinc-800 p-2 rounded-xl text-zinc-500 transition-all"
                      title="Remove Athlete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}



        {/* Trophy Card Viewer Modal */}
        {selectedCard && (
          <TrophyCardViewerModal
            card={selectedCard}
            isOpen={!!selectedCard}
            onClose={() => setSelectedCard(null)}
            onDelete={onDeleteTrophyCard}
          />
        )}
      </div>
    </div>
  );
};
