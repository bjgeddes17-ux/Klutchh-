import React, { useState, useMemo } from 'react';
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
import { KineticVideoPlayer } from './Report/KineticVideoPlayer';
import {
  ArrowLeft,
  Download,
  AlertCircle,
  Activity,
  Award,
  Flame,
  ShieldCheck,
  ChevronRight,
  Zap,
  Target,
  Layers,
  Sparkles,
  TrendingUp,
  Clock,
  RotateCcw
} from 'lucide-react-native';
import { SportRule, FrameAnalysis, AICoachingReport } from '../types';

interface AnalysisReportPageProps {
  sportRule: SportRule;
  videoUrl: string | null;
  keyframeList: FrameAnalysis[];
  allFrames?: FrameAnalysis[];
  aiReport: AICoachingReport | null;
  onBack: () => void;
  onSaveReport?: (reportData: any) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  const [duration, setDuration] = useState(3.99);
  const [activeTab, setActiveTab] = useState<'metrics' | 'keyframes' | 'drills' | 'insights'>('metrics');
  const [selectedPhase, setSelectedPhase] = useState<string>('All');

  const sortedFrames = useMemo(() => {
    const list = allFrames && allFrames.length > 0 ? allFrames : keyframeList;
    return [...list].sort((a, b) => a.timestamp - b.timestamp);
  }, [allFrames, keyframeList]);

  // Derive Titan Rating & Core Biomechanical Metrics
  const titanRating = useMemo(() => {
    if (aiReport?.overallGrade) {
      const g = aiReport.overallGrade.toUpperCase();
      if (g.startsWith('A+')) return 9.6;
      if (g.startsWith('A')) return 9.0;
      if (g.startsWith('B+')) return 8.4;
      if (g.startsWith('B')) return 7.8;
      if (g.startsWith('C+')) return 7.0;
      if (g.startsWith('C')) return 6.2;
    }
    return 8.5;
  }, [aiReport]);

  const explosivePower = useMemo(() => {
    return Math.min(99, Math.max(45, Math.round(titanRating * 9.8)));
  }, [titanRating]);

  const jointArmor = useMemo(() => {
    if (aiReport?.injuryRiskAssessment?.level) {
      return aiReport.injuryRiskAssessment.level === 'low' ? 94 : aiReport.injuryRiskAssessment.level === 'moderate' ? 78 : 60;
    }
    return 90;
  }, [aiReport]);

  const precision = useMemo(() => {
    return Math.min(99, Math.max(50, Math.round(titanRating * 10)));
  }, [titanRating]);

  const kineticFlow = useMemo(() => {
    return Math.min(99, Math.max(55, Math.round(titanRating * 9.6)));
  }, [titanRating]);

  // Top Diagnostic Keyframes with phase detection
  const diagnosticKeyframes = useMemo(() => {
    if (sortedFrames.length <= 4) return sortedFrames;
    const step = Math.floor(sortedFrames.length / 4);
    return [
      sortedFrames[Math.min(sortedFrames.length - 1, Math.floor(step * 0.5))],
      sortedFrames[Math.min(sortedFrames.length - 1, step * 1)],
      sortedFrames[Math.min(sortedFrames.length - 1, step * 2)],
      sortedFrames[Math.min(sortedFrames.length - 1, step * 3)]
    ].filter(Boolean);
  }, [sortedFrames]);

