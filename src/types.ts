export type SportId = 'rugby' | 'soccer' | 'netball' | 'hockey' | 'cricket' | 'tennis' | 'golf' | 'basketball' | 'swim';

export type AthleteCategory = 'elementary' | 'middle_school' | 'high_school';

export type SkillLevel = 'grassroots' | 'academy' | 'elite_pro';

export interface LevelTolerance {
  idealMin: number;
  idealMax: number;
  toleranceMargin: number; // Tighter margin = higher difficulty
}

export interface JointRule {
  id: string;
  name: string;
  description: string;
  sportId: SportId;
  phase: string;
  keypoints: [number, number, number]; // e.g. [Shoulder, Elbow, Wrist] -> angle at Elbow
  idealMin: number; // degrees
  idealMax: number; // degrees
  unit: string;
  importance: 'critical_safety' | 'performance' | 'posture';
  difficultyTier: SkillLevel; // Minimum tier where this rule activates
  tolerancesByLevel: {
    grassroots: LevelTolerance;
    academy: LevelTolerance;
    elite_pro: LevelTolerance;
  };
  impactOnPerformance: string;
  injuryRiskFactor: string;
  targetSpeed?: number; // deg/s
  targetTorque?: number; // relative units
  feedbackVariations?: {
    optimal: string[];
    warning: string[];
    error: string[];
  };
}

export interface Drill {
  name: string;
  description: string;
  reps: string;
  whyThisWorks?: string;
  purpose?: string;
  howToExecute?: string[];
  coachingCue?: string;
  targetJoint?: string;
  difficultyTier?: SkillLevel;
}

export type CorrectiveDrill = Drill;

export interface MediaPipeLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface FrameAnalysis {
  timestamp: number; // seconds
  frameNumber?: number;
  landmarks: MediaPipeLandmark[];
  angles: Record<string, number>; // ruleId -> calculated angle
  ruleResults: Record<string, 'optimal' | 'good' | 'warning' | 'error'>;
  symmetryScore?: number; // 0-100%
  kneeSafetyScore?: number; // 0-100%
  detectedPhase: string;
  activeLevel?: SkillLevel;
  isRealDetection?: boolean;
  velocity?: Record<string, number>; // Angular velocity in deg/s
  torque?: Record<string, number>; // Estimated relative torque
  triggerTag?: string; // Biomechanical marker for this specific frame
}

export interface PhaseTrigger {
  phase: string;
  condition: 'angle_gt' | 'angle_lt' | 'velocity_gt' | 'velocity_lt' | 'relative_y_lt' | 'relative_y_gt';
  ruleId?: string; // For angle/velocity triggers
  jointId?: number; // For relative position triggers
  targetId?: number; // For relative position comparison
  threshold: number;
  requiredBiomechanics?: string; // Descriptive tag of what must happen (e.g. "Lead arm must lock to 180°")
}

export interface MovementTechnique {
  id: string;
  name: string;
  description: string;
  phases: string[];
  sequence: string[];
  jointRules: JointRule[];
  triggers?: PhaseTrigger[];
}

export interface SportRule {
  id: SportId;
  name: string;
  iconName: string;
  category: string;
  description: string;
  kidFocus: string;
  techniques: MovementTechnique[];
  phases: string[];
  sequence: string[];
  jointRules: JointRule[];
  drills?: Drill[];
  sampleVideoUrl?: string;
  sampleVideoTitle?: string;
}

export interface StrengthItem {
  title: string;
  desc: string;
  metric: string;
}

export interface AreaToImproveItem {
  issue: string;
  explanation: string;
  drillName: string;
  drillReps: string;
  drillTip: string;
}

export interface ExecutiveDossier {
  headline: string;
  overviewText: string;
  detectedFault: {
    title: string;
    description: string;
    angleDeviation: string;
    impact: string;
  };
  goldStandard: {
    title: string;
    description: string;
    idealRange: string;
    forceTransmission: string;
  };
}

export interface KineticTakeaway {
  category: string;
  title: string;
  detail: string;
}

export interface KineticSummary {
  headline: string;
  summary: string;
  takeaways: KineticTakeaway[];
  weeklyPrescription: { title: string; detail: string }[];
}

