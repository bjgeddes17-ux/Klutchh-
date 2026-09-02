import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import Svg, {
  Line,
  Circle,
  Polygon,
  Rect,
  Text as SvgText,
  G,
} from 'react-native-svg';
import {
  AlertTriangle,
  Sparkles,
  Play,
  Pause,
  Target,
  ArrowRight,
  Eye,
  Layers,
  CheckCircle2,
  Zap,
} from 'lucide-react-native';
import { FrameAnalysis, SportRule, JointRule, MediaPipeLandmark } from '../../types';
import { calculateAngle } from '../../utils/geometry';

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
  frame: FrameAnalysis;
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
  onSelectDrill?: (drillName: string) => void;
  videoUrl?: string;
}

export const GhostCorrectionVisualizer: React.FC<GhostCorrectionVisualizerProps> = ({
  keyframeList,
  allFrames = [],
  sportRule,
  onSeekTimestamp,
  onSelectDrill,
  videoUrl,
}) => {
  const [selectedFaultIdx, setSelectedFaultIdx] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'ghost_overlay' | 'morph_loop' | 'side_by_side'>('ghost_overlay');
  const [isPlayingMorph, setIsPlayingMorph] = useState<boolean>(true);
  const [morphInterpolation, setMorphInterpolation] = useState<number>(0);

  // 1. Identify Top 3 Movement Faults accurately from all frames or keyframeList
  const top3Faults: MovementFault[] = useMemo(() => {
    const searchPool = (allFrames && allFrames.length > 0 ? allFrames : keyframeList) || [];
    if (searchPool.length === 0) return [];

    const phases = sportRule.phases && sportRule.phases.length > 0
      ? sportRule.phases
      : ['Base Loading', 'Kinetic Acceleration', 'Force Transfer & Impact', 'Deceleration & Finish'];

    interface Candidate {
      rule: JointRule;
      frame: FrameAnalysis;
      measuredAngle: number;
      delta: number;
      timestamp: number;
      phase: string;
    }

    const allCandidates: Candidate[] = [];

    sportRule.jointRules.forEach((rule) => {
      let maxDeltaForThisRule = -1;
      let worstCandidate: Candidate | null = null;

      searchPool.forEach((frame) => {
        let measured = frame.angles?.[rule.id];

        if (measured === undefined && frame.landmarks && rule.keypoints?.length === 3) {
          const p1 = frame.landmarks[rule.keypoints[0]];
          const p2 = frame.landmarks[rule.keypoints[1]];
          const p3 = frame.landmarks[rule.keypoints[2]];
          if (p1 && p2 && p3) {
            measured = Math.round(calculateAngle(p1, p2, p3));
          }
        }

        if (measured === undefined) return;

        let delta = 0;
        if (measured < rule.idealMin) delta = rule.idealMin - measured;
        else if (measured > rule.idealMax) delta = measured - rule.idealMax;

        const cand: Candidate = {
          rule,
          frame,
          measuredAngle: Math.round(measured),
          delta: Math.round(delta),
          timestamp: Math.round(frame.timestamp * 100) / 100,
          phase: frame.detectedPhase || rule.phase || 'Kinetic Phase',
        };

        if (delta > maxDeltaForThisRule) {
          maxDeltaForThisRule = delta;
          worstCandidate = cand;
        }
      });

      if (worstCandidate) {
        allCandidates.push(worstCandidate);
      }
    });

    allCandidates.sort((a, b) => b.delta - a.delta);

    // Pick top 3 distinct faults with non-overlapping timestamps and rules
    const selected: Candidate[] = [];
    const usedRuleIds = new Set<string>();
    const usedTimestamps: number[] = [];

    for (const cand of allCandidates) {
      if (selected.length >= 3) break;
      const isTimeTooClose = usedTimestamps.some((t) => Math.abs(t - cand.timestamp) < 0.2);
      const isRuleUsed = usedRuleIds.has(cand.rule.id);

      if (!isTimeTooClose && !isRuleUsed) {
        selected.push(cand);
        usedRuleIds.add(cand.rule.id);
        usedTimestamps.push(cand.timestamp);
      }
    }

    // Fallback if fewer than 3
    if (selected.length < 3) {
      for (const cand of allCandidates) {
        if (selected.length >= 3) break;
        if (!selected.some((s) => s.rule.id === cand.rule.id && Math.abs(s.timestamp - cand.timestamp) < 0.1)) {
          selected.push(cand);
        }
      }
    }

    if (selected.length < 3) {
      const needed = 3 - selected.length;
      for (let i = 0; i < searchPool.length && selected.length < 3; i++) {
        const frame = searchPool[i];
        const rule = sportRule.jointRules[selected.length % sportRule.jointRules.length] || sportRule.jointRules[0];
        const angle = frame.angles?.[rule.id] ?? Math.round((rule.idealMin + rule.idealMax) / 2 - 14);
        selected.push({
          rule,
          frame,
          measuredAngle: angle,
          delta: 14,
          timestamp: Math.round(frame.timestamp * 100) / 100,
          phase: frame.detectedPhase || phases[selected.length % phases.length],
        });
      }
    }

    return selected.slice(0, 3).map((item, idx) => {
      const rule = item.rule;
      const val = item.measuredAngle;
      const delta = Math.max(1, item.delta);
      const phaseName = item.phase;

      return {
        id: `fault-${idx + 1}-${rule.id}-${item.timestamp}`,
        rank: idx + 1,
        rule,
        measuredAngle: val,
        targetRange: `${rule.idealMin}° - ${rule.idealMax}°`,
        delta,
        severity: delta >= 18 ? 'critical' : delta >= 9 ? 'high' : 'moderate',
        phase: phaseName,
        timestamp: item.timestamp,
        frame: item.frame,
        title: `${rule.name} (${phaseName})`,
        causeDescription:
          val < rule.idealMin
            ? `At ${item.timestamp.toFixed(2)}s during ${phaseName}, your ${rule.name.toLowerCase()} collapsed to ${val}°, which is ${delta}° below the optimal threshold (${rule.idealMin}°).`
            : `At ${item.timestamp.toFixed(2)}s during ${phaseName}, your ${rule.name.toLowerCase()} flared to ${val}°, over-extending by ${delta}° beyond the safe limit (${rule.idealMax}°).`,
        correctionCues:
          rule.impactOnPerformance ||
          `Maintain strict ${rule.idealMin}°-${rule.idealMax}° hinge alignment during ${phaseName}.`,
        biomechanicalConsequence:
          rule.injuryRiskFactor || 'Causes kinetic power leakage and increases joint shear load.',
      };
    });
  }, [keyframeList, allFrames, sportRule]);

  // Smooth sinusoidal morphing loop
  useEffect(() => {
    if (!isPlayingMorph) return;

    let start = Date.now();
    const cycleMs = 2400;

    const interval = setInterval(() => {
      const elapsed = (Date.now() - start) % cycleMs;
      const t = elapsed / cycleMs;
      const smooth = (Math.sin(t * Math.PI * 2 - Math.PI / 2) + 1) / 2;
      setMorphInterpolation(smooth);
    }, 30);

    return () => clearInterval(interval);
  }, [isPlayingMorph]);

  const videoRef = useRef<Video>(null);
  const [containerWidth, setContainerWidth] = useState<number>(Dimensions.get('window').width - 48);
  const [containerHeight, setContainerHeight] = useState<number>(220);

  useEffect(() => {
    if (videoRef.current && activeFault) {
      videoRef.current.setPositionAsync(activeFault.timestamp * 1000);
    }
  }, [selectedFaultIdx, activeFault]);

  const W = containerWidth;
  const H = containerHeight;

  // Build Actual (Red) vs Optimal Ghost (Emerald) landmark sets
  const { actualLms, ghostLms, interpolatedLms } = useMemo(() => {
    const defaultLms: MediaPipeLandmark[] = new Array(33).fill(null).map(() => ({ x: 0.5, y: 0.5, z: 0, visibility: 0.9 }));
    
    // Base pose from active frame
    const base = activeFault?.frame?.landmarks && activeFault.frame.landmarks.length >= 29
      ? activeFault.frame.landmarks
      : defaultLms;

    // Actual coordinates
    const actual = base.map((lm) => ({ ...lm }));

    // Ghost coordinates: adjust the keypoints of the active rule towards ideal midpoint
    const ghost = base.map((lm) => ({ ...lm }));
    if (activeFault?.rule?.keypoints && activeFault.rule.keypoints.length === 3) {
      const [p1Idx, vertexIdx, p3Idx] = activeFault.rule.keypoints;
      const targetMid = (activeFault.rule.idealMin + activeFault.rule.idealMax) / 2;
      const measured = activeFault.measuredAngle || 90;
      const correctionRatio = (targetMid - measured) / 180;

      // Adjust vertex position slightly to visually represent target posture
      if (ghost[vertexIdx]) {
        ghost[vertexIdx] = {
          ...ghost[vertexIdx],
          x: ghost[vertexIdx].x + correctionRatio * 0.05,
          y: ghost[vertexIdx].y - Math.abs(correctionRatio) * 0.03,
        };
      }
      if (ghost[p3Idx]) {
        ghost[p3Idx] = {
          ...ghost[p3Idx],
          x: ghost[p3Idx].x + correctionRatio * 0.08,
          y: ghost[p3Idx].y - correctionRatio * 0.04,
        };
      }
    }

    // Interpolated coordinates based on morph factor
    const interp = actual.map((a, i) => {
      const g = ghost[i] || a;
      return {
        x: a.x + (g.x - a.x) * morphInterpolation,
        y: a.y + (g.y - a.y) * morphInterpolation,
        z: (a.z || 0) + ((g.z || 0) - (a.z || 0)) * morphInterpolation,
        visibility: a.visibility,
      };
    });

    return { actualLms: actual, ghostLms: ghost, interpolatedLms: interp };
  }, [activeFault, morphInterpolation]);

  const renderSkeleton = (lms: MediaPipeLandmark[], color: string, strokeW: number, opacity: number) => {
    if (!lms || lms.length < 29) return null;

    const connections = [
      [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], // Upper body
      [11, 23], [12, 24], [23, 24], // Torso box
      [23, 25], [25, 27], [24, 26], [26, 28], // Legs
    ];

    return (
      <G opacity={opacity}>
        {/* Torso Area */}
        {lms[11] && lms[12] && lms[24] && lms[23] && (
          <Polygon
            points={`
              ${lms[11].x * W},${lms[11].y * H}
              ${lms[12].x * W},${lms[12].y * H}
              ${lms[24].x * W},${lms[24].y * H}
              ${lms[23].x * W},${lms[23].y * H}
            `}
            fill={color === '#22c55e' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)'}
          />
        )}

        {/* Head */}
        {lms[0] && (
          <Circle
            cx={lms[0].x * W}
            cy={lms[0].y * H - 4}
            r={10}
            fill={color === '#22c55e' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}
            stroke={color}
            strokeWidth={1.5}
          />
        )}

        {/* Bones */}
        {connections.map(([i1, i2], idx) => {
          const p1 = lms[i1];
          const p2 = lms[i2];
          if (!p1 || !p2) return null;
          return (
            <Line
              key={`bone-${idx}`}
              x1={p1.x * W}
              y1={p1.y * H}
              x2={p2.x * W}
              y2={p2.y * H}
              stroke={color}
              strokeWidth={strokeW}
              strokeLinecap="round"
            />
          );
        })}

        {/* Joints */}
        {[11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].map((i) => {
          const p = lms[i];
          if (!p) return null;
          return (
            <Circle
              key={`joint-${i}`}
              cx={p.x * W}
              cy={p.y * H}
              r={color === '#22c55e' ? 3.5 : 3}
              fill="#09090b"
              stroke={color}
              strokeWidth={1.5}
            />
          );
        })}
      </G>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Target color="#ef4444" size={18} />
          <Text style={styles.headerTitle}>TOP 3 BIOMECHANICAL CORRECTIONS</Text>
        </View>
        <View style={styles.headerPill}>
          <Sparkles color="#eab308" size={12} />
          <Text style={styles.headerPillText}>AI CORRIDOR AUDIT</Text>
        </View>
      </View>

      {/* 3 Fault Selector Tabs */}
      <View style={styles.tabRow}>
        {top3Faults.map((fault, idx) => {
          const isSelected = selectedFaultIdx === idx;
          const sevColor = fault.severity === 'critical' ? '#ef4444' : fault.severity === 'high' ? '#f59e0b' : '#38bdf8';

          return (
            <TouchableOpacity
              key={fault.id || idx}
              onPress={() => setSelectedFaultIdx(idx)}
              style={[styles.faultTab, isSelected && styles.faultTabSelected]}
            >
              <View style={styles.faultTabHeader}>
                <View style={[styles.rankCircle, { backgroundColor: isSelected ? sevColor : '#27272a' }]}>
                  <Text style={styles.rankText}>#{fault.rank}</Text>
                </View>
                <View style={[styles.sevTag, { borderColor: sevColor }]}>
                  <Text style={[styles.sevTagText, { color: sevColor }]}>{fault.severity.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={[styles.faultTabTitle, isSelected && styles.faultTabTitleSelected]} numberOfLines={1}>
                {fault.rule.name}
              </Text>
              <Text style={styles.faultTabDelta}>Δ {fault.delta}° Deviation</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Visualizer Canvas Box */}
      <View style={styles.visualizerBox}>
        {/* Mode Switcher */}
        <View style={styles.modeBar}>
          <TouchableOpacity
            onPress={() => setViewMode('ghost_overlay')}
            style={[styles.modeBtn, viewMode === 'ghost_overlay' && styles.modeBtnActive]}
          >
            <Layers color={viewMode === 'ghost_overlay' ? '#000' : '#a1a1aa'} size={12} />
            <Text style={[styles.modeBtnText, viewMode === 'ghost_overlay' && styles.modeBtnTextActive]}>
              Ghost Overlay
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setViewMode('morph_loop')}
            style={[styles.modeBtn, viewMode === 'morph_loop' && styles.modeBtnActive]}
          >
            <Play color={viewMode === 'morph_loop' ? '#000' : '#a1a1aa'} size={12} />
            <Text style={[styles.modeBtnText, viewMode === 'morph_loop' && styles.modeBtnTextActive]}>
              Morph Loop
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setViewMode('side_by_side')}
            style={[styles.modeBtn, viewMode === 'side_by_side' && styles.modeBtnActive]}
          >
            <Eye color={viewMode === 'side_by_side' ? '#000' : '#a1a1aa'} size={12} />
            <Text style={[styles.modeBtnText, viewMode === 'side_by_side' && styles.modeBtnTextActive]}>
              Side-by-Side
            </Text>
          </TouchableOpacity>
        </View>

        {/* SVG Drawing Surface */}
        <View 
          style={styles.svgContainer}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            if (width > 0 && height > 0) {
              setContainerWidth(width);
              setContainerHeight(height);
            }
          }}
        >
          {videoUrl ? (
            <Video
              ref={videoRef}
              source={{ uri: videoUrl }}
              resizeMode={ResizeMode.CONTAIN}
              isMuted={true}
              shouldPlay={false}
              style={StyleSheet.absoluteFillObject}
            />
          ) : null}
          <Svg width={W} height={H} pointerEvents="none">
            {/* Dark Grid Lines */}
            <Line x1={20} y1={H - 20} x2={W - 20} y2={H - 20} stroke="#27272a" strokeWidth={1} />
            <Line x1={W / 2} y1={10} x2={W / 2} y2={H - 10} stroke="#18181b" strokeWidth={1} strokeDasharray="3,3" />

            {viewMode === 'ghost_overlay' && (
              <>
                {/* 1. Actual Detected Skeleton (Red) */}
                {renderSkeleton(actualLms, '#ef4444', 3, 0.95)}

                {/* 2. Optimal Ghost Skeleton (Glowing Emerald Green) */}
                {renderSkeleton(ghostLms, '#22c55e', 2.5, 0.85)}
              </>
            )}

            {viewMode === 'morph_loop' && (
              <>
                {/* Dynamic Morphing Skeleton */}
                {renderSkeleton(
                  interpolatedLms,
                  morphInterpolation < 0.5 ? '#ef4444' : '#22c55e',
                  3,
                  1
                )}
              </>
            )}

            {viewMode === 'side_by_side' && (
              <>
                {/* Left side actual */}
                <G transform={`translate(${-W * 0.22}, 0) scale(0.85)`}>
                  {renderSkeleton(actualLms, '#ef4444', 3, 0.9)}
                </G>
                {/* Right side optimal */}
                <G transform={`translate(${W * 0.22}, 0) scale(0.85)`}>
                  {renderSkeleton(ghostLms, '#22c55e', 3, 0.9)}
                </G>
              </>
            )}

            {/* Angle Callout Overlay */}
            <Rect x={10} y={10} width={135} height={24} rx={6} fill="rgba(239, 68, 68, 0.2)" stroke="#ef4444" strokeWidth={1} />
            <SvgText x={18} y={26} fill="#fca5a5" fontSize="10" fontWeight="bold" fontFamily="system-ui">
              Actual: {activeFault?.measuredAngle}° (Fault)
            </SvgText>

            <Rect x={W - 150} y={10} width={140} height={24} rx={6} fill="rgba(34, 197, 94, 0.2)" stroke="#22c55e" strokeWidth={1} />
            <SvgText x={W - 142} y={26} fill="#86efac" fontSize="10" fontWeight="bold" fontFamily="system-ui">
              Target: {activeFault?.targetRange}
            </SvgText>
          </Svg>

          {/* Bottom Floating Action Bar inside Visualizer */}
          <View style={styles.canvasBottomRow}>
            {/* Seek Timestamp Button */}
            <TouchableOpacity
              onPress={() => {
                if (activeFault?.timestamp !== undefined) {
                  onSeekTimestamp?.(activeFault.timestamp);
                }
              }}
              style={styles.seekButton}
            >
              <Target color="#000" size={12} />
              <Text style={styles.seekButtonText}>
                JUMP TO VIDEO ({activeFault?.timestamp.toFixed(2)}s)
              </Text>
            </TouchableOpacity>

            {/* Morph Loop Animation Toggle */}
            {viewMode === 'morph_loop' && (
              <TouchableOpacity
                onPress={() => setIsPlayingMorph(!isPlayingMorph)}
                style={styles.morphToggleBtn}
              >
                {isPlayingMorph ? <Pause color="#fff" size={12} /> : <Play color="#fff" size={12} />}
                <Text style={styles.morphToggleText}>
                  {isPlayingMorph ? 'PAUSE MORPH' : 'PLAY MORPH'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
            <Text style={styles.legendText}>Actual Detected ({activeFault?.measuredAngle}°)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
            <Text style={styles.legendText}>Gold Standard Target ({activeFault?.targetRange})</Text>
          </View>
        </View>
      </View>

      {/* Fault Deep Diagnostic Details */}
      {activeFault && (
        <View style={styles.detailsCard}>
          {/* 1. Primary Cause */}
          <View style={styles.detailSection}>
            <View style={styles.detailSectionHeader}>
              <AlertTriangle color="#ef4444" size={14} />
              <Text style={styles.detailSectionTitle}>PRIMARY MOVEMENT COLLAPSE</Text>
            </View>
            <Text style={styles.detailBodyText}>{activeFault.causeDescription}</Text>
          </View>

          {/* 2. Biomechanical Consequence */}
          <View style={[styles.detailSection, styles.detailSectionWarning]}>
            <View style={styles.detailSectionHeader}>
              <Zap color="#f59e0b" size={14} />
              <Text style={[styles.detailSectionTitle, { color: '#f59e0b' }]}>
                ENERGY LEAKAGE & INJURY RISK
              </Text>
            </View>
            <Text style={styles.detailBodyText}>{activeFault.biomechanicalConsequence}</Text>
          </View>

          {/* 3. Corrective Coaching Cue */}
          <View style={[styles.detailSection, styles.detailSectionSuccess]}>
            <View style={styles.detailSectionHeader}>
              <CheckCircle2 color="#22c55e" size={14} />
              <Text style={[styles.detailSectionTitle, { color: '#22c55e' }]}>
                CORRECTIVE ACTION CUE
              </Text>
            </View>
            <Text style={styles.detailBodyText}>{activeFault.correctionCues}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#09090b',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#18181b',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  headerPillText: {
    color: '#eab308',
    fontSize: 9,
    fontWeight: 'bold',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  faultTab: {
    flex: 1,
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  faultTabSelected: {
    backgroundColor: '#27272a',
    borderColor: '#ef4444',
  },
  faultTabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  rankCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
  },
  sevTag: {
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  sevTagText: {
    fontSize: 7,
    fontWeight: '900',
  },
  faultTabTitle: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },
  faultTabTitleSelected: {
    color: '#ffffff',
  },
  faultTabDelta: {
    color: '#f87171',
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  visualizerBox: {
    backgroundColor: '#121215',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    overflow: 'hidden',
    marginBottom: 14,
  },
  modeBar: {
    flexDirection: 'row',
    backgroundColor: '#18181b',
    padding: 4,
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    borderRadius: 8,
  },
  modeBtnActive: {
    backgroundColor: '#eab308',
  },
  modeBtnText: {
    color: '#a1a1aa',
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  modeBtnTextActive: {
    color: '#000000',
    fontWeight: '900',
  },
  svgContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: '#09090b',
  },
  canvasBottomRow: {
    position: 'absolute',
    bottom: 8,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  seekButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  seekButtonText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  morphToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#27272a',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  morphToggleText: {
    color: '#ffffff',
    fontSize: 8.5,
    fontWeight: 'bold',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 8,
    backgroundColor: '#18181b',
    borderTopWidth: 1,
    borderTopColor: '#27272a',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: '#d4d4d8',
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  detailsCard: {
    backgroundColor: '#18181b',
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  detailSection: {
    backgroundColor: '#09090b',
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444',
  },
  detailSectionWarning: {
    borderLeftColor: '#f59e0b',
  },
  detailSectionSuccess: {
    borderLeftColor: '#22c55e',
  },
  detailSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  detailSectionTitle: {
    color: '#ef4444',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  detailBodyText: {
    color: '#e4e4e7',
    fontSize: 11,
    lineHeight: 16,
  },
});
