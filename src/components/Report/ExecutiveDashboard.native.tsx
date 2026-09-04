import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AICoachingReport, SportRule } from '../../types';

interface ExecutiveDashboardProps {
  aiReport: AICoachingReport | null;
  sportRule: SportRule;
  titanRating: number;
  explosivePower: number;
  jointArmor: number;
  precision: number;
  kineticFlow: number;
  onSelectExplainer: (info: { title: string; score: number; desc: string; formula: string }) => void;
}

export const ExecutiveDashboardNative: React.FC<ExecutiveDashboardProps> = ({
  aiReport,
  sportRule,
  titanRating,
  explosivePower,
  jointArmor,
  precision,
  kineticFlow,
  onSelectExplainer,
}) => {
  return (
    <View style={styles.executiveCard}>
      <View style={styles.executiveTopRow}>
        <View style={styles.gradeBox}>
          <Text style={styles.gradeIcon}>
            {aiReport?.overallGrade?.startsWith('A') ? '🏆' : '🏅'}
          </Text>
        </View>
        <View style={styles.executiveInfo}>
          <View style={styles.tierPillRow}>
            <View style={styles.tierPill}>
              <Text style={styles.tierPillText}>
                {aiReport?.overallGrade?.startsWith('A') ? 'ELITE CHAMPION' : 'ADVANCED ATHLETE'}
              </Text>
            </View>
            <View style={styles.titanPill}>
              <Text style={styles.titanPillText}>
                ⚡ TITAN RATING: {titanRating.toFixed(1)} / 10
              </Text>
            </View>
          </View>
          <Text style={styles.athleteTitle}>
            {sportRule.name} {aiReport?.overallGrade?.startsWith('A') ? 'Titan' : 'Prodigy'}
          </Text>
        </View>
      </View>

      {/* 4 Biomechanical Attributes Grid */}
      <View style={styles.attributesGrid}>
        <TouchableOpacity
          onPress={() =>
            onSelectExplainer({
              title: 'Explosive Power',
              score: explosivePower,
              desc: 'Quantifies force output and velocity propagation through the kinetic chain.',
              formula: 'P = Force (Ground Reaction) × Angular Velocity (deg/s)',
            })
          }
          style={styles.attributeItem}
          activeOpacity={0.7}
        >
          <Text style={styles.attributeLabel}>⚡ POWER</Text>
          <Text style={[styles.attributeValue, { color: '#f59e0b' }]}>{explosivePower}%</Text>
          <View style={styles.attributeBarTrack}>
            <View
              style={[
                styles.attributeBarFill,
                { width: `${explosivePower}%`, backgroundColor: '#f59e0b' },
              ]}
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            onSelectExplainer({
              title: 'Joint Armor',
              score: jointArmor,
              desc: 'Quantifies ligament protection, knee valgus resistance, and shock absorption.',
              formula: 'Armor = 100 - Valgus Displacement Index - Shear Load Penalty',
            })
          }
          style={styles.attributeItem}
          activeOpacity={0.7}
        >
          <Text style={styles.attributeLabel}>🛡️ ARMOR</Text>
          <Text style={[styles.attributeValue, { color: '#22c55e' }]}>{jointArmor}%</Text>
          <View style={styles.attributeBarTrack}>
            <View
              style={[
                styles.attributeBarFill,
                { width: `${jointArmor}%`, backgroundColor: '#22c55e' },
              ]}
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            onSelectExplainer({
              title: 'Precision',
              score: precision,
              desc: 'Measures body alignment checkpoints against gold-standard joint corridors.',
              formula: 'Precision = Σ (1 - |Measured - Ideal| / Corridor_Width)',
            })
          }
          style={styles.attributeItem}
          activeOpacity={0.7}
        >
          <Text style={styles.attributeLabel}>🎯 PRECISION</Text>
          <Text style={[styles.attributeValue, { color: '#38bdf8' }]}>{precision}%</Text>
          <View style={styles.attributeBarTrack}>
            <View
              style={[
                styles.attributeBarFill,
                { width: `${precision}%`, backgroundColor: '#38bdf8' },
              ]}
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            onSelectExplainer({
              title: 'Kinetic Flow',
              score: kineticFlow,
              desc: 'Quantifies seamless energy transfer from ground contact through arms without leaks.',
              formula: 'Flow = Proximal_to_Distal Timing Index × Transfer Efficiency',
            })
          }
          style={styles.attributeItem}
          activeOpacity={0.7}
        >
          <Text style={styles.attributeLabel}>🔄 FLOW</Text>
          <Text style={[styles.attributeValue, { color: '#c084fc' }]}>{kineticFlow}%</Text>
          <View style={styles.attributeBarTrack}>
            <View
              style={[
                styles.attributeBarFill,
                { width: `${kineticFlow}%`, backgroundColor: '#c084fc' },
              ]}
            />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  executiveCard: {
    backgroundColor: '#121215',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    padding: 16,
    marginBottom: 14,
  },
  executiveTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  gradeBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeIcon: {
    fontSize: 22,
  },
  executiveInfo: {
    flex: 1,
  },
  tierPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  tierPill: {
    backgroundColor: '#27272a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tierPillText: {
    color: '#a1a1aa',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  titanPill: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.4)',
  },
  titanPillText: {
    color: '#eab308',
    fontSize: 9,
    fontWeight: '900',
  },
  athleteTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  attributesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  attributeItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 10,
  },
  attributeLabel: {
    color: '#71717a',
    fontSize: 9,
    fontWeight: '900',
    marginBottom: 4,
  },
  attributeValue: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 6,
    fontFamily: 'monospace',
  },
  attributeBarTrack: {
    height: 4,
    backgroundColor: '#27272a',
    borderRadius: 2,
    overflow: 'hidden',
  },
  attributeBarFill: {
    height: '100%',
    borderRadius: 2,
  },
});
