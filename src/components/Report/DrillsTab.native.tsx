import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Flame, Play, Zap, Award, CheckCircle2, Shield, Plus, Minus } from 'lucide-react-native';
import Svg, { Circle, Text as SvgText, G } from 'react-native-svg';
import { DrillItem } from '../../data/drillLibrary';
import { AnimatedDrillVisualizer } from './AnimatedDrillVisualizer.native';

interface DrillsTabNativeProps {
  drills: DrillItem[];
  drillStatuses: Record<number, 'pending' | 'completed' | 'mastered'>;
  onCycleStatus: (index: number) => void;
  onInspectFrames: () => void;
}

export const DrillsTabNative: React.FC<DrillsTabNativeProps> = ({
  drills,
  drillStatuses,
  onCycleStatus,
  onInspectFrames,
}) => {
  const [expandedDrillIdx, setExpandedDrillIdx] = useState<number | null>(0);
  const [repCounts, setRepCounts] = useState<Record<number, number>>({ 0: 10, 1: 5, 2: 0 });

  const completedCount = Object.values(drillStatuses).filter(s => s === 'completed').length;
  const masteredCount = Object.values(drillStatuses).filter(s => s === 'mastered').length;
  const totalDrills = drills.length || 3;
  const totalXp = masteredCount * 250 + completedCount * 100;

  // Donut Ring SVG Math
  const ringSize = 90;
  const strokeWidth = 10;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressPct = Math.min(100, Math.max(0, ((masteredCount + completedCount * 0.5) / totalDrills) * 100));
  const strokeDashoffset = circumference - (progressPct / 100) * circumference;

  const updateReps = (idx: number, delta: number) => {
    setRepCounts(prev => ({
      ...prev,
      [idx]: Math.max(0, (prev[idx] || 0) + delta)
    }));
  };

  return (
    <View style={styles.container}>
      {/* Biomechanical Mastery Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryLeft}>
          <View style={styles.summaryBadge}>
            <Award color="#eab308" size={14} />
            <Text style={styles.summaryBadgeText}>ATHLETE QUEST MATRIX</Text>
          </View>
          <Text style={styles.summaryTitle}>Corrective Action Plan</Text>
          <Text style={styles.summarySubtitle}>
            Complete assigned repetitions to re-train neural pathways and fix kinetic leaks.
          </Text>

          <View style={styles.xpRow}>
            <View style={styles.xpPill}>
              <Zap color="#eab308" size={12} />
              <Text style={styles.xpText}>+{totalXp} XP EARNED</Text>
            </View>
            <Text style={styles.statText}>
              {masteredCount}/{totalDrills} MASTERED
            </Text>
          </View>
        </View>

        {/* SVG Progress Ring */}
        <View style={styles.ringBox}>
          <Svg width={ringSize} height={ringSize}>
            <G rotation="-90" origin={`${ringSize / 2}, ${ringSize / 2}`}>
              <Circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                stroke="#1f1f23"
                strokeWidth={strokeWidth}
                fill="none"
              />
              <Circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                stroke="#eab308"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
              />
            </G>
            <SvgText
              x={ringSize / 2}
              y={ringSize / 2 + 4}
              fill="#ffffff"
              fontSize="16"
              fontWeight="900"
              textAnchor="middle"
            >
              {Math.round(progressPct)}%
            </SvgText>
          </Svg>
        </View>
      </View>

      <View style={styles.drillsHeader}>
        <Text style={styles.sectionTitle}>PRESCRIPTION DRILL MATRIX</Text>
        <Text style={styles.sectionSubtitle}>
          Custom biomechanical drills configured for kinetic chain refinement. Tap status to log progress.
        </Text>
      </View>

      {drills.map((drill, idx) => {
        const isExpanded = expandedDrillIdx === idx;
        const status = drillStatuses[idx] || 'pending';
        const currentReps = repCounts[idx] || 0;

        return (
          <View key={drill.id || idx} style={styles.drillCardBig}>
            {/* Drill Header */}
            <TouchableOpacity
              onPress={() => setExpandedDrillIdx(isExpanded ? null : idx)}
              style={styles.drillHeaderRow}
              activeOpacity={0.7}
            >
              <View style={styles.drillIconBox}>
                <Flame color="#ef4444" size={18} />
              </View>
              <View style={styles.drillTitleGroup}>
                <Text style={styles.drillTitleBig}>{drill.title}</Text>
                <Text style={styles.drillTargetText}>
                  🎯 Target: {drill.targetJoint} • {drill.category}
                </Text>
              </View>

              {/* Status Pill */}
              <TouchableOpacity
                onPress={() => onCycleStatus(idx)}
                style={[
                  styles.statusPill,
                  status === 'mastered'
                    ? styles.statusMastered
                    : status === 'completed'
                    ? styles.statusCompleted
                    : styles.statusPending,
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.statusPillText,
                    status === 'mastered'
                      ? styles.statusMasteredText
                      : status === 'completed'
                      ? styles.statusCompletedText
                      : styles.statusPendingText,
                  ]}
                >
                  {status.toUpperCase()}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>

            <Text style={styles.drillDescriptionBig}>{drill.description}</Text>

            {/* Animated Movement Visualizer */}
            <AnimatedDrillVisualizer
              drillTitle={drill.title}
              targetJoint={drill.targetJoint}
              category={drill.category}
              coachingCue={drill.coachingCue}
            />

            {/* Step-by-Step Instructions (Expandable) */}
            {isExpanded && drill.steps && drill.steps.length > 0 && (
              <View style={styles.stepsContainer}>
                <Text style={styles.stepsHeading}>STEP-BY-STEP INSTRUCTIONS</Text>
                {drill.steps.map((step, sIdx) => (
                  <View key={sIdx} style={styles.stepItem}>
                    <View style={styles.stepNumberBadge}>
                      <Text style={styles.stepNumberText}>{sIdx + 1}</Text>
                    </View>
                    <Text style={styles.stepDescriptionText}>{step}</Text>
                  </View>
                ))}

                {drill.biomechanicalBenefit ? (
                  <View style={styles.benefitBox}>
                    <Zap color="#eab308" size={14} />
                    <Text style={styles.benefitText}>{drill.biomechanicalBenefit}</Text>
                  </View>
                ) : null}
              </View>
            )}

            {/* Drill Interactive Rep Counter Row */}
            <View style={styles.repTrackerRow}>
              <Text style={styles.repTrackerLabel}>LOG REPS COMPLETED:</Text>
              <View style={styles.counterGroup}>
                <TouchableOpacity onPress={() => updateReps(idx, -1)} style={styles.counterBtn}>
                  <Minus color="#ffffff" size={12} />
                </TouchableOpacity>
                <Text style={styles.counterVal}>{currentReps} REPS</Text>
                <TouchableOpacity onPress={() => updateReps(idx, 1)} style={styles.counterBtnPlus}>
                  <Plus color="#000000" size={12} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Drill Footer Row */}
            <View style={styles.drillFooterRow}>
              <View style={styles.repBadge}>
                <Text style={styles.repText}>{drill.reps || '3 sets x 10 reps'}</Text>
              </View>

              <TouchableOpacity
                onPress={onInspectFrames}
                style={styles.startQuestBtn}
                activeOpacity={0.7}
              >
                <Play color="#000000" size={12} />
                <Text style={styles.startQuestBtnText}>INSPECT FRAMES</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0c0c10',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.4)',
    padding: 14,
    marginBottom: 16,
  },
  summaryLeft: {
    flex: 1,
  },
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  summaryBadgeText: {
    color: '#eab308',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  summaryTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  summarySubtitle: {
    color: '#a1a1aa',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
    marginBottom: 10,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  xpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.3)',
  },
  xpText: {
    color: '#eab308',
    fontSize: 9.5,
    fontWeight: '900',
  },
  statText: {
    color: '#22c55e',
    fontSize: 10,
    fontWeight: '900',
  },
  ringBox: {
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drillsHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    color: '#71717a',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
  drillCardBig: {
    backgroundColor: '#0c0c10',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#27272a',
    marginBottom: 12,
  },
  drillHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  drillIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drillTitleGroup: {
    flex: 1,
  },
  drillTitleBig: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  drillTargetText: {
    color: '#a1a1aa',
    fontSize: 10,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusPending: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  statusCompleted: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  statusMastered: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: 'rgba(34, 197, 94, 0.4)',
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  statusPendingText: {
    color: '#ef4444',
  },
  statusCompletedText: {
    color: '#38bdf8',
  },
  statusMasteredText: {
    color: '#22c55e',
  },
  drillDescriptionBig: {
    color: '#d4d4d8',
    fontSize: 11.5,
    lineHeight: 16.5,
    marginBottom: 10,
  },
  stepsContainer: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
    marginBottom: 10,
  },
  stepsHeading: {
    color: '#a1a1aa',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  stepNumberBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  stepDescriptionText: {
    color: '#e4e4e7',
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  benefitBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
  },
  benefitText: {
    color: '#eab308',
    fontSize: 10.5,
    fontWeight: '700',
    flex: 1,
  },
  repTrackerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#18181b',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
    marginBottom: 10,
  },
  repTrackerLabel: {
    color: '#a1a1aa',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  counterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  counterBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnPlus: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#eab308',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterVal: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  drillFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  repBadge: {
    backgroundColor: '#1f1f23',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  repText: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: '700',
  },
  startQuestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eab308',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  startQuestBtnText: {
    color: '#000000',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