export interface AICoachingReport {
  overallGrade: string;
  summaryTitle: string;
  keyStrengths: (string | StrengthItem)[];
  biomechanicInsights: string[];
  executiveDossier?: ExecutiveDossier;
  strengthsDetailed?: StrengthItem[];
  areasToImprove?: AreaToImproveItem[];
  kineticSummary?: KineticSummary;
  injuryRiskAssessment: {
    level: 'low' | 'moderate' | 'high';
    findings: string[];
    preventionDrills: string[];
    explanation?: string;
  };
  funCorrectiveDrills: CorrectiveDrill[];
  coachEncouragement: string;
  averageVelocities?: Record<string, number>;
  averageTorques?: Record<string, number>;
  gamifiedKidDossier?: any;
  proTipsAndCoolFacts?: any;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: 'Coach' | 'Athlete' | 'Parent';
  avatar?: string;
  clubOrSchool?: string;
}

export interface AthleteProfile {
  id: string;
  name: string;
  category: AthleteCategory;
  sportId: SportId;
  jerseyNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface SavedReport {
  id: string;
  title: string;
  createdAt: string;
  sportId: SportId;
  sportName: string;
  movementPhase: string;
  athleteId?: string;
  athleteName?: string;
  folderName?: string;
  videoUrl?: string;
  duration: number;
  overallGrade: string;
  overallScore: number;
  symmetryScore: number;
  kneeSafetyScore: number;
  keyframeList: FrameAnalysis[];
  allFrames?: FrameAnalysis[];
  report: AICoachingReport;
  sequenceComparison?: {
    ideal: string[];
    actual: string[];
    isCorrect: boolean;
    feedback: string;
  };
  kineticSequence?: {
    steps: {
      name: string;
      timestamp: number;
      score: number;
      status: 'optimal' | 'good' | 'warning' | 'error';
    }[];
    firingOrder: {
      joint: string;
      peakTime: number;
      peakVelocity: number;
    }[];
    isCorrectOrder: boolean;
    sequenceEfficiency: number;
  };
  dynamicMetrics?: {
    peakAngularVelocity: number;
    estimatedPeakTorque: number;
    explosivenessScore: number;
  };
  coachNotes?: string;
  authorName: string;
  drillProgress?: Record<number, 'pending' | 'completed' | 'mastered'>;
  isPro30FpsPipeline?: boolean;
  cloudVideoUrl?: string;
  processingMode?: 'pro_30fps_cloud' | 'standard_client';
  preRenderedFrames?: { timestamp: number; dataUrl: string }[];
}

export interface AnalysisResult {
  keyframes: FrameAnalysis[];
  allFrames?: FrameAnalysis[];
  aiReport: AICoachingReport;
  overallSymmetry: number;
  overallKneeSafety: number;
  measuredAngles: Record<string, number>;
  ruleResultsSummary: Record<string, 'optimal' | 'good' | 'warning' | 'error'>;
  sequenceComparison: {
    ideal: string[];
    actual: string[];
    isCorrect: boolean;
    feedback: string;
  };
  kineticSequence: {
    steps: {
      name: string;
      timestamp: number;
      score: number;
      status: 'optimal' | 'good' | 'warning' | 'error';
    }[];
    firingOrder: {
      joint: string;
      peakTime: number;
      peakVelocity: number;
    }[];
    isCorrectOrder: boolean;
    sequenceEfficiency: number;
  };
  dynamicMetrics: {
    peakAngularVelocity: number;
    estimatedPeakTorque: number;
    explosivenessScore: number;
  };
  isInvalidVideo?: boolean;
  invalidVideoReason?: string;
  invalidVideoCategory?: 'ok' | 'static_meme' | 'blank_screen' | 'no_human' | 'incomplete_body' | 'stationary' | 'sport_mismatch' | 'meme_or_static' | 'blank_or_dark' | 'stationary_subject' | 'general';
  invalidVideoTitle?: string;
  suggestedSport?: SportId;
  detectedMotionProfile?: string;
  isPro30FpsPipeline?: boolean;
  cloudVideoUrl?: string;
  processingMode?: 'pro_30fps_cloud' | 'standard_client';
  preRenderedFrames?: { timestamp: number; dataUrl: string }[];
}

export interface TrophyCard {
  id: string;
  userId: string;
  athleteId?: string;
  athleteName: string;
  sportId: SportId;
  sportName: string;
  movementPhase: string;
  grade: string;
  score: number;
  cardStyle: 'vintage_gold' | 'neon_ignite' | 'emerald_mastery' | 'diamond_prestige' | 'midnight_stealth';
  selectedStats: { label: string; value: string; icon?: string }[];
  landmarks: MediaPipeLandmark[];
  ruleResults?: Record<string, 'optimal' | 'good' | 'warning' | 'error'>;
  calculatedAngles?: Record<string, number>;
  coachingCue?: string;
  createdAt: string;
  capturedImage?: string;
  sportAttributes?: { label: string; value: number; name?: string }[];
}

