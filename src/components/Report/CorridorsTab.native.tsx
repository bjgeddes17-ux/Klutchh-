import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Gauge, Check, X, Sliders, ArrowRight, Play, Compass, Activity } from 'lucide-react-native';
import Svg, { Path, Line, Circle, Text as SvgText, Defs, LinearGradient, Stop, Rect, G } from 'react-native-svg';
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
                <Text style={styles.proBadgeText}>PRO BIOMECHANICAL ENVELOPE</Text>
              </View>
              <Text style={styles.frameTimestampText}>SCRUB TIME: {currentTime.toFixed(2)}s</Text>
            </View>
            <Text style={styles.heroTitle}>Understanding the Corridor Envelope</Text>
          </View>
        </View>

        <Text style={styles.heroDesc}>
          The green shaded band represents the elite Tour Gold Standard range (min/max joint angles required for peak explosive power). The blue line is your actual recorded motion. When your blue line stays inside the green corridor, energy transfer is 100% efficient. When it breaches the envelope, kinetic energy leaks out.
        </Text>
      </View>

      {/* SVG Pro Corridor Envelope Tracking Chart */}
      <View style={styles.graphCard}>
        <View style={styles.graphHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Activity color="#38bdf8" size={18} />
            <Text style={styles.graphTitle}>ANGULAR CORRIDOR ENVELOPE (0.0s - 3.25s)</Text>
          </View>
          <Text style={{ color: '#22c55e', fontSize: 10, fontWeight: '900' }}>GREEN = SAFE ZONE</Text>
        </View>

        <View style={{ paddingVertical: 6 }}>
          <Svg width="100%" height={140} viewBox="0 0 320 100">
            <Defs>
              <LinearGradient id="corridorGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#22c55e" stopOpacity="0.25" />
                <Stop offset="100%" stopColor="#22c55e" stopOpacity="0.08" />
              </LinearGradient>
            </Defs>

            {/* Baseline */}
            <Line x1="10" y1="90" x2="310" y2="90" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

            {/* Safe Green Corridor Envelope (Top Band Min/Max) */}
            <Path
              d="M 15 25 Q 100 20, 160 15 T 305 25 L 305 65 Q 160 55, 100 60 T 15 65 Z"
              fill="url(#corridorGrad)"
              stroke="#22c55e"
              strokeWidth="1.5"
              strokeDasharray="2,2"
            />

            {/* Athlete Actual Angle Trajectory */}
            <Path
              d="M 15 45 Q 80 50, 130 18 T 220 72 T 305 50"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="3"
            />

            {/* Scrub Time Vertical Marker */}
            {(() => {
              const scrubX = 15 + Math.min(290, Math.max(0, (currentTime / 3.25) * 290));
              return (
                <G>
                  <Line x1={scrubX} y1="10" x2={scrubX} y2="90" stroke="#eab308" strokeWidth="2.5" />
                  <Circle cx={scrubX} cy={45} r="5" fill="#eab308" stroke="#ffffff" strokeWidth="1.5" />
                  <SvgText x={scrubX} y="8" fill="#eab308" fontSize="8" fontWeight="900" textAnchor="middle">
                    {currentTime.toFixed(2)}s
                  </SvgText>
                </G>
              );
            })()}
          </Svg>

          <View style={styles.graphFooterRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: 'rgba(34, 197, 94, 0.4)' }} />
              <Text style={{ color: '#a1a1aa', fontSize: 10 }}>Tour Gold Standard Envelope</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 8, height: 2, backgroundColor: '#38bdf8' }} />
              <Text style={{ color: '#38bdf8', fontSize: 10, fontWeight: 'bold' }}>Your Motion Trajectory</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Educational Breakdown Card */}
      <View style={styles.heroCard}>
        <Text style={[styles.heroTitle, { fontSize: 14, marginBottom: 8 }]}>How to Read Your Envelope</Text>
        <Text style={[styles.heroDesc, { fontSize: 11, lineHeight: 16 }]}>
          • <Text style={{ color: '#22c55e', fontWeight: 'bold' }}>The Green Band:</Text> Formulated from professional motion capture databases. Staying within this corridor ensures maximum kinetic energy transfer with zero wasted torque.{'\n'}
          • <Text style={{ color: '#38bdf8', fontWeight: 'bold' }}>The Blue Line:</Text> Your body's exact angular path across the entire movement sequence.{'\n'}
          • <Text style={{ color: '#eab308', fontWeight: 'bold' }}>The Yellow Scrubber:</Text> Instantly links the graph timeline to your video scrubber position so you can inspect form breaks frame-by-frame.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  heroCard: {
    backgroundColor: '#0c0c10',
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
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
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
  graphCard: {
    backgroundColor: '#0c0c10',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
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
  corridorCard: {
    backgroundColor: '#0c0c10',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  jointName: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '900',
  },
  phasePill: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  phasePillText: {
    color: '#a1a1aa',
    fontSize: 8.5,
    fontWeight: '800',
  },
  jointDesc: {
    color: '#a1a1aa',
    fontSize: 11,
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
    height: 12,
    backgroundColor: '#1f1f23',
    borderRadius: 6,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 6,
  },
  greenCorridorZone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(34, 197, 94, 0.4)',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#22c55e',
  },
  needle: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 4,
    marginLeft: -2,
    borderRadius: 2,
    elevation: 4,
  },
  gaugeLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gaugeMinLabel: {
    color: '#71717a',
    fontSize: 9,
    fontWeight: '700',
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
    fontWeight: '700',
  },
  ruleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 8,
    borderRadius: 8,
  },
  statusIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  feedbackText: {
    color: '#d4d4d8',
    fontSize: 10.5,
    lineHeight: 15,
    flex: 1,
  },
});
