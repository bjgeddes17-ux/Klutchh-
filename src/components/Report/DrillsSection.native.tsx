import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Zap } from 'lucide-react-native';
import { CorrectiveDrill } from '../../types';

interface DrillsSectionProps {
  drills: CorrectiveDrill[];
}

export const DrillsSection: React.FC<DrillsSectionProps> = ({ drills }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>CORRECTIVE DRILLS</Text>
    {drills.map((drill, idx) => (
      <View key={idx} style={styles.drillCard}>
        <View style={styles.drillIcon}>
          <Zap color="#facc15" size={18} />
        </View>
        <View style={styles.drillContent}>
          <Text style={styles.drillName}>{drill.name}</Text>
          <Text style={styles.drillDesc}>{drill.description}</Text>
          <Text style={styles.drillReps}>Reps: {drill.reps}</Text>
        </View>
      </View>
    ))}
  </View>
);

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
  drillCard: {
    backgroundColor: '#0c0c0e',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1f1f23',
    flexDirection: 'row',
    gap: 16,
  },
  drillIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(250, 204, 21, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drillContent: {
    flex: 1,
    gap: 4,
  },
  drillName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  drillDesc: {
    color: '#a1a1aa',
    fontSize: 11,
    lineHeight: 16,
  },
  drillReps: {
    color: '#facc15',
    fontSize: 10,
    fontWeight: '900',
    marginTop: 4,
  },
});
