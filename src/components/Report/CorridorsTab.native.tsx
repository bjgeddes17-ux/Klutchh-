import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Gauge, Check, X, Sliders, ArrowRight, Play, Compass } from 'lucide-react-native';
import { SportRule, JointRule, BiomechanicalFrame } from '../../types';

interface CorridorsTabNativeProps {
  sportRule: SportRule;
  allFrames: BiomechanicalFrame[];
  currentTime: number;
  onSeek: (time: number) => void;
}

export const CorridorsTabNative: React.FC<CorridorsTabNativeProps> = ({
  sportRule,
  allFrames,
  currentTime,
  onSeek,
}) => {
  const currentFrame = allFrames.find(
    (f) => Math.abs(f.timestamp - currentTime) < 0.15
  ) || allFrames[0];

  const currentAngles = currentFrame?.angles || {};

  return (
    <View style={styles.container}>
      {/* Header Explainer */}
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.gaugeBox}>
            <Compass color="#38bdf8" size={24} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.badgeRow}>
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>PRO BENCHMARKS</Text>
              </View>
              <Text style={styles.frameTimestampText}>SCRUB TIME: {currentTime.toFixed(2)}s</Text>
            </View>
            <Text style={styles.heroTitle}>Tour Gold Corridors</Text>
          </View>
        </View>

        <Text style={styles.heroDesc}>
          Every elite athlete operates inside tight angular boundaries. If your joints are in the green corridor, energy flows seamlessly. If in red, power is bleeding.
        </Text>
      </View>

      {/* Joint Angle Corridor Gauges */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>DYNAMIC JOINT TOLERANCE GAUGES</Text>
        <Text style={styles.sectionSubtitle}>Scrub the video above to see how your joint angles track against ideal ranges</Text>
      </View>

      {sportRule.jointRules.map((rule, idx) => {
        // Find measured angle for this joint
        let measuredVal = 0;
        const jName = rule.name.toLowerCase();
        const idealAngle = (rule.idealMin + rule.idealMax) / 2;

        if (jName.includes('knee') || rule.id.includes('knee')) {
          measuredVal = currentAngles.knee || currentAngles.leadKnee || 148;
        } else if (jName.includes('hip') || rule.id.includes('hip')) {
          measuredVal = currentAngles.hip || currentAngles.trailHip || 155;
        } else if (jName.includes('spine') || jName.includes('torso') || rule.id.includes('spine')) {
          measuredVal = currentAngles.shoulder || currentAngles.spineAngle || 34;
        } else if (jName.includes('elbow') || rule.id.includes('elbow')) {
          measuredVal = currentAngles.elbow || currentAngles.leadElbow || 162;
        } else {
          measuredVal = idealAngle;
        }

        const min = rule.idealMin;
        const max = rule.idealMax;
        const isInRange = measuredVal >= min && measuredVal <= max;
        const deviation = isInRange
          ? 0
          : measuredVal < min
          ? min - measuredVal
          : measuredVal - max;

        const statusColor = isInRange ? '#22c55e' : deviation < 12 ? '#eab308' : '#ef4444';

        // Calculate needle position in percentage (0 to 100) across an expanded window [min-25, max+25]
        const displayMin = Math.max(0, min - 25);
        const displayMax = max + 25;
        const totalSpan = displayMax - displayMin;
        const currentPct = Math.min(100, Math.max(0, ((measuredVal - displayMin) / totalSpan) * 100));
        const minPct = Math.min(100, Math.max(0, ((min - displayMin) / totalSpan) * 100));
        const maxPct = Math.min(100, Math.max(0, ((max - displayMin) / totalSpan) * 100));

        return (
          <View key={rule.id || idx} style={[styles.corridorCard, { borderColor: statusColor }]}>
            <View style={styles.cardTopRow}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.jointName}>{rule.name}</Text>
                  {rule.phase && (
                    <View style={styles.phasePill}>
                      <Text style={styles.phasePillText}>{rule.phase}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.jointDesc}>{rule.description}</Text>
              </View>

              <View style={styles.measureBox}>
                <Text style={[styles.measuredAngleText, { color: statusColor }]}>
                  {Math.round(measuredVal)}°
                </Text>
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {isInRange ? 'INSIDE CORRIDOR' : `OFF BY ${Math.round(deviation)}°`}
                </Text>
              </View>
            </View>

            {/* Visual Corridor Bar Gauge */}
            <View style={styles.gaugeContainer}>
              <View style={styles.gaugeTrack}>
                {/* Safe Green Zone */}
                <View
                  style={[
                    styles.greenCorridorZone,
                    {
                      left: `${minPct}%`,
                      width: `${Math.max(8, maxPct - minPct)}%`,
                    },
                  ]}
                />

                {/* Current Angle Needle */}
                <View style={[styles.needle, { left: `${currentPct}%`, backgroundColor: statusColor }]} />
              </View>

              {/* Gauge Boundary Labels */}
              <View style={styles.gaugeLabelsRow}>
                <Text style={styles.gaugeMinLabel}>{Math.round(displayMin)}°</Text>
                <Text style={styles.gaugeTargetLabel}>
                  TARGET: {min}° - {max}°
                </Text>
                <Text style={styles.gaugeMaxLabel}>{Math.round(displayMax)}°</Text>
              </View>
            </View>

            {/* Biomechanical Rule Feedback */}
            <View style={styles.ruleFooter}>
              <View style={[styles.statusIndicatorDot, { backgroundColor: statusColor }]} />
              <Text style={styles.feedbackText}>
                {isInRange
                  ? `Gold standard posture preserved. Joint angle is within optimal ${Math.round((rule.idealMin + rule.idealMax) / 2)}° target.`
                  : measuredVal < min
                  ? `Under-rotated by ${Math.round(deviation)}°. Extend joint further to hit ideal torque.`
                  : `Over-extended by ${Math.round(deviation)}°. Pull back into target corridor to avoid energy leak.`}
              </Text>
            </View>
          </View>
        );
      })}
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
    borderColor: 'rgba(56, 189, 248, 0.4)',
    padding: 16,
    marginBottom: 16,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  gaugeBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  proBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  proBadgeText: {
    color: '#38bdf8',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  frameTimestampText: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
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
  corridorCard: {
    backgroundColor: '#121215',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  jointName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  phasePill: {
    backgroundColor: '#27272a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  phasePillText: {
    color: '#a1a1aa',
    fontSize: 8.5,
    fontWeight: '800',
  },
  jointDesc: {
    color: '#71717a',
    fontSize: 10.5,
    marginTop: 2,
  },
  measureBox: {
    alignItems: 'flex-end',
  },
  measuredAngleText: {
    fontSize: 18,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  statusText: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  gaugeContainer: {
    marginBottom: 10,
  },
  gaugeTrack: {
    height: 10,
    backgroundColor: '#27272a',
    borderRadius: 5,
    position: 'relative',
    overflow: 'visible',
    justifyContent: 'center',
  },
  greenCorridorZone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(34, 197, 94, 0.45)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  needle: {
    position: 'absolute',
    width: 6,
    height: 16,
    borderRadius: 3,
    top: -3,
    marginLeft: -3,
    borderWidth: 1,
    borderColor: '#ffffff',
    zIndex: 10,
  },
  gaugeLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  gaugeMinLabel: {
    color: '#71717a',
    fontSize: 9,
    fontFamily: 'monospace',
  },
  gaugeTargetLabel: {
    color: '#22c55e',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  gaugeMaxLabel: {
    color: '#71717a',
    fontSize: 9,
    fontFamily: 'monospace',
  },
  ruleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#18181b',
    paddingTop: 8,
  },
  statusIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  feedbackText: {
    color: '#d4d4d8',
    fontSize: 10.5,
    flex: 1,
    lineHeight: 15,
  },
});
