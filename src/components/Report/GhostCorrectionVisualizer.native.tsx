import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Canvas, Line, Circle, Path, Skia, LinearGradient, vec } from '@shopify/react-native-skia';
import { FrameAnalysis, SportRule, JointRule } from '../../types';
import { POSE_CONNECTIONS, calculateAngle } from '../../utils/geometry';
import { AlertTriangle, Sparkles, ChevronRight, Play, Pause, RotateCcw } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MovementFault {
  id: string;
  rank: number;
  rule: JointRule;
  measuredAngle: number;
  targetRange: string;
  delta: number;
  severity: 'critical' | 'high' | 'moderate';
  phase: string;
  timestamp: number;
  keyframe: FrameAnalysis;
  title: string;
  causeDescription: string;
  correctionCues: string;
  biomechanicalConsequence: string;
}

interface GhostCorrectionVisualizerProps {
  keyframeList: FrameAnalysis[];
  allFrames?: FrameAnalysis[];
  sportRule: SportRule;
  onSeekTimestamp?: (timestamp: number) => void;
}

export const GhostCorrectionVisualizerNative: React.FC<GhostCorrectionVisualizerProps> = ({
  keyframeList,
  allFrames = [],
  sportRule,
  onSeekTimestamp,
}) => {
  const [selectedFaultIdx, setSelectedFaultIdx] = useState(0);
  const [ghostInterpolation, setGhostInterpolation] = useState(0); // 0 = actual, 1 = optimal

  // Identify Top 3 Faults (Logic shared with Web)
  const top3Faults: MovementFault[] = useMemo(() => {
    const searchPool = (allFrames && allFrames.length > 0 ? allFrames : keyframeList) || [];
    if (searchPool.length === 0) return [];

    const allCandidates: any[] = [];

    sportRule.jointRules.forEach(rule => {
      let maxDelta = -1;
      let worstFrame: FrameAnalysis | null = null;
      let worstAngle = 0;

      searchPool.forEach(frame => {
        let measured = frame.angles?.[rule.id];
        if (measured === undefined && frame.landmarks && rule.keypoints?.length === 3) {
          const [p1, p2, p3] = rule.keypoints;
          if (frame.landmarks[p1] && frame.landmarks[p2] && frame.landmarks[p3]) {
            measured = calculateAngle(frame.landmarks[p1], frame.landmarks[p2], frame.landmarks[p3]);
          }
        }

        if (measured === undefined) return;

        let delta = 0;
        if (measured < rule.idealMin) delta = rule.idealMin - measured;
        else if (measured > rule.idealMax) delta = measured - rule.idealMax;

        if (delta > maxDelta) {
          maxDelta = delta;
          worstFrame = frame;
          worstAngle = Math.round(measured);
        }
      });

      if (worstFrame && maxDelta > 3) {
        allCandidates.push({
          rule,
          frame: worstFrame,
          measuredAngle: worstAngle,
          delta: Math.round(maxDelta),
          timestamp: worstFrame.timestamp,
          phase: worstFrame.detectedPhase || 'Movement'
        });
      }
    });

    allCandidates.sort((a, b) => b.delta - a.delta);

    return allCandidates.slice(0, 3).map((item, idx) => ({
      id: `fault-${idx}`,
      rank: idx + 1,
      rule: item.rule,
      measuredAngle: item.measuredAngle,
      targetRange: `${item.rule.idealMin}° - ${item.rule.idealMax}°`,
      delta: item.delta,
      severity: item.delta > 15 ? 'critical' : 'high',
      phase: item.phase,
      timestamp: item.timestamp,
      keyframe: item.frame,
      title: item.rule.name,
      causeDescription: `Detected ${item.delta}° deviation from optimal axis during ${item.phase}.`,
      correctionCues: item.rule.impactOnPerformance || "Adjust joint alignment to maintain kinetic chain integrity.",
      biomechanicalConsequence: item.rule.injuryRiskFactor || "Increased shear stress on joint complex."
    }));
  }, [keyframeList, allFrames, sportRule]);

  const activeFault = top3Faults[selectedFaultIdx];

  // Helper to get adjusted "Ghost" landmarks
  const getAdjustedLandmarks = (fault: MovementFault, interp: number) => {
    if (!fault?.keyframe?.landmarks) return [];
    const landmarks = fault.keyframe.landmarks;
    const rule = fault.rule;
    
    return landmarks.map((pt, idx) => {
      if (!pt) return pt;
      let nx = pt.x;
      let ny = pt.y;

      // Simple heuristic for "Optimal" adjustment based on fault type
      if (rule.keypoints?.includes(idx)) {
        const isTooSmall = fault.measuredAngle < rule.idealMin;
        const correction = isTooSmall ? 0.05 : -0.05;
        
        // Push the joint towards a better position
        if (idx === 25 || idx === 26) { // Knees
          nx += idx === 25 ? -correction : correction;
        } else if (idx === 11 || idx === 12) { // Shoulders
          ny -= 0.03;
        }
      }

      return {
        x: pt.x + (nx - pt.x) * interp,
        y: pt.y + (ny - pt.y) * interp,
        visibility: pt.visibility
      };
    });
  };

  const adjustedLandmarks = useMemo(() => {
    if (!activeFault) return [];
    return getAdjustedLandmarks(activeFault, ghostInterpolation);
  }, [activeFault, ghostInterpolation]);

  if (!activeFault) return null;

  const CANVAS_SIZE = SCREEN_WIDTH - 48;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <AlertTriangle size={20} color="#ef4444" />
          <Text style={styles.title}>GHOST CORRECTION HUD</Text>
        </View>
        <Text style={styles.subtitle}>
          Compare your actual pose (Red) vs. optimal ghost (Emerald)
        </Text>
      </View>

      {/* Fault Selector Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
        {top3Faults.map((fault, idx) => (
          <TouchableOpacity
            key={fault.id}
            onPress={() => {
              setSelectedFaultIdx(idx);
              onSeekTimestamp?.(fault.timestamp);
            }}
            style={[
              styles.tab,
              selectedFaultIdx === idx && styles.tabActive
            ]}
          >
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>#{fault.rank}</Text>
            </View>
            <Text style={[styles.tabText, selectedFaultIdx === idx && styles.tabTextActive]}>
              {fault.rule.name}
            </Text>
            <Text style={styles.tabDelta}>Δ {fault.delta}°</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Skia Interactive Stage */}
      <View style={styles.canvasContainer}>
        <Canvas style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}>
          {/* Skeleton Rendering */}
          {POSE_CONNECTIONS.map((conn, i) => {
            const p1 = adjustedLandmarks[conn.points[0]];
            const p2 = adjustedLandmarks[conn.points[1]];
            if (!p1 || !p2) return null;

            const isFocal = activeFault.rule.keypoints?.includes(conn.points[0]) && activeFault.rule.keypoints?.includes(conn.points[1]);
            const strokeColor = isFocal ? (ghostInterpolation > 0.6 ? '#10b981' : '#ef4444') : '#38bdf8';
            
            return (
              <Line
                key={`line-${i}`}
                p1={vec(p1.x * CANVAS_SIZE, p1.y * CANVAS_SIZE)}
                p2={vec(p2.x * CANVAS_SIZE, p2.y * CANVAS_SIZE)}
                color={strokeColor}
                strokeWidth={isFocal ? 6 : 3}
                opacity={isFocal ? 0.9 : 0.4}
              />
            );
          })}

          {/* Joint Nodes */}
          {adjustedLandmarks.map((lm, i) => {
            if (i < 11 || (lm.visibility && lm.visibility < 0.4)) return null;
            const isFocal = activeFault.rule.keypoints?.includes(i);
            return (
              <Circle
                key={`joint-${i}`}
                cx={lm.x * CANVAS_SIZE}
                cy={lm.y * CANVAS_SIZE}
                r={isFocal ? 5 : 3}
                color={isFocal ? (ghostInterpolation > 0.6 ? '#10b981' : '#ef4444') : '#ffffff'}
              />
            );
          })}
        </Canvas>

        {/* Legend Overlay */}
        <View style={styles.canvasLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
            <Text style={styles.legendText}>Actual Breakdown</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
            <Text style={styles.legendText}>Target Ghost</Text>
          </View>
        </View>
      </View>

      {/* Biomechanical Insight Cards */}
      <View style={styles.insightGrid}>
        <View style={styles.insightCard}>
          <View style={styles.cardHeader}>
            <AlertTriangle size={14} color="#f87171" />
            <Text style={styles.cardTitle}>BIOMECHANICAL RISK</Text>
          </View>
          <Text style={styles.cardText}>{activeFault.biomechanicalConsequence}</Text>
        </View>

        <View style={[styles.insightCard, styles.insightCardGreen]}>
          <View style={styles.cardHeader}>
            <Sparkles size={14} color="#34d399" />
            <Text style={[styles.cardTitle, { color: '#34d399' }]}>CORRECTION CUE</Text>
          </View>
          <Text style={styles.cardText}>{activeFault.correctionCues}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.seekButton}
        onPress={() => onSeekTimestamp?.(activeFault.timestamp)}
      >
        <Text style={styles.seekButtonText}>JUMP TO KEYFRAME ({activeFault.timestamp.toFixed(2)}s)</Text>
        <ChevronRight size={16} color="#fbbf24" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#09090b',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#27272a',
    marginVertical: 12,
  },
  header: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  subtitle: {
    color: '#a1a1aa',
    fontSize: 12,
    marginTop: 4,
  },
  tabsScroll: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  tab: {
    backgroundColor: '#18181b',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    marginRight: 8,
    alignItems: 'center',
  },
  tabActive: {
    borderColor: '#ef4444',
    backgroundColor: '#2d1a1a',
  },
  tabBadge: {
    backgroundColor: '#27272a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  tabBadgeText: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: '900',
  },
  tabText: {
    color: '#71717a',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  tabDelta: {
    color: '#f87171',
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  canvasContainer: {
    backgroundColor: '#000000',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#18181b',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  canvasLegend: {
    position: 'absolute',
    top: 12,
    right: 12,
    gap: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  insightGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  insightCard: {
    flex: 1,
    backgroundColor: '#18181b',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  insightCardGreen: {
    borderColor: '#064e3b',
    backgroundColor: '#022c22',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  cardTitle: {
    color: '#f87171',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cardText: {
    color: '#d4d4d8',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
  },
  seekButton: {
    backgroundColor: '#18181b',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  seekButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
});
