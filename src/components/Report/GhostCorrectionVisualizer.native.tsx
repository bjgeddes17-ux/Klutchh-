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
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Sparkles size={20} color="#34d399" />
          <Text style={styles.title}>FILMSTRIP ANALYSIS</Text>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {keyframeList.map((frame, idx) => (
          <TouchableOpacity 
            key={idx} 
            onPress={() => onSeekTimestamp?.(frame.timestamp)}
            style={styles.canvasContainer}
          >
            <Canvas style={{ width: 120, height: 120 }}>
              {POSE_CONNECTIONS.map((conn, cIdx) => {
                const p1 = frame.landmarks[conn.points[0]];
                const p2 = frame.landmarks[conn.points[1]];
                if (!p1 || !p2) return null;
                return (
                  <Line
                    key={`line-${cIdx}`}
                    p1={vec(p1.x * 120, p1.y * 120)}
                    p2={vec(p2.x * 120, p1.y * 120)}
                    color="#38bdf8"
                    strokeWidth={2}
                  />
                );
              })}
            </Canvas>
            <Text style={styles.tabBadgeText}>{frame.timestamp.toFixed(2)}s</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
