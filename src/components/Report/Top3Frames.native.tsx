import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Activity } from 'lucide-react-native';
import { FrameAnalysis } from '../../types';

interface Top3FramesProps {
  keyframes: FrameAnalysis[];
  onSeek: (timestamp: number) => void;
  currentTime: number;
}

export const Top3Frames: React.FC<Top3FramesProps> = ({ keyframes, onSeek, currentTime }) => {
  // Sort and take top 3 based on some criteria? Or just the first 3?
  // Let's assume keyframes provided are already relevant, take first 3.
  const displayFrames = keyframes.slice(0, 3);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>TOP 3 DIAGNOSTIC FRAMES</Text>
      <View style={styles.row}>
        {displayFrames.map((kf, idx) => {
          const isCurrent = Math.abs(kf.timestamp - currentTime) < 0.2;
          return (
            <TouchableOpacity
              key={idx}
              style={[styles.bentoCard, isCurrent && styles.bentoCardActive]}
              onPress={() => onSeek(kf.timestamp)}
            >
              <View style={styles.bentoHeader}>
                <Activity color={isCurrent ? '#000' : '#facc15'} size={16} />
                <Text style={[styles.bentoPhase, isCurrent && styles.bentoTextActive]}>{kf.detectedPhase || `PHASE ${idx + 1}`}</Text>
              </View>
              <Text style={[styles.bentoTime, isCurrent && styles.bentoTextActive]}>{kf.timestamp.toFixed(2)}s</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  bentoCard: {
    flex: 1,
    height: 80,
    backgroundColor: '#0c0c0e',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    justifyContent: 'center',
    gap: 4,
  },
  bentoCardActive: {
    backgroundColor: '#1c1c1a',
    borderColor: '#facc15',
  },
  bentoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bentoPhase: {
    color: '#71717a',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  bentoTextActive: {
    color: '#facc15',
  },
  bentoTime: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
});
