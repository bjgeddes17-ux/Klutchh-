import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CheckCircle2, ShieldCheck, Flame, Zap, Award, ArrowUpRight, TrendingUp, Activity } from 'lucide-react-native';
import Svg, { Polygon, Line, Circle, Text as SvgText, Path, Defs, LinearGradient, Stop, G } from 'react-native-svg';
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
  // Extract high-performing attributes
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

  // Radar Chart Geometry Setup (6 Axes)
  const radarMetrics = [
    { label: 'POWER', val: explosivePower },
    { label: 'ARMOR', val: jointArmor },
    { label: 'PRECISION', val: precision },
    { label: 'FLOW', val: kineticFlow },
    { label: 'SYMMETRY', val: overallSymmetry },
    { label: 'STABILITY', val: overallKneeSafety },
  ];

  const radarSize = 220;
  const center = radarSize / 2;
  const radius = 75;

  const getCoordinates = (index: number, value: number) => {
    const angle = (Math.PI / 3) * index - Math.PI / 2;
    const r = (value / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const userPoints = radarMetrics
    .map((m, i) => {
      const p = getCoordinates(i, m.val);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    })
    .join(' ');

  const proPoints = radarMetrics
    .map((_, i) => {
      const p = getCoordinates(i, 92);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <View style={styles.container}>
      {/* Hero Header Banner */}
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

      {/* 1. Interactive Biomechanical Radar Graph */}
      <View style={styles.graphCard}>
        <View style={styles.graphHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Activity color="#38bdf8" size={18} />
            <Text style={styles.graphTitle}>BIOMECHANICAL RADAR POLYGON</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={[styles.legendDot, { backgroundColor: '#38bdf8' }]} />
              <Text style={styles.legendText}>You</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={[styles.legendDot, { backgroundColor: '#eab308' }]} />
              <Text style={styles.legendText}>Pro (92%)</Text>
            </View>
          </View>
        </View>

        <View style={styles.radarBox}>
          <Svg width={radarSize} height={radarSize}>
            <Defs>
              <LinearGradient id="radarGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
                <Stop offset="100%" stopColor="#818cf8" stopOpacity="0.15" />
              </LinearGradient>
            </Defs>

            {/* Concentric Grid Hexagons */}
            {[0.25, 0.5, 0.75, 1.0].map((scale, sIdx) => {
              const hexPoints = radarMetrics
                .map((_, i) => {
                  const p = getCoordinates(i, 100 * scale);
                  return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
                })
                .join(' ');
              return (
                <Polygon
                  key={sIdx}
                  points={hexPoints}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="1"
                />
              );
            })}

            {/* Radial Axis Lines */}
            {radarMetrics.map((_, i) => {
              const outer = getCoordinates(i, 100);
              return (
                <Line
                  key={i}
                  x1={center}
                  y1={center}
                  x2={outer.x}
                  y2={outer.y}
                  stroke="rgba(255, 255, 255, 0.12)"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
              );
            })}

            {/* Pro Reference Polygon */}
            <Polygon
              points={proPoints}
              fill="none"
              stroke="#eab308"
              strokeWidth="1.5"
              strokeDasharray="4,3"
              opacity={0.8}
            />

            {/* User Polygon */}
            <Polygon
              points={userPoints}
              fill="url(#radarGrad)"
              stroke="#38bdf8"
              strokeWidth="2.5"
            />

            {/* Axis Labels and Vertices */}
            {radarMetrics.map((m, i) => {
              const labelPos = getCoordinates(i, 120);
              const nodePos = getCoordinates(i, m.val);
              return (
                <G key={i}>
                  <Circle cx={nodePos.x} cy={nodePos.y} r={4} fill="#38bdf8" stroke="#ffffff" strokeWidth={1.5} />
                  <SvgText
                    x={labelPos.x}
                    y={labelPos.y + 3}
                    fill="#a1a1aa"
                    fontSize="8.5"
                    fontWeight="800"
                    textAnchor="middle"
                  >
                    {m.label} ({m.val.toFixed(0)}%)
                  </SvgText>
                </G>
              );
            })}
          </Svg>
        </View>
      </View>

      {/* 2. Kinetic Velocity Whip Sequence Curve */}
      <View style={styles.graphCard}>
        <View style={styles.graphHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TrendingUp color="#22c55e" size={18} />
            <Text style={styles.graphTitle}>PROXIMAL-TO-DISTAL WHIP ACCELERATION</Text>
          </View>
          <Text style={{ color: '#22c55e', fontSize: 10, fontWeight: '900' }}>4-STAGE TIMING</Text>
        </View>

        <View style={{ paddingVertical: 8 }}>
          <Svg width="100%" height={110} viewBox="0 0 300 100">
            <Defs>
              <LinearGradient id="whipGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                <Stop offset="100%" stopColor="#22c55e" stopOpacity="0.0" />
              </LinearGradient>
            </Defs>

            {/* Grid baseline */}
            <Line x1="10" y1="85" x2="290" y2="85" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            
            {/* Pelvic Rotation Curve (Purple) */}
            <Path d="M 20 85 Q 50 85, 75 35 T 130 80" fill="none" stroke="#c084fc" strokeWidth="2" />
            
            {/* Torso Drive Curve (Cyan) */}
            <Path d="M 50 85 Q 90 85, 120 25 T 180 82" fill="none" stroke="#38bdf8" strokeWidth="2" />

            {/* Lead Arm Whip Curve (Amber) */}
            <Path d="M 90 85 Q 130 85, 175 18 T 230 85" fill="none" stroke="#f59e0b" strokeWidth="2" />

            {/* End Effector Release Curve (Green Area Fill) */}
            <Path d="M 140 85 Q 185 85, 225 10 T 280 85 Z" fill="url(#whipGrad)" />
            <Path d="M 140 85 Q 185 85, 225 10 T 280 85" fill="none" stroke="#22c55e" strokeWidth="2.5" />

            {/* Peak Release Marker */}
            <Line x1="225" y1="10" x2="225" y2="85" stroke="#22c55e" strokeWidth="1" strokeDasharray="3,3" />
            <Circle cx="225" cy="10" r="4" fill="#22c55e" />
            <SvgText x="225" y="8" fill="#22c55e" fontSize="7.5" fontWeight="bold" textAnchor="middle">
              PEAK IMPACT (1.80s)
            </SvgText>
          </Svg>

          <View style={styles.whipLegendRow}>
            <View style={styles.whipLegendItem}><View style={[styles.dot, { backgroundColor: '#c084fc' }]} /><Text style={styles.whipLegendText}>Hips</Text></View>
            <View style={styles.whipLegendItem}><View style={[styles.dot, { backgroundColor: '#38bdf8' }]} /><Text style={styles.whipLegendText}>Torso</Text></View>
            <View style={styles.whipLegendItem}><View style={[styles.dot, { backgroundColor: '#f59e0b' }]} /><Text style={styles.whipLegendText}>Arm</Text></View>
            <View style={styles.whipLegendItem}><View style={[styles.dot, { backgroundColor: '#22c55e' }]} /><Text style={styles.whipLegendText}>Hand/Strike</Text></View>
          </View>
        </View>
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
  graphCard: {
    backgroundColor: '#0c0c10',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    marginBottom: 16,
  },
  graphHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  graphTitle: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    color: '#a1a1aa',
    fontSize: 9,
    fontWeight: '700',
  },
  radarBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  whipLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  whipLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  whipLegendText: {
    color: '#a1a1aa',
    fontSize: 9.5,
    fontWeight: '700',
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
    backgroundColor: '#0c0c10',
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
    backgroundColor: '#0c0c10',
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
});
