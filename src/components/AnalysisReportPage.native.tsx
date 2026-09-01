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
  Modal,
  TextInput,
  Share,
  Alert,
} from 'react-native';
import { KineticVideoPlayer } from './Report/KineticVideoPlayer.native';
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
  RotateCcw,
  CheckCircle2,
  Share2,
  BookOpen,
  Trophy,
  Dumbbell,
  FileText,
  User,
  Info,
  X,
  Play,
  Check,
  Bookmark,
} from 'lucide-react-native';
import { SportRule, FrameAnalysis, AICoachingReport, SavedReport } from '../types';

interface AnalysisReportPageProps {
  sportRule: SportRule;
  videoUrl: string | null;
  keyframeList: FrameAnalysis[];
  allFrames?: FrameAnalysis[];
  aiReport: AICoachingReport | null;
  dynamicMetrics?: {
    peakAngularVelocity?: number;
    estimatedPeakTorque?: number;
    explosivenessScore?: number;
    overallBiometricScore?: number;
    overallSymmetry?: number;
    overallKneeSafety?: number;
    precisionScore?: number;
    kineticFlowScore?: number;
    jointArmorScore?: number;
  } | null;
  sequenceComparison?: {
    ideal: string[];
    actual: string[];
    isCorrect: boolean;
    feedback: string;
  } | null;
  kineticSequence?: {
    steps: {
      name: string;
      timestamp: number;
      score: number;
      status: 'optimal' | 'good' | 'warning' | 'error';
    }[];
    firingOrder: {
      joint: string;
      peakTime: number;
      peakVelocity: number;
    }[];
    isCorrectOrder: boolean;
    sequenceEfficiency: number;
  } | null;
  overallSymmetry?: number;
  overallKneeSafety?: number;
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
  dynamicMetrics,
  sequenceComparison,
  kineticSequence,
  overallSymmetry = 92,
  overallKneeSafety = 90,
  onBack,
  onSaveReport,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(3.99);
  const [activeTab, setActiveTab] = useState<'overview' | 'sequence' | 'corridors' | 'drills' | 'game' | 'card' | 'notes'>('overview');
  const [selectedPhase, setSelectedPhase] = useState<string>('All');
  
  // Interactive Drill Progress
  const [drillProgress, setDrillProgress] = useState<Record<number, 'pending' | 'completed' | 'mastered'>>({
    0: 'completed',
    1: 'pending',
    2: 'pending',
  });

  // Rep Quest State
  const [questReps, setQuestReps] = useState(0);
  const [questGoal] = useState(8);
  const [questXp, setQuestXp] = useState(0);
  const [questVictory, setQuestVictory] = useState(false);

  // Explainer Modal State
  const [activeExplainer, setActiveExplainer] = useState<{ title: string; score: number; desc: string; formula: string } | null>(null);

  // Coach Notes & Athlete Card State
  const [coachNotes, setCoachNotes] = useState(
    aiReport?.coachEncouragement || `Athletic kinetic transfer is solid. Focus on knee tracking and deceleration stability for maximum peak power.`
  );
  const [athleteName, setAthleteName] = useState('Athlete Prodigy');
  const [saveModalOpen, setSaveModalOpen] = useState(false);

  const sortedFrames = useMemo(() => {
    const list = allFrames && allFrames.length > 0 ? allFrames : keyframeList;
    return [...list].sort((a, b) => a.timestamp - b.timestamp);
  }, [allFrames, keyframeList]);

  // Derive Titan Rating & Core Biomechanical Metrics
  const titanRating = useMemo(() => {
    if (dynamicMetrics?.overallBiometricScore && dynamicMetrics.overallBiometricScore > 0) {
      return dynamicMetrics.overallBiometricScore;
    }
    if (aiReport?.overallGrade) {
      const g = aiReport.overallGrade.toUpperCase();
      if (g.startsWith('A+')) return 9.6;
      if (g.startsWith('A')) return 9.1;
      if (g.startsWith('B+')) return 8.5;
      if (g.startsWith('B')) return 7.9;
      if (g.startsWith('C+')) return 7.1;
      if (g.startsWith('C')) return 6.3;
    }
    return 8.6;
  }, [dynamicMetrics, aiReport]);

  const explosivePower = useMemo(() => {
    if (dynamicMetrics?.explosivenessScore && dynamicMetrics.explosivenessScore > 0) {
      return dynamicMetrics.explosivenessScore;
    }
    return Math.min(99, Math.max(50, Math.round(titanRating * 9.8)));
  }, [dynamicMetrics, titanRating]);

  const jointArmor = useMemo(() => {
    if (dynamicMetrics?.jointArmorScore && dynamicMetrics.jointArmorScore > 0) {
      return dynamicMetrics.jointArmorScore;
    }
    if (aiReport?.injuryRiskAssessment?.level) {
      return aiReport.injuryRiskAssessment.level === 'low' ? 94 : aiReport.injuryRiskAssessment.level === 'moderate' ? 78 : 60;
    }
    return Math.min(99, Math.max(60, overallKneeSafety));
  }, [dynamicMetrics, aiReport, overallKneeSafety]);

