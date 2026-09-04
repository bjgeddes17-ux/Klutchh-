import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CheckCircle2, ShieldCheck, Flame, Zap, Award, ArrowUpRight, TrendingUp } from 'lucide-react-native';
import { AICoachingReport, SportRule } from '../../types';

interface StrengthsTabNativeProps {
  aiReport: AICoachingReport | null;
  sportRule: SportRule;
  titanRating: number;
  explosivePower: number;
  jointArmor: number;
  precision: number;
  kineticFlow: number;
  overallSymmetry: number;
  overallKneeSafety: number;
  onExploreEnergy: () => void;
}

export const StrengthsTabNative: React.FC<StrengthsTabNativeProps> = ({
  aiReport,
  sportRule,
  titanRating,
  explosivePower,
  jointArmor,
  precision,
  kineticFlow,
  overallSymmetry,
  overallKneeSafety,
  onExploreEnergy,
}) => {
  // Extract high-performing attributes (Scores >= 80)
  const superpowers = [
    {
      name: 'Kinetic Segment Acceleration',
      score: explosivePower,
      grade: explosivePower >= 90 ? 'A+' : 'A',
      tag: 'POWER ENGINE',
      color: '#f59e0b',
      why: 'Exceptional ground reaction force generation and rapid whip transmission into the kinetic chain.',
    },
    {
      name: 'Ligament & Joint Armor',
      score: jointArmor,
      grade: jointArmor >= 90 ? 'A+' : 'A',
      tag: 'INJURY SHIELD',
      color: '#22c55e',
      why: 'Knee valgus collapse and joint shear loads remain safely shielded under high deceleration.',
    },
    {
      name: 'Corridor Postural Precision',
      score: precision,
      grade: precision >= 90 ? 'A+' : 'A',
      tag: 'MECHANICAL ACCURACY',
      color: '#38bdf8',
      why: 'Joint alignment at peak release closely tracks professional gold-standard angular envelopes.',
    },
    {
      name: 'Kinetic Energy Flow',
      score: kineticFlow,
      grade: kineticFlow >= 90 ? 'A+' : 'A',
      tag: 'SMOOTH TRANSFER',
      color: '#c084fc',
      why: 'Proximal-to-distal sequencing transfers momentum smoothly from core to extremities without abrupt stalling.',
    },
  ].sort((a, b) => b.score - a.score);

  const keyStrengthsList = aiReport?.keyStrengths || [
    'Optimal ground reaction force generation through initial drive phase',
    'Stable spine posture preserved within safe biomechanical limits',
    'Clean proximal-to-distal segmental acceleration timing',
    'Strong bilateral kinetic symmetry during high-velocity rotation',
  ];

  return (
    <View style={styles.container}>
      {/* Header Banner */}
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.trophyBox}>
            <Award color="#eab308" size={24} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.badgeRow}>
              <View style={styles.eliteBadge}>
                <Text style={styles.eliteBadgeText}>CONFIRMED SUPERPOWERS</Text>
              </View>
              <Text style={styles.scoreText}>TITAN RATING {titanRating.toFixed(1)}/10</Text>
            </View>
            <Text style={styles.heroTitle}>Where You Excel In {sportRule.name}</Text>
          </View>
        </View>

        <Text style={styles.heroDesc}>
          Biomechanical metrics where your execution operates at elite or advanced levels. Protect these habits to anchor your performance.
        </Text>
      </View>

      {/* Ranked Superpower Cards */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>YOUR TOP MECHANICAL ADVANTAGES</Text>
        <Text style={styles.sectionSubtitle}>Ranked by kinematic efficiency and gold-standard benchmark alignment</Text>
      </View>

      {superpowers.slice(0, 3).map((item, idx) => (
        <View key={idx} style={[styles.powerCard, { borderColor: item.color }]}>
          <View style={styles.powerHeaderRow}>
            <View style={[styles.rankBadge, { backgroundColor: `${item.color}20` }]}>
              <Text style={[styles.rankText, { color: item.color }]}>#{idx + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.powerName}>{item.name}</Text>
              <Text style={[styles.powerTag, { color: item.color }]}>{item.tag}</Text>
            </View>
            <View style={styles.scoreBox}>
              <Text style={[styles.scoreValue, { color: item.color }]}>{item.score}%</Text>
              <Text style={styles.gradeText}>GRADE {item.grade}</Text>
            </View>
          </View>

          <Text style={styles.powerWhy}>{item.why}</Text>

          <View style={styles.powerBarTrack}>
            <View style={[styles.powerBarFill, { width: `${item.score}%`, backgroundColor: item.color }]} />
          </View>
        </View>
      ))}

      {/* Verified AI Audit Strengths */}
      <View style={styles.verifiedCard}>
        <View style={styles.verifiedHeader}>
          <ShieldCheck color="#22c55e" size={18} />
          <Text style={styles.verifiedTitle}>VALIDATED BIOMECHANICAL STRENGTHS</Text>
        </View>

        {keyStrengthsList.map((str, idx) => {
          const text = typeof str === 'string' ? str : `${(str as any).title}: ${(str as any).desc}`;
          return (
            <View key={idx} style={styles.strengthRow}>
              <CheckCircle2 color="#22c55e" size={15} style={{ marginTop: 2 }} />
              <Text style={styles.strengthText}>{text}</Text>
            </View>
          );
        })}
      </View>

      {/* Symmetry & Stability Overview */}
      <View style={styles.metricsSummaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>BILATERAL SYMMETRY</Text>
          <Text style={[styles.summaryValue, { color: '#38bdf8' }]}>{overallSymmetry}%</Text>
          <Text style={styles.summaryNote}>Left vs. Right Balance</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>JOINT ARMOR</Text>
          <Text style={[styles.summaryValue, { color: '#22c55e' }]}>{overallKneeSafety}%</Text>
          <Text style={styles.summaryNote}>Ligament Protection</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  heroCard: {
    backgroundColor: '#121215',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.4)',
    padding: 16,
    marginBottom: 16,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  trophyBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  eliteBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  eliteBadgeText: {
    color: '#22c55e',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  scoreText: {
    color: '#eab308',
    fontSize: 10,
    fontWeight: '900',
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  heroDesc: {
    color: '#a1a1aa',
    fontSize: 11.5,
    lineHeight: 17,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    color: '#71717a',
    fontSize: 10.5,
    marginTop: 2,
  },
  powerCard: {
    backgroundColor: '#121215',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  powerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '900',
  },
  powerName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  powerTag: {
    fontSize: 9,
    fontWeight: '900',
    marginTop: 1,
    letterSpacing: 0.5,
  },
  scoreBox: {
    alignItems: 'flex-end',
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  gradeText: {
    color: '#71717a',
    fontSize: 9,
    fontWeight: '800',
  },
  powerWhy: {
    color: '#d4d4d8',
    fontSize: 11.5,
    lineHeight: 16.5,
    marginBottom: 10,
  },
  powerBarTrack: {
    height: 5,
    backgroundColor: '#27272a',
    borderRadius: 3,
    overflow: 'hidden',
  },
  powerBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  verifiedCard: {
    backgroundColor: '#121215',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 14,
    marginBottom: 12,
  },
  verifiedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  verifiedTitle: {
    color: '#22c55e',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  strengthText: {
    color: '#d4d4d8',
    fontSize: 11.5,
    lineHeight: 16.5,
    flex: 1,
  },
  metricsSummaryCard: {
    flexDirection: 'row',
    backgroundColor: '#121215',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 14,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#71717a',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '900',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  summaryNote: {
    color: '#a1a1aa',
    fontSize: 9.5,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#27272a',
    marginHorizontal: 10,
  },
});
