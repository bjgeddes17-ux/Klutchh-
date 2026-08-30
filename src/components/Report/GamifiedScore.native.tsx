import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Award } from 'lucide-react-native';

interface GamifiedScoreProps {
  grade: string;
  title: string;
}

export const GamifiedScore: React.FC<GamifiedScoreProps> = ({ grade, title }) => (
  <View style={styles.scoreCard}>
    <View style={styles.scoreCircle}>
       <Award color="#facc15" size={28} />
    </View>
    <View style={styles.scoreContent}>
      <Text style={styles.scoreLabel}>PERFORMANCE RATING</Text>
      <Text style={styles.scoreValue}>{grade}</Text>
      <Text style={styles.scoreSubtext}>{title}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  scoreCard: {
    backgroundColor: '#0c0c0e',
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.1)',
  },
  scoreCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(250, 204, 21, 0.15)',
    borderWidth: 2,
    borderColor: '#facc15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreContent: {
    flex: 1,
  },
  scoreLabel: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    fontStyle: 'italic',
  },
  scoreValue: {
    color: '#facc15',
    fontSize: 42,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 1,
    marginVertical: 4,
  },
  scoreSubtext: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