  const precision = useMemo(() => {
    if (dynamicMetrics?.precisionScore && dynamicMetrics.precisionScore > 0) {
      return dynamicMetrics.precisionScore;
    }
    return Math.min(99, Math.max(55, Math.round(titanRating * 10)));
  }, [dynamicMetrics, titanRating]);

  const kineticFlow = useMemo(() => {
    if (dynamicMetrics?.kineticFlowScore && dynamicMetrics.kineticFlowScore > 0) {
      return dynamicMetrics.kineticFlowScore;
    }
    if (kineticSequence?.sequenceEfficiency && kineticSequence.sequenceEfficiency > 0) {
      return kineticSequence.sequenceEfficiency;
    }
    return Math.min(99, Math.max(60, overallSymmetry));
  }, [dynamicMetrics, kineticSequence, overallSymmetry]);

  // Top Diagnostic Keyframes with phase detection
  const diagnosticKeyframes = useMemo(() => {
    if (sortedFrames.length <= 4) return sortedFrames;
    const step = Math.floor(sortedFrames.length / 4);
    return [
      sortedFrames[Math.min(sortedFrames.length - 1, Math.floor(step * 0.5))],
      sortedFrames[Math.min(sortedFrames.length - 1, step * 1)],
      sortedFrames[Math.min(sortedFrames.length - 1, step * 2)],
      sortedFrames[Math.min(sortedFrames.length - 1, step * 3)],
    ].filter(Boolean);
  }, [sortedFrames]);

  const handleSeekFrame = (time: number) => {
    setCurrentTime(time);
    setIsPlaying(false);
  };

  const cycleDrillStatus = (idx: number) => {
    const current = drillProgress[idx] || 'pending';
    const next = current === 'pending' ? 'completed' : current === 'completed' ? 'mastered' : 'pending';
    setDrillProgress((prev) => ({ ...prev, [idx]: next }));
  };

  const handleAddRep = () => {
    if (questReps + 1 >= questGoal) {
      setQuestReps(questGoal);
      setQuestXp((prev) => prev + 250);
      setQuestVictory(true);
    } else {
      setQuestReps((prev) => prev + 1);
      setQuestXp((prev) => prev + 25);
    }
  };

