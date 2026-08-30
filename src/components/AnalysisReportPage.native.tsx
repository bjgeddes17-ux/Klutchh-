import React, { useState, useMemo, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  StyleSheet, 
  StatusBar,
  Dimensions
} from 'react-native';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { KineticVideoPlayer } from './Report/KineticVideoPlayer.native';
import { GamifiedScore } from './Report/GamifiedScore.native';
import { Top3Frames } from './Report/Top3Frames.native';
import { DrillsSection } from './Report/DrillsSection.native';
import { ArrowLeft, Download, AlertCircle, Play, Pause, Activity, Flame, ShieldAlert, Award, Zap } from 'lucide-react-native';
import { SportRule, FrameAnalysis, AICoachingReport } from '../types';

interface AnalysisReportPageProps {
  sportRule: SportRule;
  videoUrl: string | null;
  keyframeList: FrameAnalysis[];
  allFrames?: FrameAnalysis[];
  aiReport: AICoachingReport | null;
  dynamicMetrics?: any;
  onBack: () => void;
}

export const AnalysisReportPage: React.FC<AnalysisReportPageProps> = ({
  sportRule,
  videoUrl,
  keyframeList = [],
  allFrames = [],
  aiReport,
  onBack
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeTab, setActiveTab] = useState<'video' | 'faults' | 'metrics'>('video');
  const videoRef = useRef<any>(null);

  const sortedFrames = useMemo(() => {
    return [...allFrames].sort((a, b) => a.timestamp - b.timestamp);
  }, [allFrames]);

  const handleSeek = (timestamp: number) => {
    setCurrentTime(timestamp);
    if (videoRef.current) {
      videoRef.current.seek(timestamp);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const onSlidingComplete = (value: number) => {
    handleSeek(value);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft color="#fff" size={20} />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerSubtitle}>{sportRule.name.toUpperCase()} PERFORMANCE</Text>
          <Text style={styles.headerTitle}>BIOMETRIC REPORT</Text>
        </View>
        <TouchableOpacity style={styles.exportButton}>
          <Download color="#fff" size={18} />
        </TouchableOpacity>
      </View>

      {/* Sub-Navigation */}
      <View style={styles.tabRow}>
        <TouchableOpacity 
          style={[styles.subTab, activeTab === 'video' && styles.subTabActive]} 
          onPress={() => setActiveTab('video')}
        >
          <Activity color={activeTab === 'video' ? '#facc15' : '#71717a'} size={14} />
          <Text style={[styles.subTabText, activeTab === 'video' && styles.subTabTextActive]}>VIDEO HUD</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.subTab, activeTab === 'faults' && styles.subTabActive]} 
          onPress={() => setActiveTab('faults')}
        >
          <ShieldAlert color={activeTab === 'faults' ? '#facc15' : '#71717a'} size={14} />
          <Text style={[styles.subTabText, activeTab === 'faults' && styles.subTabTextActive]}>DIAGNOSTICS</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.subTab, activeTab === 'metrics' && styles.subTabActive]} 
          onPress={() => setActiveTab('metrics')}
        >
          <Zap color={activeTab === 'metrics' ? '#facc15' : '#71717a'} size={14} />
          <Text style={[styles.subTabText, activeTab === 'metrics' && styles.subTabTextActive]}>TELEMETRY</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        
        {/* Video & Skeleton Stage */}
        <View style={styles.videoStage}>
          <KineticVideoPlayer
            ref={videoRef}
            videoUrl={videoUrl || ''}
            sportRule={sportRule}
            sortedFrames={sortedFrames}
            isPlaying={isPlaying}
            currentTime={currentTime}
            onTimeUpdate={setCurrentTime}
            onDurationChange={setDuration}
            isDataReady={true}
          />
          
          {/* Controls Overlay */}
          <View style={styles.videoHudTop}>
            <View style={styles.timestampBadge}>
              <Text style={styles.timestampText}>{currentTime.toFixed(2)}s / {duration.toFixed(2)}s</Text>
            </View>
            <View style={styles.liveTag}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>BIO-FEEDBACK</Text>
            </View>
          </View>

          <TouchableOpacity 
            onPress={() => setIsPlaying(!isPlaying)}
            style={styles.playButtonOverlay}
          >
            {isPlaying ? <Pause color="#fff" size={20} /> : <Play color="#fff" size={20} fill="#fff" />}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.fullscreenButtonOverlay}
            onPress={() => {
              // Implementation for full screen toggle
            }}
          >
             <Text style={{color: 'white', fontSize: 10}}>FULL</Text>
          </TouchableOpacity>
        </View>

        {/* Manual HUD Scrubber */}
        <View style={styles.scrubberContainer}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={duration || 1}
            value={currentTime}
            onSlidingComplete={onSlidingComplete}
            onValueChange={(val) => {
              setCurrentTime(val);
              // Real-time skeleton sync while dragging
            }}
            minimumTrackTintColor="#facc15"
            maximumTrackTintColor="#27272a"
            thumbTintColor="#facc15"
          />
          <View style={styles.scrubberLabels}>
            <Text style={styles.scrubberTime}>0.00</Text>
            <Text style={styles.scrubberTime}>{duration.toFixed(2)}s</Text>
          </View>
        </View>

        {/* Hero Score Section */}
        <GamifiedScore 
          grade={aiReport?.overallGrade || 'A'} 
          title={aiReport?.summaryTitle || 'BIOMECHANICAL PRECISION'} 
        />

        {/* Top 3 Frames */}
        {keyframeList.length > 0 && (
          <Top3Frames 
            keyframes={keyframeList} 
            onSeek={handleSeek} 
            currentTime={currentTime} 
          />
        )}
        
        {/* Corrective Drills Section */}
        {aiReport?.funCorrectiveDrills && aiReport.funCorrectiveDrills.length > 0 && (
          <DrillsSection drills={aiReport.funCorrectiveDrills} />
        )}

        {/* Active Tab: Faults & Insights */}
        {activeTab === 'faults' && (
          <View style={styles.insightSection}>
            <Text style={styles.sectionTitle}>ANOMALY LOGS</Text>
            {sportRule.jointRules.slice(0, 3).map((rule, idx) => (
              <View key={rule.id || idx} style={styles.faultCard}>
                <View style={styles.faultHeader}>
                  <View style={styles.faultRankBadge}>
                    <Text style={styles.faultRankText}>RATING: #{idx + 1}</Text>
                  </View>
                  <Text style={styles.faultTitle}>{rule.name}</Text>
                  <View style={styles.faultDeltaBadge}>
                    <Text style={styles.faultDeltaText}>Target: {rule.idealMin}°-{rule.idealMax}°</Text>
                  </View>
                </View>
                <Text style={styles.faultDesc}>
                  {rule.impactOnPerformance || 'Maintain rigid kinetic alignment to maximize elastic power transmission.'}
                </Text>
                <Text style={styles.faultInjury}>
                  ⚠️ {rule.injuryRiskFactor || 'Excessive joint deviation increases shear stress.'}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Active Tab: Metrics */}
        {activeTab === 'metrics' && (
          <View style={styles.metricsSection}>
            <Text style={styles.sectionTitle}>JOINT ANGULAR CORRIDORS</Text>
            {sportRule.jointRules.map((rule, idx) => (
              <View key={rule.id || idx} style={styles.metricRow}>
                <View style={styles.metricInfo}>
                  <Text style={styles.metricName}>{rule.name}</Text>
                  <Text style={styles.metricPhase}>{rule.phase}</Text>
                </View>
                <View style={styles.metricRangeBox}>
                  <Text style={styles.metricRange}>{rule.idealMin}° - {rule.idealMax}°</Text>
                  <Text style={styles.metricStatus}>OPTIMAL</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* General Insights */}
        {activeTab === 'video' && (
          <View style={styles.insightSection}>
             <Text style={styles.sectionTitle}>COACHING SYNTHESIS</Text>
             {aiReport?.biomechanicInsights?.map((insight: any, idx: number) => (
               <View key={idx} style={styles.insightCard}>
                  <View style={styles.insightIcon}><AlertCircle color="#facc15" size={16} /></View>
                  <Text style={styles.insightText}>{typeof insight === 'string' ? insight : insight?.finding || insight?.title || ''}</Text>
               </View>
             ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#18181b',
    backgroundColor: '#09090b',
  },
  headerTitleBox: {
    flex: 1,
  },
  backButton: {
    padding: 8,
    backgroundColor: '#18181b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },
  headerSubtitle: {
    color: '#facc15',
    fontSize: 9,
    fontStyle: 'italic',
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  exportButton: {
    padding: 8,
    backgroundColor: '#18181b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#18181b',
    backgroundColor: '#0c0c0e',
  },
  subTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
    backgroundColor: 'transparent',
  },
  subTabActive: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  subTabText: {
    color: '#71717a',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subTabTextActive: {
    color: '#ffffff',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  videoStage: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#1f1f23',
    shadowColor: '#facc15',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  videoHudTop: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.2)',
  },
  liveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#facc15',
  },
  liveText: {
    color: '#facc15',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  playButtonOverlay: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    backgroundColor: 'rgba(0,0,0,0.65)',
    padding: 12,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.3)',
  },
  fullscreenButtonOverlay: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    backgroundColor: 'rgba(0,0,0,0.65)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.3)',
  },
  timestampBadge: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  timestampText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  scrubberContainer: {
    backgroundColor: '#0c0c0e',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1f1f23',
  },
  slider: {
    width: '100%',
    height: 30,
  },
  scrubberLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  scrubberTime: {
    color: '#52525b',
    fontSize: 9,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  scoreCard: {
    backgroundColor: '#0c0c0e',
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.1)',
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
  scoreCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(250, 204, 21, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightSection: {
    gap: 10,
  },
  sectionTitle: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  insightCard: {
    backgroundColor: '#0c0c0e',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1f1f23',
    borderLeftWidth: 3,
    borderLeftColor: '#facc15',
  },
  insightIcon: {
    padding: 6,
    backgroundColor: 'rgba(250, 204, 21, 0.05)',
    borderRadius: 8,
  },
  insightText: {
    color: '#d4d4d8',
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
  faultCard: {
    backgroundColor: '#0c0c0e',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1f1f23',
    gap: 10,
  },
  faultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  faultRankBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#facc15',
    borderRadius: 4,
  },
  faultRankText: {
    color: '#000',
    fontSize: 9,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  faultTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    flex: 1,
  },
  faultDeltaBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#27272a',
    borderRadius: 6,
  },
  faultDeltaText: {
    color: '#a1a1aa',
    fontSize: 9,
    fontWeight: '700',
  },
  faultDesc: {
    color: '#a1a1aa',
    fontSize: 11,
    lineHeight: 16,
  },
  faultInjury: {
    color: '#f59e0b',
    fontSize: 10,
    fontWeight: '700',
  },
  metricsSection: {
    gap: 8,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#141417',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  metricInfo: {
    gap: 2,
  },
  metricName: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  metricPhase: {
    color: '#71717a',
    fontSize: 9,
    fontWeight: '700',
  },
  metricRangeBox: {
    alignItems: 'flex-end',
    gap: 2,
  },
  metricRange: {
    color: '#facc15',
    fontSize: 11,
    fontWeight: '800',
  },
  metricStatus: {
    color: '#22c55e',
    fontSize: 8,
    fontWeight: '900',
  },
});
