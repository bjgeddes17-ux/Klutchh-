
export interface BiomechanicScenario {
  id: string;
  name: string;
  conditions: {
    metric: 'velocity' | 'torque' | 'symmetry' | 'safety' | 'score' | 'angle';
    operator: '>' | '<' | 'range';
    value: number | [number, number];
    jointId?: string;
  }[];
  insights: string[]; // Supports multiple variations
  priority: 'low' | 'medium' | 'high' | 'critical';
  sportIds: string[];
}

/**
 * MASTER SCENARIO LIBRARY
 * Deterministic coaching logic patterns with variational text.
 * Use placeholders: {velocity}, {torque}, {symmetry}, {safety}, {score}
 */
export const SCENARIO_LIBRARY: BiomechanicScenario[] = [
  {
    id: 'power_leak_velocity',
    name: 'Velocity vs Stability Leak',
    conditions: [
      { metric: 'velocity', operator: '>', value: 400 },
      { metric: 'score', operator: '<', value: 8 }
    ],
    insights: [
      "Your velocity is elite at {velocity} units, but your kinetic chain is leaking energy due to technical instability.",
      "Elite speed detected ({velocity}), yet efficiency is low. You're moving fast, but technical 'leaks' are reducing your impact.",
      "Biometric alert: High output ({velocity}) paired with sub-optimal form ({score}/10). Focus on stabilizing your core to convert that speed into power.",
      "You're generating massive speed ({velocity}), but your stability score of {score} suggests you're losing force through the kinetic chain."
    ],
    priority: 'high',
    sportIds: []
  },
  {
    id: 'asymmetric_torque_danger',
    name: 'Asymmetric Shear Load',
    conditions: [
      { metric: 'symmetry', operator: '<', value: 70 },
      { metric: 'torque', operator: '>', value: 12 }
    ],
    insights: [
      "High torque ({torque} Nm) measured with significant asymmetry ({symmetry}%). This puts uneven shear load on your joints.",
      "Critical Observation: Your {symmetry}% symmetry score combined with high torque loads ({torque} Nm) increases injury risk in your dominant side.",
      "Warning: Asymmetric loading detected. With {torque} Nm of torque and only {symmetry}% symmetry, your weight distribution needs immediate correction.",
      "Torque output is high ({torque} Nm), but your symmetry is lagging at {symmetry}%. You're overloading one side of the kinetic chain."
    ],
    priority: 'critical',
    sportIds: []
  },
  {
    id: 'low_stability_academy',
    name: 'Foundation Stability Alert',
    conditions: [
      { metric: 'safety', operator: '<', value: 60 },
      { metric: 'score', operator: '<', value: 6 }
    ],
    insights: [
      "Your foundation is currently unstable (Safety: {safety}%). We need to prioritize decelerating force control.",
      "Technical Debt Alert: Low safety metrics ({safety}%) and form score ({score}) indicate you're building power on an unstable base.",
      "Focus on the foundation. Your {safety}% safety rating suggests your joints are absorbing too much force. Slow down to speed up later.",
      "Biomechanical Warning: Stabilizer muscles are underperforming. With a safety score of {safety}%, we must fix your landing and bracing mechanics."
    ],
    priority: 'high',
    sportIds: []
  },
  {
    id: 'elite_efficiency_check',
    name: 'Elite Efficiency Detection',
    conditions: [
      { metric: 'score', operator: '>', value: 9 },
      { metric: 'torque', operator: '<', value: 5 }
    ],
    insights: [
      "Maximum efficiency detected. You are generating high-output movement with minimal joint stress ({torque} Nm).",
      "Elite Precision: Maintaining a {score}/10 form score while keeping torque under {torque} Nm is the hallmark of a pro.",
      "Kinematic Signature: Perfect. You've achieved elite-level efficiency with a symmetry score of {symmetry}% and optimal joint safety.",
      "Pro Status: Your movement efficiency is in the top 5%. High control, low stress ({torque} Nm), and perfect sequencing."
    ],
    priority: 'low',
    sportIds: []
  }
];

const PREFIXES = [
  "Technical Observation:",
  "Kinetic Insight:",
  "Pro-Level Note:",
  "Data Analysis:",
  "Coach's Eye:",
  "Biometric Alert:",
  "Performance Tip:"
];

function injectVariables(text: string, data: any): string {
  return text
    .replace(/{velocity}/g, Math.round(data.velocity).toString())
    .replace(/{torque}/g, data.torque.toFixed(1))
    .replace(/{symmetry}/g, Math.round(data.symmetry).toString())
    .replace(/{safety}/g, Math.round(data.safety).toString())
    .replace(/{score}/g, data.score.toFixed(1));
}

export function evaluateScenarios(
  data: {
    velocity: number;
    torque: number;
    symmetry: number;
    safety: number;
    score: number;
    angles: Record<string, number>;
  },
  sportId: string
): string[] {
  const insights: string[] = [];

  SCENARIO_LIBRARY.forEach(scenario => {
    if (scenario.sportIds.length > 0 && !scenario.sportIds.includes(sportId)) return;

    const allConditionsMet = scenario.conditions.every(cond => {
      let actualValue = 0;
      if (cond.metric === 'velocity') actualValue = data.velocity;
      if (cond.metric === 'torque') actualValue = data.torque;
      if (cond.metric === 'symmetry') actualValue = data.symmetry;
      if (cond.metric === 'safety') actualValue = data.safety;
      if (cond.metric === 'score') actualValue = data.score;
      if (cond.metric === 'angle' && cond.jointId) actualValue = data.angles[cond.jointId] || 0;

      if (cond.operator === '>') return actualValue > (cond.value as number);
      if (cond.operator === '<') return actualValue < (cond.value as number);
      if (cond.operator === 'range') {
        const [min, max] = cond.value as [number, number];
        return actualValue >= min && actualValue <= max;
      }
      return false;
    });

    if (allConditionsMet) {
      // Pick a random variation
      const rawInsight = scenario.insights[Math.floor(Math.random() * scenario.insights.length)];
      
      // Inject real numbers
      let processedInsight = injectVariables(rawInsight, data);
      
      // Occasionally add a prefix for more variety
      if (Math.random() > 0.4) {
        const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
        processedInsight = `${prefix} ${processedInsight}`;
      }
      
      insights.push(processedInsight);
    }
  });

  return insights;
}
