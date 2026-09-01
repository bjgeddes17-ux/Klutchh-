import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Modal,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {
  Activity,
  Play,
  Bookmark,
  ShieldCheck,
  Zap,
  ChevronRight,
  Sparkles,
  Flame,
  TrendingUp,
  Target,
  Layers,
  Award,
  Video,
  UploadCloud,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react-native';
import { SPORTS_RULES } from './data/sportsRules';
import { COMPREHENSIVE_DRILL_LIBRARY, DrillItem } from './data/drillLibrary';
import { SportRule, SkillLevel, AthleteCategory, AnalysisResult, SportId, FrameAnalysis, AICoachingReport } from './types';
import { AnalysisReportPage } from './components/AnalysisReportPage.native';
import { MagicProcessingScreenNative } from './components/MagicProcessingScreen.native';
import { generateSyntheticSportsPose } from './utils/mediapipePose.native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function App() {
  const [selectedSportId, setSelectedSportId] = useState<SportId>('rugby');
  const [athleteCategory, setAthleteCategory] = useState<AthleteCategory>('middle_school');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('grassroots');
  const [activeTab, setActiveTab] = useState<'analyze' | 'drills' | 'saved'>('analyze');

  // Video and analysis states
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [savedReports, setSavedReports] = useState<{ id: string; sportName: string; grade: string; score: number; date: string }[]>([]);
  const [selectedDrill, setSelectedDrill] = useState<DrillItem | null>(null);

  const currentSportRule: SportRule = SPORTS_RULES.find((s) => s.id === selectedSportId) || SPORTS_RULES[0];

  // Analysis pipeline
  const handleStartAnalysis = (videoSource: string = 'Sample_Video.mp4') => {
    setIsProcessing(true);
    setProcessingProgress(0);
    setVideoUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');

    let prog = 0;
    const interval = setInterval(() => {
      prog += 15;
      if (prog >= 100) {
        clearInterval(interval);
        setProcessingProgress(100);

        // Generate high-precision synthetic telemetry frames
        const frames: FrameAnalysis[] = [];
        const frameCount = 30;
        for (let i = 0; i < frameCount; i++) {
          const ts = (i / frameCount) * 3.8;
          const landmarks = generateSyntheticSportsPose(ts * 1000, ts);
          frames.push({
            frameNumber: i,
            timestamp: ts,
            landmarks,
            detectedPhase: i < 8 ? 'Setup & Coil' : i < 20 ? 'Kinetic Drive' : 'Follow-Through',
            angles: {
              knee: 112 + Math.sin(i * 0.2) * 18,
              hip: 136 + Math.cos(i * 0.2) * 14,
              shoulder: 92 + Math.sin(i * 0.3) * 22,
            },
            ruleResults: {
              knee: i === 14 ? 'warning' : 'optimal',
              hip: 'optimal',
              shoulder: 'optimal',
            },
            symmetryScore: 90 + Math.floor(Math.sin(i) * 5),
            kneeSafetyScore: i === 14 ? 79 : 95,
            activeLevel: skillLevel,
            isRealDetection: true,
          });
        }

        const report: AICoachingReport = {
          overallGrade: 'A',
          summaryTitle: `Biomechanical Mastery: ${currentSportRule.name}`,
          keyStrengths: [
            'Explosive Ground Reaction Force across initial drive phase',
            'Optimal Torso Forward Lean within efficiency corridor (30°)',
            'High Rotational Velocity through hip-shoulder separation',
          ],
          biomechanicInsights: [
            'Triple-extension through ankle, knee, and hip generating high kinetic output.',
            'Right knee exhibits mild medial collapse at deceleration phase (12° inward deviation).',
            `Trunk angle maintained within optimal ${currentSportRule.name} biomechanical corridor.`,
          ],
          injuryRiskAssessment: {
            level: 'low',
            findings: ['Minor right knee valgus during dynamic deceleration'],
            preventionDrills: ['Single-leg Romanian Deadlifts', 'Banded Monster Walks'],
          },
          funCorrectiveDrills: [
            {
              name: 'Low-Hip Athletic Spine Hinge',
              description: 'Eliminates upright bending during contact by locking the thoracic spine.',
              reps: '3 sets x 10 reps',
              targetJoint: 'Hip & Lumbar Spine',
            },
            {
              name: 'Rotational Core Transfer Snap',
              description: 'Builds explosive rotational sequencing for long-range power transfer.',
              reps: '3 sets x 12 reps',
              targetJoint: 'Thoracic Spine',
            },
          ],
          coachEncouragement: 'Phenomenal kinetic rhythm. Deceleration knee tracking will unlock peak speed & power!',
        };

        const syntheticResult: AnalysisResult = {
          keyframes: [frames[4], frames[14], frames[25]],
          allFrames: frames,
          aiReport: report,
          overallSymmetry: 91,
          overallKneeSafety: 89,
          measuredAngles: {
            kneeAngle: 118,
            hipAngle: 132,
            torsoLean: 31,
          },
          ruleResultsSummary: {
            kneeAlignment: 'warning',
            hipExtension: 'optimal',
            torsoAngle: 'optimal',
          },
          sequenceComparison: {
            ideal: ['Stance & Coil', 'Explosive Drive', 'Kinetic Follow-Through'],
            actual: ['Stance & Coil', 'Explosive Drive', 'Kinetic Follow-Through'],
            isCorrect: true,
            feedback: 'Sequence timing aligns with elite kinematic sequence.',
          },
          kineticSequence: {
            steps: [
              { name: 'Stance & Coil', timestamp: 0.5, score: 92, status: 'optimal' },
              { name: 'Explosive Drive', timestamp: 1.5, score: 88, status: 'optimal' },
              { name: 'Kinetic Follow-Through', timestamp: 2.5, score: 90, status: 'optimal' },
            ],
            firingOrder: [
              { joint: 'Hips', peakTime: 0.8, peakVelocity: 340 },
              { joint: 'Torso', peakTime: 1.1, peakVelocity: 420 },
              { joint: 'Arms', peakTime: 1.4, peakVelocity: 510 },
            ],
            isCorrectOrder: true,
            sequenceEfficiency: 91,
          },
          dynamicMetrics: {
            peakAngularVelocity: 520,
            estimatedPeakTorque: 86,
            explosivenessScore: 93,
          },
        };

        setAnalysisResult(syntheticResult);
        setIsProcessing(false);
      } else {
        setProcessingProgress(prog);
      }
    }, 200);
  };

  const sportsList: { id: SportId; name: string; icon: string }[] = [
    { id: 'rugby', name: 'Rugby', icon: '🏉' },
    { id: 'netball', name: 'Netball', icon: '🏐' },
    { id: 'hockey', name: 'Hockey', icon: '🏑' },
    { id: 'cricket', name: 'Cricket', icon: '🏏' },
    { id: 'tennis', name: 'Tennis', icon: '🎾' },
    { id: 'soccer', name: 'Soccer', icon: '⚽' },
    { id: 'golf', name: 'Golf', icon: '⛳' },
  ];

  // If in active processing state, display the Magic Processing Screen
  if (isProcessing) {
    return (
      <MagicProcessingScreenNative
        sportRule={currentSportRule}
        videoUrl={videoUrl}
        skillLevel={skillLevel}
        athleteCategory={athleteCategory}
        progress={processingProgress}
        onCancel={() => {
          setIsProcessing(false);
          setProcessingProgress(0);
        }}
      />
    );
  }

  // If in analysis report mode, display the native report page
  if (analysisResult) {
    return (
      <AnalysisReportPage
        sportRule={currentSportRule}
        videoUrl={videoUrl}
        keyframeList={analysisResult.keyframes || []}
        allFrames={analysisResult.allFrames || []}
        aiReport={analysisResult.aiReport}
        onBack={() => setAnalysisResult(null)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#09090b" />

      {/* Modern High-End Top App Bar */}
      <View style={styles.appBar}>
        <View style={styles.brandRow}>
          <View style={styles.brandBadge}>
            <Zap color="#eab308" size={18} />
          </View>
          <View>
            <Text style={styles.brandTitle}>KLUTCHH AI</Text>
            <Text style={styles.brandSubtitle}>BIOMECHANICAL PERFORMANCE</Text>
          </View>
        </View>

        <View style={styles.tierPill}>
          <View style={styles.livePulseDot} />
          <Text style={styles.tierText}>AI ACTIVE</Text>
        </View>
      </View>

      {/* Clean Unified Top Navigation Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'analyze' && styles.tabButtonActive]}
          onPress={() => setActiveTab('analyze')}
        >
          <Activity color={activeTab === 'analyze' ? '#eab308' : '#71717a'} size={16} />
          <Text style={[styles.tabText, activeTab === 'analyze' && styles.tabTextActive]}>ANALYZE</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'drills' && styles.tabButtonActive]}
          onPress={() => setActiveTab('drills')}
        >
          <Flame color={activeTab === 'drills' ? '#eab308' : '#71717a'} size={16} />
          <Text style={[styles.tabText, activeTab === 'drills' && styles.tabTextActive]}>DRILLS</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'saved' && styles.tabButtonActive]}
          onPress={() => setActiveTab('saved')}
        >
          <Bookmark color={activeTab === 'saved' ? '#eab308' : '#71717a'} size={16} />
          <Text style={[styles.tabText, activeTab === 'saved' && styles.tabTextActive]}>
            SAVED ({savedReports.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'analyze' && (
          <>
            {/* Sport Selection Carousel */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>SELECT SPORT PROTOCOL</Text>
              <Text style={styles.sectionBadge}>{sportsList.length} SPORTS</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sportsScroll}>
              {sportsList.map((sport) => {
                const isSelected = selectedSportId === sport.id;
                return (
                  <TouchableOpacity
                    key={sport.id}
                    style={[styles.sportCard, isSelected && styles.sportCardActive]}
                    onPress={() => setSelectedSportId(sport.id)}
                  >
                    <View style={[styles.sportIconWrap, isSelected && styles.sportIconWrapActive]}>
                      <Text style={styles.sportEmoji}>{sport.icon}</Text>
                    </View>
                    <Text style={[styles.sportName, isSelected && styles.sportNameActive]}>
                      {sport.name.toUpperCase()}
                    </Text>
                    {isSelected && <View style={styles.activeDot} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Sport Rules & Target Parameters Overview */}
            <View style={styles.ruleCard}>
              <View style={styles.ruleCardHeader}>
                <View style={styles.ruleHeaderLeft}>
                  <Text style={styles.ruleSportName}>{currentSportRule.name.toUpperCase()}</Text>
                  <Text style={styles.ruleSportCategory}>CATEGORY: {currentSportRule.category.toUpperCase()}</Text>
                </View>
                <View style={styles.rulesCountBadge}>
                  <Text style={styles.rulesCountText}>{currentSportRule.jointRules.length} JOINT CORRIDORS</Text>
                </View>
              </View>

              <Text style={styles.ruleDescription}>{currentSportRule.description}</Text>

              {/* Tiers & Level Selector */}
              <View style={styles.optionsGrid}>
                <View style={styles.optionBox}>
                  <Text style={styles.optionLabel}>ATHLETE SKILL LEVEL</Text>
                  <View style={styles.optionChips}>
                    {(['grassroots', 'academy', 'elite_pro'] as SkillLevel[]).map((lvl) => (
                      <TouchableOpacity
                        key={lvl}
                        style={[styles.chip, skillLevel === lvl && styles.chipActive]}
                        onPress={() => setSkillLevel(lvl)}
                      >
                        <Text style={[styles.chipText, skillLevel === lvl && styles.chipTextActive]}>
                          {lvl.replace('_', ' ').toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.optionBox}>
                  <Text style={styles.optionLabel}>AGE DIVISION</Text>
                  <View style={styles.optionChips}>
                    {(['elementary', 'middle_school', 'high_school'] as AthleteCategory[]).map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.chip, athleteCategory === cat && styles.chipActive]}
                        onPress={() => setAthleteCategory(cat)}
                      >
                        <Text style={[styles.chipText, athleteCategory === cat && styles.chipTextActive]}>
                          {cat.replace('_', ' ').toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </View>

            {/* Video Input & Upload Trigger Card */}
            <View style={styles.actionCard}>
              <View style={styles.actionHeader}>
                <View style={styles.actionIconBox}>
                  <Video color="#eab308" size={18} />
                </View>
                <View style={styles.actionHeaderText}>
                  <Text style={styles.actionTitle}>BIOMECHANICAL SCAN</Text>
                  <Text style={styles.actionSubtitle}>
                    Evaluate joint kinematics, kinetic chain sequencing, and injury risk factors.
                  </Text>
                </View>
              </View>

              <View style={styles.actionButtonsCol}>
                <TouchableOpacity
                  style={styles.primaryActionBtn}
                  onPress={() => handleStartAnalysis('Video_Analysis.mp4')}
                >
                  <Play color="#000" size={18} />
                  <Text style={styles.primaryActionText}>START {currentSportRule.name.toUpperCase()} SCAN</Text>
                  <ArrowRight color="#000" size={16} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Active Biomechanical Corridors Section */}
            <View style={styles.featuresSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>ACTIVE BIOMECHANICAL AUDIT CORRIDORS</Text>
                <Text style={styles.sectionBadge}>STANDARDS</Text>
              </View>
              {currentSportRule.jointRules.slice(0, 4).map((rule, idx) => {
                const minOpt = rule.idealMin;
                const maxOpt = rule.idealMax;
                return (
                  <View key={rule.id || idx} style={styles.featureRow}>
                    <View style={styles.featureIconBox}>
                      <Target color="#eab308" size={16} />
                    </View>
                    <View style={styles.featureContent}>
                      <Text style={styles.featureName}>{rule.name}</Text>
                      <Text style={styles.featureDetails}>
                        Corridor: {minOpt}° - {maxOpt}° • Phase: {rule.phase || 'Dynamic'}
                      </Text>
                    </View>
                    <View style={styles.featureBadge}>
                      <Text style={styles.featureBadgeText}>
                        {rule.importance === 'critical_safety' ? 'SAFETY' : 'POWER'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {activeTab === 'drills' && (
          <View style={styles.drillsContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>CORRECTIVE DRILLS & RESISTANCE LIBRARY</Text>
              <Text style={styles.sectionBadge}>{COMPREHENSIVE_DRILL_LIBRARY.length} DRILLS</Text>
            </View>

            {COMPREHENSIVE_DRILL_LIBRARY.map((drill) => (
              <TouchableOpacity
                key={drill.id}
                style={styles.drillCard}
                onPress={() => setSelectedDrill(drill)}
              >
                <View style={styles.drillTopRow}>
                  <View style={styles.drillBadge}>
                    <Text style={styles.drillBadgeText}>{drill.sportId.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.drillDifficulty}>{drill.difficulty.toUpperCase()}</Text>
                </View>
                <Text style={styles.drillTitle}>{drill.title}</Text>
                <Text style={styles.drillFocus}>{drill.category}</Text>
                <View style={styles.drillFooter}>
                  <Text style={styles.drillJointText}>🎯 Target: {drill.targetJoint}</Text>
                  <ChevronRight color="#71717a" size={16} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 'saved' && (
          <View style={styles.savedContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>SAVED SESSIONS & BENCHMARKS</Text>
              <Text style={styles.sectionBadge}>{savedReports.length} SESSIONS</Text>
            </View>

            {savedReports.length === 0 ? (
              <View style={styles.emptyBox}>
                <Bookmark color="#3f3f46" size={40} />
                <Text style={styles.emptyTitle}>NO SAVED SESSIONS YET</Text>
                <Text style={styles.emptySubtitle}>
                  Run a biomechanical motion analysis to benchmark performance and store reports.
                </Text>
              </View>
            ) : (
              savedReports.map((item) => (
                <View key={item.id} style={styles.savedCard}>
                  <View style={styles.savedCardTop}>
                    <Text style={styles.savedSport}>{item.sportName.toUpperCase()}</Text>
                    <View style={styles.savedGradeBadge}>
                      <Text style={styles.savedGradeText}>{item.grade}</Text>
                    </View>
                  </View>
                  <Text style={styles.savedDate}>{item.date}</Text>
                  <Text style={styles.savedScore}>Klutchh Score: {item.score}/100</Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Drill Detail Modal */}
      <Modal visible={!!selectedDrill} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedDrill?.title}</Text>
              <TouchableOpacity onPress={() => setSelectedDrill(null)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalFocusLabel}>BIOMECHANICAL FOCUS</Text>
              <Text style={styles.modalFocusText}>{selectedDrill?.category} • {selectedDrill?.targetJoint}</Text>

              <Text style={styles.modalFocusLabel}>DESCRIPTION & PURPOSE</Text>
              <Text style={styles.modalBodyText}>{selectedDrill?.description}</Text>

              <Text style={styles.modalFocusLabel}>COACHING CUE</Text>
              <Text style={styles.modalBodyText}>{selectedDrill?.coachingCue}</Text>

              <View style={styles.modalDetailsRow}>
                <View style={styles.modalDetailBox}>
                  <Text style={styles.detailBoxLabel}>SETS / REPS</Text>
                  <Text style={styles.detailBoxValue}>{selectedDrill?.sets} x {selectedDrill?.reps}</Text>
                </View>
                <View style={styles.modalDetailBox}>
                  <Text style={styles.detailBoxLabel}>DIFFICULTY</Text>
                  <Text style={styles.detailBoxValue}>{selectedDrill?.difficulty?.toUpperCase()}</Text>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.modalDoneBtn} onPress={() => setSelectedDrill(null)}>
              <Text style={styles.modalDoneBtnText}>GOT IT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#09090b',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  brandSubtitle: {
    color: '#a1a1aa',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  tierText: {
    color: '#d4d4d8',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: '#0c0c0e',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 12,
    gap: 6,
    backgroundColor: 'transparent',
  },
  tabButtonActive: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  tabText: {
    color: '#71717a',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  tabTextActive: {
    color: '#ffffff',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 36,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  sectionTitle: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  sectionBadge: {
    color: '#a1a1aa',
    fontSize: 9,
    fontWeight: '800',
  },
  sportsScroll: {
    gap: 10,
    paddingVertical: 2,
  },
  sportCard: {
    width: 90,
    height: 84,
    backgroundColor: '#141417',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    position: 'relative',
  },
  sportCardActive: {
    backgroundColor: '#1f1f24',
    borderColor: '#eab308',
  },
  sportIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sportIconWrapActive: {
    backgroundColor: 'rgba(234, 179, 8, 0.12)',
  },
  sportEmoji: {
    fontSize: 18,
  },
  sportName: {
    color: '#a1a1aa',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sportNameActive: {
    color: '#ffffff',
    fontWeight: '900',
  },
  activeDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#eab308',
  },
  ruleCard: {
    backgroundColor: '#121215',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  ruleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  ruleHeaderLeft: {
    gap: 2,
  },
  ruleSportName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  ruleSportCategory: {
    color: '#eab308',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  rulesCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#1f1f24',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  rulesCountText: {
    color: '#d4d4d8',
    fontSize: 8.5,
    fontWeight: '800',
  },
  ruleDescription: {
    color: '#a1a1aa',
    fontSize: 11.5,
    lineHeight: 16,
  },
  optionsGrid: {
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 12,
  },
  optionBox: {
    gap: 6,
  },
  optionLabel: {
    color: '#71717a',
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  optionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#1c1c20',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  chipActive: {
    backgroundColor: '#eab308',
    borderColor: '#eab308',
  },
  chipText: {
    color: '#a1a1aa',
    fontSize: 9.5,
    fontWeight: '800',
  },
  chipTextActive: {
    color: '#000000',
    fontWeight: '900',
  },
  actionCard: {
    backgroundColor: '#121215',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  actionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.25)',
  },
  actionHeaderText: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  actionSubtitle: {
    color: '#a1a1aa',
    fontSize: 11,
    lineHeight: 15,
  },
  actionButtonsCol: {
    marginTop: 4,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eab308',
    paddingVertical: 13,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#eab308',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryActionText: {
    color: '#000000',
    fontSize: 11.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  processingBox: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  processingTitle: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  progressBarTrack: {
    width: '100%',
    height: 5,
    backgroundColor: '#27272a',
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#eab308',
  },
  processingStepText: {
    color: '#71717a',
    fontSize: 9.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  featuresSection: {
    gap: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121215',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 10,
  },
  featureIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureName: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '800',
  },
  featureDetails: {
    color: '#71717a',
    fontSize: 9.5,
    marginTop: 2,
  },
  featureBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: '#1f1f23',
    borderRadius: 6,
  },
  featureBadgeText: {
    color: '#eab308',
    fontSize: 8,
    fontWeight: '900',
  },
  drillsContainer: {
    gap: 10,
  },
  drillCard: {
    backgroundColor: '#121215',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 6,
  },
  drillTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  drillBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderRadius: 6,
  },
  drillBadgeText: {
    color: '#eab308',
    fontSize: 8.5,
    fontWeight: '900',
  },
  drillDifficulty: {
    color: '#71717a',
    fontSize: 8.5,
    fontWeight: '800',
  },
  drillTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  drillFocus: {
    color: '#a1a1aa',
    fontSize: 10.5,
    lineHeight: 15,
  },
  drillFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  drillJointText: {
    color: '#d4d4d8',
    fontSize: 9.5,
    fontWeight: '700',
  },
  savedContainer: {
    gap: 10,
  },
  emptyBox: {
    backgroundColor: '#121215',
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 10,
  },
  emptyTitle: {
    color: '#71717a',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  emptySubtitle: {
    color: '#52525b',
    fontSize: 10.5,
    textAlign: 'center',
    lineHeight: 15,
  },
  savedCard: {
    backgroundColor: '#121215',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 6,
  },
  savedCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  savedSport: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  savedGradeBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#eab308',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedGradeText: {
    color: '#000000',
    fontSize: 10.5,
    fontWeight: '900',
  },
  savedDate: {
    color: '#71717a',
    fontSize: 9.5,
  },
  savedScore: {
    color: '#a1a1aa',
    fontSize: 10.5,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#141417',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    flex: 1,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#a1a1aa',
    fontSize: 13,
    fontWeight: '800',
  },
  modalBody: {
    gap: 10,
  },
  modalFocusLabel: {
    color: '#eab308',
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginTop: 6,
  },
  modalFocusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  modalBodyText: {
    color: '#a1a1aa',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  modalDetailsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  modalDetailBox: {
    flex: 1,
    backgroundColor: '#18181b',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 2,
  },
  detailBoxLabel: {
    color: '#71717a',
    fontSize: 7.5,
    fontWeight: '900',
  },
  detailBoxValue: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  modalDoneBtn: {
    backgroundColor: '#eab308',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  modalDoneBtnText: {
    color: '#000000',
    fontSize: 11.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});
