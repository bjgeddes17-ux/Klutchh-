import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  StatusBar,
} from 'react-native';
import {
  Flame,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Award,
  CheckCircle2,
  Shield,
  Plus,
  Minus,
  Target,
  Dumbbell,
  Clock,
  Sparkles,
  ChevronRight,
  X,
  Check,
  AlertTriangle,
  Layers,
  Activity,
  Compass,
} from 'lucide-react-native';
import Svg, { Circle, Text as SvgText, G } from 'react-native-svg';
import { DrillItem } from '../../data/drillLibrary';

interface DrillsTabNativeProps {
  drills: DrillItem[];
  drillStatuses: Record<number, 'pending' | 'completed' | 'mastered'>;
  onCycleStatus: (index: number) => void;
  onInspectFrames: () => void;
}

export const DrillsTabNative: React.FC<DrillsTabNativeProps> = ({
  drills,
  drillStatuses,
  onCycleStatus,
  onInspectFrames,
}) => {
  const [expandedDrillIdx, setExpandedDrillIdx] = useState<number | null>(0);
  const [repCounts, setRepCounts] = useState<Record<number, number>>({ 0: 10, 1: 8, 2: 12 });
  const [completedSets, setCompletedSets] = useState<Record<number, boolean[]>>({
    0: [true, true, false],
    1: [true, false, false],
    2: [false, false, false],
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Guided Practice Modal State
  const [practiceModalDrill, setPracticeModalDrill] = useState<DrillItem | null>(null);
  const [practiceDrillIdx, setPracticeDrillIdx] = useState<number>(0);
  const [timerSec, setTimerSec] = useState<number>(45);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSec > 0) {
      interval = setInterval(() => {
        setTimerSec((prev) => prev - 1);
      }, 1000);
    } else if (timerSec === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSec]);

  const categories = ['ALL', 'MOBILITY', 'KINETIC CHAIN', 'STRENGTH & POWER', 'STABILITY', 'INJURY PREVENTION'];

  const filteredDrills = drills.filter((d) => {
    if (selectedCategory === 'ALL') return true;
    return d.category?.toUpperCase() === selectedCategory;
  });

  const completedCount = Object.values(drillStatuses).filter((s) => s === 'completed').length;
  const masteredCount = Object.values(drillStatuses).filter((s) => s === 'mastered').length;
  const totalDrills = drills.length || 3;
  const totalXp = masteredCount * 250 + completedCount * 100 + 150;

  // Donut Ring SVG Math
  const ringSize = 92;
  const strokeWidth = 10;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressPct = Math.min(100, Math.max(0, ((masteredCount + completedCount * 0.5) / totalDrills) * 100));
  const strokeDashoffset = circumference - (progressPct / 100) * circumference;

  const updateReps = (idx: number, delta: number) => {
    setRepCounts((prev) => ({
      ...prev,
      [idx]: Math.max(0, (prev[idx] || 0) + delta),
    }));
  };

  const toggleSetComplete = (drillIdx: number, setIdx: number) => {
    setCompletedSets((prev) => {
      const current = prev[drillIdx] || [false, false, false];
      const updated = [...current];
      updated[setIdx] = !updated[setIdx];
      return { ...prev, [drillIdx]: updated };
    });
  };

  const startPracticeSession = (drill: DrillItem, idx: number) => {
    setPracticeModalDrill(drill);
    setPracticeDrillIdx(idx);
    setTimerSec(45);
    setIsTimerRunning(true);
  };

  return (
    <View style={styles.container}>
      {/* Biomechanical Mastery Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryLeft}>
          <View style={styles.summaryBadge}>
            <Award color="#eab308" size={14} />
            <Text style={styles.summaryBadgeText}>ATHLETE CORRECTIVE MATRIX</Text>
          </View>
          <Text style={styles.summaryTitle}>Prescription Action Plan</Text>
          <Text style={styles.summarySubtitle}>
            Targeted neuro-muscular drills designed to resolve kinetic leaks and elevate athletic power output.
          </Text>

          <View style={styles.xpRow}>
            <View style={styles.xpPill}>
              <Zap color="#eab308" size={12} />
              <Text style={styles.xpText}>+{totalXp} XP EARNED</Text>
            </View>
            <View style={styles.masteryPill}>
              <CheckCircle2 color="#22c55e" size={12} />
              <Text style={styles.statText}>
                {masteredCount}/{totalDrills} MASTERED
              </Text>
            </View>
          </View>
        </View>

        {/* SVG Progress Ring */}
        <View style={styles.ringBox}>
          <Svg width={ringSize} height={ringSize}>
            <G rotation="-90" origin={`${ringSize / 2}, ${ringSize / 2}`}>
              <Circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                stroke="#1f1f23"
                strokeWidth={strokeWidth}
                fill="none"
              />
              <Circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                stroke="#eab308"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
              />
            </G>
            <SvgText
              x={ringSize / 2}
              y={ringSize / 2 + 4}
              fill="#ffffff"
              fontSize="16"
              fontWeight="900"
              textAnchor="middle"
            >
              {Math.round(progressPct)}%
            </SvgText>
          </Svg>
        </View>
      </View>

      {/* Category Filter Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              style={[styles.categoryPill, isActive && styles.categoryPillActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.categoryPillText, isActive && styles.categoryPillTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Section Header */}
      <View style={styles.drillsHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Sparkles color="#eab308" size={14} />
          <Text style={styles.sectionTitle}>CORRECTIVE PRESCRIPTION DRILLS ({filteredDrills.length})</Text>
        </View>
        <Text style={styles.sectionSubtitle}>
          Perform specified sets to lock in motor patterns and resolve mechanical weaknesses.
        </Text>
      </View>

      {/* Drill Cards */}
      {filteredDrills.map((drill, idx) => {
        const origIdx = drills.findIndex((d) => d.id === drill.id) >= 0 ? drills.findIndex((d) => d.id === drill.id) : idx;
        const isExpanded = expandedDrillIdx === origIdx;
        const status = drillStatuses[origIdx] || 'pending';
        const currentReps = repCounts[origIdx] || 10;
        const setsStatus = completedSets[origIdx] || [false, false, false];

        return (
          <View key={drill.id || idx} style={styles.drillCardBig}>
            {/* Cover Image & Category Header Banner */}
            {drill.photoUrl ? (
              <View style={styles.photoContainer}>
                <Image source={{ uri: drill.photoUrl }} style={styles.coverImage} resizeMode="cover" />
                <View style={styles.photoOverlay} />
                <View style={styles.photoHeaderRow}>
                  <View style={styles.badgeGroup}>
                    <View style={styles.categoryTag}>
                      <Flame color="#ef4444" size={11} />
                      <Text style={styles.categoryTagText}>{drill.category.toUpperCase()}</Text>
                    </View>
                    <View style={styles.difficultyTag}>
                      <Text style={styles.difficultyTagText}>{drill.difficulty.toUpperCase()}</Text>
                    </View>
                  </View>

                  {/* Status Toggle Button */}
                  <TouchableOpacity
                    onPress={() => onCycleStatus(origIdx)}
                    style={[
                      styles.statusPill,
                      status === 'mastered'
                        ? styles.statusMastered
                        : status === 'completed'
                        ? styles.statusCompleted
                        : styles.statusPending,
                    ]}
                    activeOpacity={0.7}
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
                      {status === 'mastered' ? '🏆 MASTERED' : status === 'completed' ? '✓ COMPLETED' : '⏳ PENDING'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Cover Title Overlay */}
                <View style={styles.photoTitleContainer}>
                  <Text style={styles.coverTitle}>{drill.title}</Text>
                  <Text style={styles.coverTargetText}>
                    🎯 Target: <Text style={{ color: '#fff', fontWeight: 'bold' }}>{drill.targetJoint}</Text> • {drill.reps}
                  </Text>
                </View>
              </View>
            ) : (
              /* Fallback Header if no photoUrl */
              <View style={styles.drillHeaderNoPhoto}>
                <View style={styles.drillTitleGroup}>
                  <View style={styles.badgeGroup}>
                    <View style={styles.categoryTag}>
                      <Flame color="#ef4444" size={11} />
                      <Text style={styles.categoryTagText}>{drill.category.toUpperCase()}</Text>
                    </View>
                    <View style={styles.difficultyTag}>
                      <Text style={styles.difficultyTagText}>{drill.difficulty.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.drillTitleBig}>{drill.title}</Text>
                  <Text style={styles.drillTargetText}>
                    🎯 Target: {drill.targetJoint} • {drill.reps}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => onCycleStatus(origIdx)}
                  style={[
                    styles.statusPill,
                    status === 'mastered'
                      ? styles.statusMastered
                      : status === 'completed'
                      ? styles.statusCompleted
                      : styles.statusPending,
                  ]}
                  activeOpacity={0.7}
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
                    {status === 'mastered' ? '🏆 MASTERED' : status === 'completed' ? '✓ COMPLETED' : '⏳ PENDING'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Drill Core Description */}
            <View style={styles.cardContentPadding}>
              <Text style={styles.drillDescriptionBig}>{drill.description}</Text>

              {/* Coaching Directive Box */}
              {drill.coachingCue && (
                <View style={styles.cueBox}>
                  <View style={styles.cueHeader}>
                    <Zap color="#eab308" size={13} />
                    <Text style={styles.cueLabel}>EXPERT COACHING DIRECTIVE</Text>
                  </View>
                  <Text style={styles.cueText}>{drill.coachingCue}</Text>
                </View>
              )}

              {/* Anatomical Target & Angle Corridor Banner */}
              <View style={styles.metricsGrid}>
                {drill.targetAngleRule && (
                  <View style={styles.metricItem}>
                    <Compass color="#38bdf8" size={13} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.metricLabel}>TARGET ANGLE RULE</Text>
                      <Text style={styles.metricVal}>{drill.targetAngleRule}</Text>
                    </View>
                  </View>
                )}

                {drill.equipment && (
                  <View style={styles.metricItem}>
                    <Dumbbell color="#a855f7" size={13} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.metricLabel}>EQUIPMENT</Text>
                      <Text style={styles.metricVal}>{drill.equipment}</Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Biomechanical Benefit Banner */}
              {drill.biomechanicalBenefit && (
                <View style={styles.benefitBox}>
                  <CheckCircle2 color="#22c55e" size={14} />
                  <Text style={styles.benefitText}>{drill.biomechanicalBenefit}</Text>
                </View>
              )}

              {/* Step-by-Step Biomechanical Instructions */}
              <TouchableOpacity
                onPress={() => setExpandedDrillIdx(isExpanded ? null : origIdx)}
                style={styles.expandHeader}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Layers color="#38bdf8" size={14} />
                  <Text style={styles.expandHeaderText}>STEP-BY-STEP EXECUTION BLUEPRINT</Text>
                </View>
                <Text style={styles.expandActionText}>{isExpanded ? 'HIDE STEPS' : 'VIEW STEPS'}</Text>
              </TouchableOpacity>

              {isExpanded && drill.steps && drill.steps.length > 0 && (
                <View style={styles.stepsContainer}>
                  {drill.steps.map((step, sIdx) => (
                    <View key={sIdx} style={styles.stepItem}>
                      <View style={styles.stepNumberBadge}>
                        <Text style={styles.stepNumberText}>{sIdx + 1}</Text>
                      </View>
                      <Text style={styles.stepDescriptionText}>{step}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Interactive Sets Tracker Row */}
              <View style={styles.setsTrackerBox}>
                <Text style={styles.setsTrackerTitle}>SET PROGRESSION TRACKER:</Text>
                <View style={styles.setsRow}>
                  {[0, 1, 2].map((sIdx) => {
                    const isDone = setsStatus[sIdx];
                    return (
                      <TouchableOpacity
                        key={sIdx}
                        onPress={() => toggleSetComplete(origIdx, sIdx)}
                        style={[styles.setChip, isDone && styles.setChipDone]}
                        activeOpacity={0.7}
                      >
                        <Check color={isDone ? '#000' : '#71717a'} size={12} />
                        <Text style={[styles.setChipText, isDone && styles.setChipTextDone]}>
                          SET {sIdx + 1}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Interactive Rep Counter Row */}
              <View style={styles.repTrackerRow}>
                <Text style={styles.repTrackerLabel}>REPS PERFORMS:</Text>
                <View style={styles.counterGroup}>
                  <TouchableOpacity onPress={() => updateReps(origIdx, -1)} style={styles.counterBtn}>
                    <Minus color="#ffffff" size={12} />
                  </TouchableOpacity>
                  <Text style={styles.counterVal}>{currentReps} REPS</Text>
                  <TouchableOpacity onPress={() => updateReps(origIdx, 1)} style={styles.counterBtnPlus}>
                    <Plus color="#000000" size={12} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Drill Footer Action Buttons */}
              <View style={styles.drillFooterRow}>
                <TouchableOpacity
                  onPress={() => startPracticeSession(drill, origIdx)}
                  style={styles.practiceBtn}
                  activeOpacity={0.7}
                >
                  <Play color="#000000" size={13} fill="#000000" />
                  <Text style={styles.practiceBtnText}>START DRILL SESSION</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={onInspectFrames}
                  style={styles.inspectBtn}
                  activeOpacity={0.7}
                >
                  <Activity color="#38bdf8" size={13} />
                  <Text style={styles.inspectBtnText}>INSPECT POSE</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      })}

      {/* Fullscreen Guided Drill Practice Modal */}
      <Modal
        visible={!!practiceModalDrill}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setPracticeModalDrill(null)}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <StatusBar barStyle="light-content" />
          {practiceModalDrill && (
            <View style={styles.modalContent}>
              {/* Modal Top Nav Bar */}
              <View style={styles.modalNavBar}>
                <TouchableOpacity
                  onPress={() => setPracticeModalDrill(null)}
                  style={styles.modalCloseBtn}
                >
                  <X color="#ffffff" size={20} />
                </TouchableOpacity>
                <View style={{ alignItems: 'center' }}>
                  <Text style={styles.modalNavTitle}>ACTIVE PRACTICE SESSION</Text>
                  <Text style={styles.modalNavSubtitle}>{practiceModalDrill.category.toUpperCase()}</Text>
                </View>
                <View style={{ width: 36 }} />
              </View>

              <ScrollView style={styles.modalScroll} contentContainerStyle={{ padding: 20 }}>
                {/* Drill Title & Target */}
                <View style={styles.modalHeroBox}>
                  <Text style={styles.modalDrillTitle}>{practiceModalDrill.title}</Text>
                  <Text style={styles.modalDrillTarget}>🎯 Target: {practiceModalDrill.targetJoint}</Text>
                </View>

                {/* Big Countdown Timer Circle */}
                <View style={styles.timerCard}>
                  <Text style={styles.timerHeader}>SET INTERVAL COUNTDOWN</Text>
                  <Text style={styles.timerDisplay}>{timerSec}s</Text>
                  <Text style={styles.timerSubtext}>
                    {isTimerRunning ? 'HOLD MECHANICS & SINK INTO CORRIDOR' : 'PAUSED - PREPARE FOR NEXT REPETITION'}
                  </Text>

                  <View style={styles.timerControlsRow}>
                    <TouchableOpacity
                      onPress={() => setIsTimerRunning(!isTimerRunning)}
                      style={styles.timerPlayBtn}
                    >
                      {isTimerRunning ? <Pause color="#000" size={18} fill="#000" /> : <Play color="#000" size={18} fill="#000" />}
                      <Text style={styles.timerPlayBtnText}>{isTimerRunning ? 'PAUSE TIMER' : 'START TIMER'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        setTimerSec(45);
                        setIsTimerRunning(false);
                      }}
                      style={styles.timerResetBtn}
                    >
                      <RotateCcw color="#fff" size={16} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Coaching Cue Reminder */}
                <View style={styles.modalCueCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Zap color="#eab308" size={14} />
                    <Text style={styles.modalCueTitle}>COACHING CUE DIRECTIVE</Text>
                  </View>
                  <Text style={styles.modalCueText}>{practiceModalDrill.coachingCue}</Text>
                </View>

                {/* Steps Checklist */}
                <View style={styles.modalStepsBox}>
                  <Text style={styles.modalStepsTitle}>EXECUTION CHECKLIST</Text>
                  {practiceModalDrill.steps?.map((st, i) => (
                    <View key={i} style={styles.modalStepItem}>
                      <View style={styles.modalStepNum}>
                        <Text style={styles.modalStepNumText}>{i + 1}</Text>
                      </View>
                      <Text style={styles.modalStepText}>{st}</Text>
                    </View>
                  ))}
                </View>

                {/* Complete Set Button */}
                <TouchableOpacity
                  onPress={() => {
                    toggleSetComplete(practiceDrillIdx, 0);
                    onCycleStatus(practiceDrillIdx);
                    setPracticeModalDrill(null);
                  }}
                  style={styles.completeSessionBtn}
                  activeOpacity={0.8}
                >
                  <CheckCircle2 color="#000" size={18} />
                  <Text style={styles.completeSessionBtnText}>LOG SET COMPLETED (+100 XP)</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#09090b',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(234, 179, 8, 0.4)',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#eab308',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  summaryLeft: {
    flex: 1,
  },
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  summaryBadgeText: {
    color: '#eab308',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  summaryTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  summarySubtitle: {
    color: '#a1a1aa',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
    marginBottom: 12,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  xpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.35)',
  },
  xpText: {
    color: '#eab308',
    fontSize: 9.5,
    fontWeight: '900',
  },
  masteryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.35)',
  },
  statText: {
    color: '#22c55e',
    fontSize: 9.5,
    fontWeight: '900',
  },
  ringBox: {
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryScroll: {
    gap: 8,
    marginBottom: 16,
  },
  categoryPill: {
    backgroundColor: '#18181b',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  categoryPillActive: {
    backgroundColor: 'rgba(234, 179, 8, 0.18)',
    borderColor: '#eab308',
  },
  categoryPillText: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  categoryPillTextActive: {
    color: '#eab308',
  },
  drillsHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    color: '#71717a',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
  drillCardBig: {
    backgroundColor: '#0c0c10',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#27272a',
    marginBottom: 16,
    overflow: 'hidden',
  },
  photoContainer: {
    height: 140,
    width: '100%',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(12, 12, 16, 0.65)',
  },
  photoHeaderRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(9, 9, 11, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  categoryTagText: {
    color: '#ef4444',
    fontSize: 9,
    fontWeight: '900',
  },
  difficultyTag: {
    backgroundColor: 'rgba(9, 9, 11, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  difficultyTagText: {
    color: '#d4d4d8',
    fontSize: 9,
    fontWeight: '800',
  },
  photoTitleContainer: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    zIndex: 10,
  },
  coverTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    textShadowColor: '#000',
    textShadowRadius: 4,
  },
  coverTargetText: {
    color: '#a1a1aa',
    fontSize: 11,
    marginTop: 2,
  },
  drillHeaderNoPhoto: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#18181b',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  drillTitleGroup: {
    flex: 1,
  },
  drillTitleBig: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 6,
  },
  drillTargetText: {
    color: '#a1a1aa',
    fontSize: 11,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusPending: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  statusCompleted: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  statusMastered: {
    backgroundColor: 'rgba(34, 197, 94, 0.18)',
    borderColor: 'rgba(34, 197, 94, 0.45)',
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  statusPendingText: {
    color: '#ef4444',
  },
  statusCompletedText: {
    color: '#38bdf8',
  },
  statusMasteredText: {
    color: '#22c55e',
  },
  cardContentPadding: {
    padding: 14,
  },
  drillDescriptionBig: {
    color: '#d4d4d8',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
  },
  cueBox: {
    backgroundColor: 'rgba(234, 179, 8, 0.08)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.25)',
    marginBottom: 12,
  },
  cueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  cueLabel: {
    color: '#eab308',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cueText: {
    color: '#fef08a',
    fontSize: 11.5,
    lineHeight: 16.5,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  metricsGrid: {
    gap: 8,
    marginBottom: 10,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  metricLabel: {
    color: '#71717a',
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  metricVal: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  benefitBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderRadius: 10,
    padding: 9,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.25)',
    marginBottom: 12,
  },
  benefitText: {
    color: '#4ade80',
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  expandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#18181b',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 4,
  },
  expandHeaderText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  expandActionText: {
    color: '#38bdf8',
    fontSize: 9.5,
    fontWeight: '900',
  },
  stepsContainer: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  stepNumberBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '900',
  },
  stepDescriptionText: {
    color: '#e4e4e7',
    fontSize: 11.5,
    lineHeight: 16.5,
    flex: 1,
  },
  setsTrackerBox: {
    marginTop: 12,
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 10,
  },
  setsTrackerTitle: {
    color: '#a1a1aa',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  setsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  setChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#27272a',
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  setChipDone: {
    backgroundColor: '#eab308',
    borderColor: '#eab308',
  },
  setChipText: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: '900',
  },
  setChipTextDone: {
    color: '#000000',
  },
  repTrackerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#18181b',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  repTrackerLabel: {
    color: '#a1a1aa',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  counterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  counterBtn: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnPlus: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: '#eab308',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterVal: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  drillFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  practiceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#eab308',
    borderRadius: 10,
    paddingVertical: 10,
    elevation: 3,
  },
  practiceBtnText: {
    color: '#000000',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  inspectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  inspectBtnText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // Modal Styles
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#050508',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#050508',
  },
  modalNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#18181b',
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#18181b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalNavTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  modalNavSubtitle: {
    color: '#eab308',
    fontSize: 9,
    fontWeight: '800',
  },
  modalScroll: {
    flex: 1,
  },
  modalHeroBox: {
    marginBottom: 16,
  },
  modalDrillTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
  },
  modalDrillTarget: {
    color: '#a1a1aa',
    fontSize: 12,
    marginTop: 4,
  },
  timerCard: {
    backgroundColor: '#0c0c10',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(234, 179, 8, 0.4)',
    marginBottom: 16,
  },
  timerHeader: {
    color: '#eab308',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  timerDisplay: {
    color: '#ffffff',
    fontSize: 56,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    marginVertical: 4,
  },
  timerSubtext: {
    color: '#a1a1aa',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 16,
  },
  timerControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  timerPlayBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#eab308',
    borderRadius: 12,
    paddingVertical: 12,
  },
  timerPlayBtnText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  timerResetBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCueCard: {
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.3)',
    marginBottom: 16,
  },
  modalCueTitle: {
    color: '#eab308',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  modalCueText: {
    color: '#fef08a',
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  modalStepsBox: {
    backgroundColor: '#0c0c10',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#27272a',
    marginBottom: 20,
    gap: 10,
  },
  modalStepsTitle: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  modalStepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  modalStepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalStepNumText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  modalStepText: {
    color: '#e4e4e7',
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
  completeSessionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#22c55e',
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 24,
  },
  completeSessionBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
