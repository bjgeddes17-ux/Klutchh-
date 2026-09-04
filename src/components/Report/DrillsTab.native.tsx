import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Flame, Play, Zap } from 'lucide-react-native';
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

  return (
    <View style={styles.container}>
      <View style={styles.drillsHeader}>
        <Text style={styles.sectionTitle}>PRESCRIPTION DRILL MATRIX</Text>
        <Text style={styles.sectionSubtitle}>
          Custom biomechanical drills configured for kinetic chain refinement. Tap status to log progress.
        </Text>
      </View>

      {drills.map((drill, idx) => {
        const isExpanded = expandedDrillIdx === idx;
        const status = drillStatuses[idx] || 'pending';

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
    backgroundColor: '#121215',
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
    fontSize: 13,
    fontWeight: '900',
  },
  drillTargetText: {
    color: '#71717a',
    fontSize: 10,
    marginTop: 1,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusPending: {
    backgroundColor: 'rgba(113, 113, 122, 0.15)',
    borderColor: '#3f3f46',
  },
  statusCompleted: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38bdf8',
  },
  statusMastered: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: '#22c55e',
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '900',
  },
  statusPendingText: {
    color: '#a1a1aa',
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
    lineHeight: 17,
    marginBottom: 10,
  },
  stepsContainer: {
    backgroundColor: '#09090b',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    marginBottom: 10,
  },
  stepsHeading: {
    color: '#eab308',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  stepNumberBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumberText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
  },
  stepDescriptionText: {
    color: '#d4d4d8',
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
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
    flex: 1,
    fontWeight: '600',
  },
  drillFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#18181b',
  },
  repBadge: {
    backgroundColor: '#18181b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  repText: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: '700',
  },
  startQuestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eab308',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  startQuestBtnText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '900',
  },
});