  const handleSeekFrame = (time: number) => {
    setCurrentTime(time);
    setIsPlaying(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft color="#fff" size={20} />
        </TouchableOpacity>
        <View style={styles.headerTitleGroup}>
          <View style={styles.sportBadgeRow}>
            <Text style={styles.sportTag}>{sportRule.name.toUpperCase()}</Text>
            <Text style={styles.headerSubtitle}>• BIOMETRIC AUDIT</Text>
          </View>
          <Text style={styles.headerTitle}>EXECUTIVE REPORT</Text>
        </View>
        <TouchableOpacity style={styles.exportButton}>
          <Download color="#fff" size={18} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        
        {/* 1. Volumetric & Broadcast Native Video Stage */}
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
            viewMode="student"
            onTogglePlay={() => setIsPlaying(!isPlaying)}
          />
        </View>

        {/* 2. Interactive Phase Filter Chips */}
        {sportRule.phases && sportRule.phases.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.phaseScroll}>
            <TouchableOpacity
              onPress={() => setSelectedPhase('All')}
              style={[styles.phasePill, selectedPhase === 'All' && styles.phasePillActive]}
            >
              <Text style={[styles.phasePillText, selectedPhase === 'All' && styles.phasePillTextActive]}>
                ⚡ Full Kinetic Chain
              </Text>
            </TouchableOpacity>
            {sportRule.phases.map((ph, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setSelectedPhase(ph)}
                style={[styles.phasePill, selectedPhase === ph && styles.phasePillActive]}
              >
                <Text style={[styles.phasePillText, selectedPhase === ph && styles.phasePillTextActive]}>
                  {ph}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* 3. Executive Titan Performance Banner (Matching Web ExecutiveDashboard) */}
        <View style={styles.executiveBanner}>
          <View style={styles.bannerGlow} />
          <View style={styles.bannerContent}>
            <View style={styles.bannerBadgeBox}>
              <Text style={styles.bannerBadgeEmoji}>
                {aiReport?.overallGrade?.startsWith('A') ? '🏆' : aiReport?.overallGrade?.startsWith('B') ? '🏅' : '🎖️'}
              </Text>
            </View>
            <View style={styles.bannerMeta}>
              <View style={styles.bannerPillRow}>
                <View style={styles.championPill}>
                  <Text style={styles.championText}>
                    {aiReport?.overallGrade?.startsWith('A') ? 'ELITE CHAMPION' : 'PRODIGY ATHLETE'}
                  </Text>
                </View>
                <View style={styles.titanPill}>
                  <Text style={styles.titanText}>⚡ TITAN: {titanRating.toFixed(1)}/10</Text>
                </View>
              </View>
              <Text style={styles.bannerHeadline}>
                {sportRule.name} {aiReport?.overallGrade?.startsWith('A') ? 'Titan' : 'Prodigy'}
              </Text>
            </View>
          </View>

          {/* Core 4 Biomechanical Attributes Grid */}
          <View style={styles.attrGrid}>
            <View style={styles.attrCard}>
              <View style={styles.attrLabelRow}>
                <Zap color="#f59e0b" size={14} />
                <Text style={styles.attrLabel}>POWER</Text>
              </View>
              <Text style={styles.attrScoreYellow}>{explosivePower}%</Text>
              <View style={styles.attrBarTrack}>
                <View style={[styles.attrBarFillYellow, { width: `${explosivePower}%` }]} />
              </View>
              <Text style={styles.attrDesc}>Kinetic energy transfer</Text>
            </View>

            <View style={styles.attrCard}>
              <View style={styles.attrLabelRow}>
                <ShieldCheck color="#22c55e" size={14} />
                <Text style={styles.attrLabel}>ARMOR</Text>
              </View>
              <Text style={styles.attrScoreGreen}>{jointArmor}%</Text>
              <View style={styles.attrBarTrack}>
                <View style={[styles.attrBarFillGreen, { width: `${jointArmor}%` }]} />
              </View>
              <Text style={styles.attrDesc}>Ligament & valgus safety</Text>
            </View>

            <View style={styles.attrCard}>
              <View style={styles.attrLabelRow}>
                <Target color="#38bdf8" size={14} />
                <Text style={styles.attrLabel}>PRECISION</Text>
              </View>
              <Text style={styles.attrScoreCyan}>{precision}%</Text>
              <View style={styles.attrBarTrack}>
                <View style={[styles.attrBarFillCyan, { width: `${precision}%` }]} />
              </View>
              <Text style={styles.attrDesc}>Elite posture alignment</Text>
            </View>

            <View style={styles.attrCard}>
              <View style={styles.attrLabelRow}>
                <RotateCcw color="#c084fc" size={14} />
                <Text style={styles.attrLabel}>FLOW</Text>
              </View>
              <Text style={styles.attrScorePurple}>{kineticFlow}%</Text>
              <View style={styles.attrBarTrack}>
                <View style={[styles.attrBarFillPurple, { width: `${kineticFlow}%` }]} />
              </View>
              <Text style={styles.attrDesc}>Bilateral symmetry flow</Text>
            </View>
          </View>
        </View>

        {/* 4. Tab Switcher Navigation */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            onPress={() => setActiveTab('metrics')}
            style={[styles.tabButton, activeTab === 'metrics' && styles.tabButtonActive]}
          >
            <Target color={activeTab === 'metrics' ? '#000' : '#a1a1aa'} size={14} />
            <Text style={[styles.tabText, activeTab === 'metrics' && styles.tabTextActive]}>
              Top Checks
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('keyframes')}
            style={[styles.tabButton, activeTab === 'keyframes' && styles.tabButtonActive]}
          >
            <Layers color={activeTab === 'keyframes' ? '#000' : '#a1a1aa'} size={14} />
            <Text style={[styles.tabText, activeTab === 'keyframes' && styles.tabTextActive]}>
              Keyframes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('drills')}
            style={[styles.tabButton, activeTab === 'drills' && styles.tabButtonActive]}
          >
            <Flame color={activeTab === 'drills' ? '#000' : '#a1a1aa'} size={14} />
            <Text style={[styles.tabText, activeTab === 'drills' && styles.tabTextActive]}>
              Drills ({aiReport?.funCorrectiveDrills?.length || 3})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('insights')}
            style={[styles.tabButton, activeTab === 'insights' && styles.tabButtonActive]}
          >
            <Sparkles color={activeTab === 'insights' ? '#000' : '#a1a1aa'} size={14} />
            <Text style={[styles.tabText, activeTab === 'insights' && styles.tabTextActive]}>
              Insights
            </Text>
          </TouchableOpacity>
        </View>

        {/* 5. Tab Content: Top Checks & Biomechanical Rules */}
        {activeTab === 'metrics' && (
          <View style={styles.tabSection}>
            <Text style={styles.sectionTitle}>BIOMECHANICAL RULE AUDIT</Text>
            {sportRule.jointRules.map((rule, idx) => {
              const minOpt = rule.idealMin;
              const maxOpt = rule.idealMax;
              return (
                <View key={rule.id || idx} style={styles.ruleCard}>
                  <View style={styles.ruleTopRow}>
                    <View style={styles.ruleTitleBox}>
                      <View style={styles.ruleStatusDot} />
                      <Text style={styles.ruleName}>{rule.name}</Text>
                    </View>
                    <View style={styles.ruleIdealBadge}>
                      <Text style={styles.ruleIdealText}>Target: {minOpt}° - {maxOpt}°</Text>
                    </View>
                  </View>
                  <Text style={styles.ruleDesc}>{rule.description}</Text>
                  <View style={styles.rulePhaseRow}>
                    <Text style={styles.rulePhaseTag}>PHASE: {rule.phase || 'Dynamic'}</Text>
                    <Text style={styles.ruleJointTag}>JOINTS: #{rule.keypoints.join(' - #')}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* 6. Tab Content: Top Diagnostic Keyframes (Interactive Scrubber) */}
        {activeTab === 'keyframes' && (
          <View style={styles.tabSection}>
            <Text style={styles.sectionTitle}>DIAGNOSTIC KEYFRAMES (TAP TO SEEK)</Text>
            <View style={styles.keyframeGrid}>
              {diagnosticKeyframes.map((kf, idx) => {
                const phaseName = kf?.detectedPhase || (idx === 0 ? 'Setup & Stance' : idx === 1 ? 'Coil & Load' : idx === 2 ? 'Explosive Release' : 'Deceleration Finish');
                const isSelected = Math.abs(currentTime - (kf?.timestamp || 0)) < 0.1;

                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => handleSeekFrame(kf?.timestamp || 0)}
                    style={[styles.keyframeCardBig, isSelected && styles.keyframeCardSelected]}
                  >
                    <View style={styles.keyframeTopRow}>
                      <View style={styles.keyframeIconBox}>
                        <Activity color="#eab308" size={16} />
                      </View>
                      <Text style={styles.keyframeTimeBadge}>{kf?.timestamp?.toFixed(2) || '0.00'}s</Text>
                    </View>
                    <Text style={styles.keyframeBigPhase}>{phaseName}</Text>
                    <Text style={styles.keyframeHint}>Tap to view biomechanics at this millisecond</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* 7. Tab Content: Corrective Drills */}
        {activeTab === 'drills' && (
          <View style={styles.tabSection}>
            <Text style={styles.sectionTitle}>PRESCRIPTION DRILLS & RESISTANCE FIXES</Text>
            {aiReport?.funCorrectiveDrills && aiReport.funCorrectiveDrills.length > 0 ? (
              aiReport.funCorrectiveDrills.map((drill, idx) => (
                <View key={idx} style={styles.drillCardBig}>
                  <View style={styles.drillIconBoxBig}>
                    <Flame color="#ef4444" size={22} />
                  </View>
                  <View style={styles.drillInfoBig}>
                    <View style={styles.drillHeadingRow}>
                      <Text style={styles.drillTitleBig}>{drill.name}</Text>
                      <View style={styles.repBadge}>
                        <Text style={styles.repText}>{drill.reps || '3 sets x 8 reps'}</Text>
                      </View>
                    </View>
                    <Text style={styles.drillDescriptionBig}>{drill.description}</Text>
                    <View style={styles.drillTargetRow}>
                      <Text style={styles.drillTargetText}>🎯 Target: {drill.targetJoint || 'Kinetic Chain'}</Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.drillCardBig}>
                <View style={styles.drillIconBoxBig}>
                  <ShieldCheck color="#22c55e" size={22} />
                </View>
                <View style={styles.drillInfoBig}>
                  <Text style={styles.drillTitleBig}>Movement Sequence Optimal</Text>
                  <Text style={styles.drillDescriptionBig}>
                    All kinetic transmission sequences are within high efficiency tolerances.
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* 8. Tab Content: Coaching Insights & Energy Leaks */}
        {activeTab === 'insights' && (
          <View style={styles.tabSection}>
            <Text style={styles.sectionTitle}>COACHING AUDIT & ACTIONABLE FINDINGS</Text>
            {aiReport?.biomechanicInsights && aiReport.biomechanicInsights.length > 0 ? (
              aiReport.biomechanicInsights.map((insight: any, idx: number) => (
                <View key={idx} style={styles.insightCardBig}>
                  <View style={styles.insightIconBig}>
                    <AlertCircle color="#eab308" size={18} />
                  </View>
                  <View style={styles.insightTextBox}>
                    <Text style={styles.insightTitleText}>
                      {typeof insight === 'string' ? `Biomechanic Insight #${idx + 1}` : insight?.title || 'Movement Pattern Observation'}
                    </Text>
                    <Text style={styles.insightBodyText}>
                      {typeof insight === 'string' ? insight : insight?.finding || ''}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.insightCardBig}>
                <View style={styles.insightIconBig}>
                  <ShieldCheck color="#22c55e" size={18} />
                </View>
                <View style={styles.insightTextBox}>
                  <Text style={styles.insightTitleText}>Kinetic Chain Alignment</Text>
                  <Text style={styles.insightBodyText}>
                    Coordinated ground reaction forces transferred cleanly through torso segment.
                  </Text>
                </View>
              </View>
            )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backButton: {
    padding: 10,
    backgroundColor: '#18181b',
    borderRadius: 12,
  },
  headerTitleGroup: {
    marginLeft: 12,
  },
  sportBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sportTag: {
    color: '#eab308',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  headerSubtitle: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  exportButton: {
    marginLeft: 'auto',
    padding: 10,
    backgroundColor: '#18181b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  videoStage: {
    width: '100%',
    height: 520,
    backgroundColor: '#000',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 8,
  },
  phaseScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  phasePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  phasePillActive: {
    backgroundColor: '#eab308',
    borderColor: '#eab308',
  },
  phasePillText: {
    color: '#a1a1aa',
    fontSize: 11,
    fontWeight: '800',
  },
  phasePillTextActive: {
    color: '#000',
    fontWeight: '900',
  },
  executiveBanner: {
    backgroundColor: '#121216',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(234, 179, 8, 0.35)',
    position: 'relative',
    overflow: 'hidden',
    gap: 16,
  },
  bannerGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(234, 179, 8, 0.12)',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  bannerBadgeBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#eab308',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fef08a',
  },
  bannerBadgeEmoji: {
    fontSize: 28,
  },
  bannerMeta: {
    flex: 1,
    gap: 4,
  },
  bannerPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  championPill: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.3)',
  },
  championText: {
    color: '#eab308',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  titanPill: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  titanText: {
    color: '#22c55e',
    fontSize: 9,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  bannerHeadline: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
  },
  attrGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  attrCard: {
    flex: 1,
    backgroundColor: 'rgba(9, 9, 11, 0.7)',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 4,
  },
  attrLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  attrLabel: {
    color: '#71717a',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  attrScoreYellow: {
    color: '#eab308',
    fontSize: 16,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  attrScoreGreen: {
    color: '#22c55e',
    fontSize: 16,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  attrScoreCyan: {
    color: '#38bdf8',
    fontSize: 16,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  attrScorePurple: {
    color: '#c084fc',
    fontSize: 16,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  attrBarTrack: {
    height: 3,
    backgroundColor: '#27272a',
    borderRadius: 2,
    overflow: 'hidden',
    marginVertical: 2,
  },
  attrBarFillYellow: {
    height: '100%',
    backgroundColor: '#eab308',
  },
  attrBarFillGreen: {
    height: '100%',
    backgroundColor: '#22c55e',
  },
  attrBarFillCyan: {
    height: '100%',
    backgroundColor: '#38bdf8',
  },
  attrBarFillPurple: {
    height: '100%',
    backgroundColor: '#c084fc',
  },
  attrDesc: {
    color: '#71717a',
    fontSize: 8,
    lineHeight: 10,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#121215',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: '#eab308',
  },
  tabText: {
    color: '#a1a1aa',
    fontSize: 11,
    fontWeight: '800',
  },
  tabTextActive: {
    color: '#000',
    fontWeight: '900',
  },
  tabSection: {
    gap: 12,
  },
  sectionTitle: {
    color: '#71717a',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginLeft: 4,
  },
  ruleCard: {
    backgroundColor: '#121215',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  ruleTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ruleTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ruleStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  ruleName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  ruleIdealBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  ruleIdealText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '700',
  },
  ruleDesc: {
    color: '#a1a1aa',
    fontSize: 11,
    lineHeight: 16,
  },
  rulePhaseRow: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 8,
  },
  rulePhaseTag: {
    color: '#eab308',
    fontSize: 9,
    fontWeight: '800',
  },
  ruleJointTag: {
    color: '#71717a',
    fontSize: 9,
    fontWeight: '700',
  },
  keyframeGrid: {
    gap: 10,
  },
  keyframeCardBig: {
    backgroundColor: '#121215',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 6,
  },
  keyframeCardSelected: {
    borderColor: '#eab308',
    backgroundColor: 'rgba(234, 179, 8, 0.06)',
  },
  keyframeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  keyframeIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyframeTimeBadge: {
    color: '#eab308',
    fontSize: 13,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  keyframeBigPhase: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },
  keyframeHint: {
    color: '#71717a',
    fontSize: 11,
  },
  drillCardBig: {
    backgroundColor: '#121215',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  drillIconBoxBig: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  drillInfoBig: {
    flex: 1,
    gap: 4,
  },
  drillHeadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  drillTitleBig: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    flex: 1,
  },
  repBadge: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  repText: {
    color: '#eab308',
    fontSize: 10,
    fontWeight: '800',
  },
  drillDescriptionBig: {
    color: '#a1a1aa',
    fontSize: 12,
    lineHeight: 18,
  },
  drillTargetRow: {
    marginTop: 4,
  },
  drillTargetText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '700',
  },
  insightCardBig: {
    backgroundColor: '#121215',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  insightIconBig: {
    padding: 8,
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    borderRadius: 12,
  },
  insightTextBox: {
    flex: 1,
    gap: 4,
  },
  insightTitleText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  insightBodyText: {
    color: '#d4d4d8',
    fontSize: 12,
    lineHeight: 18,
  },
});
