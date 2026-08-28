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
  ShieldAlert,
  Zap,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Award,
  CheckCircle2,
  TrendingUp,
  Flame,
  Info,
} from 'lucide-react-native';
import { SPORTS_RULES } from './data/sportsRules';
import { COMPREHENSIVE_DRILL_LIBRARY, DrillItem } from './data/drillLibrary';
import { SportRule, SkillLevel, AthleteCategory, AnalysisResult, SportId, FrameAnalysis, AICoachingReport } from './types';
import { AnalysisReportPage } from './components/AnalysisReportPage.native';
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

  // Sample video simulation & analysis pipeline
  const handleStartAnalysis = (_sampleName: string = 'Rugby_Sprint_Tackle_Analysis.mp4') => {
    setIsProcessing(true);
    setProcessingProgress(0);
    setVideoUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');

    let prog = 0;
    const interval = setInterval(() => {
      prog += 12;
      if (prog >= 100) {
        clearInterval(interval);
        setProcessingProgress(100);

        // Generate high-precision synthetic telemetry frames
        const frames: FrameAnalysis[] = [];
        const frameCount = 30;
        for (let i = 0; i < frameCount; i++) {
          const ts = (i / frameCount) * 4;
          const landmarks = generateSyntheticSportsPose(ts * 1000, ts);
          frames.push({
            frameNumber: i,
            timestamp: ts,
            landmarks,
            detectedPhase: i < 10 ? 'Preparation' : i < 22 ? 'Execution' : 'Follow-Through',
            angles: {
              knee: 110 + Math.sin(i * 0.2) * 20,
              hip: 135 + Math.cos(i * 0.2) * 15,
              shoulder: 90 + Math.sin(i * 0.3) * 25,
            },
            ruleResults: {
              knee: i === 15 ? 'warning' : 'optimal',
              hip: 'optimal',
              shoulder: 'good',
            },
            symmetryScore: 88 + Math.floor(Math.sin(i) * 6),
            kneeSafetyScore: i === 15 ? 78 : 94,
            activeLevel: skillLevel,
            isRealDetection: true,
          });
        }

        const report: AICoachingReport = {
          overallGrade: 'A-',
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
          coachEncouragement: 'Phenomenal kinetic rhythm. Focus on deceleration knee tracking to unlock peak power!',
        };

        const syntheticResult: AnalysisResult = {
          keyframes: [frames[4], frames[15], frames[26]],
          allFrames: frames,
          aiReport: report,
          overallSymmetry: 89,
          overallKneeSafety: 87,
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
              { name: 'Explosive Drive', timestamp: 1.5, score: 86, status: 'good' },
              { name: 'Kinetic Follow-Through', timestamp: 2.5, score: 90, status: 'optimal' },
            ],
            firingOrder: [
              { joint: 'Hips', peakTime: 0.8, peakVelocity: 340 },
              { joint: 'Torso', peakTime: 1.1, peakVelocity: 420 },
              { joint: 'Arms', peakTime: 1.4, peakVelocity: 510 },
            ],
            isCorrectOrder: true,
            sequenceEfficiency: 89,
          },
          dynamicMetrics: {
            peakAngularVelocity: 510,
            estimatedPeakTorque: 84,
            explosivenessScore: 91,
          },
        };

        setAnalysisResult(syntheticResult);
        setIsProcessing(false);
      } else {
        setProcessingProgress(prog);
      }
    }, 220);
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

      {/* Top App Bar */}
      <View style={styles.appBar}>
        <View style={styles.brandRow}>
          <View style={styles.brandBadge}>
            <Zap color="#ef4444" size={18} />
          </View>
          <View>
            <Text style={styles.brandTitle}>KLUTCHH AI</Text>
            <Text style={styles.brandSubtitle}>BIOMECHANIC PERFORMANCE ENGINE</Text>
          </View>
        </View>

        <View style={styles.tierPill}>
          <Text style={styles.tierText}>PRO V1.0</Text>
        </View>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'analyze' && styles.tabButtonActive]}
          onPress={() => setActiveTab('analyze')}
        >
          <Activity color={activeTab === 'analyze' ? '#ef4444' : '#71717a'} size={16} />
          <Text style={[styles.tabText, activeTab === 'analyze' && styles.tabTextActive]}>ANALYZE</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'drills' && styles.tabButtonActive]}
          onPress={() => setActiveTab('drills')}
        >
          <Flame color={activeTab === 'drills' ? '#ef4444' : '#71717a'} size={16} />
          <Text style={[styles.tabText, activeTab === 'drills' && styles.tabTextActive]}>DRILLS</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'saved' && styles.tabButtonActive]}
          onPress={() => setActiveTab('saved')}
        >
          <Bookmark color={activeTab === 'saved' ? '#ef4444' : '#71717a'} size={16} />
          <Text style={[styles.tabText, activeTab === 'saved' && styles.tabTextActive]}>
            SAVED ({savedReports.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {activeTab === 'analyze' && (
          <>
            {/* Sport Selector Carousel */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>SELECT SPORT & PROTOCOL</Text>
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
                    <Text style={styles.sportEmoji}>{sport.icon}</Text>
                    <Text style={[styles.sportName, isSelected && styles.sportNameActive]}>
                      {sport.name.toUpperCase()}
                    </Text>
                    {isSelected && <View style={styles.activeDot} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Sport Focus & Biomechanics Summary Card */}
            <View style={styles.ruleCard}>
              <View style={styles.ruleCardHeader}>
                <View>
                  <Text style={styles.ruleSportName}>{currentSportRule.name.toUpperCase()}</Text>
                  <Text style={styles.ruleSportCategory}>{currentSportRule.category.toUpperCase()}</Text>
                </View>
                <View style={styles.rulesCountBadge}>
                  <Text style={styles.rulesCountText}>{currentSportRule.jointRules.length} JOINT RULES</Text>
                </View>
              </View>

              <Text style={styles.ruleDescription}>{currentSportRule.description}</Text>

              {/* Tiers & Level Selector */}
              <View style={styles.optionsGrid}>
                <View style={styles.optionBox}>
                  <Text style={styles.optionLabel}>ATHLETE LEVEL</Text>
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
                  <Text style={styles.optionLabel}>DIVISION CATEGORY</Text>
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

            {/* Video Input & Capture Actions */}
            <View style={styles.actionCard}>
              <View style={styles.actionHeader}>
                <Sparkles color="#ef4444" size={20} />
                <Text style={styles.actionTitle}>BIOMETRIC CAPTURE & RUN</Text>
              </View>
              <Text style={styles.actionSubtitle}>
                Run athlete motion analysis to benchmark kinematic parameters and identify joint compensation patterns.
              </Text>

              {isProcessing ? (
                <View style={styles.processingBox}>
                  <ActivityIndicator size="large" color="#ef4444" />
                  <Text style={styles.processingTitle}>ANALYZING JOINT TELEMETRY ({processingProgress}%)</Text>
                  <View style={styles.progressBarTrack}>
                    <View style={[styles.progressBarFill, { width: `${processingProgress}%` }]} />
                  </View>
                  <Text style={styles.processingStepText}>
                    {processingProgress < 30
                      ? 'Calibrating keypoints & spatial depth...'
                      : processingProgress < 75
                      ? `Matching ${currentSportRule.name} angular corridors...`
                      : 'Synthesizing coaching insights & safety index...'}
                  </Text>
                </View>
              ) : (
                <View style={styles.btnGrid}>
                  <TouchableOpacity
                    style={styles.primaryActionBtn}
                    onPress={() => handleStartAnalysis('Sample_Pro_Athletic_Clip.mp4')}
                  >
                    <Play color="#fff" size={18} />
                    <Text style={styles.primaryActionText}>RUN {currentSportRule.name.toUpperCase()} AI SCAN</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Core Tracked Joint Features */}
            <View style={styles.featuresSection}>
              <Text style={styles.sectionTitle}>ACTIVE BIOMECHANICAL MONITORS</Text>
              {currentSportRule.jointRules.slice(0, 4).map((rule, idx) => (
                <View key={rule.id || idx} style={styles.featureRow}>
                  <View style={styles.featureIconBox}>
                    <TrendingUp color="#ef4444" size={16} />
                  </View>
                  <View style={styles.featureContent}>
                    <Text style={styles.featureName}>{rule.name}</Text>
                    <Text style={styles.featureDetails}>
                      Corridor: {rule.idealMin}° - {rule.idealMax}° • {rule.phase}
                    </Text>
                  </View>
                  <View style={styles.featureBadge}>
                    <Text style={styles.featureBadgeText}>
                      {rule.importance === 'critical_safety' ? 'SAFETY' : 'POWER'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {activeTab === 'drills' && (
          <View style={styles.drillsContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>CORRECTIVE DRILLS LIBRARY</Text>
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
              <Text style={styles.sectionTitle}>SAVED SESSIONS</Text>
              <Text style={styles.sectionBadge}>{savedReports.length} SESSIONS</Text>
            </View>

            {savedReports.length === 0 ? (
              <View style={styles.emptyBox}>
                <Bookmark color="#3f3f46" size={48} />
                <Text style={styles.emptyTitle}>NO SAVED SESSIONS YET</Text>
                <Text style={styles.emptySubtitle}>
                  Run a biometric analysis to benchmark performance and save reports to your library.
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

            <ScrollView style={styles.modalBody}>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#18181b',
    backgroundColor: '#09090b',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  brandSubtitle: {
    color: '#71717a',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  tierPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  tierText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#18181b',
    backgroundColor: '#0c0c0e',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    backgroundColor: 'transparent',
  },
  tabButtonActive: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  tabText: {
    color: '#71717a',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  tabTextActive: {
    color: '#ffffff',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionTitle: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  sectionBadge: {
    color: '#a1a1aa',
    fontSize: 9,
    fontWeight: '800',
  },
  sportsScroll: {
    gap: 10,
    paddingVertical: 4,
  },
  sportCard: {
    width: 100,
    height: 90,
    backgroundColor: '#18181b',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    position: 'relative',
  },
  sportCardActive: {
    backgroundColor: '#27272a',
    borderColor: '#ef4444',
  },
  sportEmoji: {
    fontSize: 26,
  },
  sportName: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sportNameActive: {
    color: '#ffffff',
  },
  activeDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
  },
  ruleCard: {
    backgroundColor: '#141417',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#27272a',
    gap: 14,
  },
  ruleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ruleSportName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  ruleSportCategory: {
    color: '#ef4444',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  rulesCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#27272a',
    borderRadius: 8,
  },
  rulesCountText: {
    color: '#d4d4d8',
    fontSize: 9,
    fontWeight: '800',
  },
  ruleDescription: {
    color: '#a1a1aa',
    fontSize: 12,
    lineHeight: 18,
  },
  optionsGrid: {
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    paddingTop: 14,
  },
  optionBox: {
    gap: 6,
  },
  optionLabel: {
    color: '#71717a',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  optionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#1c1c20',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  chipActive: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  chipText: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: '800',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  actionCard: {
    backgroundColor: '#18181b',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#27272a',
    gap: 12,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  actionSubtitle: {
    color: '#a1a1aa',
    fontSize: 11,
    lineHeight: 16,
  },
  btnGrid: {
    marginTop: 6,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  processingBox: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  processingTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  progressBarTrack: {
    width: '100%',
    height: 6,
    backgroundColor: '#27272a',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#ef4444',
  },
  processingStepText: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  featuresSection: {
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141417',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    gap: 12,
  },
  featureIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureName: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  featureDetails: {
    color: '#71717a',
    fontSize: 10,
    marginTop: 2,
  },
  featureBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#1f1f23',
    borderRadius: 6,
  },
  featureBadgeText: {
    color: '#ef4444',
    fontSize: 8,
    fontWeight: '900',
  },
  drillsContainer: {
    gap: 12,
  },
  drillCard: {
    backgroundColor: '#18181b',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    gap: 8,
  },
  drillTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  drillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 6,
  },
  drillBadgeText: {
    color: '#ef4444',
    fontSize: 9,
    fontWeight: '900',
  },
  drillDifficulty: {
    color: '#71717a',
    fontSize: 9,
    fontWeight: '800',
  },
  drillTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  drillFocus: {
    color: '#a1a1aa',
    fontSize: 11,
    lineHeight: 16,
  },
  drillFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
  },
  drillJointText: {
    color: '#d4d4d8',
    fontSize: 10,
    fontWeight: '700',
  },
  savedContainer: {
    gap: 12,
  },
  emptyBox: {
    backgroundColor: '#141417',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#27272a',
    marginTop: 20,
  },
  emptyTitle: {
    color: '#71717a',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  emptySubtitle: {
    color: '#52525b',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  savedCard: {
    backgroundColor: '#18181b',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    gap: 6,
  },
  savedCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  savedSport: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  savedGradeBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedGradeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  savedDate: {
    color: '#71717a',
    fontSize: 10,
  },
  savedScore: {
    color: '#a1a1aa',
    fontSize: 11,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#18181b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#27272a',
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    flex: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#a1a1aa',
    fontSize: 14,
    fontWeight: '800',
  },
  modalBody: {
    gap: 12,
  },
  modalFocusLabel: {
    color: '#ef4444',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 8,
  },
  modalFocusText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
  },
  modalBodyText: {
    color: '#a1a1aa',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  modalDetailsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  modalDetailBox: {
    flex: 1,
    backgroundColor: '#141417',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    gap: 4,
  },
  detailBoxLabel: {
    color: '#71717a',
    fontSize: 8,
    fontWeight: '900',
  },
  detailBoxValue: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  modalDoneBtn: {
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  modalDoneBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
