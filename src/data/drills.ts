export type DrillCategory = 'foundation' | 'action';

export interface Drill {
  id: string;
  category: DrillCategory;
  name: string;
  description: string;
  videoUrl?: string; // Optional for now
}

export const DRILLS: Drill[] = [
  // Foundation Drills
  { id: 'f1', category: 'foundation', name: 'Shoulder Coiling', description: 'Focus on rotating your shoulders while keeping your lower body stable.' },
  { id: 'f2', category: 'foundation', name: 'Trophy Pose Setup', description: 'Ensure your elbow is at a 90-degree angle to prevent strain.' },
  
  // Action Drills
  { id: 'a1', category: 'action', name: 'Hip Explosion', description: 'Push off your back foot to initiate the movement.' },
  { id: 'a2', category: 'action', name: 'Follow-Through Balance', description: 'Hold your finish position for two seconds to ensure balance.' },
];
