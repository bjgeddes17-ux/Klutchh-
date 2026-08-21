import { FrameAnalysis, SportRule } from '../types';
import { generateDynamicReport, DynamicSynthesisResult } from './dynamicNarrativeEngine';

export interface LongitudinalProgressRecord {
  timestamp: number;
  cycleNumber: number;
  score: number;
  peakAngularVelocity: number;
  symmetryIndex: number;
  progressSummary: string;
  milestoneUnlocked: string | null;
}

export interface LongitudinalAnalysisResult {
  currentCycle: number;
  daysUntilNextCalibration: number;
  progressDeltaScore: number;
  velocityGrowthRate: number; // percentage
  historyRecords: LongitudinalProgressRecord[];
  activeRecommendations: string[];
}

const STORAGE_KEY_LONGITUDINAL = 'klutchh_longitudinal_engine_state_v1';
const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

export function checkAndExecuteLongitudinalEngine(
  currentKeyframes: FrameAnalysis[],
  sportRule: SportRule,
  currentScore: number
): LongitudinalAnalysisResult {
  let storedData: {
    lastCalibrationTime: number;
    cycleCount: number;
    records: LongitudinalProgressRecord[];
  } | null = null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY_LONGITUDINAL);
    if (raw) {
      storedData = JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to load longitudinal engine state', e);
  }

  const now = Date.now();
  let lastTime = storedData?.lastCalibrationTime || (now - (14 * 24 * 60 * 60 * 1000)); // default to ready on first run
  let cycleCount = storedData?.cycleCount || 1;
  let records = storedData?.records || [];

  const elapsedTime = now - lastTime;
  const timeRemaining = Math.max(0, FOURTEEN_DAYS_MS - elapsedTime);
  const daysUntilNextCalibration = Math.ceil(timeRemaining / (24 * 60 * 60 * 1000));

  const dynamicReport = generateDynamicReport(currentKeyframes, sportRule);

  // If 14 days have elapsed or records are empty, execute the 14-day cycle recalculation
  if (elapsedTime >= FOURTEEN_DAYS_MS || records.length === 0) {
    cycleCount += 1;
    lastTime = now;

    const prevScore = records.length > 0 ? records[records.length - 1].score : currentScore - 0.4;
    const deltaScore = parseFloat((currentScore - prevScore).toFixed(1));

    let milestone: string | null = null;
    if (currentScore >= 9.0) milestone = '🏆 Elite Titan Milestone Unlocked (9.0+ Tier)';
    else if (deltaScore > 0.5) milestone = '⚡ Rapid Velocity Surge (+0.5 pts in 14 Days)';
    else milestone = '📈 Consistent Baseline Progression Cycle';

    const newRecord: LongitudinalProgressRecord = {
      timestamp: now,
      cycleNumber: cycleCount,
      score: currentScore,
      peakAngularVelocity: dynamicReport.kineticDataSummary.peakAngularVelocity,
      symmetryIndex: dynamicReport.kineticDataSummary.symmetryIndex,
      progressSummary: `Cycle ${cycleCount} Auto-Recalibration: Overall score adjusted by ${deltaScore >= 0 ? '+' : ''}${deltaScore} over 14 days with steady kinetic sequence retention.`,
      milestoneUnlocked: milestone
    };

    records.push(newRecord);
    // Keep last 10 records
    if (records.length > 10) records = records.slice(records.length - 10);

    try {
      localStorage.setItem(STORAGE_KEY_LONGITUDINAL, JSON.stringify({
        lastCalibrationTime: lastTime,
        cycleCount,
        records
      }));
    } catch (e) {
      console.warn('Failed to save longitudinal state', e);
    }
  }

  const latestRecord = records[records.length - 1] || { score: currentScore, peakAngularVelocity: 685 };
  const baseRecord = records[0] || latestRecord;
  const progressDelta = parseFloat((currentScore - baseRecord.score).toFixed(1));
  const velocityGrowth = parseFloat((((latestRecord.peakAngularVelocity - baseRecord.peakAngularVelocity) / (baseRecord.peakAngularVelocity || 1)) * 100).toFixed(1));

  const activeRecommendations = [
    `14-Day Cycle Status: Next automated biometric recalibration in ${daysUntilNextCalibration} days.`,
    progressDelta >= 0 ? `Positive upward trajectory: +${progressDelta} cumulative score improvement across training blocks.` : `Phase stabilization recommended to overcome recent plateau.`,
    `Kinetic efficiency retention rate remains optimal at ${dynamicReport ? dynamicReport.kineticDataSummary.sequencingEfficiency : 89}%`
  ];

  return {
    currentCycle: cycleCount,
    daysUntilNextCalibration,
    progressDeltaScore: progressDelta,
    velocityGrowthRate: velocityGrowth,
    historyRecords: records,
    activeRecommendations
  };
}
