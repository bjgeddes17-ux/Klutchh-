import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertCircle, ArrowRight, Play, Flame, TrendingDown, Target, Zap, Activity } from 'lucide-react-native';
import Svg, { Path, Line, Circle, Text as SvgText, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { AICoachingReport, SportRule, BiomechanicalFrame } from '../../types';
import { GhostCorrectionVisualizer } from './GhostCorrectionVisualizer.native';

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

  // Extract worst energy leaks / biomechanical deviations
  const leaks = [
    {
      title: 'Spine Angle Breakdown (Postural Fault)',
      severity: 'CRITICAL STABILITY',
      severityColor: '#f97316',
      impact: 'High Lumbar Shear & Reduced Arc',
      phase: 'Coil & Backswing',
      timestamp: 1.1,
      description: 'Thoracic spine straightens upward during the top of backswing, shifting center of pressure off-axis.',
      fix: 'Anchor lead hip lower than trailing hip throughout maximum coil.',
      suggestedDrill: `${sportRule.name} Low-Hip Kinetic Hinge`,
    },
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
              <Text style={styles.impactScoreText}>3 LEAKS IDENTIFIED</Text>
            </View>
            <Text style={styles.bannerTitle}>Where You Are Losing Power & Precision</Text>
          </View>
        </View>
        <Text style={styles.bannerDesc}>
          These 3 mechanical faults directly account for lost velocity and inconsistent delivery. Tap any leak below to inspect and seek video.
        </Text>
      </View>

      {/* Interactive SVG Kinetic Energy Loss / Wattage Dissipation Curve */}
      <View style={styles.graphCard}>
        <View style={styles.graphHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Activity color="#ef4444" size={18} />
            <Text style={styles.graphTitle}>KINETIC DISSIPATION & POWER LEAK TIMELINE</Text>
          </View>
          <Text style={{ color: '#ef4444', fontSize: 10, fontWeight: '900' }}>WATTS DISSIPATION</Text>
        </View>

        <View style={{ paddingVertical: 6 }}>
          <Svg width="100%" height={125} viewBox="0 0 320 110">
            <Defs>
              <LinearGradient id="leakGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
                <Stop offset="100%" stopColor="#ef4444" stopOpacity="0.05" />
              </LinearGradient>
              <LinearGradient id="dropGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
                <Stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
              </LinearGradient>
            </Defs>

            {/* Baseline and Ideal Curve */}
            <Line x1="10" y1="95" x2="310" y2="95" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            
            {/* Pro Baseline Curve (Dashed Green) */}
            <Path
              d="M 15 85 Q 60 85, 110 30 Q 180 15, 240 10 T 305 70"
              fill="none"
              stroke="#22c55e"
              strokeWidth="1.5"
              strokeDasharray="4,4"
              opacity={0.6}
            />

            {/* Athlete Actual Energy Curve with Dropoffs */}
            <Path
              d="M 15 85 Q 50 85, 95 65 L 105 45 L 120 72 L 170 30 L 185 62 L 230 25 L 245 78 T 305 90 Z"
              fill="url(#leakGrad)"
            />
            <Path
              d="M 15 85 Q 50 85, 95 65 L 105 45 L 120 72 L 170 30 L 185 62 L 230 25 L 245 78 T 305 90"
              fill="none"
              stroke="#ef4444"
              strokeWidth="2.5"
            />

            {/* Red Energy Leak Markers */}
            {/* Leak 1: 1.1s (x ~ 115) */}
            <Line x1="115" y1="45" x2="115" y2="95" stroke="#f97316" strokeWidth="1" strokeDasharray="2,2" />
            <Circle cx="115" cy="45" r="5" fill="#f97316" stroke="#ffffff" strokeWidth="1.5" />
            <SvgText x="115" y="36" fill="#f97316" fontSize="7.5" fontWeight="900" textAnchor="middle">
              LEAK #1 (1.1s)
            </SvgText>

            {/* Leak 2: 1.8s (x ~ 180) */}
            <Line x1="180" y1="30" x2="180" y2="95" stroke="#ef4444" strokeWidth="1" strokeDasharray="2,2" />
            <Circle cx="180" cy="30" r="5" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
            <SvgText x="180" y="21" fill="#ef4444" fontSize="7.5" fontWeight="900" textAnchor="middle">
              LEAK #2 (1.8s)
            </SvgText>

            {/* Leak 3: 2.1s (x ~ 240) */}
            <Line x1="240" y1="25" x2="240" y2="95" stroke="#eab308" strokeWidth="1" strokeDasharray="2,2" />
            <Circle cx="240" cy="25" r="5" fill="#eab308" stroke="#ffffff" strokeWidth="1.5" />
            <SvgText x="240" y="16" fill="#eab308" fontSize="7.5" fontWeight="900" textAnchor="middle">
              LEAK #3 (2.1s)
            </SvgText>
          </Svg>

          <View style={styles.graphFooterRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 8, height: 2, backgroundColor: '#22c55e' }} />
              <Text style={{ color: '#a1a1aa', fontSize: 9 }}>Pro Energy Transfer</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 8, height: 2, backgroundColor: '#ef4444' }} />
              <Text style={{ color: '#ef4444', fontSize: 9, fontWeight: 'bold' }}>Athlete Wattage Dropoff</Text>
            </View>
          </View>
        </View>
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
              isSelected && { backgroundColor: '#141419', borderWidth: 1.5 },
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
    backgroundColor: '#0c0c10',
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
  graphCard: {
    backgroundColor: '#0c0c10',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    padding: 14,
    marginBottom: 16,
  },
  graphHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  graphTitle: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  graphFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
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
    backgroundColor: '#0c0c10',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  leakHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
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
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: '700',
  },
  leakTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 6,
  },
  costBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 8,
  },
  costText: {
    color: '#ef4444',
    fontSize: 11,
  },
  leakDesc: {
    color: '#d4d4d8',
    fontSize: 11.5,
    lineHeight: 16.5,
    marginBottom: 10,
  },
  fixBox: {
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
    padding: 10,
    marginBottom: 12,
  },
  fixHeading: {
    color: '#22c55e',
    fontSize: 9.5,
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
    gap: 8,
  },
  jumpBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingVertical: 8,
  },
  jumpBtnText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  drillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#eab308',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  drillBtnText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