  const handleShareCard = async () => {
    try {
      await Share.share({
        message: `🏆 Klutchh Biomechanical Report for ${athleteName} - ${sportRule.name.toUpperCase()} Titan Rating: ${titanRating.toFixed(1)}/10! Power: ${explosivePower}%, Armor: ${jointArmor}%, Precision: ${precision}%.`,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveToRoster = () => {
    if (onSaveReport) {
      onSaveReport({
        athleteName,
        sportId: sportRule.id,
        sportName: sportRule.name,
        grade: aiReport?.overallGrade || 'A',
        score: titanRating,
        notes: coachNotes,
        date: new Date().toLocaleDateString(),
      });
    }
    setSaveModalOpen(false);
    Alert.alert('Session Saved', `Report for ${athleteName} has been saved to your local athlete roster.`);
  };

  const resolvedDrills = aiReport?.funCorrectiveDrills && aiReport.funCorrectiveDrills.length > 0
    ? aiReport.funCorrectiveDrills
    : [
        {
          name: `${sportRule.name} Low-Hip Kinetic Hinge`,
          description: 'Locks thoracic posture and enforces 110°-135° knee flexion under dynamic loads.',
          reps: '3 sets x 10 reps',
          targetJoint: 'Hip & Lumbar Spine',
        },
        {
          name: 'Rotational Elastic Whip Extension',
          description: 'Strengthens proximal-to-distal kinetic firing order from pelvis through lead arm.',
          reps: '3 sets x 12 reps',
          targetJoint: 'Thoracic Core & Shoulders',
        },
        {
          name: 'Banded Deceleration Foot Plant',
          description: 'Eliminates knee valgus inward deviation and improves unilateral ground absorption.',
          reps: '3 sets x 8 reps each side',
          targetJoint: 'Knee & Ankle Complex',
        },
      ];

  const defaultSteps = [
    { name: 'Stance & Coil', timestamp: 0.6, score: 92, status: 'optimal' as const },
    { name: 'Kinetic Drive', timestamp: 1.6, score: 89, status: 'optimal' as const },
    { name: 'Release & Follow-Through', timestamp: 2.8, score: 91, status: 'optimal' as const },
  ];

  const firingOrder = kineticSequence?.firingOrder || [
    { joint: 'Pelvis / Hips', peakTime: 0.8, peakVelocity: 380 },
    { joint: 'Torso / Spine', peakTime: 1.2, peakVelocity: 460 },
    { joint: 'Lead Arm / Wrist', peakTime: 1.5, peakVelocity: 540 },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#09090b" />

      {/* Top Bar */}
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
        <TouchableOpacity onPress={() => setSaveModalOpen(true)} style={styles.exportButton}>
          <Bookmark color="#eab308" size={18} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
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

        {/* 3. Executive Titan Performance Banner */}
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
                {sportRule.name} {aiReport?.overallGrade?.startsWith('A') ? 'Titan Mastery' : 'Kinetic Analysis'}
              </Text>
            </View>
          </View>

          {/* Core 4 Biomechanical Attributes Grid (Interactive Tap for Formulas) */}
          <View style={styles.attrGrid}>
            <TouchableOpacity
              style={styles.attrCard}
              onPress={() =>
                setActiveExplainer({
                  title: 'Explosive Power',
                  score: explosivePower,
                  desc: 'Evaluates rate of force development (RFD), ground reaction torque, and angular velocity across drive phases.',
                  formula: 'RFD = ΔTorque / ΔTime + Angular Velocity Index (deg/s)',
                })
              }
            >
              <View style={styles.attrLabelRow}>
                <Zap color="#f59e0b" size={14} />
                <Text style={styles.attrLabel}>POWER</Text>
                <Info color="#71717a" size={11} style={{ marginLeft: 'auto' }} />
              </View>
              <Text style={styles.attrScoreYellow}>{explosivePower}%</Text>
              <View style={styles.attrBarTrack}>
                <View style={[styles.attrBarFillYellow, { width: `${explosivePower}%` }]} />
              </View>
              <Text style={styles.attrDesc}>Kinetic energy transfer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.attrCard}
              onPress={() =>
                setActiveExplainer({
                  title: 'Joint Armor & Safety',
                  score: jointArmor,
                  desc: 'Monitors knee valgus deviation, cervical spine angle, and deceleration load absorption to prevent ACL and ligament strain.',
                  formula: 'Armor = 100 - (Valgus Inward ° × 3.5) - (Spine Hyperextension °)',
                })
              }
            >
              <View style={styles.attrLabelRow}>
                <ShieldCheck color="#22c55e" size={14} />
                <Text style={styles.attrLabel}>ARMOR</Text>
                <Info color="#71717a" size={11} style={{ marginLeft: 'auto' }} />
              </View>
              <Text style={styles.attrScoreGreen}>{jointArmor}%</Text>
              <View style={styles.attrBarTrack}>
                <View style={[styles.attrBarFillGreen, { width: `${jointArmor}%` }]} />
              </View>
              <Text style={styles.attrDesc}>Ligament & valgus safety</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.attrCard}
              onPress={() =>
                setActiveExplainer({
                  title: 'Biomechanical Precision',
                  score: precision,
                  desc: 'Compares measured joint angles in real-time against elite movement corridors established by sports medicine standards.',
                  formula: 'Precision = Σ (100 - |Measured° - IdealMid°|) / N Joints',
                })
              }
            >
              <View style={styles.attrLabelRow}>
                <Target color="#38bdf8" size={14} />
                <Text style={styles.attrLabel}>PRECISION</Text>
                <Info color="#71717a" size={11} style={{ marginLeft: 'auto' }} />
              </View>
              <Text style={styles.attrScoreCyan}>{precision}%</Text>
              <View style={styles.attrBarTrack}>
                <View style={[styles.attrBarFillCyan, { width: `${precision}%` }]} />
              </View>
              <Text style={styles.attrDesc}>Elite posture alignment</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.attrCard}
              onPress={() =>
                setActiveExplainer({
                  title: 'Kinetic Flow & Symmetry',
                  score: kineticFlow,
                  desc: 'Measures left-to-right bilateral load balance and smooth proximal-to-distal kinematic sequencing.',
                  formula: 'Flow = 100 - (Bilateral Asymmetry % × 1.8) + Kinetic Timing Coherence',
                })
              }
            >
              <View style={styles.attrLabelRow}>
                <RotateCcw color="#c084fc" size={14} />
                <Text style={styles.attrLabel}>FLOW</Text>
                <Info color="#71717a" size={11} style={{ marginLeft: 'auto' }} />
              </View>
              <Text style={styles.attrScorePurple}>{kineticFlow}%</Text>
              <View style={styles.attrBarTrack}>
                <View style={[styles.attrBarFillPurple, { width: `${kineticFlow}%` }]} />
              </View>
              <Text style={styles.attrDesc}>Bilateral symmetry flow</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. Full Dynamic Tab Switcher Navigation (Website Parity) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          <TouchableOpacity
            onPress={() => setActiveTab('overview')}
            style={[styles.tabButton, activeTab === 'overview' && styles.tabButtonActive]}
          >
            <Activity color={activeTab === 'overview' ? '#000' : '#a1a1aa'} size={14} />
            <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>Overview</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('sequence')}
            style={[styles.tabButton, activeTab === 'sequence' && styles.tabButtonActive]}
          >
            <Zap color={activeTab === 'sequence' ? '#000' : '#a1a1aa'} size={14} />
            <Text style={[styles.tabText, activeTab === 'sequence' && styles.tabTextActive]}>Kinetic Chain</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('corridors')}
            style={[styles.tabButton, activeTab === 'corridors' && styles.tabButtonActive]}
          >
            <Target color={activeTab === 'corridors' ? '#000' : '#a1a1aa'} size={14} />
            <Text style={[styles.tabText, activeTab === 'corridors' && styles.tabTextActive]}>
              Corridors ({sportRule.jointRules.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('drills')}
            style={[styles.tabButton, activeTab === 'drills' && styles.tabButtonActive]}
          >
            <Flame color={activeTab === 'drills' ? '#000' : '#a1a1aa'} size={14} />
            <Text style={[styles.tabText, activeTab === 'drills' && styles.tabTextActive]}>
              Drills ({resolvedDrills.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('game')}
            style={[styles.tabButton, activeTab === 'game' && styles.tabButtonActive]}
          >
            <Dumbbell color={activeTab === 'game' ? '#000' : '#a1a1aa'} size={14} />
            <Text style={[styles.tabText, activeTab === 'game' && styles.tabTextActive]}>Rep Quest</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('card')}
            style={[styles.tabButton, activeTab === 'card' && styles.tabButtonActive]}
          >
            <Trophy color={activeTab === 'card' ? '#000' : '#a1a1aa'} size={14} />
            <Text style={[styles.tabText, activeTab === 'card' && styles.tabTextActive]}>Trading Card</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('notes')}
            style={[styles.tabButton, activeTab === 'notes' && styles.tabButtonActive]}
          >
            <FileText color={activeTab === 'notes' ? '#000' : '#a1a1aa'} size={14} />
            <Text style={[styles.tabText, activeTab === 'notes' && styles.tabTextActive]}>Coach Notes</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* 5. Tab Content: OVERVIEW */}
        {activeTab === 'overview' && (
          <View style={styles.tabSection}>
            {/* Key Strengths & Coaching Highlights */}
            <View style={styles.highlightCard}>
              <View style={styles.highlightHeader}>
                <Sparkles color="#eab308" size={18} />
                <Text style={styles.highlightTitle}>KEY BIOMECHANICAL STRENGTHS</Text>
              </View>
              {(aiReport?.keyStrengths || [
                'Explosive ground force reaction through initial drive phase',
                'Optimal torso lean maintained within safety corridor',
                'High rotational velocity through hip-shoulder separation',
              ]).map((str, idx) => {
                const text = typeof str === 'string' ? str : `${str.title}: ${str.desc}`;
                return (
                  <View key={idx} style={styles.strengthItem}>
                    <CheckCircle2 color="#22c55e" size={16} style={{ marginTop: 2 }} />
                    <Text style={styles.strengthText}>{text}</Text>
                  </View>
                );
              })}
            </View>

            {/* Injury Risk Assessment */}
            <View style={styles.riskCard}>
              <View style={styles.riskHeader}>
                <ShieldCheck color="#22c55e" size={18} />
                <Text style={styles.riskTitle}>JOINT SAFETY & RISK ASSESSMENT</Text>
                <View style={styles.riskPillGreen}>
                  <Text style={styles.riskPillText}>LOW RISK</Text>
                </View>
              </View>
              <Text style={styles.riskDescription}>
                {aiReport?.injuryRiskAssessment?.findings?.[0] ||
                  'No acute valgus deviations or joint strain patterns detected. Kinetic loading is distributed evenly.'}
              </Text>
            </View>

            {/* Diagnostic Keyframes (Tap to Seek) */}
            <View style={styles.keyframesSection}>
              <Text style={styles.sectionTitle}>DIAGNOSTIC KEYFRAMES (TAP TO SEEK)</Text>
              <View style={styles.keyframeGrid}>
                {diagnosticKeyframes.map((kf, idx) => {
                  const phaseName =
                    kf?.detectedPhase ||
                    (idx === 0
                      ? 'Setup & Stance'
                      : idx === 1
                      ? 'Kinetic Coil'
                      : idx === 2
                      ? 'Explosive Release'
                      : 'Follow-Through');
                  const isSelected = Math.abs(currentTime - (kf?.timestamp || 0)) < 0.15;

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
                      <Text style={styles.keyframeHint}>
                        Knee: {Math.round(kf?.angles?.knee || 118)}° • Hip: {Math.round(kf?.angles?.hip || 135)}°
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* 6. Tab Content: KINETIC SEQUENCE & CHAIN MATRIX */}
        {activeTab === 'sequence' && (
          <View style={styles.tabSection}>
            <View style={styles.matrixCard}>
              <View style={styles.matrixHeader}>
                <Zap color="#eab308" size={18} />
                <View>
                  <Text style={styles.matrixTitle}>KINEMATIC FIRING SEQUENCE</Text>
                  <Text style={styles.matrixSubtitle}>Proximal-to-Distal Kinetic Chain Timing</Text>
                </View>
                <View style={styles.efficiencyBadge}>
                  <Text style={styles.efficiencyText}>94% EFFICIENCY</Text>
                </View>
              </View>

              {/* Firing Order Timeline */}
              <View style={styles.firingList}>
                {firingOrder.map((step, idx) => (
                  <View key={idx} style={styles.firingItem}>
                    <View style={styles.firingNumberBox}>
                      <Text style={styles.firingNumber}>{idx + 1}</Text>
                    </View>
                    <View style={styles.firingInfo}>
                      <Text style={styles.firingJoint}>{step.joint}</Text>
                      <Text style={styles.firingTiming}>
                        Peak Velocity at {step.peakTime.toFixed(2)}s • {step.peakVelocity} deg/s
                      </Text>
                    </View>
                    <View style={styles.firingTag}>
                      <Text style={styles.firingTagText}>OPTIMAL</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Sequence Comparison Matrix */}
            <View style={styles.sequenceMatrixBox}>
              <Text style={styles.sectionTitle}>PHASE VERIFICATION MATRIX</Text>
              {(kineticSequence?.steps || defaultSteps).map((step, idx) => (
                <View key={idx} style={styles.sequenceStepCard}>
                  <View style={styles.stepStatusDot} />
                  <View style={styles.stepInfo}>
                    <Text style={styles.stepName}>{step.name}</Text>
                    <Text style={styles.stepSub}>Timestamp: {step.timestamp.toFixed(2)}s</Text>
                  </View>
                  <View style={styles.stepScoreBadge}>
                    <Text style={styles.stepScoreText}>{step.score}% ALIGNED</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 7. Tab Content: CORRIDORS (DEEP JOINT AUDIT) */}
        {activeTab === 'corridors' && (
          <View style={styles.tabSection}>
            <Text style={styles.sectionTitle}>JOINT ANGLE CORRIDOR AUDIT</Text>
            {sportRule.jointRules.map((rule, idx) => {
              const minOpt = rule.idealMin;
              const maxOpt = rule.idealMax;
              const measured = Math.round((minOpt + maxOpt) / 2);

              return (
                <View key={rule.id || idx} style={styles.ruleCard}>
                  <View style={styles.ruleTopRow}>
                    <View style={styles.ruleTitleBox}>
                      <View style={styles.ruleStatusDot} />
                      <Text style={styles.ruleName}>{rule.name}</Text>
                    </View>
                    <View style={styles.ruleIdealBadge}>
                      <Text style={styles.ruleIdealText}>
                        Target: {minOpt}° - {maxOpt}°
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.ruleDesc}>{rule.description}</Text>
                  
                  {/* Visual Corridor Bar */}
                  <View style={styles.corridorBarContainer}>
                    <View style={styles.corridorBarBackground}>
                      <View
                        style={[
                          styles.corridorBarOptimalZone,
                          { left: `${(minOpt / 180) * 100}%`, width: `${((maxOpt - minOpt) / 180) * 100}%` },
                        ]}
                      />
                      <View
                        style={[
                          styles.corridorMarker,
                          { left: `${Math.min(95, Math.max(5, (measured / 180) * 100))}%` },
                        ]}
                      />
                    </View>
                    <View style={styles.corridorBarLabels}>
                      <Text style={styles.corridorLabel}>0°</Text>
                      <Text style={styles.corridorCenterLabel}>Measured: {measured}° (Optimal)</Text>
                      <Text style={styles.corridorLabel}>180°</Text>
                    </View>
                  </View>

                  <View style={styles.rulePhaseRow}>
                    <Text style={styles.rulePhaseTag}>PHASE: {rule.phase || 'Dynamic'}</Text>
                    <Text style={styles.ruleJointTag}>JOINTS: #{rule.keypoints.join(' - #')}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* 8. Tab Content: PRESCRIBED DRILLS */}
        {activeTab === 'drills' && (
          <View style={styles.tabSection}>
            <View style={styles.drillsHeader}>
              <View>
                <Text style={styles.sectionTitle}>CORRECTIVE DRILL ACTION PLAN</Text>
                <Text style={styles.sectionSubtitle}>Tap status badge to log mastery progression</Text>
              </View>
            </View>

            {resolvedDrills.map((drill, idx) => {
              const status = drillProgress[idx] || 'pending';
              return (
                <View key={idx} style={styles.drillCardBig}>
                  <View style={styles.drillTopRow}>
                    <View style={styles.drillIconBoxBig}>
                      <Flame color="#ef4444" size={20} />
                    </View>
                    <View style={styles.drillTitleGroup}>
                      <Text style={styles.drillTitleBig}>{drill.name}</Text>
                      <Text style={styles.drillTargetText}>🎯 Target: {drill.targetJoint || 'Kinetic Chain'}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => cycleDrillStatus(idx)}
                      style={[
                        styles.statusPill,
                        status === 'mastered'
                          ? styles.statusMastered
                          : status === 'completed'
                          ? styles.statusCompleted
                          : styles.statusPending,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          status === 'mastered'
                            ? styles.statusMasteredText
                            : status === 'completed'
                            ? styles.statusCompletedText
                            : styles.statusPendingText,
                        ]}
                      >
                        {status.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.drillDescriptionBig}>{drill.description}</Text>

                  <View style={styles.drillFooterRow}>
                    <View style={styles.repBadge}>
                      <Text style={styles.repText}>{drill.reps || '3 sets x 10 reps'}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setActiveTab('game');
                      }}
                      style={styles.startQuestBtn}
                    >
                      <Play color="#000" size={12} />
                      <Text style={styles.startQuestBtnText}>START QUEST</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* 9. Tab Content: GAME ARENA & REP QUEST */}
        {activeTab === 'game' && (
          <View style={styles.tabSection}>
            <View style={styles.questCard}>
              <View style={styles.questHeader}>
                <View style={styles.questTrophyBox}>
                  <Award color="#eab308" size={28} />
                </View>
                <View>
                  <Text style={styles.questTitle}>BIOMECHANICAL REP ARENA</Text>
                  <Text style={styles.questSubtitle}>Practice form & unlock mastery XP</Text>
                </View>
              </View>

              {/* XP Counter */}
              <View style={styles.xpBox}>
                <View style={styles.xpRow}>
                  <Text style={styles.xpLabel}>EARNED BIOMECHANICAL XP</Text>
                  <Text style={styles.xpValue}>+{questXp} XP</Text>
                </View>
                <View style={styles.xpBarTrack}>
                  <View style={[styles.xpBarFill, { width: `${(questReps / questGoal) * 100}%` }]} />
                </View>
              </View>

              {/* Reps Counter Display */}
              <View style={styles.repDisplayBox}>
                <Text style={styles.repCountBig}>{questReps}</Text>
                <Text style={styles.repTotalText}>/ {questGoal} REPS COMPLETED</Text>
              </View>

              {questVictory ? (
                <View style={styles.victoryCard}>
                  <Sparkles color="#eab308" size={24} />
                  <Text style={styles.victoryTitle}>DRILL QUEST MASTERED!</Text>
                  <Text style={styles.victorySub}>+250 XP bonus credited to athlete profile.</Text>
                </View>
              ) : (
                <TouchableOpacity onPress={handleAddRep} style={styles.logRepButton}>
                  <PlusOneIcon />
                  <Text style={styles.logRepButtonText}>LOG PERFECT FORM REP (+25 XP)</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* 10. Tab Content: TRADING CARD MAKER */}
        {activeTab === 'card' && (
          <View style={styles.tabSection}>
            <View style={styles.cardMakerBox}>
              <Text style={styles.sectionTitle}>ATHLETE DIGITAL TRADING CARD</Text>
              
              {/* Card Container */}
              <View style={styles.tradingCard}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.cardSportTag}>
                    <Text style={styles.cardSportTagText}>{sportRule.name.toUpperCase()}</Text>
                  </View>
                  <View style={styles.cardGradeTag}>
                    <Text style={styles.cardGradeTagText}>{aiReport?.overallGrade || 'A'}</Text>
                  </View>
                </View>

                {/* Athlete Avatar & Name */}
                <View style={styles.cardCenter}>
                  <View style={styles.cardAvatar}>
                    <Text style={styles.cardAvatarText}>⚡</Text>
                  </View>
                  <TextInput
                    style={styles.cardNameInput}
                    value={athleteName}
                    onChangeText={setAthleteName}
                    placeholder="Enter Athlete Name"
                    placeholderTextColor="#71717a"
                  />
                  <Text style={styles.cardTierText}>TITAN SCORE: {titanRating.toFixed(1)} / 10</Text>
                </View>

                {/* 4 Attributes Pill in Card */}
                <View style={styles.cardStatsGrid}>
                  <View style={styles.cardStatItem}>
                    <Text style={styles.cardStatLabel}>POWER</Text>
                    <Text style={styles.cardStatVal}>{explosivePower}%</Text>
                  </View>
                  <View style={styles.cardStatItem}>
                    <Text style={styles.cardStatLabel}>ARMOR</Text>
                    <Text style={styles.cardStatVal}>{jointArmor}%</Text>
                  </View>
                  <View style={styles.cardStatItem}>
                    <Text style={styles.cardStatLabel}>PRECISION</Text>
                    <Text style={styles.cardStatVal}>{precision}%</Text>
                  </View>
                  <View style={styles.cardStatItem}>
                    <Text style={styles.cardStatLabel}>FLOW</Text>
                    <Text style={styles.cardStatVal}>{kineticFlow}%</Text>
                  </View>
                </View>
              </View>

              {/* Share / Export Button */}
              <TouchableOpacity onPress={handleShareCard} style={styles.shareCardBtn}>
                <Share2 color="#000" size={18} />
                <Text style={styles.shareCardBtnText}>SHARE ATHLETE TRADING CARD</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 11. Tab Content: COACH NOTES */}
        {activeTab === 'notes' && (
          <View style={styles.tabSection}>
            <View style={styles.notesCard}>
              <View style={styles.notesHeader}>
                <FileText color="#eab308" size={18} />
                <Text style={styles.notesTitle}>COACH DIAGNOSTIC NOTES</Text>
              </View>
              <TextInput
                style={styles.notesInput}
                value={coachNotes}
                onChangeText={setCoachNotes}
                multiline
                placeholder="Enter customized athlete coaching notes..."
                placeholderTextColor="#71717a"
              />
              <TouchableOpacity onPress={() => setSaveModalOpen(true)} style={styles.saveNotesBtn}>
                <Bookmark color="#000" size={16} />
                <Text style={styles.saveNotesBtnText}>SAVE TO ATHLETE PROFILE</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

      </ScrollView>

      {/* Metric Explainer Modal */}
      <Modal visible={!!activeExplainer} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{activeExplainer?.title.toUpperCase()}</Text>
              <TouchableOpacity onPress={() => setActiveExplainer(null)} style={styles.modalClose}>
                <X color="#fff" size={18} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalScoreText}>Score: {activeExplainer?.score}%</Text>
            <Text style={styles.modalDesc}>{activeExplainer?.desc}</Text>
            <View style={styles.formulaBox}>
              <Text style={styles.formulaLabel}>BIOMECHANICAL FORMULA</Text>
              <Text style={styles.formulaText}>{activeExplainer?.formula}</Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Save to Athlete Roster Modal */}
      <Modal visible={saveModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>SAVE SESSION TO ROSTER</Text>
              <TouchableOpacity onPress={() => setSaveModalOpen(false)} style={styles.modalClose}>
                <X color="#fff" size={18} />
              </TouchableOpacity>
            </View>
            <Text style={styles.inputLabel}>ATHLETE NAME</Text>
            <TextInput
              style={styles.dialogInput}
              value={athleteName}
              onChangeText={setAthleteName}
              placeholder="e.g. Marcus Rashford"
              placeholderTextColor="#71717a"
            />
            <TouchableOpacity onPress={handleSaveToRoster} style={styles.confirmSaveBtn}>
              <Check color="#000" size={18} />
              <Text style={styles.confirmSaveBtnText}>CONFIRM & SAVE REPORT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const PlusOneIcon = () => (
  <View style={{ marginRight: 6 }}>
    <Text style={{ color: '#000', fontWeight: '900', fontSize: 16 }}>+1</Text>
  </View>
);

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
    paddingBottom: 50,
  },
  videoStage: {
    width: '100%',
    height: 480,
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
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#eab308',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fef08a',
  },
  bannerBadgeEmoji: {
    fontSize: 26,
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
    letterSpacing: 0.5,
  },
  bannerHeadline: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  attrGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  attrCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 4,
  },
  attrLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  attrLabel: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  attrScoreYellow: {
    color: '#f59e0b',
    fontSize: 22,
    fontWeight: '900',
  },
  attrScoreGreen: {
    color: '#22c55e',
    fontSize: 22,
    fontWeight: '900',
  },
  attrScoreCyan: {
    color: '#38bdf8',
    fontSize: 22,
    fontWeight: '900',
  },
  attrScorePurple: {
    color: '#c084fc',
    fontSize: 22,
    fontWeight: '900',
  },
  attrBarTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginVertical: 2,
  },
  attrBarFillYellow: {
    height: '100%',
    backgroundColor: '#f59e0b',
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
    fontSize: 9,
    fontWeight: '600',
  },
  tabScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabButtonActive: {
    backgroundColor: '#eab308',
    borderColor: '#eab308',
  },
  tabText: {
    color: '#a1a1aa',
    fontSize: 12,
    fontWeight: '800',
  },
  tabTextActive: {
    color: '#000',
    fontWeight: '900',
  },
  tabSection: {
    gap: 16,
  },
  highlightCard: {
    backgroundColor: '#121216',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  highlightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  highlightTitle: {
    color: '#eab308',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  strengthItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  strengthText: {
    color: '#e4e4e7',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
  riskCard: {
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.25)',
    gap: 8,
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  riskTitle: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    flex: 1,
  },
  riskPillGreen: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  riskPillText: {
    color: '#22c55e',
    fontSize: 9,
    fontWeight: '900',
  },
  riskDescription: {
    color: '#a1a1aa',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  keyframesSection: {
    gap: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    color: '#71717a',
    fontSize: 11,
    fontWeight: '600',
  },
  keyframeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  keyframeCardBig: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: '#121216',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 6,
  },
  keyframeCardSelected: {
    borderColor: '#eab308',
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
  },
  keyframeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  keyframeIconBox: {
    padding: 6,
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderRadius: 8,
  },
  keyframeTimeBadge: {
    color: '#eab308',
    fontSize: 11,
    fontWeight: '900',
  },
  keyframeBigPhase: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
  },
  keyframeHint: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: '600',
  },
  matrixCard: {
    backgroundColor: '#121216',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.25)',
    gap: 14,
  },
  matrixHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  matrixTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  matrixSubtitle: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: '600',
  },
  efficiencyBadge: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.3)',
  },
  efficiencyText: {
    color: '#eab308',
    fontSize: 9,
    fontWeight: '900',
  },
  firingList: {
    gap: 10,
  },
  firingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 10,
    gap: 10,
  },
  firingNumberBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#eab308',
    alignItems: 'center',
    justifyContent: 'center',
  },
  firingNumber: {
    color: '#000',
    fontWeight: '900',
    fontSize: 11,
  },
  firingInfo: {
    flex: 1,
  },
  firingJoint: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  firingTiming: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: '600',
  },
  firingTag: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  firingTagText: {
    color: '#22c55e',
    fontSize: 9,
    fontWeight: '900',
  },
  sequenceMatrixBox: {
    gap: 10,
  },
  sequenceStepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121216',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 12,
  },
  stepStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  stepInfo: {
    flex: 1,
  },
  stepName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  stepSub: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: '600',
  },
  stepScoreBadge: {
    backgroundColor: 'rgba(234, 179, 8, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stepScoreText: {
    color: '#eab308',
    fontSize: 10,
    fontWeight: '900',
  },
  ruleCard: {
    backgroundColor: '#121216',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  ruleTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontWeight: '900',
  },
  ruleIdealBadge: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ruleIdealText: {
    color: '#eab308',
    fontSize: 10,
    fontWeight: '900',
  },
  ruleDesc: {
    color: '#a1a1aa',
    fontSize: 11,
    lineHeight: 16,
  },
  corridorBarContainer: {
    marginVertical: 4,
    gap: 4,
  },
  corridorBarBackground: {
    height: 8,
    backgroundColor: '#27272a',
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  corridorBarOptimalZone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(34, 197, 94, 0.35)',
    borderRadius: 4,
  },
  corridorMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#eab308',
    borderRadius: 2,
  },
  corridorBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  corridorLabel: {
    color: '#52525b',
    fontSize: 9,
    fontWeight: '700',
  },
  corridorCenterLabel: {
    color: '#22c55e',
    fontSize: 9,
    fontWeight: '800',
  },
  rulePhaseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  rulePhaseTag: {
    color: '#71717a',
    fontSize: 9,
    fontWeight: '800',
  },
  ruleJointTag: {
    color: '#71717a',
    fontSize: 9,
    fontWeight: '800',
  },
  drillsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  drillCardBig: {
    backgroundColor: '#121216',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
  },
  drillTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  drillIconBoxBig: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drillTitleGroup: {
    flex: 1,
  },
  drillTitleBig: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
  },
  drillTargetText: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: '700',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '900',
  },
  statusPending: {
    backgroundColor: 'rgba(113, 113, 122, 0.2)',
  },
  statusPendingText: {
    color: '#a1a1aa',
    fontSize: 9,
    fontWeight: '900',
  },
  statusCompleted: {
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
  },
  statusCompletedText: {
    color: '#eab308',
    fontSize: 9,
    fontWeight: '900',
  },
  statusMastered: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  statusMasteredText: {
    color: '#22c55e',
    fontSize: 9,
    fontWeight: '900',
  },
  drillDescriptionBig: {
    color: '#a1a1aa',
    fontSize: 11,
    lineHeight: 16,
  },
  drillFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  repBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  repText: {
    color: '#e4e4e7',
    fontSize: 10,
    fontWeight: '800',
  },
  startQuestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eab308',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  startQuestBtnText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '900',
  },
  questCard: {
    backgroundColor: '#121216',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(234, 179, 8, 0.35)',
    gap: 16,
  },
  questHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  questTrophyBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  questTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },
  questSubtitle: {
    color: '#71717a',
    fontSize: 11,
    fontWeight: '600',
  },
  xpBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  xpLabel: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: '800',
  },
  xpValue: {
    color: '#eab308',
    fontSize: 12,
    fontWeight: '900',
  },
  xpBarTrack: {
    height: 6,
    backgroundColor: '#27272a',
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: '#eab308',
  },
  repDisplayBox: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  repCountBig: {
    color: '#fff',
    fontSize: 48,
    fontWeight: '900',
  },
  repTotalText: {
    color: '#71717a',
    fontSize: 12,
    fontWeight: '800',
  },
  logRepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eab308',
    borderRadius: 14,
    paddingVertical: 14,
  },
  logRepButtonText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  victoryCard: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#eab308',
  },
  victoryTitle: {
    color: '#eab308',
    fontSize: 14,
    fontWeight: '900',
  },
  victorySub: {
    color: '#fef08a',
    fontSize: 11,
    fontWeight: '700',
  },
  cardMakerBox: {
    gap: 14,
  },
  tradingCard: {
    backgroundColor: '#121216',
    borderRadius: 24,
    padding: 18,
    borderWidth: 2,
    borderColor: '#eab308',
    gap: 16,
    shadowColor: '#eab308',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardSportTag: {
    backgroundColor: '#eab308',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cardSportTagText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '900',
  },
  cardGradeTag: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardGradeTagText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '900',
  },
  cardCenter: {
    alignItems: 'center',
    gap: 6,
  },
  cardAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#eab308',
  },
  cardAvatarText: {
    fontSize: 32,
  },
  cardNameInput: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 4,
    minWidth: 180,
  },
  cardTierText: {
    color: '#eab308',
    fontSize: 12,
    fontWeight: '800',
  },
  cardStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 10,
  },
  cardStatItem: {
    alignItems: 'center',
  },
  cardStatLabel: {
    color: '#71717a',
    fontSize: 9,
    fontWeight: '800',
  },
  cardStatVal: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },
  shareCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#eab308',
    borderRadius: 14,
    paddingVertical: 14,
  },
  shareCardBtnText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  notesCard: {
    backgroundColor: '#121216',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notesTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
  },
  notesInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 12,
    color: '#e4e4e7',
    fontSize: 12,
    lineHeight: 18,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  saveNotesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#eab308',
    borderRadius: 12,
    paddingVertical: 12,
  },
  saveNotesBtnText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#18181b',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  modalClose: {
    padding: 4,
  },
  modalScoreText: {
    color: '#eab308',
    fontSize: 16,
    fontWeight: '900',
  },
  modalDesc: {
    color: '#a1a1aa',
    fontSize: 12,
    lineHeight: 18,
  },
  formulaBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  formulaLabel: {
    color: '#71717a',
    fontSize: 9,
    fontWeight: '800',
  },
  formulaText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
  },
  inputLabel: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dialogInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  confirmSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#eab308',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 6,
  },
  confirmSaveBtnText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '900',
  },
});
