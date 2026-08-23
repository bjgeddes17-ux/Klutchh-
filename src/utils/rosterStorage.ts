import { get, set } from 'idb-keyval';
import { AthleteProfile, SavedReport, SportId, AthleteCategory, TrophyCard } from '../types';

const ROSTER_STORAGE_KEY = 'klutchh_coach_roster';
const TROPHY_CABINET_KEY = 'klutchh_trophy_cabinet';

export const DEFAULT_ATHLETES: AthleteProfile[] = [
  {
    id: 'ath_default_1',
    name: 'Marcus Rashford',
    category: 'high_school',
    sportId: 'soccer',
    jerseyNumber: '10',
    notes: 'Focusing on striking follow-through and hip rotation torque.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ath_default_2',
    name: 'Sarah Chen',
    category: 'middle_school',
    sportId: 'tennis',
    jerseyNumber: '4',
    notes: 'Improving serve trophy pose elbow angle and knee drive.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ath_default_3',
    name: 'Liam O\'Connor',
    category: 'elementary',
    sportId: 'rugby',
    jerseyNumber: '7',
    notes: 'Tackle hinge positioning and head-up spine alignment.',
    createdAt: new Date().toISOString(),
  }
];

export async function getCoachAthletes(): Promise<AthleteProfile[]> {
  try {
    const roster = await get<AthleteProfile[]>(ROSTER_STORAGE_KEY);
    if (roster && Array.isArray(roster)) {
      return roster;
    }
    // Seed default athletes if undefined/not initialized yet
    await set(ROSTER_STORAGE_KEY, DEFAULT_ATHLETES);
    return DEFAULT_ATHLETES;
  } catch (e) {
    console.warn('Failed to load coach athletes from storage:', e);
    return DEFAULT_ATHLETES;
  }
}

export async function saveCoachAthlete(athlete: AthleteProfile): Promise<AthleteProfile[]> {
  const current = await getCoachAthletes();
  const index = current.findIndex((a) => a.id === athlete.id);
  let updated: AthleteProfile[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = athlete;
  } else {
    updated = [athlete, ...current];
  }
  await set(ROSTER_STORAGE_KEY, updated);
  return updated;
}

export async function deleteCoachAthlete(athleteId: string): Promise<AthleteProfile[]> {
  const current = await getCoachAthletes();
  const updated = current.filter((a) => a.id !== athleteId);
  // Always save even if empty array so it doesn't re-seed defaults
  await set(ROSTER_STORAGE_KEY, updated);
  return updated;
}

export function formatAthleteFolderName(athleteName: string): string {
  const safeName = athleteName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  return `Klutchh/${safeName}`;
}

export interface AthleteFolderGroup {
  athlete: AthleteProfile | { id: string; name: string; category?: AthleteCategory; sportId?: SportId };
  folderName: string;
  reports: SavedReport[];
  trophyCards: TrophyCard[];
}

export function groupReportsByAthleteFolder(
  reports: SavedReport[],
  athletes: AthleteProfile[],
  trophyCards: TrophyCard[] = []
): AthleteFolderGroup[] {
  const athleteMap = new Map<string, AthleteProfile>();
  athletes.forEach((a) => athleteMap.set(a.id, a));

  const groups = new Map<string, AthleteFolderGroup>();

  // Ensure all registered athletes have a folder even if 0 reports yet
  athletes.forEach((ath) => {
    groups.set(ath.id, {
      athlete: ath,
      folderName: formatAthleteFolderName(ath.name),
      reports: [],
      trophyCards: []
    });
  });

  // Assign reports to athlete folders
  const unassignedReports: SavedReport[] = [];

  reports.forEach((rep) => {
    if (rep.athleteId && groups.has(rep.athleteId)) {
      groups.get(rep.athleteId)!.reports.push(rep);
    } else if (rep.athleteName) {
      // Find matching athlete by name or create virtual folder
      const match = athletes.find((a) => a.name.toLowerCase() === rep.athleteName?.toLowerCase());
      if (match) {
        groups.get(match.id)?.reports.push(rep);
      } else {
        const virtualId = `virtual_${rep.athleteName.toLowerCase().replace(/\s+/g, '_')}`;
        if (!groups.has(virtualId)) {
          groups.set(virtualId, {
            athlete: { id: virtualId, name: rep.athleteName, sportId: rep.sportId },
            folderName: formatAthleteFolderName(rep.athleteName),
            reports: [],
            trophyCards: []
          });
        }
        groups.get(virtualId)!.reports.push(rep);
      }
    } else {
      unassignedReports.push(rep);
    }
  });

  // Assign trophy cards to athlete folders
  const unassignedCards: TrophyCard[] = [];
  trophyCards.forEach((card) => {
    if (card.athleteId && groups.has(card.athleteId)) {
      groups.get(card.athleteId)!.trophyCards.push(card);
    } else if (card.athleteName) {
      const match = athletes.find((a) => a.name.toLowerCase() === card.athleteName?.toLowerCase());
      if (match) {
        groups.get(match.id)?.trophyCards.push(card);
      } else {
        const virtualId = `virtual_${card.athleteName.toLowerCase().replace(/\s+/g, '_')}`;
        if (!groups.has(virtualId)) {
          groups.set(virtualId, {
            athlete: { id: virtualId, name: card.athleteName, sportId: card.sportId },
            folderName: formatAthleteFolderName(card.athleteName),
            reports: [],
            trophyCards: []
          });
        }
        groups.get(virtualId)!.trophyCards.push(card);
      }
    } else {
      unassignedCards.push(card);
    }
  });

  if (unassignedReports.length > 0 || unassignedCards.length > 0) {
    groups.set('unassigned', {
      athlete: { id: 'unassigned', name: 'General / Unassigned' },
      folderName: 'Klutchh/General',
      reports: unassignedReports,
      trophyCards: unassignedCards
    });
  }

  return Array.from(groups.values()).sort((a, b) => (b.reports.length + b.trophyCards.length) - (a.reports.length + a.trophyCards.length));
}

/**
 * Exports a single report or an entire athlete's folder package
 */
export function exportAthleteReportFile(report: SavedReport, videoBase64?: string | null) {
  const safeAthlete = (report.athleteName || 'Athlete').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeSport = report.sportName.toLowerCase().replace(/\s+/g, '_');
  const dateStr = new Date(report.createdAt).toISOString().split('T')[0];
  const filename = `Klutchh_${safeAthlete}_${safeSport}_${dateStr}.klutchh`;

  const payload = {
    version: '1.2',
    type: 'klutchh_athlete_report',
    folder: formatAthleteFolderName(report.athleteName || 'Athlete'),
    athleteName: report.athleteName || 'Athlete',
    athleteId: report.athleteId || null,
    exportedAt: new Date().toISOString(),
    report: {
      ...report,
      videoData: videoBase64 || null
    }
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
