import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {
  Scan,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Activity,
  ShieldCheck,
  Target,
  Sparkles,
  ArrowRight,
} from 'lucide-react-native';
import { SportRule, SkillLevel, AthleteCategory, AnalysisResult } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MagicProcessingScreenNativeProps {
  sportRule: SportRule;
  videoUrl: string | null;
  skillLevel: SkillLevel;
  athleteCategory: AthleteCategory;
  progress: number;
  onCancel?: () => void;
}

export const MagicProcessingScreenNative: React.FC<MagicProcessingScreenNativeProps> = ({
  sportRule,
  videoUrl,
  skillLevel,
  athleteCategory,
  progress,
  onCancel,
}) => {
  const STEPS = [
    { id: 0, label: 'Initializing Biomechanical Core', sub: 'Calibrating camera buffers & 3D pose anchors...' },
    { id: 1, label: 'High-Precision Joint Extraction', sub: 'MediaPipe 33-Keypoint skeleton stabilization' },
    { id: 2, label: 'Kinetic Chain Sequencing', sub: `Evaluating ${sportRule.name} velocity & power corridors` },
    { id: 3, label: 'Symmetry & Valgus Risk Audit', sub: 'Scanning joint load stress & angular deviation' },
    { id: 4, label: 'Synthesizing Executive Report', sub: 'Generating prescription drills & Titan Score' },
  ];

  const currentStepIndex =
    progress >= 95 ? 4 : progress >= 75 ? 3 : progress >= 45 ? 2 : progress >= 20 ? 1 : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#09090b" />
      <View style={styles.container}>
        
        {/* Glow Effects */}
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />

        {/* Center Scanner Pulse Graphic */}
        <View style={styles.scannerWrapper}>
          <View style={styles.scannerCircle}>
            <Scan color="#eab308" size={42} />
          </View>
          <View style={styles.sportBadge}>
            <Text style={styles.sportBadgeText}>{sportRule.name.toUpperCase()}</Text>
          </View>
        </View>

        {/* Headline */}
        <View style={styles.titleBox}>
          <View style={styles.titleRow}>
            <View style={styles.statusPulseDot} />
            <Text style={styles.mainTitle}>KLUTCHH BIOMETRIC ENGINE</Text>
          </View>
          <Text style={styles.subtitle}>
            Extracting 3D joint landmarks, calculating angular velocities, and auditing against{' '}
            {sportRule.jointRules.length} movement standards.
          </Text>
        </View>

        {/* Progress Bar Module */}
        <View style={styles.progressContainer}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressLabel}>BIOMECHANICAL SCAN</Text>
            <Text style={styles.progressValue}>{Math.round(progress)}%</Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${Math.min(100, Math.max(5, progress))}%` }]} />
          </View>
        </View>

        {/* Step-by-Step Telemetry Stages */}
        <View style={styles.stepsContainer}>
          {STEPS.map((step, idx) => {
            const isDone = idx < currentStepIndex || progress >= 100;
            const isCurrent = idx === currentStepIndex && progress < 100;

            return (
              <View
                key={step.id}
                style={[
                  styles.stepCard,
                  isDone && styles.stepCardDone,
                  isCurrent && styles.stepCardCurrent,
                ]}
              >
                <View style={styles.stepLeft}>
                  <View
                    style={[
                      styles.stepIconBox,
                      isDone && styles.stepIconBoxDone,
                      isCurrent && styles.stepIconBoxCurrent,
                    ]}
                  >
                    {isDone ? (
                      <CheckCircle2 color="#22c55e" size={16} />
                    ) : isCurrent ? (
                      <ActivityIndicator size="small" color="#000000" />
                    ) : (
                      <Text style={styles.stepNumber}>{step.id + 1}</Text>
                    )}
                  </View>
                  <View style={styles.stepTextBox}>
                    <Text
                      style={[
                        styles.stepTitle,
                        isDone && styles.stepTitleDone,
                        isCurrent && styles.stepTitleCurrent,
                      ]}
                    >
                      {step.label}
                    </Text>
                    <Text style={styles.stepSub}>{step.sub}</Text>
                  </View>
                </View>

                {isCurrent && (
                  <View style={styles.processingPill}>
                    <Text style={styles.processingPillText}>ACTIVE</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Cancel Button */}
        {onCancel && (
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelBtnText}>CANCEL ANALYSIS</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: '#09090b',
  },
  glowTop: {
    position: 'absolute',
    top: -80,
    left: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(234, 179, 8, 0.12)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -80,
    right: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  scannerWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  scannerCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#141418',
    borderWidth: 2,
    borderColor: 'rgba(234, 179, 8, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#eab308',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  sportBadge: {
    marginTop: -10,
    backgroundColor: '#eab308',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
  },
  sportBadgeText: {
    color: '#000000',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 1,
  },
  titleBox: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#eab308',
  },
  mainTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  subtitle: {
    color: '#a1a1aa',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 16,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 20,
    gap: 6,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    color: '#71717a',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 1,
  },
  progressValue: {
    color: '#eab308',
    fontSize: 13,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  progressBarTrack: {
    width: '100%',
    height: 8,
    backgroundColor: '#18181b',
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#eab308',
    borderRadius: 4,
  },
  stepsContainer: {
    width: '100%',
    gap: 8,
    marginBottom: 18,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#121216',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  stepCardDone: {
    borderColor: 'rgba(34, 197, 94, 0.3)',
    backgroundColor: 'rgba(34, 197, 94, 0.04)',
  },
  stepCardCurrent: {
    borderColor: 'rgba(234, 179, 8, 0.5)',
    backgroundColor: 'rgba(234, 179, 8, 0.08)',
  },
  stepLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  stepIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#18181b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIconBoxDone: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  stepIconBoxCurrent: {
    backgroundColor: '#eab308',
  },
  stepNumber: {
    color: '#71717a',
    fontSize: 11,
    fontWeight: '900',
  },
  stepTextBox: {
    flex: 1,
    gap: 2,
  },
  stepTitle: {
    color: '#71717a',
    fontSize: 11.5,
    fontWeight: '800',
  },
  stepTitleDone: {
    color: '#ffffff',
  },
  stepTitleCurrent: {
    color: '#ffffff',
    fontWeight: '900',
  },
  stepSub: {
    color: '#71717a',
    fontSize: 9.5,
    lineHeight: 13,
  },
  processingPill: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.3)',
  },
  processingPillText: {
    color: '#eab308',
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cancelBtnText: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
