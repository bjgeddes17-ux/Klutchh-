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

  const sortedFrames = useMemo(() => {
    return [...allFrames].sort((a, b) => a.timestamp - b.timestamp);
  }, [allFrames]);

  const handleSeek = (timestamp: number) => {
    setCurrentTime(timestamp);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#09090b" />
      
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
          <Activity color={activeTab === 'video' ? '#ef4444' : '#71717a'} size={14} />
          <Text style={[styles.subTabText, activeTab === 'video' && styles.subTabTextActive]}>VIDEO & SKELETON</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.subTab, activeTab === 'faults' && styles.subTabActive]} 
          onPress={() => setActiveTab('faults')}
        >
          <ShieldAlert color={activeTab === 'faults' ? '#ef4444' : '#71717a'} size={14} />
          <Text style={[styles.subTabText, activeTab === 'faults' && styles.subTabTextActive]}>FAULTS & GHOST</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.subTab, activeTab === 'metrics' && styles.subTabActive]} 
          onPress={() => setActiveTab('metrics')}
        >
          <Zap color={activeTab === 'metrics' ? '#ef4444' : '#71717a'} size={14} />
          <Text style={[styles.subTabText, activeTab === 'metrics' && styles.subTabTextActive]}>METRICS</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        
        {/* Video & Skeleton Stage */}
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
          
          {/* Controls Overlay */}
          <TouchableOpacity 
            onPress={() => setIsPlaying(!isPlaying)}
            style={styles.playButtonOverlay}
          >
            {isPlaying ? <Pause color="#fff" size={24} /> : <Play color="#fff" size={24} />}
          </TouchableOpacity>

          <View style={styles.timestampBadge}>
            <Text style={styles.timestampText}>{currentTime.toFixed(2)}s</Text>
          </View>
        </View>

        {/* Keyframe Timeline Scrubber */}
        {keyframeList.length > 0 && (
          <View style={styles.keyframeSection}>
            <Text style={styles.sectionTitle}>SYNCHRONIZED KEYFRAMES</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.keyframeRow}>
              {keyframeList.map((kf, idx) => {
                const isCurrent = Math.abs(kf.timestamp - currentTime) < 0.2;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.keyframeCard, isCurrent && styles.keyframeCardActive]}
                    onPress={() => handleSeek(kf.timestamp)}
                  >
                    <Text style={[styles.keyframePhase, isCurrent && styles.keyframePhaseActive]}>
                      {kf.detectedPhase || `Phase ${idx + 1}`}
                    </Text>
                    <Text style={styles.keyframeTime}>{kf.timestamp.toFixed(2)}s</Text>
                    {isCurrent && <View style={styles.activeDot} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Hero Score Section */}
        <View style={styles.scoreCard}>
          <View>
            <Text style={styles.scoreLabel}>OVERALL KLUTCHH GRADE</Text>
            <Text style={styles.scoreValue}>{aiReport?.overallGrade || 'A-'}</Text>
            <Text style={styles.scoreSubtext}>{aiReport?.summaryTitle || 'Biomechanical Precision'}</Text>
          </View>
          <View style={styles.scoreCircle}>
             <Award color="#ef4444" size={28} />
          </View>
        </View>

        {/* Active Tab: Faults & Insights */}
        {activeTab === 'faults' && (
          <View style={styles.insightSection}>
            <Text style={styles.sectionTitle}>TOP BIOMECHANICAL CORRECTIONS</Text>
            {sportRule.jointRules.slice(0, 3).map((rule, idx) => (
              <View key={rule.id || idx} style={styles.faultCard}>
                <View style={styles.faultHeader}>
                  <View style={styles.faultRankBadge}>
                    <Text style={styles.faultRankText}>#{idx + 1}</Text>
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
                  <View style={styles.insightIcon}><AlertCircle color="#ef4444" size={16} /></View>
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
    color: '#ef4444',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
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
    backgroundColor: '#111',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  playButtonOverlay: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    backgroundColor: 'rgba(0,0,0,0.65)',
    padding: 10,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  timestampBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  timestampText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  keyframeSection: {
    gap: 8,
  },
  keyframeRow: {
    gap: 8,
    paddingVertical: 4,
  },
  keyframeCard: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#141417',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
    gap: 2,
  },
  keyframeCardActive: {
    borderColor: '#ef4444',
    backgroundColor: '#1f1a1a',
  },
  keyframePhase: {
    color: '#a1a1aa',
    fontSize: 9,
    fontWeight: '800',
  },
  keyframePhaseActive: {
    color: '#ef4444',
  },
  keyframeTime: {
    color: '#71717a',
    fontSize: 8,
    fontWeight: '700',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ef4444',
    marginTop: 2,
  },
  scoreCard: {
    backgroundColor: '#141417',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  scoreLabel: {
    color: '#71717a',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  scoreValue: {
    color: '#ef4444',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 1,
  },
  scoreSubtext: {
    color: '#a1a1aa',
    fontSize: 11,
    fontWeight: '700',
  },
  scoreCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
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
    backgroundColor: '#141417',
    padding: 14,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  insightIcon: {
    padding: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
  },
  insightText: {
    color: '#d4d4d8',
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
  faultCard: {
    backgroundColor: '#141417',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    gap: 8,
  },
  faultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  faultRankBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#ef4444',
    borderRadius: 6,
  },
  faultRankText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
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
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '800',
  },
  metricStatus: {
    color: '#22c55e',
    fontSize: 8,
    fontWeight: '900',
  },
});
