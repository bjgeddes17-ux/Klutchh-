import { DrillItem } from '../data/drillLibrary';
import { AnalysisResult, DrillThreshold } from '../types';

/**
 * Utility function to define and inject specific biomechanical threshold rules
 * for each sports drill.
 */

// Specific threshold overrides for high-precision coaching
const DRILL_THRESHOLD_OVERRIDES: Record<string, DrillThreshold[]> = {
  'rugby-tackle-hinge': [
    { jointKey: 'hip_hinge', min: 120, max: 145, unit: '°', description: 'Spine & Hip Hinge Alignment' },
    { jointKey: 'knee_flex', min: 100, max: 125, unit: '°', description: 'Power Base Knee Flexion' }
  ],
  'soccer-strike-chest-over': [
    { jointKey: 'chest_over', min: 155, max: 172, unit: '°', description: 'Trajectory Control Lean' },
    { jointKey: 'plant_knee', min: 120, max: 145, unit: '°', description: 'Plant Foot Impact Absorption' }
  ],
  'netball-shot-vertical-arc': [
    { jointKey: 'elbow_flick', min: 165, max: 180, unit: '°', description: 'Overhead Release Extension' },
    { jointKey: 'knee_dip', min: 110, max: 135, unit: '°', description: 'Vertical Power Loading' }
  ],
  'cricket-bowling-action': [
    { jointKey: 'front_knee', min: 168, max: 180, unit: '°', description: 'Front-Leg Brace Lock' },
    { jointKey: 'arm_straight', min: 175, max: 180, unit: '°', description: 'Bowling Arm Legality (15° Law)' }
  ],
  'cricket-batting-brace': [
    { jointKey: 'knee_brace', min: 145, max: 165, unit: '°', description: 'Front Knee Bracing' }
  ]
};

export function getThresholdsForDrill(drill: DrillItem): DrillThreshold[] {
  // 1. Check for manual overrides first (highest precision)
  if (DRILL_THRESHOLD_OVERRIDES[drill.id]) {
    return DRILL_THRESHOLD_OVERRIDES[drill.id];
  }

  // 2. Parse the targetAngleRule string if it exists
  if (drill.targetAngleRule) {
    const thresholds: DrillThreshold[] = [];
    const match = drill.targetAngleRule.match(/(.+):\s*([\d\.]+)(?:°)?-([\d\.]+)(?:°)?/);
    
    if (match) {
      thresholds.push({
        jointKey: drill.targetJoint.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_'),
        min: parseFloat(match[2]),
        max: parseFloat(match[3]),
        unit: '°',
        description: match[1]
      });
      return thresholds;
    }
  }

  return [];
}

/**
 * Injects drill-specific thresholds into the AnalysisResult pipeline.
 */
export function injectDrillThresholds(result: AnalysisResult, drill?: DrillItem): AnalysisResult {
  if (!drill) return result;

  const thresholds = getThresholdsForDrill(drill);
  if (thresholds.length === 0) return result;

  // Clone to avoid side effects
  const enrichedResult = { ...result };
  
  if (enrichedResult.aiReport) {
    enrichedResult.aiReport.drillThresholds = thresholds;

    // Generate specific biomechanical feedback based on these thresholds
    const newInsights: string[] = [];
    
    thresholds.forEach(t => {
      const measuredValue = result.measuredAngles[t.jointKey];
      
      // If we don't have a direct joint key match, try searching in measuredAngles
      // some keys might be slightly different
      const actualValue = measuredValue ?? findSimilarMetric(result.measuredAngles, t.jointKey);

      if (actualValue !== undefined) {
        const isOptimal = actualValue >= t.min && actualValue <= t.max;
        const diff = isOptimal ? 0 : (actualValue < t.min ? t.min - actualValue : actualValue - t.max);
        
        const feedback = isOptimal
          ? `✓ Elite Threshold Met: Your ${t.description} was ${actualValue.toFixed(1)}${t.unit}, hitting the target ${t.min}-${t.max}${t.unit} corridor.`
          : `⚠ Threshold Alert: Your ${t.description} was ${actualValue.toFixed(1)}${t.unit}. You are ${diff.toFixed(1)}${t.unit} outside the elite ${t.min}-${t.max}${t.unit} range.`;
        
        newInsights.push(feedback);
      }
    });

    // Prepend these precise insights to the report
    if (newInsights.length > 0) {
      enrichedResult.aiReport.biomechanicInsights = [
        ...newInsights,
        ...(enrichedResult.aiReport.biomechanicInsights || [])
      ];
    }
  }

  return enrichedResult;
}

function findSimilarMetric(angles: Record<string, number>, key: string): number | undefined {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const target = normalize(key);
  
  // High confidence match: exact substring
  for (const [k, v] of Object.entries(angles)) {
    const nk = normalize(k);
    if (nk.includes(target) || target.includes(nk)) {
      return v;
    }
  }

  // Token-based matching (e.g., 'knee' matches 'rugby_tackle_knee_flex')
  const tokens = key.toLowerCase().split(/[^a-z0-9]/).filter(t => t.length > 2);
  for (const [k, v] of Object.entries(angles)) {
    const nk = normalize(k);
    if (tokens.some(t => nk.includes(t))) {
      return v;
    }
  }

  return undefined;
}
