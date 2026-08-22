import { FrameAnalysis, SportRule, AICoachingReport, AthleteCategory, StrengthItem, AreaToImproveItem } from '../types';
import { calculateKlutchhScore } from './klutchhAnalysis';
import { calculateKineticTitanMetrics, getTitanRank } from './kineticTitanModel';

export interface DynamicSynthesisResult {
  report: AICoachingReport;
  score: number;
  kineticDataSummary: {
    peakAngularVelocity: number;
    estimatedPeakTorque: number;
    symmetryIndex: number;
    sequencingEfficiency: number;
    titanRank: string;
    explosivenessScore: number;
  };
}

export function generateDynamicReport(
  keyframes: FrameAnalysis[],
  sportRule: SportRule,
  athleteCategory: AthleteCategory = 'middle_school'
): DynamicSynthesisResult {
  const titanMetrics = calculateKineticTitanMetrics(keyframes);
  const titanRank = getTitanRank(titanMetrics.titanPower);

  // 1. Compute rule results
  const allAngles = keyframes.map(kf => {
    const vals = Object.values(kf.angles || {});
    return typeof vals[0] === 'number' ? vals[0] : 125;
  });
  const avgAngle = allAngles.length > 0 ? allAngles.reduce((a, b) => a + b, 0) / allAngles.length : 125;

  const ruleResults: Record<string, 'optimal' | 'good' | 'warning' | 'error'> = {};
  sportRule.techniques.forEach((tech, idx) => {
    const kf = keyframes[idx % keyframes.length];
    const angle = typeof Object.values(kf.angles || {})[0] === 'number' ? (Object.values(kf.angles || {})[0] as number) : avgAngle;
    let status: 'optimal' | 'good' | 'warning' | 'error' = 'good';
    if (angle >= 110 && angle <= 150) status = 'optimal';
    else if (angle >= 90 && angle <= 170) status = 'good';
    else if (angle >= 70 && angle <= 185) status = 'warning';
    else status = 'error';
    ruleResults[tech.name] = status;
  });

  const calculatedScore = calculateKlutchhScore(ruleResults);
  const gradeLetter = calculatedScore >= 9.0 ? 'A+' : calculatedScore >= 8.0 ? 'A' : calculatedScore >= 7.0 ? 'B' : 'C';

  // 2. Dynamic Narrative Generation
  let executiveSummary = '';
  const strengths: StrengthItem[] = [];
  const flaws: AreaToImproveItem[] = [];
  const insights: string[] = [];

  if (titanMetrics.titanPower >= 85) {
    executiveSummary = `Elite ${titanRank} performance detected. Exceptional kinetic chain integration with a peak angular velocity of ${titanMetrics.omega}°/s. The athlete demonstrates professional-grade proximal-to-distal sequencing, generating ${titanMetrics.torque} Nm of peak torque with minimal joint shear.`;
    strengths.push({ title: 'Explosive Velocity', desc: `Reached a peak angular velocity of ${titanMetrics.omega}°/s.`, metric: 'Elite' });
    strengths.push({ title: 'Torque Mastery', desc: `Generated ${titanMetrics.torque} Nm of biomechanical torque.`, metric: 'High' });
    insights.push(`Kinetic sequencing efficiency at ${titanMetrics.kineticFlow}%.`);
  } else if (titanMetrics.titanPower >= 65) {
    executiveSummary = `Solid ${titanRank} execution. The movement is biomechanically sound with consistent energy transfer. Peak torque reached ${titanMetrics.torque} Nm, though there is a ${titanMetrics.precision < 80 ? 'precision' : 'velocity'} bottleneck preventing transition to the next Titan tier.`;
    strengths.push({ title: 'Joint Armor', desc: `Maintained a high stability index of ${titanMetrics.jointArmor}%.`, metric: 'Solid' });
    insights.push(`Focus on increasing rate of force development (currently ${titanMetrics.explosiveness}%).`);
  } else {
    executiveSummary = `Initiate level mechanics observed. Biomechanical analysis reveals energy dissipation during the terminal acceleration phase. Peak velocity of ${titanMetrics.omega}°/s indicates a sequencing delay, resulting in sub-optimal ${titanMetrics.torque} Nm torque output.`;
    flaws.push({
      issue: 'Sequencing Lag',
      explanation: 'Proximal-to-distal timing breakdown reducing terminal power.',
      drillName: 'Titan Power Chain',
      drillReps: '3x10 reps',
      drillTip: 'Rotate hips before torso.'
    });
  }

  const phaseBreakdowns = sportRule.phases.map((phase, idx) => {
    const kf = keyframes[idx % keyframes.length];
    const measuredAngle = typeof Object.values(kf.angles || {})[0] === 'number' ? Math.round(Object.values(kf.angles || {})[0] as number) : 120;
    let status: 'optimal' | 'good' | 'warning' | 'error' = 'good';
    if (measuredAngle >= 110 && measuredAngle <= 145) status = 'optimal';
    else if (measuredAngle >= 95 && measuredAngle <= 165) status = 'good';
    else status = 'warning';

    return {
      phaseName: phase,
      status,
      measuredAngle,
      targetRange: '110° - 140°',
      coachingAdvice: status === 'optimal' ? 'Perfect precision.' : 'Watch joint alignment.',
      biomechanicalImpact: 'Force transmission efficiency.'
    };
  });

  const aiReport: AICoachingReport = {
    overallGrade: gradeLetter,
    summaryTitle: `${sportRule.name} ${titanRank} Report`,
    summaryText: executiveSummary,
    keyStrengths: strengths,
    biomechanicInsights: insights,
    strengthsDetailed: strengths,
    areasToImprove: flaws,
    injuryRiskAssessment: {
      level: titanMetrics.jointArmor > 80 ? 'low' : 'moderate',
      findings: [titanMetrics.jointArmor < 70 ? 'High joint shear detected.' : 'No major safety issues.'],
      preventionDrills: ['Stability Holds']
    },
    funCorrectiveDrills: flaws.map(f => ({
      name: f.drillName,
      description: f.explanation,
      reps: f.drillReps,
      coachingCue: f.drillTip
    })),
    coachEncouragement: titanMetrics.titanPower > 80 ? "Keep pushing the limits of your Titan form!" : "Focus on the drills to unlock more power.",
    kineticSummary: {
      headline: `${titanRank} Level Performance`,
      summary: executiveSummary,
      takeaways: insights.map(i => ({ category: 'Biomechanics', title: 'Insight', detail: i })),
      weeklyPrescription: flaws.map(f => ({ title: f.drillName, detail: f.drillTip }))
    }
  };

  return {
    report: aiReport,
    score: calculatedScore,
    kineticDataSummary: {
      peakAngularVelocity: titanMetrics.omega,
      estimatedPeakTorque: titanMetrics.torque,
      symmetryIndex: titanMetrics.jointArmor,
      sequencingEfficiency: titanMetrics.kineticFlow,
      titanRank,
      explosivenessScore: titanMetrics.explosiveness
    }
  };
}


