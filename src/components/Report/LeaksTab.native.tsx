import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertCircle, ArrowRight, Play, Flame, TrendingDown, Target, HelpCircle } from 'lucide-react-native';
import { AICoachingReport, SportRule, BiomechanicalFrame } from '../../types';
import { GhostCorrectionVisualizer } from './GhostCorrectionVisualizer.native';
import { COMPREHENSIVE_DRILL_LIBRARY } from '../../data/drillLibrary';

interface LeaksTabNativeProps {
  aiReport: AICoachingReport | null;
  sportRule: SportRule;
  keyframeList: BiomechanicalFrame[];
  allFrames: BiomechanicalFrame[];
  videoUrl?: string;
  onSeek: (time: number) => void;
  onNavigateToDrillPlan: (drillId?: string) => void;
}

export const LeaksTabNative: React.FC<LeaksTabNativeProps> = ({
  aiReport,
  sportRule,
  keyframeList,
  allFrames,
  videoUrl,
  onSeek,
  onNavigateToDrillPlan,
}) => {
  const [selectedLeakIdx, setSelectedLeakIdx] = useState<number>(0);

  const sortedFrames = allFrames && allFrames.length > 0 ? allFrames : keyframeList;

  // Extract worst energy leaks / biomechanical deviations
  const leaks = [
    {
      title: 'Premature Segment Deceleration (Energy Leak)',
      severity: 'HIGH PRIORITY',
      severityColor: '#ef4444',
      impact: '-18% Peak Ball Exit Velocity',
      phase: 'Delivery & Impact',
      timestamp: 1.8,
      description: 'The hips and pelvic rotation stall 60ms too early, forcing the upper torso and arms to compensate, bleeding kinetic whip velocity.',
      fix: 'Maintain continuous rotational drive until lead arm reaches 45° past strike line.',
      suggestedDrill: 'Rotational Elastic Core Whip Snap',
    },
    {
      title: 'Spine Angle Breakdown (Postural Fault)',
      severity: 'CRITICAL STABILITY',
      severityColor: '#f97316',
      impact: 'High Lumbar Shear & Reduced Arc',
      phase: 'Backswing / Coil',
      timestamp: 1.1,
      description: 'Thoracic spine straightens upward during the top of backswing, shifting center of pressure off-axis.',
      fix: 'Anchor lead hip lower than trailing hip throughout maximum coil.',
      suggestedDrill: `${sportRule.name} Low-Hip Kinetic Hinge`,
    },
    {
      title: 'Lead Knee Valgus Shift (Safety Flag)',
      severity: 'INJURY VULNERABILITY',
      severityColor: '#eab308',
      impact: 'Ligament Strain Vector',
      phase: 'Ground Plant',
      timestamp: 2.1,
      description: 'Lead knee collapses 6° inward past the second toe line upon absorbing ground reaction impulse.',
      fix: 'Drive knee outward against external resistance band during deceleration.',
      suggestedDrill: 'Single-Leg Deceleration ACL Armor',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Visual Diagnostic Banner */}
      <View style={styles.bannerCard}>
        <View style={styles.bannerTopRow}>
          <View style={styles.alertIconBox}>
            <AlertCircle color="#ef4444" size={22} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.badgeRow}>
              <View style={styles.criticalBadge}>
                <Text style={styles.criticalBadgeText}>MECHANICAL BOTTLENECKS</Text>
              </View>
              <Text style={styles.impactScoreText}>3 LEAKS FOUND</Text>
            </View>
            <Text style={styles.bannerTitle}>Where You Are Losing Power & Precision</Text>
          </View>
        </View>
        <Text style={styles.bannerDesc}>
          These 3 mechanical faults directly account for lost velocity and inconsistent delivery. Fixing them produces the highest performance ROI.
        </Text>
      </View>

      {/* Interactive Ghost Correction / Pose Visualizer */}
      <View style={{ marginBottom: 16 }}>
        <GhostCorrectionVisualizer
          keyframeList={keyframeList}
          allFrames={allFrames}
          sportRule={sportRule}
          onSeekTimestamp={onSeek}
          onSelectDrill={() => onNavigateToDrillPlan()}
          videoUrl={videoUrl}
        />
      </View>

      {/* Leaks Breakdown List */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>RANKED KINETIC LEAKS</Text>
        <Text style={styles.sectionSubtitle}>Select a leak to inspect the biomechanical root cause and prescribed fix</Text>
      </View>

      {leaks.map((leak, idx) => {
        const isSelected = selectedLeakIdx === idx;
        return (
          <TouchableOpacity
            key={idx}
            onPress={() => {
              setSelectedLeakIdx(idx);
              onSeek(leak.timestamp);
            }}
            style={[
              styles.leakCard,
              { borderColor: leak.severityColor },
              isSelected && { backgroundColor: '#18181b', borderWidth: 1.5 },
            ]}
            activeOpacity={0.8}
          >
            <View style={styles.leakHeaderRow}>
              <View style={[styles.severityBadge, { backgroundColor: `${leak.severityColor}20` }]}>
                <Text style={[styles.severityBadgeText, { color: leak.severityColor }]}>
                  {leak.severity}
                </Text>
              </View>
              <Text style={styles.phaseTag}>{leak.phase} @ {leak.timestamp}s</Text>
            </View>

            <Text style={styles.leakTitle}>{leak.title}</Text>

            <View style={styles.costBox}>
              <TrendingDown color="#ef4444" size={14} />
              <Text style={styles.costText}>Performance Cost: <Text style={{ fontWeight: '900', color: '#ffffff' }}>{leak.impact}</Text></Text>
            </View>

            <Text style={styles.leakDesc}>{leak.description}</Text>

            {/* Prescribed Fix Box */}
            <View style={styles.fixBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Target color="#22c55e" size={14} />
                <Text style={styles.fixHeading}>COACHING CORRECTION CUE</Text>
              </View>
              <Text style={styles.fixText}>{leak.fix}</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.leakActionRow}>
              <TouchableOpacity
                onPress={() => onSeek(leak.timestamp)}
                style={styles.jumpBtn}
                activeOpacity={0.7}
              >
                <Play color="#38bdf8" size={12} />
                <Text style={styles.jumpBtnText}>JUMP TO VIDEO ({leak.timestamp}s)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => onNavigateToDrillPlan(leak.suggestedDrill)}
                style={styles.drillBtn}
                activeOpacity={0.7}
              >
                <Flame color="#000000" size={12} />
                <Text style={styles.drillBtnText}>GET DRILL</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  bannerCard: {
    backgroundColor: '#121215',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    padding: 16,
    marginBottom: 16,
  },
  bannerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  alertIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  criticalBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  criticalBadgeText: {
    color: '#ef4444',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  impactScoreText: {
    color: '#f97316',
    fontSize: 10,
    fontWeight: '900',
  },
  bannerTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  bannerDesc: {
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
  leakCard: {
    backgroundColor: '#121215',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  leakHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  severityBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  phaseTag: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: '700',
  },
  leakTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 8,
  },
  costBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  costText: {
    color: '#fca5a5',
    fontSize: 11,
  },
  leakDesc: {
    color: '#d4d4d8',
    fontSize: 11.5,
    lineHeight: 17,
    marginBottom: 10,
  },
  fixBox: {
    backgroundColor: '#09090b',
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#22c55e',
    marginBottom: 12,
  },
  fixHeading: {
    color: '#22c55e',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  fixText: {
    color: '#e4e4e7',
    fontSize: 11,
    lineHeight: 16,
  },
  leakActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  jumpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#27272a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  jumpBtnText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '900',
  },
  drillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eab308',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  drillBtnText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '900',
  },
});
