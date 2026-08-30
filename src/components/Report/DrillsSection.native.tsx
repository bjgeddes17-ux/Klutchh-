import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Zap, Play } from 'lucide-react-native';
import { CorrectiveDrill } from '../../types';

interface DrillsSectionProps {
  drills: CorrectiveDrill[];
  onViewDrill?: (timestamp: number) => void;
}

export const DrillsSection: React.FC<DrillsSectionProps> = ({ drills, onViewDrill }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>CORRECTIVE DRILLS</Text>
    {drills.map((drill, idx) => (
      <TouchableOpacity 
        key={idx} 
        style={styles.drillCard}
        onPress={() => onViewDrill && drill.timestamp !== undefined && onViewDrill(drill.timestamp)}
        activeOpacity={0.7}
      >
        <View style={styles.drillIcon}>
          <Zap color="#facc15" size={18} />
        </View>
        <View style={styles.drillContent}>
          <View style={styles.drillHeader}>
            <Text style={styles.drillName}>{drill.name}</Text>
            {onViewDrill && (
              <View style={styles.watchBadge}>
                <Play color="#facc15" size={8} fill="#facc15" />
                <Text style={styles.watchText}>WATCH</Text>
              </View>
            )}
          </View>
          <Text style={styles.drillDesc}>{drill.description}</Text>
          <Text style={styles.drillReps}>Reps: {drill.reps}</Text>
        </View>
      </TouchableOpacity>
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
  drillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  drillName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  watchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(250, 204, 21, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  watchText: {
    color: '#facc15',
    fontSize: 8,
    fontWeight: '900',
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
