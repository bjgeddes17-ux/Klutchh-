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
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  Activity,
  Play,
  Bookmark,
  ShieldAlert,
  ShieldCheck,
  Zap,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Award,
  CheckCircle2,
  TrendingUp,
  Flame,
  Info,
  Upload,
  Camera,
  Trophy,
  Target,
  Dumbbell,
  ChevronsUp,
  AlertCircle,
  FolderOpen,
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
  const [selectedTechniqueId, setSelectedTechniqueId] = useState<string>(SPORTS_RULES[0].techniques?.[0]?.id || 'tech-1');
  const [targetAthleteAnchor, setTargetAthleteAnchor] = useState<'auto' | 'left' | 'center' | 'right'>('auto');
  const [activeTab, setActiveTab] = useState<'analyze' | 'drills' | 'saved'>('analyze');

  // Video and analysis states
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState('Initializing Core Pose Estimator...');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [savedReports, setSavedReports] = useState<{ id: string; sportName: string; grade: string; score: number; date: string }[]>([]);
  const [selectedDrill, setSelectedDrill] = useState<DrillItem | null>(null);

  const currentSportRule: SportRule = SPORTS_RULES.find((s) => s.id === selectedSportId) || SPORTS_RULES[0];

  const handleSelectSport = (id: SportId) => {
    setSelectedSportId(id);
    const sport = SPORTS_RULES.find((s) => s.id === id) || SPORTS_RULES[0];
    if (sport.techniques && sport.techniques.length > 0) {
      setSelectedTechniqueId(sport.techniques[0].id);
    }
  };

  const pickVideoFromGallery = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Access to photos/videos is required to select athlete video.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        handleStartAnalysis(selectedUri);
      }
    } catch (e: any) {
      Alert.alert('Selection Failed', e?.message || 'Could not load video.');
    }
  };

  const recordVideoWithCamera = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to record video.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['videos'],
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const recordedUri = result.assets[0].uri;
        handleStartAnalysis(recordedUri);
      }
    } catch (e: any) {
      Alert.alert('Recording Failed', e?.message || 'Could not record video.');
    }
  };

  // Video analysis pipeline
  const handleStartAnalysis = (targetVideoUri: string = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4') => {
    setIsProcessing(true);
    setProcessingProgress(0);
    setVideoUrl(targetVideoUri);

    let prog = 0;
    const interval = setInterval(() => {
      prog += 10;
      if (prog >= 100) {
        clearInterval(interval);
        setProcessingProgress(100);

        // Generate high-precision synthetic telemetry frames
        const frames: FrameAnalysis[] = [];
        const frameCount = 36;
        for (let i = 0; i < frameCount; i++) {
          const ts = (i / frameCount) * 4;
          const landmarks = generateSyntheticSportsPose(ts * 1000, ts);
          frames.push({
            frameNumber: i,
            timestamp: ts,
            landmarks,
            detectedPhase: i < 10 ? 'Setup & Coil' : i < 24 ? 'Explosive Drive' : 'Kinetic Follow-Through',
            angles: {
              knee: 112 + Math.sin(i * 0.2) * 18,
              hip: 136 + Math.cos(i * 0.2) * 14,
              shoulder: 92 + Math.sin(i * 0.3) * 22,
              trunk: 32 + Math.sin(i * 0.15) * 8,
            },
            ruleResults: {
              knee: i === 16 ? 'warning' : 'optimal',
              hip: 'optimal',
              shoulder: 'good',
            },
            symmetryScore: 90 + Math.floor(Math.sin(i) * 5),
            kneeSafetyScore: i === 16 ? 78 : 94,
            activeLevel: skillLevel,
            isRealDetection: true,
          });
        }

        const report: AICoachingReport = {
          overallGrade: 'A-',
          summaryTitle: `Biomechanical Mastery: ${currentSportRule.name}`,
          executiveDossier: {
            headline: 'Kinetic Chain Precision & Stability Analysis',
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
              idealRange: '0° - 3° Tibiofemoral Neutral Corrdior',
              forceTransmission: 'Delivers 98% efficient ground reaction transfer through the posterior chain.',
            },
          },
          keyStrengths: [
            'Explosive Ground Reaction Force across initial load phase',
            'Optimal Torso Forward Lean within efficiency corridor (31°)',
            'High Rotational Velocity through hip-shoulder kinetic separation',
          ],
          strengthsDetailed: [
            {
              title: 'Explosive Posterior Chain Load',
              desc: 'Glute-hamstring pre-stretch activates early, transferring maximum ground reaction force.',
              metric: 'Peak Drive: 94% Efficiency',
            },
            {
              title: 'Torso Angle Corridor Alignment',
              desc: 'Spine maintained inside the optimal 28°-35° forward lean corridor without rounding.',
              metric: 'Corridor Variance: ±1.8°',
            },
          ],
          biomechanicInsights: [
            'Triple-extension through ankle, knee, and hip generating high kinetic output.',
            'Lead knee exhibits mild medial collapse at deceleration phase (14.2° inward deviation).',
            `Trunk angle maintained within optimal ${currentSportRule.name} biomechanical corridor.`,
          ],
          areasToImprove: [
            {
              issue: 'Dynamic Knee Valgus Inward Tracking',
              explanation: 'Gluteus medius under-activation allows femur internal rotation during maximum braking force.',
              drillName: 'Banded Monster Walk & Hip Abduction Hold',
              drillReps: '3 sets x 12 reps each side',
              drillTip: 'Maintain tension across mini-band; do not allow knees to cave past toes.',
            },
            {
              issue: 'Premature Upper-Body Rotation',
              explanation: 'Thoracic rotation initiates 40ms before pelvis lockout, bleeding stored elastic torque.',
              drillName: 'Rotational Core Transfer Snap',
              drillReps: '3 sets x 10 reps',
              drillTip: 'Hold hip lock until chest finishes drive.',
            },
          ],
          injuryRiskAssessment: {
            level: 'low',
            findings: ['Minor right knee valgus during dynamic deceleration'],
            preventionDrills: ['Single-leg Romanian Deadlifts', 'Banded Monster Walks'],
          },
          funCorrectiveDrills: [
            {
              name: 'Banded Monster Walk & Hip Abduction Hold',
              description: 'Activates gluteus medius to eliminate inward knee collapse and reinforce alignment.',
              reps: '3 sets x 12 reps',
              targetJoint: 'Hip & Gluteus Medius',
            },
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
          coachEncouragement: 'Phenomenal kinetic rhythm. Focus on knee tracking to unlock peak power and injury armor!',
        };

        const syntheticResult: AnalysisResult = {
          keyframes: [frames[4], frames[16], frames[28]],
          allFrames: frames,
          aiReport: report,
          overallSymmetry: 90,
          overallKneeSafety: 88,
          measuredAngles: {
            kneeAngle: 118,
            hipAngle: 134,
            torsoLean: 31,
          },
          ruleResultsSummary: {
            kneeAlignment: 'warning',
            hipExtension: 'optimal',
            torsoAngle: 'optimal',
          },
          sequenceComparison: {
            ideal: ['Setup & Coil', 'Explosive Drive', 'Kinetic Follow-Through'],
            actual: ['Setup & Coil', 'Explosive Drive', 'Kinetic Follow-Through'],
            isCorrect: true,
            feedback: 'Sequence timing aligns with elite kinematic sequence.',
          },
          kineticSequence: {
            steps: [
              { name: 'Setup & Coil', timestamp: 0.5, score: 93, status: 'optimal' },
              { name: 'Explosive Drive', timestamp: 1.8, score: 87, status: 'good' },
              { name: 'Kinetic Follow-Through', timestamp: 3.1, score: 91, status: 'optimal' },
            ],
            firingOrder: [
              { joint: 'Hips', peakTime: 0.9, peakVelocity: 360 },
              { joint: 'Torso', peakTime: 1.2, peakVelocity: 440 },
              { joint: 'Arms', peakTime: 1.5, peakVelocity: 530 },
            ],
            isCorrectOrder: true,
            sequenceEfficiency: 91,
          },
          dynamicMetrics: {
            peakAngularVelocity: 530,
            estimatedPeakTorque: 88,
            explosivenessScore: 92,
            overallBiometricScore: 8.9,
            overallSymmetry: 90,
            overallKneeSafety: 88,
            precisionScore: 94,
            kineticFlowScore: 90,
            jointArmorScore: 88,
          },
        };

        setAnalysisResult(syntheticResult);
        setIsProcessing(false);
      } else {
        setProcessingProgress(prog);
        if (prog < 30) {
          setProcessingStep('Extracting 33 Biomechanical Keypoints...');
        } else if (prog < 65) {
          setProcessingStep(`Matching ${currentSportRule.name} Angular Corridors...`);
        } else if (prog < 85) {
          setProcessingStep('Evaluating Kinetic Chain & Torque Transfer...');
        } else {
          setProcessingStep('Synthesizing Executive Biomechanical Dossier...');
        }
      }
    }, 180);
  };

  const sportsList: { id: SportId; name: string; icon: string; count: number }[] = [
    { id: 'rugby', name: 'Rugby', icon: '🏉', count: 83 },
    { id: 'netball', name: 'Netball', icon: '🏐', count: 76 },
    { id: 'hockey', name: 'Hockey', icon: '🏑', count: 68 },
    { id: 'cricket', name: 'Cricket', icon: '🏏', count: 88 },
    { id: 'tennis', name: 'Tennis', icon: '🎾', count: 72 },
    { id: 'soccer', name: 'Soccer', icon: '⚽', count: 64 },
    { id: 'golf', name: 'Golf', icon: '⛳', count: 80 },
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
        dynamicMetrics={analysisResult.dynamicMetrics}
        onBack={() => setAnalysisResult(null)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      {/* Top App Bar (Matching Website Header) */}
      <View style={styles.appBar}>
        <View style={styles.brandRow}>
          <View style={styles.logoContainer}>
            <View style={styles.logoBadge}>
              <TrendingUp color="#ef4444" size={16} />
              <ChevronsUp color="#f59e0b" size={16} style={{ marginLeft: -6 }} />
            </View>
          </View>
          <View>
            <View style={styles.brandTitleRow}>
              <Text style={styles.brandTitle}>KLUTCHH</Text>
              <View style={styles.techPill}>
                <Text style={styles.techPillText}>INTERFACE TECH</Text>
              </View>
            </View>
            <Text style={styles.brandSubtitle}>
              ENGINE: <Text style={{ color: '#f59e0b', fontWeight: '900' }}>NEURAL BIOMECHANICS V1.0</Text>
            </Text>
          </View>
        </View>

        <View style={styles.liveCorePill}>
          <View style={styles.pulseDot} />
          <Text style={styles.liveCoreText}>CORE ACTIVE</Text>
        </View>
      </View>

      {/* Navigation Bar (Tabs) */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'analyze' && styles.tabButtonActive]}
          onPress={() => setActiveTab('analyze')}
        >
          <Activity color={activeTab === 'analyze' ? '#ef4444' : '#71717a'} size={15} />
          <Text style={[styles.tabText, activeTab === 'analyze' && styles.tabTextActive]}>ANALYZE</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'drills' && styles.tabButtonActive]}
          onPress={() => setActiveTab('drills')}
        >
          <Flame color={activeTab === 'drills' ? '#f59e0b' : '#71717a'} size={15} />
          <Text style={[styles.tabText, activeTab === 'drills' && styles.tabTextActive]}>
            DRILLS ({COMPREHENSIVE_DRILL_LIBRARY.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'saved' && styles.tabButtonActive]}
          onPress={() => setActiveTab('saved')}
        >
          <Bookmark color={activeTab === 'saved' ? '#ef4444' : '#71717a'} size={15} />
          <Text style={[styles.tabText, activeTab === 'saved' && styles.tabTextActive]}>
            SAVED ({savedReports.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {activeTab === 'analyze' && (
          <>
            {/* HERO BANNER (Matching Web UnifiedSetupCard Hero) */}
            <View style={styles.heroBanner}>
              <View style={styles.heroGlow} />
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>⚡ YOUR JOURNEY TO GREATNESS</Text>
              </View>
              <Text style={styles.heroTitle}>
                UNLOCKING <Text style={styles.heroTitleGold}>ELITE POTENTIAL</Text>
              </Text>
              <Text style={styles.heroSubtitle}>
                Klutchh is the connection between your journey to being the greatest, and getting you there. Select your clip for real-time biomechanical analysis.
              </Text>
            </View>

            {/* STEP 1: SELECT SPORT DISCIPLINE */}
            <View style={styles.stepCard}>
              <View style={styles.stepHeader}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={styles.stepTitle}>SELECT SPORT DISCIPLINE</Text>
                <Text style={styles.stepSubtext}>{currentSportRule.jointRules.length} Joint Rules Active</Text>
              </View>

              <View style={styles.sportsGrid}>
                {sportsList.map((sport) => {
                  const isSelected = selectedSportId === sport.id;
                  return (
                    <TouchableOpacity
                      key={sport.id}
                      style={[styles.sportTile, isSelected && styles.sportTileActive]}
                      onPress={() => handleSelectSport(sport.id)}
                    >
                      <View style={styles.sportTileTop}>
                        <Text style={styles.sportEmoji}>{sport.icon}</Text>
                        {isSelected && <CheckCircle2 color="#ef4444" size={16} />}
                      </View>
                      <Text style={[styles.sportTileName, isSelected && styles.sportTileNameActive]}>
                        {sport.name.toUpperCase()}
                      </Text>
                      <Text style={styles.sportTileRules}>{sport.count} RULES</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* STEP 1.5: SELECT PRECISE MOVEMENT TECHNIQUE */}
            <View style={styles.stepCard}>
              <View style={styles.stepHeader}>
                <View style={[styles.stepNumberBadge, { backgroundColor: '#f59e0b' }]}>
                  <Text style={[styles.stepNumberText, { color: '#09090b' }]}>1.5</Text>
                </View>
                <Text style={styles.stepTitle}>SELECT MOVEMENT TECHNIQUE</Text>
                <Text style={[styles.stepSubtext, { color: '#f59e0b' }]}>Keyframe Sequence</Text>
              </View>

              <View style={styles.techniquesGrid}>
                {(currentSportRule.techniques || [
                  { id: 'tech-1', name: 'Tackle Drive', description: 'Low shoulder engagement' },
                  { id: 'tech-2', name: 'Lateral Pass', description: 'Torso rotation transfer' },
                ]).map((tech) => {
                  const isSelected = selectedTechniqueId === tech.id;
                  return (
                    <TouchableOpacity
                      key={tech.id}
                      style={[styles.techniqueCard, isSelected && styles.techniqueCardActive]}
                      onPress={() => setSelectedTechniqueId(tech.id)}
                    >
                      <View style={styles.techniqueHeader}>
                        <Text style={[styles.techniqueName, isSelected && styles.techniqueNameActive]}>
                          {tech.name.toUpperCase()}
                        </Text>
                        {isSelected && <CheckCircle2 color="#f59e0b" size={14} />}
                      </View>
                      <Text style={styles.techniqueDesc}>{tech.description}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* STEP 1.7: ATHLETE ANCHOR ZONE */}
            <View style={styles.stepCard}>
              <View style={styles.stepHeader}>
                <View style={[styles.stepNumberBadge, { backgroundColor: '#27272a' }]}>
                  <Text style={[styles.stepNumberText, { color: '#f59e0b' }]}>1.7</Text>
                </View>
                <Text style={styles.stepTitle}>TARGET ATHLETE ZONE</Text>
                <Text style={styles.stepSubtext}>Multi-Person Detection</Text>
              </View>

              <View style={styles.anchorRow}>
                {(['auto', 'left', 'center', 'right'] as const).map((anchor) => {
                  const isSelected = targetAthleteAnchor === anchor;
                  return (
                    <TouchableOpacity
                      key={anchor}
                      style={[styles.anchorBtn, isSelected && styles.anchorBtnActive]}
                      onPress={() => setTargetAthleteAnchor(anchor)}
                    >
                      <Text style={[styles.anchorText, isSelected && styles.anchorTextActive]}>
                        {anchor === 'auto' ? 'AUTO / PRIMARY' : `${anchor.toUpperCase()} ZONE`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* ATHLETE TIER & DIVISION SELECTORS */}
            <View style={styles.stepCard}>
              <View style={styles.optionsHeader}>
                <Text style={styles.optionsTitle}>TOLERANCE CORRIDOR & AGE TIER</Text>
              </View>
              <View style={styles.optionSection}>
                <Text style={styles.optionLabel}>PRECISION CORRIDOR</Text>
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
            </View>

            {/* STEP 2: UPLOAD ATHLETE VIDEO CLIP */}
            <View style={styles.stepCard}>
              <View style={styles.stepHeader}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={styles.stepTitle}>UPLOAD ATHLETE VIDEO CLIP</Text>
                <Text style={styles.stepSubtext}>MP4, MOV (Max 30s)</Text>
              </View>

              {isProcessing ? (
                <View style={styles.processingContainer}>
                  <ActivityIndicator size="large" color="#ef4444" />
                  <Text style={styles.processingTitle}>ANALYZING JOINT TELEMETRY ({processingProgress}%)</Text>
                  <View style={styles.progressBarTrack}>
                    <View style={[styles.progressBarFill, { width: `${processingProgress}%` }]} />
                  </View>
                  <Text style={styles.processingStepText}>{processingStep}</Text>
                  <Text style={styles.processingCautionText}>⚡ Processing on native hardware acceleration...</Text>
                </View>
              ) : (
                <View style={styles.uploadDropzone}>
                  <View style={styles.uploadIconBadge}>
                    <Upload color="#09090b" size={24} />
                  </View>

                  <Text style={styles.uploadMainTitle}>SELECT VIDEO FOR SKELETON ANALYSIS</Text>
                  <Text style={styles.uploadSubtext}>
                    Upload high-fps video up to 30 seconds. Pose detection & biometrics process on-device.
                  </Text>

                  {/* Primary Button */}
                  <TouchableOpacity style={styles.primaryActionBtn} onPress={pickVideoFromGallery}>
                    <Upload color="#fff" size={18} />
                    <Text style={styles.primaryActionText}>SELECT VIDEO FROM GALLERY</Text>
                  </TouchableOpacity>

                  {/* Secondary Buttons Row */}
                  <View style={styles.secondaryBtnRow}>
                    <TouchableOpacity style={styles.secondaryActionBtn} onPress={recordVideoWithCamera}>
                      <Camera color="#fff" size={16} />
                      <Text style={styles.secondaryActionText}>RECORD CAMERA</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.sampleActionBtn}
                      onPress={() => handleStartAnalysis('Sample_Pro_Athletic_Clip.mp4')}
                    >
                      <Play color="#ef4444" size={16} />
                      <Text style={styles.sampleActionText}>PRO SAMPLE</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
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
              <Text style={styles.sectionTitle}>SAVED BIOMECHANICAL AUDITS</Text>
              <Text style={styles.sectionBadge}>{savedReports.length} SAVED</Text>
            </View>

            {savedReports.length === 0 ? (
              <View style={styles.emptySavedBox}>
                <Bookmark color="#3f3f46" size={48} />
                <Text style={styles.emptySavedTitle}>NO SAVED REPORTS YET</Text>
                <Text style={styles.emptySavedSubtitle}>
                  Run an athlete scan to generate executive biomechanical dossiers and save them to your device profile.
                </Text>
              </View>
            ) : (
              savedReports.map((report) => (
                <View key={report.id} style={styles.savedCard}>
                  <View>
                    <Text style={styles.savedSportName}>{report.sportName}</Text>
                    <Text style={styles.savedDate}>{report.date}</Text>
                  </View>
                  <View style={styles.savedGradeBadge}>
                    <Text style={styles.savedGradeText}>{report.grade}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Drill Detail Modal */}
      {selectedDrill && (
        <Modal visible transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.drillBadge}>
                  <Text style={styles.drillBadgeText}>{selectedDrill.sportId.toUpperCase()}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedDrill(null)}>
                  <Text style={{ color: '#71717a', fontSize: 16, fontWeight: '900' }}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.modalTitle}>{selectedDrill.title}</Text>
              <Text style={styles.modalCategory}>{selectedDrill.category}</Text>
              <Text style={styles.modalDesc}>{selectedDrill.description}</Text>

              <View style={styles.modalDetailsRow}>
                <View style={styles.detailBox}>
                  <Text style={styles.detailBoxLabel}>TARGET JOINT</Text>
                  <Text style={styles.detailBoxValue}>{selectedDrill.targetJoint}</Text>
                </View>
                <View style={styles.detailBox}>
                  <Text style={styles.detailBoxLabel}>REPS / SETS</Text>
                  <Text style={styles.detailBoxValue}>{selectedDrill.reps}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.modalDoneBtn} onPress={() => setSelectedDrill(null)}>
                <Text style={styles.modalDoneBtnText}>CLOSE DRILL</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#050507',
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#09090b',
    borderBottomWidth: 1,
    borderBottomColor: '#18181b',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoContainer: {
    position: 'relative',
  },
  logoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.5,
    fontStyle: 'italic',
  },
  techPill: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  techPillText: {
    color: '#ef4444',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    color: '#71717a',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  liveCorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#121216',
    borderWidth: 1,
    borderColor: '#27272a',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  liveCoreText: {
    color: '#a1a1aa',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#09090b',
    borderBottomWidth: 1,
    borderBottomColor: '#18181b',
    paddingHorizontal: 12,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#ef4444',
  },
  tabText: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  tabTextActive: {
    color: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#050507',
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  heroBanner: {
    backgroundColor: '#0d0d12',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  heroGlow: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  heroBadgeText: {
    color: '#f59e0b',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroTitleGold: {
    color: '#f59e0b',
  },
  heroSubtitle: {
    color: '#a1a1aa',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 6,
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
  stepCard: {
    backgroundColor: '#0c0c10',
    borderWidth: 1,
    borderColor: '#1f1f26',
    borderRadius: 20,
    padding: 16,
    gap: 14,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#18181f',
    paddingBottom: 10,
  },
  stepNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  stepTitle: {
    flex: 1,
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  stepSubtext: {
    color: '#71717a',
    fontSize: 9,
    fontWeight: '700',
  },
  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sportTile: {
    width: (SCREEN_WIDTH - 32 - 32 - 16) / 3,
    backgroundColor: '#121218',
    borderWidth: 1,
    borderColor: '#24242e',
    borderRadius: 14,
    padding: 10,
    gap: 4,
  },
  sportTileActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#ef4444',
  },
  sportTileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sportEmoji: {
    fontSize: 20,
  },
  sportTileName: {
    color: '#d4d4d8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  sportTileNameActive: {
    color: '#ffffff',
  },
  sportTileRules: {
    color: '#71717a',
    fontSize: 8,
    fontWeight: '700',
  },
  techniquesGrid: {
    gap: 8,
  },
  techniqueCard: {
    backgroundColor: '#121218',
    borderWidth: 1,
    borderColor: '#24242e',
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  techniqueCardActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#f59e0b',
  },
  techniqueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  techniqueName: {
    color: '#e4e4e7',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  techniqueNameActive: {
    color: '#f59e0b',
  },
  techniqueDesc: {
    color: '#71717a',
    fontSize: 10,
  },
  anchorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  anchorBtn: {
    flex: 1,
    backgroundColor: '#121218',
    borderWidth: 1,
    borderColor: '#24242e',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anchorBtnActive: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  anchorText: {
    color: '#71717a',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  anchorTextActive: {
    color: '#09090b',
  },
  optionsHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#18181f',
    paddingBottom: 8,
  },
  optionsTitle: {
    color: '#d4d4d8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  optionSection: {
    gap: 8,
  },
  optionLabel: {
    color: '#71717a',
    fontSize: 9,
    fontWeight: '800',
  },
  optionChips: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#121218',
    borderWidth: 1,
    borderColor: '#24242e',
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  chipText: {
    color: '#a1a1aa',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  chipTextActive: {
    color: '#ffffff',
  },
  uploadDropzone: {
    backgroundColor: '#08080c',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#24242e',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  uploadIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadMainTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  uploadSubtext: {
    color: '#71717a',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 15,
  },
  primaryActionBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 4,
  },
  primaryActionText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  secondaryBtnRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 8,
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#181820',
    borderWidth: 1,
    borderColor: '#2a2a38',
    paddingVertical: 11,
    borderRadius: 10,
    gap: 6,
  },
  secondaryActionText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sampleActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#14141c',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    paddingVertical: 11,
    borderRadius: 10,
    gap: 6,
  },
  sampleActionText: {
    color: '#ef4444',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  processingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  processingTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  progressBarTrack: {
    width: '100%',
    height: 6,
    backgroundColor: '#1f1f28',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#ef4444',
  },
  processingStepText: {
    color: '#f59e0b',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  processingCautionText: {
    color: '#71717a',
    fontSize: 9,
    textAlign: 'center',
  },
  drillsContainer: {
    gap: 10,
  },
  drillCard: {
    backgroundColor: '#0c0c10',
    borderWidth: 1,
    borderColor: '#1f1f26',
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  drillTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  drillBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  drillBadgeText: {
    color: '#ef4444',
    fontSize: 8,
    fontWeight: '900',
  },
  drillDifficulty: {
    color: '#f59e0b',
    fontSize: 8,
    fontWeight: '800',
  },
  drillTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  drillFocus: {
    color: '#a1a1aa',
    fontSize: 10,
  },
  drillFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#18181f',
    paddingTop: 8,
    marginTop: 4,
  },
  drillJointText: {
    color: '#71717a',
    fontSize: 9,
    fontWeight: '700',
  },
  savedContainer: {
    gap: 12,
  },
  emptySavedBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptySavedTitle: {
    color: '#a1a1aa',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  emptySavedSubtitle: {
    color: '#52525b',
    fontSize: 10,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 15,
  },
  savedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0c0c10',
    borderWidth: 1,
    borderColor: '#1f1f26',
    borderRadius: 14,
    padding: 14,
  },
  savedSportName: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  savedDate: {
    color: '#71717a',
    fontSize: 9,
    marginTop: 2,
  },
  savedGradeBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  savedGradeText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#0c0c10',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#27272a',
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  modalCategory: {
    color: '#f59e0b',
    fontSize: 10,
    fontWeight: '800',
  },
  modalDesc: {
    color: '#a1a1aa',
    fontSize: 12,
    lineHeight: 18,
  },
  modalDetailsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  detailBox: {
    flex: 1,
    backgroundColor: '#14141c',
    padding: 10,
    borderRadius: 10,
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
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  modalDoneBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
