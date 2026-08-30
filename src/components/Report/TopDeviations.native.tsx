import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ShieldAlert, ArrowUpRight, Target } from 'lucide-react-native';
import { SportRule } from '../../types';

export interface DeviationMoment {
  ruleId: string;
  ruleName: string;
  timestamp: number;
  currentValue: number;
  targetRange: [number, number];
  status: 'error' | 'warning';
  correction: string;
}

interface TopDeviationsProps {
  deviations: DeviationMoment[];
  onSeek: (timestamp: number) => void;
}

export const TopDeviations: React.FC<TopDeviationsProps> = ({ deviations, onSeek }) => {
  if (deviations.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CRITICAL DEVIATIONS</Text>
      <View style={styles.list}>
        {deviations.map((dev, idx) => (
          <TouchableOpacity 
            key={`${dev.ruleId}-${idx}`} 
            style={[styles.card, dev.status === 'error' ? styles.cardError : styles.cardWarning]}
            onPress={() => onSeek(dev.timestamp)}
            activeOpacity={0.8}
          >
            <View style={styles.header}>
              <View style={styles.statusGroup}>
                <ShieldAlert color={dev.status === 'error' ? '#ef4444' : '#a855f7'} size={18} />
                <Text style={[styles.ruleName, dev.status === 'error' ? styles.textError : styles.textWarning]}>
                  {dev.ruleName}
                </Text>
              </View>
              <View style={styles.timestampBadge}>
                <Text style={styles.timestampText}>{dev.timestamp.toFixed(2)}s</Text>
              </View>
            </View>

            <View style={styles.metricsRow}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>CURRENT</Text>
                <Text style={styles.metricValue}>{dev.currentValue.toFixed(1)}°</Text>
              </View>
              <ArrowUpRight color="#3f3f46" size={16} />
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>OPTIMAL</Text>
                <Text style={styles.metricValue}>{dev.targetRange[0]}° - {dev.targetRange[1]}°</Text>
              </View>
            </View>

            <View style={styles.correctionBox}>
              <Target color="#facc15" size={14} />
              <Text style={styles.correctionText}>{dev.correction}</Text>
            </View>

            <View style={styles.actionPrompt}>
              <Text style={styles.promptText}>TAP TO REVIEW FRAME</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    gap: 12,
  },
  title: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: '#0c0c0e',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
  },
  cardError: {
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  cardWarning: {
    borderColor: 'rgba(168, 85, 247, 0.2)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ruleName: {
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  textError: { color: '#ef4444' },
  textWarning: { color: '#a855f7' },
  timestampBadge: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timestampText: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  metricItem: {
    gap: 2,
  },
  metricLabel: {
    color: '#52525b',
    fontSize: 9,
    fontWeight: '900',
  },
  metricValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  correctionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(250, 204, 21, 0.05)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.1)',
  },
  correctionText: {
    color: '#facc15',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
  actionPrompt: {
    marginTop: 12,
    alignItems: 'center',
  },
  promptText: {
    color: '#3f3f46',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
