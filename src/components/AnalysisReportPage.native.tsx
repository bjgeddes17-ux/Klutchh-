import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  StyleSheet, 
  StatusBar 
} from 'react-native';
import { KineticVideoPlayer } from './Report/KineticVideoPlayer';
import { ArrowLeft, Download, HardDrive, AlertCircle, Play, Pause } from 'lucide-react-native';
import { SportRule, FrameAnalysis, AICoachingReport } from '../types';

interface AnalysisReportPageProps {
  sportRule: SportRule;
  videoUrl: string | null;
  keyframeList: FrameAnalysis[];
  allFrames?: FrameAnalysis[];
  aiReport: AICoachingReport | null;
  onBack: () => void;
}

export const AnalysisReportPage: React.FC<AnalysisReportPageProps> = ({
  sportRule,
  videoUrl,
  allFrames = [],
  aiReport,
  onBack
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const sortedFrames = useMemo(() => {
    return [...allFrames].sort((a, b) => a.timestamp - b.timestamp);
  }, [allFrames]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft color="#fff" size={20} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerSubtitle}>{sportRule.name} ANALYSIS</Text>
          <Text style={styles.headerTitle}>BIOMETRIC REPORT</Text>
        </View>
        <TouchableOpacity style={styles.exportButton}>
          <Download color="#fff" size={18} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        
        {/* Native Video Stage */}
        <View style={styles.videoStage}>
          <KineticVideoPlayer
            videoUrl={videoUrl || ''}
            sportRule={sportRule}
            sortedFrames={sortedFrames}
            isPlaying={isPlaying}
            currentTime={currentTime}
            onTimeUpdate={setCurrentTime}
            onDurationChange={setDuration}
            isDataReady={true}
          />
          
          {/* Native Controls Overlay */}
          <TouchableOpacity 
            onPress={() => setIsPlaying(!isPlaying)}
            style={styles.playButtonOverlay}
          >
            {isPlaying ? <Pause color="#fff" size={32} /> : <Play color="#fff" size={32} />}
          </TouchableOpacity>
        </View>

        {/* Hero Score Section */}
        <View style={styles.scoreCard}>
          <View>
            <Text style={styles.scoreLabel}>KLUTCHH SCORE</Text>
            <Text style={styles.scoreValue}>{aiReport?.overallGrade || 'A-'}</Text>
          </View>
          <View style={styles.scoreCircle}>
             <Text style={styles.scorePercent}>85</Text>
          </View>
        </View>

        {/* Insight Cards */}
        <View style={styles.insightSection}>
           <Text style={styles.sectionTitle}>CORE INSIGHTS</Text>
           {aiReport?.biomechanicInsights.map((insight, idx) => (
             <View key={idx} style={styles.insightCard}>
                <View style={styles.insightIcon}><AlertCircle color="#ef4444" size={16} /></View>
                <Text style={styles.insightText}>{insight.finding}</Text>
             </View>
           ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#18181b',
  },
  backButton: {
    padding: 10,
    backgroundColor: '#27272a',
    borderRadius: 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  headerSubtitle: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: '900',
  },
  exportButton: {
    marginLeft: 'auto',
    padding: 10,
    backgroundColor: '#ef4444',
    borderRadius: 12,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  videoStage: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#111',
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  playButtonOverlay: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 12,
    borderRadius: 40,
  },
  scoreCard: {
    backgroundColor: '#18181b',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  scoreLabel: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: '900',
  },
  scoreValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  scoreCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    borderColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scorePercent: {
    color: '#fff',
    fontWeight: '900',
  },
  insightSection: {
    gap: 12,
  },
  sectionTitle: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
  insightCard: {
    backgroundColor: '#18181b',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  insightIcon: {
    padding: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
  },
  insightText: {
    color: '#d4d4d8',
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  }
});
