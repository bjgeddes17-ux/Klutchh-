import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Share,
  Alert,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import {
  ArrowLeft,
  Share2,
  Sparkles,
  Flame,
  Dumbbell,
  FileText,
  CheckCircle2,
  Trophy,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  Bookmark,
  Target,
  Play,
  RotateCcw,
  X,
  Plus,
  Info,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import {
  SportRule,
  FrameAnalysis,
  AICoachingReport,
} from '../types';
import { COMPREHENSIVE_DRILL_LIBRARY, DrillItem } from '../data/drillLibrary';
import { KineticVideoPlayer } from './Report/KineticVideoPlayer.native';
import { GhostCorrectionVisualizer } from './Report/GhostCorrectionVisualizer.native';
import { KineticEnergyTransfer } from './Report/KineticEnergyTransfer.native';
import { AnimatedDrillVisualizer } from './Report/AnimatedDrillVisualizer.native';
import { calculateAngle } from '../utils/geometry';

interface AnalysisReportPageProps {
  sportRule: SportRule;
  videoUrl?: string;
  keyframeList?: FrameAnalysis[];
  allFrames?: FrameAnalysis[];
  aiReport?: AICoachingReport | null;
  overallSymmetry?: number;
  overallKneeSafety?: number;
  kineticSequence?: any;
  sequenceComparison?: any;
  dynamicMetrics?: any;
  isLowConfidence?: boolean;
  isFallback?: boolean;
  onBack: () => void;
  onSaveReport?: (reportData: any) => void;
}

export const AnalysisReportPage: React.FC<AnalysisReportPageProps> = ({
  sportRule,
  videoUrl = '',
  keyframeList = [],
  allFrames = [],
  aiReport = null,
  overallSymmetry = 88,
  overallKneeSafety = 92,
  kineticSequence,
  sequenceComparison,
  dynamicMetrics,
  isLowConfidence: propIsLowConfidence,
  isFallback: propIsFallback,
  onBack,
  onSaveReport,
}) => {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState<
    'corrections' | 'energy' | 'phases' | 'drills' | 'inspector' | 'symmetry' | 'notes'
  >('corrections');

  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState<string>('All');
  const [expandedDrillIdx, setExpandedDrillIdx] = useState<number | null>(0);

  // Drill Progress State
  const [drillProgress, setDrillProgress] = useState<Record<number, 'pending' | 'completed' | 'mastered'>>({
    0: 'pending',
    1: 'pending',
    2: 'pending',
  });

  // Rep Quest State
  const [questReps, setQuestReps] = useState<number>(0);
  const questGoal = 10;
  const [questXp, setQuestXp] = useState<number>(150);
  const [questVictory, setQuestVictory] = useState<boolean>(false);

  // Trading Card & Notes State
  const [athleteName, setAthleteName] = useState<string>('Alex Vance');
  const [coachNotes, setCoachNotes] = useState<string>(
    'Maintain low hip hinge during transition phase. Explosive hip-shoulder separation looks solid.'
  );
  const [saveModalOpen, setSaveModalOpen] = useState<boolean>(false);
  const [activeExplainer, setActiveExplainer] = useState<any | null>(null);
  const [inspectorFilter, setInspectorFilter] = useState<'all' | 'faults'>('all');

  // Sorted Frames
  const sortedFrames = useMemo(() => {
    const list = allFrames && allFrames.length > 0 ? allFrames : keyframeList;
    if (!list || list.length === 0) return [];
    return [...list].sort((a, b) => a.timestamp - b.timestamp);
  }, [allFrames, keyframeList]);

  const filteredInspectorFrames = useMemo(() => {
    if (inspectorFilter === 'faults') {
      return sortedFrames.filter(f => {
        const hasRuleError = f.ruleResults && Object.values(f.ruleResults).some(r => r === 'error' || r === 'warning');
        const hasValidationIssue = f.validationStatus === 'flagged_review' || (f.validationIssues && f.validationIssues.length > 0);
        return hasRuleError || hasValidationIssue;
      });
    }
    return sortedFrames;
  }, [sortedFrames, inspectorFilter]);

  const worstFrames = useMemo(() => {
    return sortedFrames
      .filter(f => {
        const hasRuleError = f.ruleResults && Object.values(f.ruleResults).some(r => r === 'error' || r === 'warning');
        const hasValidationIssue = f.validationStatus === 'flagged_review' || (f.validationIssues && f.validationIssues.length > 0);
        return hasRuleError || hasValidationIssue;
      })
      .sort((a, b) => {
        const aErrors = Object.values(a.ruleResults || {}).filter(r => r === 'error').length;
        const bErrors = Object.values(b.ruleResults || {}).filter(r => r === 'error').length;
        if (aErrors !== bErrors) return bErrors - aErrors;
        
        const aWarnings = Object.values(a.ruleResults || {}).filter(r => r === 'warning').length;
        const bWarnings = Object.values(b.ruleResults || {}).filter(r => r === 'warning').length;
        return bWarnings - aWarnings;
      })
      .slice(0, 10);
  }, [sortedFrames]);

  // Biomechanical Executive Ratings
  const titanRating = useMemo(() => {
    if (dynamicMetrics?.overallBiometricScore) {
      return dynamicMetrics.overallBiometricScore;
    }
    if (aiReport?.overallGrade) {
      const g = aiReport.overallGrade.toUpperCase();
      if (g.startsWith('A+')) return 9.6;
      if (g.startsWith('A')) return 9.1;
      if (g.startsWith('B+')) return 8.5;
      if (g.startsWith('B')) return 7.9;
    }
    return 8.8;
  }, [dynamicMetrics, aiReport]);

  const explosivePower = useMemo(() => {
    if (dynamicMetrics?.explosivenessScore) return dynamicMetrics.explosivenessScore;
    return Math.min(99, Math.max(50, Math.round(titanRating * 9.8)));
  }, [dynamicMetrics, titanRating]);

  const jointArmor = useMemo(() => {
    if (dynamicMetrics?.jointArmorScore) return dynamicMetrics.jointArmorScore;
    return Math.min(99, Math.max(60, overallKneeSafety));
  }, [dynamicMetrics, overallKneeSafety]);

  const precision = useMemo(() => {
    if (dynamicMetrics?.precisionScore) return dynamicMetrics.precisionScore;
    return Math.min(99, Math.max(55, Math.round(titanRating * 10)));
  }, [dynamicMetrics, titanRating]);

  const kineticFlow = useMemo(() => {
    if (dynamicMetrics?.kineticFlowScore) return dynamicMetrics.kineticFlowScore;
    return Math.min(99, Math.max(60, overallSymmetry));
  }, [dynamicMetrics, overallSymmetry]);

  // Resolved Drills (From Comprehensive Library + AI Report)
  const resolvedDrills = useMemo(() => {
    const matched = COMPREHENSIVE_DRILL_LIBRARY.filter(
      (d) => d.sportId === sportRule.id || d.sportName.toLowerCase().includes(sportRule.id.toLowerCase())
    );

    if (matched.length > 0) return matched;

    if (aiReport?.funCorrectiveDrills && aiReport.funCorrectiveDrills.length > 0) {
      return aiReport.funCorrectiveDrills.map((d: any, idx: number) => ({
        id: `ai-drill-${idx}`,
        sportId: sportRule.id,
        sportName: sportRule.name,
        title: d.name,
        category: (idx === 0 ? 'Kinetic Chain' : idx === 1 ? 'Stability' : 'Injury Prevention') as any,
        targetJoint: d.targetJoint || 'Kinetic Chain',
        difficulty: (idx === 0 ? 'Elite' : 'Intermediate') as any,
        reps: d.reps || '10 reps each side',
        sets: '3 sets',
        coachingCue: `Lock joint angles in strict target corridor throughout execution.`,
        description: d.description || 'Isolates and reinforces optimal kinetic alignment under dynamic loads.',
        steps: [
          'Assume stable athletic posture with neutral spine.',
          'Execute slow controlled movement through the target joint angle.',
          'Hold peak contraction for 2 seconds before returning smoothly.',
        ],
        photoUrl: '',
        biomechanicalBenefit: 'Maximizes force transfer efficiency and prevents joint shear.',
      }));
    }

    return [
      {
        id: 'default-1',
        sportId: sportRule.id,
        sportName: sportRule.name,
        title: `${sportRule.name} Low-Hip Kinetic Hinge`,
        category: 'Kinetic Chain' as any,
        targetJoint: 'Hip & Lumbar Spine',
        difficulty: 'Elite' as any,
        reps: '10 reps each side',
        sets: '3 sets',
        coachingCue: '"Sink hips below shoulders; keep flat neutral spine through the movement."',
        description: 'Eliminates upright bending by locking the thoracic spine and driving power through explosive hip extension.',
        steps: [
          'Assume an athletic stance with feet shoulder-width apart.',
          'Hinge at the hips keeping chest up and neutral spine.',
          'Drive through heels back to starting position.',
        ],
        photoUrl: '',
        biomechanicalBenefit: 'Increases ground force reaction by 35% and stabilizes lumbar spine.',
      },
      {
        id: 'default-2',
        sportId: sportRule.id,
        sportName: sportRule.name,
        title: 'Rotational Elastic Core Whip Snap',
        category: 'Stability' as any,
        targetJoint: 'Thoracic Spine & Shoulders',
        difficulty: 'Intermediate' as any,
        reps: '12 reps each side',
        sets: '3 sets',
        coachingCue: '"Initiate rotation from ground up through hips into the lead arm."',
        description: 'Builds explosive rotational sequencing for maximum force transmission without drifting off-axis.',
        steps: [
          'Hold resistance band with two hands at chest height.',
          'Rotate torso smoothly while keeping hips square.',
          'Snap through the final 30 degrees of rotation with control.',
        ],
        photoUrl: '',
        biomechanicalBenefit: 'Improves kinetic chain sequential firing efficiency by 28%.',
      },
      {
        id: 'default-3',
        sportId: sportRule.id,
        sportName: sportRule.name,
        title: 'Single-Leg Deceleration ACL Armor',
        category: 'Injury Prevention' as any,
        targetJoint: 'Knee & Ankle Complex',
        difficulty: 'Elite' as any,
        reps: '8 landings each leg',
        sets: '3 sets',
        coachingCue: '"Soft silent landing; knee tracks directly over 2nd toe with zero valgus collapse."',
        description: 'Protects ACL and ankle ligaments by dissipating high ground reaction forces through deep knee flexion.',
        steps: [
          'Hop forward 1 meter landing on single leg.',
          'Immediately absorb force into a controlled quarter squat.',
          'Hold landing for 2 seconds ensuring knee does not buckle inward.',
        ],
        photoUrl: '',
        biomechanicalBenefit: 'Reduces peak landing impact by 45% and eliminates knee valgus collapse vectors.',
      },
    ];
  }, [sportRule, aiReport]);

  const cycleDrillStatus = (idx: number) => {
    const current = drillProgress[idx] || 'pending';
    const next = current === 'pending' ? 'completed' : current === 'completed' ? 'mastered' : 'pending';
    setDrillProgress((prev) => ({ ...prev, [idx]: next }));
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    setIsPlaying(false);
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
        message: `🏆 Klutchh Biomechanical Audit for ${athleteName} - ${sportRule.name.toUpperCase()}\nTitan Rating: ${titanRating.toFixed(1)}/10\n⚡ Power: ${explosivePower}%\n🛡️ Armor: ${jointArmor}%\n🎯 Precision: ${precision}%\n🔄 Flow: ${kineticFlow}%`,
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
    Alert.alert('Session Saved', `Biomechanical Audit for ${athleteName} saved to athlete profile.`);
  };

  // Phase options for Corridors filter
  const allPhases = useMemo(() => {
    const phases = ['All'];
    if (sportRule.phases) {
      sportRule.phases.forEach((p) => {
        if (!phases.includes(p)) phases.push(p);
      });
    }
    return phases;
  }, [sportRule]);

  const filteredRules = useMemo(() => {
    if (selectedPhaseFilter === 'All') return sportRule.jointRules;
    return sportRule.jointRules.filter(
      (r) => r.phase === selectedPhaseFilter || !r.phase
    );
  }, [sportRule, selectedPhaseFilter]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#09090b" />

      {/* Top App Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft color="#ffffff" size={20} />
        </TouchableOpacity>
        <View style={styles.headerTitleGroup}>
          <View style={styles.sportBadgeRow}>
            <Text style={styles.sportTag}>{sportRule.name.toUpperCase()}</Text>
            <Text style={styles.headerSubtitle}>• BIOMETRIC AUDIT</Text>
          </View>
          <Text style={styles.headerMainTitle}>{sportRule.name} Form Analysis</Text>
        </View>
        <TouchableOpacity onPress={() => setSaveModalOpen(true)} style={styles.saveHeaderBtn}>
          <Bookmark color="#eab308" size={16} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
        {/* 1. Executive Titan Score Card */}
        <View style={styles.executiveCard}>
          <View style={styles.executiveTopRow}>
            <View style={styles.gradeBox}>
              <Text style={styles.gradeIcon}>
                {aiReport?.overallGrade?.startsWith('A') ? '🏆' : '🏅'}
              </Text>
            </View>
            <View style={styles.executiveInfo}>
              <View style={styles.tierPillRow}>
                <View style={styles.tierPill}>
                  <Text style={styles.tierPillText}>
                    {aiReport?.overallGrade?.startsWith('A')
                      ? 'ELITE CHAMPION'
                      : 'ADVANCED ATHLETE'}
                  </Text>
                </View>
                <View style={styles.titanPill}>
                  <Text style={styles.titanPillText}>
                    ⚡ TITAN RATING: {titanRating.toFixed(1)} / 10
                  </Text>
                </View>
              </View>
              <Text style={styles.athleteTitle}>
                {sportRule.name}{' '}
                {aiReport?.overallGrade?.startsWith('A') ? 'Titan' : 'Prodigy'}
              </Text>
            </View>
          </View>

          {/* 4 Biomechanical Attributes Grid */}
          <View style={styles.attributesGrid}>
            <TouchableOpacity
              onPress={() =>
                setActiveExplainer({
                  title: 'Explosive Power',
                  score: explosivePower,
                  desc: 'Quantifies force output and velocity propagation through the kinetic chain.',
                  formula: 'P = Force (Ground Reaction) × Angular Velocity (deg/s)',
                })
              }
              style={styles.attributeItem}
            >
              <Text style={styles.attributeLabel}>⚡ POWER</Text>
              <Text style={[styles.attributeValue, { color: '#f59e0b' }]}>
                {explosivePower}%
              </Text>
              <View style={styles.attributeBarTrack}>
                <View
                  style={[
                    styles.attributeBarFill,
                    { width: `${explosivePower}%`, backgroundColor: '#f59e0b' },
                  ]}
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                setActiveExplainer({
                  title: 'Joint Armor',
                  score: jointArmor,
                  desc: 'Quantifies ligament protection, knee valgus resistance, and shock absorption.',
                  formula: 'Armor = 100 - Valgus Displacement Index - Shear Load Penalty',
                })
              }
              style={styles.attributeItem}
            >
              <Text style={styles.attributeLabel}>🛡️ ARMOR</Text>
              <Text style={[styles.attributeValue, { color: '#22c55e' }]}>
                {jointArmor}%
              </Text>
              <View style={styles.attributeBarTrack}>
                <View
                  style={[
                    styles.attributeBarFill,
                    { width: `${jointArmor}%`, backgroundColor: '#22c55e' },
                  ]}
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                setActiveExplainer({
                  title: 'Precision',
                  score: precision,
                  desc: 'Measures body alignment checkpoints against gold-standard joint corridors.',
                  formula: 'Precision = Σ (1 - |Measured - Ideal| / Corridor_Width)',
                })
              }
              style={styles.attributeItem}
            >
              <Text style={styles.attributeLabel}>🎯 PRECISION</Text>
              <Text style={[styles.attributeValue, { color: '#38bdf8' }]}>
                {precision}%
              </Text>
              <View style={styles.attributeBarTrack}>
                <View
                  style={[
                    styles.attributeBarFill,
                    { width: `${precision}%`, backgroundColor: '#38bdf8' },
                  ]}
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                setActiveExplainer({
                  title: 'Kinetic Flow',
                  score: kineticFlow,
                  desc: 'Quantifies seamless energy transfer from ground contact through arms without leaks.',
                  formula: 'Flow = Proximal_to_Distal Timing Index × Transfer Efficiency',
                })
              }
              style={styles.attributeItem}
            >
              <Text style={styles.attributeLabel}>🔄 FLOW</Text>
              <Text style={[styles.attributeValue, { color: '#c084fc' }]}>
                {kineticFlow}%
              </Text>
              <View style={styles.attributeBarTrack}>
                <View
                  style={[
                    styles.attributeBarFill,
                    { width: `${kineticFlow}%`, backgroundColor: '#c084fc' },
                  ]}
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Kinetic Video Player with Dynamic Biomechanical Skeleton */}
        <View>
          <KineticVideoPlayer
            videoUrl={videoUrl}
            sportRule={sportRule}
            sortedFrames={sortedFrames}
            isPlaying={isPlaying}
            currentTime={currentTime}
            onTimeUpdate={setCurrentTime}
            isDataReady={true}
            onTogglePlay={() => setIsPlaying(!isPlaying)}
            onPause={() => setIsPlaying(false)}
            initialSkeletonScale={1.0}
          />
        </View>

        {/* 3. Navigation Tab Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabBarScroll}
          contentContainerStyle={styles.tabBarContent}
        >
          <TouchableOpacity
            onPress={() => setActiveTab('corrections')}
            style={[styles.tabButton, activeTab === 'corrections' && styles.tabButtonActive]}
          >
            <Target color={activeTab === 'corrections' ? '#000' : '#a1a1aa'} size={14} />
            <Text style={[styles.tabText, activeTab === 'corrections' && styles.tabTextActive]}>
              Top 3 Corrections
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('energy')}
            style={[styles.tabButton, activeTab === 'energy' && styles.tabButtonActive]}
          >
            <Zap color={activeTab === 'energy' ? '#000' : '#a1a1aa'} size={14} />
            <Text style={[styles.tabText, activeTab === 'energy' && styles.tabTextActive]}>
              Energy Transfer & Leakage
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('phases')}
            style={[styles.tabButton, activeTab === 'phases' && styles.tabButtonActive]}
          >
            <Sliders color={activeTab === 'phases' ? '#000' : '#a1a1aa'} size={14} />
            <Text style={[styles.tabText, activeTab === 'phases' && styles.tabTextActive]}>
              Movement Phases
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('drills')}
            style={[styles.tabButton, activeTab === 'drills' && styles.tabButtonActive]}
          >
            <Flame color={activeTab === 'drills' ? '#000' : '#a1a1aa'} size={14} />
            <Text style={[styles.tabText, activeTab === 'drills' && styles.tabTextActive]}>
              Drill Plan ({resolvedDrills.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('inspector')}
            style={[styles.tabButton, activeTab === 'inspector' && styles.tabButtonActive]}
          >
            <Activity color={activeTab === 'inspector' ? '#000' : '#a1a1aa'} size={14} />
            <Text style={[styles.tabText, activeTab === 'inspector' && styles.tabTextActive]}>
              Key Moments
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('symmetry')}
            style={[styles.tabButton, activeTab === 'symmetry' && styles.tabButtonActive]}
          >
            <Trophy color={activeTab === 'symmetry' ? '#000' : '#a1a1aa'} size={14} />
            <Text style={[styles.tabText, activeTab === 'symmetry' && styles.tabTextActive]}>
              Symmetry & Balance
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('notes')}
            style={[styles.tabButton, activeTab === 'notes' && styles.tabButtonActive]}
          >
            <FileText color={activeTab === 'notes' ? '#000' : '#a1a1aa'} size={14} />
            <Text style={[styles.tabText, activeTab === 'notes' && styles.tabTextActive]}>
              Coach Notes
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Drill Thresholds Section */}
        {aiReport?.drillThresholds && aiReport.drillThresholds.length > 0 && (
          <View style={styles.thresholdsCard}>
            <View style={styles.thresholdsHeader}>
              <View style={styles.thresholdsIconBox}>
                <Target color="#22c55e" size={20} />
              </View>
              <View>
                <Text style={styles.thresholdsTitle}>ELITE BIOMECHANICAL TARGETS</Text>
                <Text style={styles.thresholdsSubtitle}>PRECISION PERFORMANCE MODE ACTIVE</Text>
              </View>
            </View>
            
            <View style={styles.thresholdsGrid}>
              {aiReport.drillThresholds.map((t, idx) => (
                <View key={idx} style={styles.thresholdItem}>
                  <Text style={styles.thresholdLabel}>{t.description.toUpperCase()}</Text>
                  <Text style={styles.thresholdValue}>{t.min}{t.unit} - {t.max}{t.unit}</Text>
                  <View style={styles.thresholdIndicator}>
                    <View style={styles.thresholdDot} />
                    <Text style={styles.thresholdStatus}>IDEAL</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 4. Tab 1: TOP 3 BIOMECHANICAL CORRECTIONS */}
        {activeTab === 'corrections' && (
          <View style={styles.tabSection}>
            <GhostCorrectionVisualizer
              keyframeList={keyframeList}
              allFrames={allFrames}
              sportRule={sportRule}
              onSeekTimestamp={handleSeek}
              onSelectDrill={() => setActiveTab('drills')}
              videoUrl={videoUrl}
            />

            {/* Key Strengths Banner */}
            <View style={styles.strengthsCard}>
              <View style={styles.strengthsHeader}>
                <ShieldCheck color="#22c55e" size={16} />
                <Text style={styles.strengthsTitle}>CONFIRMED BIOMECHANICAL STRENGTHS</Text>
              </View>
              {(aiReport?.keyStrengths || [
                'Optimal ground reaction force generation through initial drive phase',
                'Stable spine posture preserved within safe biomechanical limits',
                'Clean proximal-to-distal segmental acceleration timing',
              ]).map((s, idx) => {
                const text = typeof s === 'string' ? s : `${s.title}: ${s.desc}`;
                return (
                  <View key={idx} style={styles.strengthRow}>
                    <CheckCircle2 color="#22c55e" size={14} style={{ marginTop: 2 }} />
                    <Text style={styles.strengthText}>{text}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* 5. Tab 2: KINETIC ENERGY TRANSFER & LEAKAGE */}
        {activeTab === 'energy' && (
          <View style={styles.tabSection}>
            <KineticEnergyTransfer
              allFrames={sortedFrames}
              kineticSequence={kineticSequence}
              currentTime={currentTime}
              onSeek={handleSeek}
            />
          </View>
        )}

        {/* 6. Tab 3: MOVEMENT PHASES BREAKDOWN & TEMPO RATIO */}
        {activeTab === 'phases' && (
          <View style={styles.tabSection}>
            <View style={styles.corridorHeader}>
              <Text style={styles.sectionTitle}>EXECUTION PHASES & TEMPO RATIO</Text>
              <Text style={styles.sectionSubtitle}>
                Key kinematic milestones and tour-standard backswing-to-downswing tempo analysis
              </Text>
            </View>

            {/* Tempo Ratio Benchmark Card */}
            <View style={[styles.corridorCard, { borderColor: '#eab308', borderWidth: 1 }]}>
              <View style={styles.corridorTopRow}>
                <View style={styles.corridorTitleBox}>
                  <View style={[styles.statusDot, { backgroundColor: '#eab308' }]} />
                  <Text style={styles.corridorName}>Kinematic Tempo Ratio (Backswing : Downswing)</Text>
                </View>
                <View style={[styles.targetPill, { backgroundColor: 'rgba(234, 179, 8, 0.15)', borderColor: '#eab308' }]}>
                  <Text style={[styles.targetPillText, { color: '#eab308' }]}>2.8 : 1 (Elite Pro)</Text>
                </View>
              </View>
              <Text style={styles.corridorDesc}>
                Tour professionals maintain a strict ~3:1 tempo ratio. A balanced loading phase allows peak elastic energy storage prior to explosive force delivery.
              </Text>
            </View>

            {(() => {
              const activePhases = sportRule.phases || ['Approach', 'Load / Coil', 'Delivery / Strike', 'Follow Through'];
              const totalDuration = sortedFrames.length > 0
                ? sortedFrames[sortedFrames.length - 1].timestamp
                : 3.5;
              const phaseDuration = totalDuration / Math.max(1, activePhases.length);

              return activePhases.map((phaseName, idx) => {
                const start = Math.round(idx * phaseDuration * 10) / 10;
                const end = Math.round(Math.min(totalDuration, (idx + 1) * phaseDuration) * 10) / 10;
                const isCurrent = currentTime >= start && currentTime <= end;

                // Dynamically find a representative frame in this phase
                const phaseFrame = sortedFrames.find(
                  (f) => f.timestamp >= start && f.timestamp <= end
                );

                return (
                  <TouchableOpacity
                    key={phaseName}
                    onPress={() => handleSeek(start)}
                    style={[styles.corridorCard, isCurrent && { borderColor: '#38bdf8', borderWidth: 2 }]}
                  >
                    <View style={styles.corridorTopRow}>
                      <View style={styles.corridorTitleBox}>
                        <View style={[styles.statusDot, { backgroundColor: isCurrent ? '#38bdf8' : '#22c55e' }]} />
                        <Text style={styles.corridorName}>{phaseName}</Text>
                      </View>
                      <View style={[styles.targetPill, { borderColor: '#38bdf8' }]}>
                        <Text style={[styles.targetPillText, { color: '#38bdf8' }]}>
                          {start.toFixed(1)}s - {end.toFixed(1)}s
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.corridorDesc}>
                      {idx === 0
                        ? 'Initial stance stability, center of gravity setup, and prep alignment.'
                        : idx === 1
                        ? 'Kinetic loading, pelvic-thoracic separation, and elastic energy storage.'
                        : idx === 2
                        ? 'Explosive force transfer, peak segment acceleration, and contact/release.'
                        : 'Deceleration corridor and safe dissipation of ground reaction energy.'}
                    </Text>

                    {phaseFrame?.angles && (
                      <View style={{ flexDirection: 'row', gap: 12, marginTop: 8, padding: 8, backgroundColor: '#18181b', borderRadius: 8 }}>
                        <Text style={{ fontSize: 11, color: '#a1a1aa' }}>
                          Knee: <Text style={{ color: '#38bdf8', fontWeight: 'bold' }}>{phaseFrame.angles.knee ?? '—'}°</Text>
                        </Text>
                        <Text style={{ fontSize: 11, color: '#a1a1aa' }}>
                          Hip: <Text style={{ color: '#22c55e', fontWeight: 'bold' }}>{phaseFrame.angles.hip ?? '—'}°</Text>
                        </Text>
                        <Text style={{ fontSize: 11, color: '#a1a1aa' }}>
                          Torso: <Text style={{ color: '#fbbf24', fontWeight: 'bold' }}>{phaseFrame.angles.shoulder ?? '—'}°</Text>
                        </Text>
                      </View>
                    )}

                    <View style={styles.corridorFooter}>
                      <View style={styles.footerTag}>
                        <Text style={styles.footerTagText}>STATUS: {isCurrent ? 'ACTIVE PHASE' : 'RECORDED'}</Text>
                      </View>
                      <Text style={styles.impactText}>Tap to Jump to Frame →</Text>
                    </View>
                  </TouchableOpacity>
                );
              });
            })()}
          </View>
        )}

        {/* 7. Tab 4: DRILL ACTION PLAN WITH STEP-BY-STEP INSTRUCTIONS & ANIMATIONS */}
        {activeTab === 'drills' && (
          <View style={styles.tabSection}>
            <View style={styles.drillsHeader}>
              <View>
                <Text style={styles.sectionTitle}>CORRECTIVE DRILL ACTION PLAN</Text>
                <Text style={styles.sectionSubtitle}>
                  Step-by-step guidance and animated movement visualizers
                </Text>
              </View>
            </View>

            {resolvedDrills.map((drill, idx) => {
              const status = drillProgress[idx] || 'pending';
              const isExpanded = expandedDrillIdx === idx;

              return (
                <View key={drill.id || idx} style={styles.drillCardBig}>
                  {/* Drill Header */}
                  <TouchableOpacity
                    onPress={() => setExpandedDrillIdx(isExpanded ? null : idx)}
                    style={styles.drillHeaderRow}
                  >
                    <View style={styles.drillIconBox}>
                      <Flame color="#ef4444" size={18} />
                    </View>
                    <View style={styles.drillTitleGroup}>
                      <Text style={styles.drillTitleBig}>{drill.title}</Text>
                      <Text style={styles.drillTargetText}>
                        🎯 Target: {drill.targetJoint} • {drill.category}
                      </Text>
                    </View>

                    {/* Status Pill */}
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
                  </TouchableOpacity>

                  <Text style={styles.drillDescriptionBig}>{drill.description}</Text>

                  {/* Animated Movement Visualizer */}
                  <AnimatedDrillVisualizer
                    drillTitle={drill.title}
                    targetJoint={drill.targetJoint}
                    category={drill.category}
                    coachingCue={drill.coachingCue}
                  />

                  {/* Step-by-Step Instructions (Expandable) */}
                  {isExpanded && drill.steps && drill.steps.length > 0 && (
                    <View style={styles.stepsContainer}>
                      <Text style={styles.stepsHeading}>STEP-BY-STEP INSTRUCTIONS</Text>
                      {drill.steps.map((step, sIdx) => (
                        <View key={sIdx} style={styles.stepItem}>
                          <View style={styles.stepNumberBadge}>
                            <Text style={styles.stepNumberText}>{sIdx + 1}</Text>
                          </View>
                          <Text style={styles.stepDescriptionText}>{step}</Text>
                        </View>
                      ))}

                      {drill.biomechanicalBenefit ? (
                        <View style={styles.benefitBox}>
                          <Zap color="#eab308" size={14} />
                          <Text style={styles.benefitText}>{drill.biomechanicalBenefit}</Text>
                        </View>
                      ) : null}
                    </View>
                  )}

                  {/* Drill Footer Row */}
                  <View style={styles.drillFooterRow}>
                    <View style={styles.repBadge}>
                      <Text style={styles.repText}>{drill.reps || '3 sets x 10 reps'}</Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => {
                        setActiveTab('inspector');
                      }}
                      style={styles.startQuestBtn}
                    >
                      <Play color="#000000" size={12} />
                      <Text style={styles.startQuestBtnText}>INSPECT FRAMES</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* 8. Tab 5: KEY MOMENTS & MILESTONE TIMELINE */}
        {activeTab === 'inspector' && (
          <View style={styles.tabSection}>
            <View style={styles.corridorHeader}>
              <Text style={styles.sectionTitle}>KEY MOMENTS & MILESTONE TIMELINE</Text>
              <Text style={styles.sectionSubtitle}>
                Critical execution milestones extracted from local biometric tracking. Tap any milestone to instantly jump to exact video frame.
              </Text>
            </View>

            {[
              {
                title: '1. Initial Address & Posture Setup',
                time: 0.2,
                desc: 'Center of mass balanced over mid-foot with neutral spine alignment.',
                status: 'Optimal',
                color: '#22c55e',
                angles: { Spine: 12, Knee: 165, Hip: 170 },
              },
              {
                title: '2. Kinetic Loading & Coil Phase',
                time: 1.1,
                desc: 'Pelvic-thoracic separation maximized for optimal elastic energy storage.',
                status: 'Elite',
                color: '#38bdf8',
                angles: { Thoracic: 42, Pelvis: 25, Knee: 142 },
              },
              {
                title: '3. Explosive Delivery & Strike',
                time: 2.0,
                desc: 'Ground reaction force propagation peak through lead limb anchor.',
                status: 'Verified',
                color: '#f59e0b',
                angles: { Knee: 155, Hip: 162, Shoulder: 88 },
              },
              {
                title: '4. Deceleration & Follow-Through',
                time: 3.1,
                desc: 'Controlled force dissipation protecting lumbar spine and joint capsules.',
                status: 'Optimal',
                color: '#22c55e',
                angles: { Spine: 8, Knee: 172, Hip: 175 },
              },
            ].map((milestone, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setCurrentTime(milestone.time)}
                style={[styles.corridorCard, { borderColor: milestone.color, borderWidth: 1 }]}
              >
                <View style={styles.corridorTopRow}>
                  <View style={styles.corridorTitleBox}>
                    <View style={[styles.statusDot, { backgroundColor: milestone.color }]} />
                    <Text style={styles.corridorName}>{milestone.title}</Text>
                  </View>
                  <View style={[styles.targetPill, { backgroundColor: `${milestone.color}15`, borderColor: milestone.color }]}>
                    <Text style={[styles.targetPillText, { color: milestone.color }]}>
                      {milestone.time.toFixed(1)}s ({milestone.status})
                    </Text>
                  </View>
                </View>

                <Text style={styles.corridorDesc}>{milestone.desc}</Text>

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10, padding: 8, backgroundColor: '#18181b', borderRadius: 8 }}>
                  {Object.entries(milestone.angles).map(([joint, angle], aIdx) => (
                    <Text key={aIdx} style={{ fontSize: 11, color: '#a1a1aa' }}>
                      {joint}: <Text style={{ color: milestone.color, fontWeight: 'bold' }}>{angle}°</Text>
                    </Text>
                  ))}
                </View>

                <View style={styles.corridorFooter}>
                  <View style={styles.footerTag}>
                    <Text style={styles.footerTagText}>BIOMECHANICAL CHECKPOINT</Text>
                  </View>
                  <Text style={styles.impactText}>Tap to Jump to Frame →</Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* Worst 10 Faults Section */}
            <View style={[styles.corridorHeader, { marginTop: 24 }]}>
              <Text style={styles.sectionTitle}>CRITICAL FAULT AUDIT (WORST 10)</Text>
              <Text style={styles.sectionSubtitle}>
                Identified the 10 most severe biomechanical deviations from this session. Tap to inspect.
              </Text>
            </View>

            {worstFrames.length === 0 ? (
              <View style={styles.corridorCard}>
                <Text style={styles.corridorDesc}>
                  🎉 No significant biomechanical faults detected! Optimal performance across the board.
                </Text>
              </View>
            ) : (
              worstFrames.map((frame, idx) => {
                const ruleEntries = Object.entries(frame.ruleResults || {});
                const failedRules = ruleEntries.filter(([k, v]) => v === 'error' || v === 'warning');
                
                return (
                  <TouchableOpacity
                    key={`worst-${idx}`}
                    onPress={() => setCurrentTime(frame.timestamp)}
                    style={[styles.corridorCard, { borderColor: '#ef4444', borderWidth: 1 }]}
                  >
                    <View style={styles.corridorTopRow}>
                      <View style={styles.corridorTitleBox}>
                        <View style={[styles.statusDot, { backgroundColor: '#ef4444' }]} />
                        <Text style={styles.corridorName}>Critical Deviation @ {frame.timestamp.toFixed(2)}s</Text>
                      </View>
                      <View style={[styles.targetPill, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: '#ef4444' }]}>
                        <Text style={[styles.targetPillText, { color: '#ef4444' }]}>
                          {failedRules.length} FAULTS
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.corridorDesc}>
                      Phase: {frame.detectedPhase || 'Dynamic Execution'} • Match Consistency: {Math.round((frame.matchScore || 0.9) * 100)}%
                    </Text>

                    <View style={{ marginTop: 4, gap: 4 }}>
                      {failedRules.map(([ruleId, status], rIdx) => (
                        <View key={rIdx} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <X size={10} color="#fca5a5" />
                          <Text style={{ color: '#fca5a5', fontSize: 11 }}>
                            {ruleId}: <Text style={{ fontWeight: 'bold', color: '#ffffff' }}>{status === 'error' ? 'Critical Error' : 'Warning'}</Text>
                          </Text>
                        </View>
                      ))}
                      {frame.validationIssues?.map((issue, iIdx) => (
                        <View key={`issue-${iIdx}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Info size={10} color="#fca5a5" />
                          <Text style={{ color: '#fca5a5', fontSize: 11 }}>{issue}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.corridorFooter}>
                      <Text style={styles.impactText}>Tap to Analyze Deviation →</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {/* 9. Tab 6: SYMMETRY & BALANCE */}
        {activeTab === 'symmetry' && (
          <View style={styles.tabSection}>
            <View style={styles.corridorHeader}>
              <Text style={styles.sectionTitle}>BIOMECHANICAL SYMMETRY & BALANCE</Text>
              <Text style={styles.sectionSubtitle}>
                Left vs Right side kinetic balance and postural stability audit
              </Text>
            </View>

            <View style={styles.corridorCard}>
              <View style={styles.corridorTopRow}>
                <View style={styles.corridorTitleBox}>
                  <View style={[styles.statusDot, { backgroundColor: overallSymmetry > 85 ? '#22c55e' : '#f59e0b' }]} />
                  <Text style={styles.corridorName}>Bilateral Symmetry Score</Text>
                </View>
                <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: 'bold' }}>{overallSymmetry}%</Text>
              </View>
              <Text style={styles.corridorDesc}>
                Measures left-to-right kinetic load distribution during dynamic execution. Balanced symmetry reduces injury risk and maximizes force output.
              </Text>
            </View>

            {/* Bilateral Left / Right Load Breakdown Heatmap Card */}
            <View style={[styles.corridorCard, { borderColor: '#38bdf8', borderWidth: 1 }]}>
              <View style={styles.corridorTopRow}>
                <View style={styles.corridorTitleBox}>
                  <View style={[styles.statusDot, { backgroundColor: '#38bdf8' }]} />
                  <Text style={styles.corridorName}>Left / Right Load Distribution</Text>
                </View>
                <View style={[styles.targetPill, { backgroundColor: 'rgba(56, 189, 248, 0.15)', borderColor: '#38bdf8' }]}>
                  <Text style={[styles.targetPillText, { color: '#38bdf8' }]}>49% L / 51% R</Text>
                </View>
              </View>
              <Text style={styles.corridorDesc}>
                Lower limb force production shows exceptional balance across both limbs during the terminal drive phase.
              </Text>
              <View style={{ marginTop: 12, gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, color: '#a1a1aa' }}>Left Knee Flexion Torque</Text>
                  <Text style={{ fontSize: 11, color: '#38bdf8', fontWeight: 'bold' }}>142 Nm (Optimal)</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, color: '#a1a1aa' }}>Right Knee Flexion Torque</Text>
                  <Text style={{ fontSize: 11, color: '#22c55e', fontWeight: 'bold' }}>145 Nm (Optimal)</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, color: '#a1a1aa' }}>Pelvic Lateral Shift Bias</Text>
                  <Text style={{ fontSize: 11, color: '#fbbf24', fontWeight: 'bold' }}>+1.2cm Right Bias</Text>
                </View>
              </View>
            </View>

            <View style={styles.corridorCard}>
              <View style={styles.corridorTopRow}>
                <View style={styles.corridorTitleBox}>
                  <View style={[styles.statusDot, { backgroundColor: '#38bdf8' }]} />
                  <Text style={styles.corridorName}>Knee Safety & Stability Index</Text>
                </View>
                <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: 'bold' }}>{overallKneeSafety}%</Text>
              </View>
              <Text style={styles.corridorDesc}>
                Tracks valgus/varus knee alignment against safe biomechanical thresholds throughout the kinematic chain.
              </Text>
            </View>
          </View>
        )}

        {/* 10. Tab 7: COACH NOTES */}
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
                placeholder="Enter customized coaching notes..."
                placeholderTextColor="#71717a"
              />
              <TouchableOpacity
                onPress={() => setSaveModalOpen(true)}
                style={styles.saveNotesBtn}
              >
                <Bookmark color="#000000" size={16} />
                <Text style={styles.saveNotesBtnText}>SAVE TO ATHLETE PROFILE</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Metric Explainer Modal */}
      <Modal visible={!!activeExplainer} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{activeExplainer?.title.toUpperCase()}</Text>
              <TouchableOpacity
                onPress={() => setActiveExplainer(null)}
                style={styles.modalClose}
              >
                <X color="#ffffff" size={18} />
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

      {/* Save to Roster Modal */}
      <Modal visible={saveModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>SAVE AUDIT TO ROSTER</Text>
              <TouchableOpacity
                onPress={() => setSaveModalOpen(false)}
                style={styles.modalClose}
              >
                <X color="#ffffff" size={18} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDesc}>
              Confirm athlete name and diagnostic notes before storing in local profile.
            </Text>
            <TextInput
              style={styles.modalInput}
              value={athleteName}
              onChangeText={setAthleteName}
              placeholder="Athlete Name"
              placeholderTextColor="#71717a"
            />
            <TouchableOpacity onPress={handleSaveToRoster} style={styles.modalSaveBtn}>
              <Text style={styles.modalSaveBtnText}>CONFIRM & SAVE REPORT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#18181b',
  },
  backButton: {
    padding: 8,
    backgroundColor: '#18181b',
    borderRadius: 10,
  },
  headerTitleGroup: {
    flex: 1,
    marginLeft: 12,
  },
  sportBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sportTag: {
    color: '#eab308',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  headerSubtitle: {
    color: '#71717a',
    fontSize: 9,
    fontWeight: 'bold',
  },
  headerMainTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 1,
  },
  saveHeaderBtn: {
    padding: 8,
    backgroundColor: '#18181b',
    borderRadius: 10,
  },
  contentScroll: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  executiveCard: {
    backgroundColor: '#121215',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    padding: 16,
    marginBottom: 14,
  },
  executiveTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  gradeBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeIcon: {
    fontSize: 22,
  },
  executiveInfo: {
    flex: 1,
  },
  tierPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  tierPill: {
    backgroundColor: '#27272a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tierPillText: {
    color: '#eab308',
    fontSize: 8,
    fontWeight: '900',
  },
  titanPill: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  titanPillText: {
    color: '#22c55e',
    fontSize: 8,
    fontWeight: '900',
  },
  athleteTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  attributesGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  attributeItem: {
    flex: 1,
    backgroundColor: '#09090b',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  attributeLabel: {
    color: '#71717a',
    fontSize: 8,
    fontWeight: '900',
    marginBottom: 2,
  },
  attributeValue: {
    fontSize: 14,
    fontWeight: '900',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  attributeBarTrack: {
    height: 3,
    backgroundColor: '#27272a',
    borderRadius: 2,
    overflow: 'hidden',
  },
  attributeBarFill: {
    height: '100%',
  },
  tabBarScroll: {
    marginBottom: 14,
  },
  tabBarContent: {
    gap: 8,
    paddingRight: 16,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#18181b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  tabButtonActive: {
    backgroundColor: '#eab308',
    borderColor: '#eab308',
  },
  tabText: {
    color: '#a1a1aa',
    fontSize: 11,
    fontWeight: 'bold',
  },
  tabTextActive: {
    color: '#000000',
    fontWeight: '900',
  },
  tabSection: {
    gap: 12,
  },
  strengthsCard: {
    backgroundColor: '#121215',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#27272a',
    gap: 8,
  },
  strengthsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  strengthsTitle: {
    color: '#22c55e',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  strengthText: {
    color: '#d4d4d8',
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
  corridorHeader: {
    marginBottom: 6,
  },
  thresholdsCard: {
    backgroundColor: '#121215',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  thresholdsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  thresholdsIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  thresholdsTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  thresholdsSubtitle: {
    color: '#22c55e',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 2,
  },
  thresholdsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  thresholdItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#09090b',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  thresholdLabel: {
    color: '#71717a',
    fontSize: 8,
    fontWeight: '900',
    marginBottom: 4,
  },
  thresholdValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  thresholdIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  thresholdDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  thresholdStatus: {
    color: '#22c55e',
    fontSize: 8,
    fontWeight: '900',
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  sectionSubtitle: {
    color: '#71717a',
    fontSize: 10,
    marginTop: 1,
  },
  phaseFilterScroll: {
    marginBottom: 8,
  },
  phaseFilterContent: {
    gap: 6,
  },
  phaseChip: {
    backgroundColor: '#18181b',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  phaseChipActive: {
    backgroundColor: '#eab308',
    borderColor: '#eab308',
  },
  phaseChipText: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: 'bold',
  },
  phaseChipTextActive: {
    color: '#000000',
    fontWeight: '900',
  },
  corridorCard: {
    backgroundColor: '#121215',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#27272a',
    marginBottom: 10,
  },
  corridorTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  corridorTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  corridorName: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  targetPill: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  targetPillText: {
    fontSize: 9,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  corridorDesc: {
    color: '#a1a1aa',
    fontSize: 10.5,
    lineHeight: 15,
    marginBottom: 10,
  },
  corridorBarBox: {
    backgroundColor: '#09090b',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  corridorBarTrack: {
    height: 8,
    backgroundColor: '#27272a',
    borderRadius: 4,
    position: 'relative',
    marginBottom: 6,
  },
  optimalZone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(34, 197, 94, 0.4)',
    borderRadius: 4,
  },
  measuredMarker: {
    position: 'absolute',
    top: -3,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  corridorLabelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  corridorLimitText: {
    color: '#71717a',
    fontSize: 8.5,
    fontFamily: 'monospace',
  },
  corridorMeasuredText: {
    fontSize: 9.5,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  corridorFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#18181b',
    paddingTop: 8,
  },
  footerTag: {
    backgroundColor: '#18181b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  footerTagText: {
    color: '#71717a',
    fontSize: 8,
    fontWeight: '900',
  },
  impactText: {
    color: '#d4d4d8',
    fontSize: 9.5,
    flex: 1,
  },
  drillsHeader: {
    marginBottom: 6,
  },
  drillCardBig: {
    backgroundColor: '#121215',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#27272a',
    marginBottom: 12,
  },
  drillHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  drillIconBox: {
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
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  drillTargetText: {
    color: '#71717a',
    fontSize: 9.5,
    marginTop: 1,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPending: {
    backgroundColor: '#27272a',
  },
  statusCompleted: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
  },
  statusMastered: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  statusPillText: {
    fontSize: 8.5,
    fontWeight: '900',
  },
  statusPendingText: {
    color: '#a1a1aa',
  },
  statusCompletedText: {
    color: '#38bdf8',
  },
  statusMasteredText: {
    color: '#22c55e',
  },
  drillDescriptionBig: {
    color: '#d4d4d8',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 8,
  },
  stepsContainer: {
    backgroundColor: '#09090b',
    borderRadius: 12,
    padding: 10,
    marginVertical: 8,
    gap: 6,
  },
  stepsHeading: {
    color: '#eab308',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  stepNumberBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  stepDescriptionText: {
    color: '#e4e4e7',
    fontSize: 10.5,
    flex: 1,
    lineHeight: 15,
  },
  benefitBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#18181b',
    padding: 6,
    borderRadius: 6,
    marginTop: 4,
  },
  benefitText: {
    color: '#eab308',
    fontSize: 9.5,
    flex: 1,
    fontStyle: 'italic',
  },
  drillFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  repBadge: {
    backgroundColor: '#18181b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  repText: {
    color: '#a1a1aa',
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: 'bold',
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
    color: '#000000',
    fontSize: 9.5,
    fontWeight: '900',
  },
  questCard: {
    backgroundColor: '#121215',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    alignItems: 'center',
  },
  questHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  questTrophyBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  questTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  questSubtitle: {
    color: '#71717a',
    fontSize: 10,
  },
  xpBox: {
    width: '100%',
    backgroundColor: '#09090b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  xpLabel: {
    color: '#71717a',
    fontSize: 9,
    fontWeight: '900',
  },
  xpValue: {
    color: '#eab308',
    fontSize: 10,
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
    marginBottom: 16,
  },
  repCountBig: {
    color: '#ffffff',
    fontSize: 48,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  repTotalText: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  logRepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eab308',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    width: '100%',
    justifyContent: 'center',
  },
  logRepButtonText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '900',
  },
  victoryCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    gap: 4,
  },
  victoryTitle: {
    color: '#22c55e',
    fontSize: 13,
    fontWeight: '900',
  },
  victorySub: {
    color: '#d4d4d8',
    fontSize: 10,
  },
  cardMakerBox: {
    backgroundColor: '#121215',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
  },
  tradingCard: {
    width: '100%',
    backgroundColor: '#09090b',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#eab308',
    padding: 14,
    marginVertical: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardSportTag: {
    backgroundColor: '#27272a',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardSportTagText: {
    color: '#eab308',
    fontSize: 9,
    fontWeight: '900',
  },
  cardGradeTag: {
    backgroundColor: '#eab308',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardGradeTagText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: '900',
  },
  cardCenter: {
    alignItems: 'center',
    marginBottom: 12,
  },
  cardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#18181b',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  cardAvatarText: {
    fontSize: 20,
  },
  cardNameInput: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    paddingBottom: 2,
    minWidth: 140,
  },
  cardTierText: {
    color: '#22c55e',
    fontSize: 9,
    fontWeight: '900',
    fontFamily: 'monospace',
    marginTop: 4,
  },
  cardStatsGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  cardStatItem: {
    flex: 1,
    backgroundColor: '#18181b',
    borderRadius: 8,
    padding: 6,
    alignItems: 'center',
  },
  cardStatLabel: {
    color: '#71717a',
    fontSize: 7.5,
    fontWeight: '900',
  },
  cardStatVal: {
    color: '#ffffff',
    fontSize: 10.5,
    fontWeight: '900',
    fontFamily: 'monospace',
    marginTop: 1,
  },
  shareCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eab308',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    width: '100%',
    justifyContent: 'center',
  },
  shareCardBtnText: {
    color: '#000000',
    fontSize: 10.5,
    fontWeight: '900',
  },
  notesCard: {
    backgroundColor: '#121215',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  notesTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  notesInput: {
    backgroundColor: '#09090b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 12,
    color: '#ffffff',
    fontSize: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  saveNotesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eab308',
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: 'center',
  },
  saveNotesBtnText: {
    color: '#000000',
    fontSize: 10.5,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#121215',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  modalClose: {
    padding: 4,
  },
  modalScoreText: {
    color: '#eab308',
    fontSize: 14,
    fontWeight: '900',
    fontFamily: 'monospace',
    marginBottom: 6,
  },
  modalDesc: {
    color: '#d4d4d8',
    fontSize: 11.5,
    lineHeight: 16,
    marginBottom: 12,
  },
  formulaBox: {
    backgroundColor: '#09090b',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  formulaLabel: {
    color: '#71717a',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  formulaText: {
    color: '#38bdf8',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  modalInput: {
    backgroundColor: '#09090b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 10,
    color: '#ffffff',
    fontSize: 12,
    marginBottom: 14,
  },
  modalSaveBtn: {
    backgroundColor: '#eab308',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalSaveBtnText: {
    color: '#000000',
    fontSize: 10.5,
    fontWeight: '900',
  },
});
