
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
    name: 'Fast Movement but Low Control',
    conditions: [
      { metric: 'velocity', operator: '>', value: 400 },
      { metric: 'score', operator: '<', value: 8 }
    ],
    insights: [
      "You have awesome speed ({velocity} speed), but you are losing power because your body is wobbling slightly.",
      "Great quickness! To get full power on your shot or pass, keep your core and hips steady.",
      "Speed is high, but control is {score}/10. Slow down just a little bit to hit the perfect form.",
      "You are moving fast, but tightening your stomach muscles will give you much more solid power."
    ],
    priority: 'high',
    sportIds: []
  },
  {
    id: 'asymmetric_torque_danger',
    name: 'Leaning Too Much on One Side',
    conditions: [
      { metric: 'symmetry', operator: '<', value: 70 },
      { metric: 'torque', operator: '>', value: 12 }
    ],
    insights: [
      "You are putting most of your weight on one side ({symmetry}% balance). Try to keep your feet and hips centered.",
      "Watch your balance: you are leaning heavily to one side. Standing even protects your knees and ankles.",
      "Balance check ({symmetry}%): Put equal weight on both feet so you don't wear out one leg.",
      "Stay centered! Leaning too hard on one side slows you down and can make your joints sore."
    ],
    priority: 'critical',
    sportIds: []
  },
  {
    id: 'low_stability_academy',
    name: 'Knee & Ankle Landing Check',
    conditions: [
      { metric: 'safety', operator: '<', value: 60 },
      { metric: 'score', operator: '<', value: 6 }
    ],
    insights: [
      "Your knees need a softer bend on landing (Safety score: {safety}%). Bend your knees like a spring to stay safe.",
      "Landing tip: Don't let your knees cave inward. Keep them pointing over your middle toes.",
      "Soft landings protect your knees! Sink your hips down gently when you plant or land.",
      "Keep your feet wide and stable. Bending your knees softly absorbs shock and keeps you fast."
    ],
    priority: 'high',
    sportIds: []
  },
  {
    id: 'elite_efficiency_check',
    name: 'Smooth & Powerful Form',
    conditions: [
      { metric: 'score', operator: '>', value: 9 },
      { metric: 'torque', operator: '<', value: 5 }
    ],
    insights: [
      "Awesome technique! You are moving smoothly with great power and zero wasted effort.",
      "Pro level form! Your score is {score}/10. Everything looks smooth, balanced, and sharp.",
      "Great balance and control! Your body is lined up perfectly from your feet all the way to your arms.",
      "Top notch movement! You are getting maximum power while keeping your knees and back completely safe."
    ],
    priority: 'low',
    sportIds: []
  }
];

const PREFIXES = [
  "Coach Tip:",
  "Key Note:",
  "Quick Check:",
  "What to Watch:"
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
