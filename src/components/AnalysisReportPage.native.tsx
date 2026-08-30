import React, { useState, useMemo, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  StyleSheet, 
  StatusBar,
  Dimensions,
  Share,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { KineticVideoPlayer } from './Report/KineticVideoPlayer.native';
import { GamifiedScore } from './Report/GamifiedScore.native';
import { Top3Frames } from './Report/Top3Frames.native';
import { DrillsSection } from './Report/DrillsSection.native';
import { TopDeviations, DeviationMoment } from './Report/TopDeviations.native';
import { GhostCorrectionVisualizerNative } from './Report/GhostCorrectionVisualizer.native';
import { KineticVelocityWaveNative } from './Report/KineticVelocityWave.native';
import { 
  ArrowLeft, 
  Download, 
  AlertCircle, 
  Play, 
  Pause, 
  Activity, 
  Flame, 
  ShieldAlert, 
  Award, 
  Zap, 
  SkipBack, 
  SkipForward,
  ChevronLeft,
  Share2,
  ShieldCheck
} from 'lucide-react-native';
import { SportRule, FrameAnalysis, AICoachingReport } from '../types';

const EXECUTIVE_DOSSIER_MOCK = {
  headline: 'KINETIC CHAIN PRECISION & STABILITY ANALYSIS',
  overviewText: 'High neuromuscular drive observed across key transition phases with minor valgus deviation during eccentric loading.',
  detectedFault: {
    title: 'Medial Knee Valgus Collapse on Dynamic Deceleration',
    description: 'During peak ground-contact deceleration, the lead knee exhibits a 14.2° internal rotation deviation away from the vertical tibial axis, losing kinetic force and creating shear stress.',
    angleDeviation: '+14.2° Inward Deviation',
    impact: 'Kinetic Energy Leakage: ~14% drop in forward impulse; increased ACL strain.',
  },
  goldStandard: {
    title: 'Triple-Joint Stacking (Hip-Knee-Ankle Neutral Axis)',
    description: 'Elite benchmark maintains the patellar apex directly collinear with the second metatarsal throughout eccentric load.',
    idealRange: '0° - 3° Tibiofemoral Neutral Corridor',
    forceTransmission: 'Delivers 98% efficient ground reaction transfer through the posterior chain.',
  },
};

interface AnalysisReportPageProps {
  sportRule: SportRule;
  videoUrl: string | null;
  keyframeList: FrameAnalysis[];
  allFrames?: FrameAnalysis[];
  aiReport: AICoachingReport | null;
  dynamicMetrics?: any;
  onBack: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const AnalysisReportPage: React.FC<AnalysisReportPageProps> = ({
  sportRule,
  videoUrl,
  keyframeList = [],
  allFrames = [],
  aiReport,
  dynamicMetrics,
  onBack
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeTab, setActiveTab] = useState<'diagnostics' | 'telemetry' | 'drills'>('diagnostics');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const videoRef = useRef<any>(null);

  const sortedFrames = useMemo(() => {
    return [...allFrames].sort((a, b) => a.timestamp - b.timestamp);
  }, [allFrames]);

  const handleSeek = (timestamp: number) => {
    const clampedTime = Math.max(0, Math.min(timestamp, duration));
    setCurrentTime(clampedTime);
    if (videoRef.current) {
      videoRef.current.seek(clampedTime);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleFrameStep = (direction: 'forward' | 'backward') => {
    setIsPlaying(false);
    const step = 0.033; 
    const nextTime = direction === 'forward' ? currentTime + step : currentTime - step;
    handleSeek(nextTime);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleShare = async () => {
    try {
      const exportData = {
        sport: sportRule.name,
        date: new Date().toISOString(),
        overallGrade: aiReport?.overallGrade || 'N/A',
        metrics: dynamicMetrics,
        frames: allFrames.length,
      };
      
      const result = await Share.share({
        message: `KLUTCHH Forensic Report: ${sportRule.name}\nGrade: ${exportData.overallGrade}\n\nDownload the Klutchh app to view the full interactive 3D analysis.`,
        title: `Klutchh Report - ${sportRule.name}`,
      });
      
      if (result.action === Share.sharedAction) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error: any) {
      Alert.alert('Share Failed', error.message);
    }
  };

  const topDeviations = useMemo(() => {
    if (!sortedFrames.length || !sportRule.jointRules.length) return [];
    const deviations: DeviationMoment[] = [];

    sportRule.jointRules.forEach(rule => {
      let maxDev = 0;
      let worstFrame: FrameAnalysis | null = null;
      sortedFrames.forEach(frame => {
        const val = frame.angles[rule.id];
        if (val !== undefined) {
          const mid = (rule.idealMin + rule.idealMax) / 2;
          const dev = Math.abs(val - mid);
          const status = frame.ruleResults[rule.id];
          if (status === 'error' || status === 'warning') {
            if (dev > maxDev) {
              maxDev = dev;
              worstFrame = frame;
            }
          }
        }
      });

      if (worstFrame) {
        const val = worstFrame.angles[rule.id];
        deviations.push({
          ruleId: rule.id,
          ruleName: rule.name,
          timestamp: worstFrame.timestamp,
          currentValue: val,
          targetRange: [rule.idealMin, rule.idealMax],
          status: worstFrame.ruleResults[rule.id] as 'error' | 'warning',
          correction: `Restore ${rule.name} alignment. Target: ${rule.idealMin}°-${rule.idealMax}°.`
        });
      }
    });

    return deviations.sort((a, b) => (a.status === 'error' ? -1 : 1)).slice(0, 3);
  }, [sortedFrames, sportRule]);

  const dossier = aiReport?.executiveDossier || EXECUTIVE_DOSSIER_MOCK;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      
      {/* Premium Forensic Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <ChevronLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          <View>
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>HERO STATUS: ACTIVE</Text>
            </View>
            <Text style={styles.headerTitle}>{sportRule.name} AUDIT</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.exportButton} onPress={handleShare}>
          <Share2 size={16} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        
        {/* Main Video & Scrubber Stage */}
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
            isDataReady={sortedFrames.length > 0}
          />
          
          <View style={styles.videoHudTop}>
            <View style={styles.timestampBadge}>
              <Text style={styles.timestampText}>{currentTime.toFixed(2)}s / {duration.toFixed(2)}s</Text>
            </View>
            <View style={styles.liveTag}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>BIO-FEEDBACK</Text>
            </View>
          </View>

          <View style={styles.playbackControlsOverlay}>
            <TouchableOpacity 
              onPress={() => handleFrameStep('backward')}
              style={styles.stepButtonOverlay}
            >
              <SkipBack color="#fff" size={16} />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setIsPlaying(!isPlaying)}
              style={styles.playButtonOverlay}
            >
              {isPlaying ? <Pause color="#fff" size={24} /> : <Play color="#fff" size={24} fill="#fff" />}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => handleFrameStep('forward')}
              style={styles.stepButtonOverlay}
            >
              <SkipForward color="#fff" size={16} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Precision Forensic Scrubber */}
        <View style={styles.scrubberContainer}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={duration || 1}
            value={currentTime}
            onSlidingComplete={handleSeek}
            onValueChange={(val) => {
              setCurrentTime(val);
              if (videoRef.current) {
                videoRef.current.seek(val);
              }
            }}
            minimumTrackTintColor="#fbbf24"
            maximumTrackTintColor="#27272a"
            thumbTintColor="#fbbf24"
          />
          <View style={styles.scrubberLabels}>
            <Text style={styles.scrubberTime}>0.00s</Text>
            <Text style={styles.scrubberTime}>{(duration || 0).toFixed(2)}s</Text>
          </View>
        </View>

        {/* Tab Switcher - Premium Unified Control */}
        <View style={styles.tabRow}>
          <TouchableOpacity 
            style={[styles.subTab, activeTab === 'diagnostics' && styles.subTabActive]} 
            onPress={() => setActiveTab('diagnostics')}
          >
            <Activity color={activeTab === 'diagnostics' ? '#facc15' : '#71717a'} size={14} />
            <Text style={[styles.subTabText, activeTab === 'diagnostics' && styles.subTabTextActive]}>DIAGNOSTICS</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.subTab, activeTab === 'telemetry' && styles.subTabActive]} 
            onPress={() => setActiveTab('telemetry')}
          >
            <Zap color={activeTab === 'telemetry' ? '#facc15' : '#71717a'} size={14} />
            <Text style={[styles.subTabText, activeTab === 'telemetry' && styles.subTabTextActive]}>TELEMETRY</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.subTab, activeTab === 'drills' && styles.subTabActive]} 
            onPress={() => setActiveTab('drills')}
          >
            <Flame color={activeTab === 'drills' ? '#facc15' : '#71717a'} size={14} />
            <Text style={[styles.subTabText, activeTab === 'drills' && styles.subTabTextActive]}>DRILLS</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'diagnostics' && (
          <View style={styles.bentoGrid}>
            {/* Executive Dossier Hero */}
            <View style={styles.dossierHero}>
              <View style={styles.dossierRow}>
                <ShieldCheck size={20} color="#fbbf24" />
                <Text style={styles.dossierHeadline}>{dossier.headline}</Text>
              </View>
              <Text style={styles.dossierOverview}>{dossier.overviewText}</Text>
            </View>

            {/* Ghost Correction HUD */}
            <GhostCorrectionVisualizerNative
              keyframeList={keyframeList}
              allFrames={allFrames}
              sportRule={sportRule}
              onSeekTimestamp={handleSeek}
            />

            {/* Top 3 Deviations - Corrective Guidance */}
            <TopDeviations 
              deviations={topDeviations} 
              onSeek={handleSeek} 
            />

            {/* Fault Comparison Grid */}
            <View style={styles.faultComparisonGrid}>
              <View style={styles.faultCard}>
                <View style={[styles.faultCardHeader, { backgroundColor: '#450a0a' }]}>
                  <ShieldAlert size={14} color="#ef4444" />
                  <Text style={[styles.faultCardTitle, { color: '#ef4444' }]}>DETECTED FAULT</Text>
                </View>
                <Text style={styles.faultCardHeadline}>{dossier.detectedFault.title}</Text>
                <Text style={styles.faultCardDesc}>{dossier.detectedFault.description}</Text>
                <View style={styles.faultMetric}>
                  <Text style={styles.faultMetricLabel}>DEVIATION</Text>
                  <Text style={styles.faultMetricValue}>{dossier.detectedFault.angleDeviation}</Text>
                </View>
              </View>

              <View style={styles.faultCard}>
                <View style={[styles.faultCardHeader, { backgroundColor: '#064e3b' }]}>
                  <Award size={14} color="#34d399" />
                  <Text style={[styles.faultCardTitle, { color: '#34d399' }]}>GOLD STANDARD</Text>
                </View>
                <Text style={styles.faultCardHeadline}>{dossier.goldStandard.title}</Text>
                <Text style={styles.faultCardDesc}>{dossier.goldStandard.description}</Text>
                <View style={styles.faultMetric}>
                  <Text style={styles.faultMetricLabel}>OPTIMAL RANGE</Text>
                  <Text style={[styles.faultMetricValue, { color: '#34d399' }]}>{dossier.goldStandard.idealRange}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'telemetry' && (
          <View style={styles.bentoGrid}>
            <KineticVelocityWaveNative 
              allFrames={allFrames}
              currentTime={currentTime}
            />
            
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>SYMMETRY</Text>
                <Text style={styles.statValue}>{dynamicMetrics?.overallSymmetry ?? 88}%</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>JOINT ARMOR</Text>
                <Text style={styles.statValue}>{dynamicMetrics?.jointArmorScore ?? 92}%</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>POWER OUTPUT</Text>
                <Text style={styles.statValue}>{Math.round(dynamicMetrics?.peakAngularVelocity ?? 450)}°/s</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>PRECISION</Text>
                <Text style={styles.statValue}>{dynamicMetrics?.precisionScore ?? 94}%</Text>
              </View>
            </View>

            <Top3Frames 
              keyframes={keyframeList} 
              onSeek={handleSeek} 
              currentTime={currentTime} 
            />
          </View>
        )}

        {activeTab === 'drills' && (
          <DrillsSection 
            drills={aiReport?.funCorrectiveDrills || []} 
            onViewDrill={(ts) => handleSeek(ts)}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#18181b',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 8,
    backgroundColor: '#18181b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  headerBadge: {
    backgroundColor: '#450a0a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
  headerBadgeText: {
    color: '#ef4444',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 1,
  },
  exportButton: {
    padding: 10,
    backgroundColor: '#18181b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
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
    backgroundColor: '#000',
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#1f1f23',
  },
  videoHudTop: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timestampBadge: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timestampText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 6,
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
  },
  playbackControlsOverlay: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.3)',
  },
  stepButtonOverlay: {
    padding: 4,
  },
  playButtonOverlay: {
    padding: 8,
    backgroundColor: 'rgba(250, 204, 21, 0.2)',
    borderRadius: 20,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  subTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#18181b',
    gap: 6,
  },
  subTabActive: {
    backgroundColor: '#18181b',
    borderColor: '#27272a',
  },
  subTabText: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: '900',
  },
  subTabTextActive: {
    color: '#ffffff',
  },
  bentoGrid: {
    gap: 20,
  },
  dossierHero: {
    backgroundColor: '#09090b',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#18181b',
  },
  dossierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dossierHeadline: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  dossierOverview: {
    color: '#d4d4d8',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  faultComparisonGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  faultCard: {
    flex: 1,
    backgroundColor: '#09090b',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#18181b',
    gap: 12,
  },
  faultCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  faultCardTitle: {
    fontSize: 8,
    fontWeight: '900',
  },
  faultCardHeadline: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  faultCardDesc: {
    color: '#a1a1aa',
    fontSize: 10,
    lineHeight: 14,
  },
  faultMetric: {
    backgroundColor: '#000000',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#18181b',
  },
  faultMetricLabel: {
    color: '#52525b',
    fontSize: 8,
    fontWeight: '900',
    marginBottom: 2,
  },
  faultMetricValue: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statBox: {
    width: (SCREEN_WIDTH - 50) / 2,
    backgroundColor: '#09090b',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#18181b',
  },
  statLabel: {
    color: '#52525b',
    fontSize: 9,
    fontWeight: '900',
    marginBottom: 4,
  },
  statValue: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  scrubberContainer: {
    backgroundColor: '#09090b',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#18181b',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  scrubberLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: -4,
  },
  scrubberTime: {
    color: '#52525b',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
});
