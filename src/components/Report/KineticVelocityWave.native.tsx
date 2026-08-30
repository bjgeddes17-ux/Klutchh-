import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Canvas, Path, Skia, LinearGradient, vec, Line } from '@shopify/react-native-skia';
import { FrameAnalysis } from '../../types';
import { Zap, TrendingUp, AlertTriangle } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface KineticVelocityWaveProps {
  allFrames: FrameAnalysis[];
  currentTime?: number;
  onSeek?: (time: number) => void;
}

export const KineticVelocityWaveNative: React.FC<KineticVelocityWaveProps> = ({
  allFrames,
  currentTime = 0,
}) => {
  const chartData = useMemo(() => {
    if (!allFrames || allFrames.length === 0) return [];
    return allFrames.map(f => {
      const totalVelocity = f.velocity 
        ? Object.values(f.velocity).reduce((acc: number, v: number) => acc + Math.abs(v), 0)
        : 0;
      return {
        timestamp: f.timestamp,
        value: totalVelocity,
      };
    }).sort((a, b) => a.timestamp - b.timestamp);
  }, [allFrames]);

  const peakVelocity = useMemo(() => {
    if (chartData.length === 0) return 0;
    return Math.max(...chartData.map(d => d.value));
  }, [chartData]);

  const CANVAS_WIDTH = SCREEN_WIDTH - 64;
  const CANVAS_HEIGHT = 120;

  const path = useMemo(() => {
    if (chartData.length < 2) return null;
    const skPath = Skia.Path.Make();
    const maxT = chartData[chartData.length - 1].timestamp || 1;
    const maxV = peakVelocity || 1;

    chartData.forEach((d, i) => {
      const x = (d.timestamp / maxT) * CANVAS_WIDTH;
      const y = CANVAS_HEIGHT - (d.value / (maxV * 1.1)) * CANVAS_HEIGHT;
      if (i === 0) skPath.moveTo(x, y);
      else skPath.lineTo(x, y);
    });

    return skPath;
  }, [chartData, peakVelocity, CANVAS_WIDTH, CANVAS_HEIGHT]);

  const scrubberX = useMemo(() => {
    if (chartData.length === 0) return 0;
    const maxT = chartData[chartData.length - 1].timestamp || 1;
    return (currentTime / maxT) * CANVAS_WIDTH;
  }, [currentTime, chartData, CANVAS_WIDTH]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <TrendingUp size={16} color="#38bdf8" />
          <Text style={styles.title}>KINETIC VELOCITY WAVEFORM</Text>
        </View>
        <View style={styles.peakBadge}>
          <Text style={styles.peakText}>PEAK: {Math.round(peakVelocity)}°/s</Text>
        </View>
      </View>

      <View style={styles.canvasWrapper}>
        <Canvas style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
          {path && (
            <>
              <Path
                path={path}
                color="#38bdf8"
                style="stroke"
                strokeWidth={3}
                strokeJoin="round"
              />
              <Path
                path={path}
                color="transparent"
                style="fill"
              >
                <LinearGradient
                  start={vec(0, 0)}
                  end={vec(0, CANVAS_HEIGHT)}
                  colors={['rgba(56, 189, 248, 0.4)', 'rgba(56, 189, 248, 0)']}
                />
              </Path>
            </>
          )}
          
          {/* Scrubber Line */}
          <Line
            p1={vec(scrubberX, 0)}
            p2={vec(scrubberX, CANVAS_HEIGHT)}
            color="#fbbf24"
            strokeWidth={2}
          />
        </Canvas>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Zap size={12} color="#fbbf24" />
          <Text style={styles.footerText}>Firing Efficiency: 92%</Text>
        </View>
        <View style={styles.footerItem}>
          <AlertTriangle size={12} color="#f87171" />
          <Text style={styles.footerText}>0 Energy Leaks</Text>
        </View>
      </View>
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
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  peakBadge: {
    backgroundColor: '#0c4a6e',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  peakText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  canvasWrapper: {
    backgroundColor: '#000000',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#18181b',
  },
  footer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
