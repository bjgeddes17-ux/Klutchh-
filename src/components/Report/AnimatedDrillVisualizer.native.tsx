import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Line, Circle, Rect, Polygon, G, Text as SvgText } from 'react-native-svg';
import { Play, Pause, RotateCcw, Activity } from 'lucide-react-native';

interface AnimatedDrillVisualizerProps {
  drillTitle: string;
  targetJoint?: string;
  category?: string;
  coachingCue?: string;
}

export const AnimatedDrillVisualizer: React.FC<AnimatedDrillVisualizerProps> = ({
  drillTitle,
  targetJoint = 'Hip & Spine',
  category = 'Kinetic Chain',
  coachingCue,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [frameProgress, setFrameProgress] = useState<number>(0);
  const animRef = useRef<any>(null);

  // Animation cycle: 0 to 1 back to 0
  useEffect(() => {
    if (!isPlaying) return;

    let start = Date.now();
    const cycleMs = 2400; // 2.4s cycle

    const interval = setInterval(() => {
      const elapsed = (Date.now() - start) % cycleMs;
      const t = elapsed / cycleMs;
      // Sinusoidal easing
      const smooth = (Math.sin(t * Math.PI * 2 - Math.PI / 2) + 1) / 2;
      setFrameProgress(smooth);
    }, 30);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const W = 320;
  const H = 200;
  const cx = W / 2;

  // Determine movement archetype based on drill keywords
  const titleLower = (drillTitle + ' ' + targetJoint + ' ' + category).toLowerCase();
  
  let isHinge = titleLower.includes('hinge') || titleLower.includes('squat') || titleLower.includes('hip') || titleLower.includes('tackle');
  let isRotational = titleLower.includes('rotat') || titleLower.includes('whip') || titleLower.includes('pass') || titleLower.includes('swing');
  let isLanding = titleLower.includes('land') || titleLower.includes('decel') || titleLower.includes('armor') || titleLower.includes('knee');
  let isVertical = titleLower.includes('vertical') || titleLower.includes('jump') || titleLower.includes('reach') || titleLower.includes('header') || titleLower.includes('arc');

  // Compute animated joint coordinates
  const p = frameProgress; // 0 = start position, 1 = peak target position

  let headY = 40;
  let shoulderY = 65;
  let hipY = 110;
  let leftKneeY = 145;
  let rightKneeY = 145;
  let leftAnkleY = 180;
  let rightAnkleY = 180;

  let leftShoulderX = cx - 22;
  let rightShoulderX = cx + 22;
  let leftHipX = cx - 18;
  let rightHipX = cx + 18;

  let leftElbowX = cx - 35;
  let leftElbowY = 85;
  let rightElbowX = cx + 35;
  let rightElbowY = 85;

  let leftWristX = cx - 45;
  let leftWristY = 105;
  let rightWristX = cx + 45;
  let rightWristY = 105;

  let leftKneeX = cx - 20;
  let rightKneeX = cx + 20;
  let leftAnkleX = cx - 20;
  let rightAnkleX = cx + 20;

  let activeAngle = '125°';
  let angleLabel = 'Knee Flexion';

  if (isHinge) {
    // Dynamic hip hinge squat
    headY = 40 + p * 20;
    shoulderY = 65 + p * 25;
    hipY = 110 + p * 30;
    leftHipX = cx - 18 - p * 15; // Hips sink back
    rightHipX = cx + 18 - p * 15;
    leftKneeY = 145 + p * 15;
    rightKneeY = 145 + p * 15;
    leftElbowY = 85 + p * 20;
    rightElbowY = 85 + p * 20;
    leftWristY = 105 + p * 25;
    rightWristY = 105 + p * 25;
    activeAngle = `${Math.round(155 - p * 45)}°`;
    angleLabel = 'Hip Hinge Angle';
  } else if (isRotational) {
    // Torso coil & arm whip
    const rot = (p - 0.5) * 2; // -1 to +1
    leftShoulderX = cx - 22 + rot * 20;
    rightShoulderX = cx + 22 - rot * 20;
    leftElbowX = cx - 35 + rot * 40;
    leftElbowY = 85 - Math.abs(rot) * 15;
    rightElbowX = cx + 35 + rot * 45;
    rightElbowY = 85 + rot * 10;
    leftWristX = cx - 45 + rot * 65;
    leftWristY = 105 - Math.abs(rot) * 25;
    rightWristX = cx + 45 + rot * 70;
    activeAngle = `${Math.round(85 + p * 60)}°`;
    angleLabel = 'Torso Separation';
  } else if (isLanding) {
    // Single leg landing cushion
    leftKneeY = 145 + p * 20;
    leftKneeX = cx - 20;
    leftAnkleY = 180;
    rightKneeY = 145 - p * 15; // trail leg suspended
    rightAnkleY = 175 - p * 25;
    hipY = 110 + p * 18;
    headY = 40 + p * 12;
    activeAngle = `${Math.round(160 - p * 40)}°`;
    angleLabel = 'Cushion Flexion';
  } else if (isVertical) {
    // Vertical reach & extension
    headY = 40 - p * 15;
    shoulderY = 65 - p * 18;
    hipY = 110 - p * 20;
    leftWristY = 105 - p * 65;
    rightWristY = 105 - p * 65;
    leftElbowY = 85 - p * 45;
    rightElbowY = 85 - p * 45;
    leftWristX = cx - 12;
    rightWristX = cx + 12;
    activeAngle = `${Math.round(140 + p * 38)}°`;
    angleLabel = 'Overhead Extension';
  }

  return (
    <View style={styles.container}>
      {/* Visual Canvas */}
      <View style={styles.canvasWrapper}>
        <Svg width={W} height={H} style={styles.svg}>
          {/* Background Grid Pattern */}
          <Line x1={20} y1={H - 20} x2={W - 20} y2={H - 20} stroke="#27272a" strokeWidth={2} />
          <Line x1={W / 2} y1={20} x2={W / 2} y2={H - 20} stroke="#18181b" strokeWidth={1} strokeDasharray="3,3" />

          {/* Torso Polygon */}
          <Polygon
            points={`
              ${leftShoulderX},${shoulderY}
              ${rightShoulderX},${shoulderY}
              ${rightHipX},${hipY}
              ${leftHipX},${hipY}
            `}
            fill="rgba(34, 197, 94, 0.15)"
            stroke="rgba(34, 197, 94, 0.4)"
            strokeWidth={1.5}
          />

          {/* Head */}
          <Circle cx={cx} cy={headY} r={11} fill="rgba(34, 197, 94, 0.25)" stroke="#22c55e" strokeWidth={1.5} />

          {/* Spine Line */}
          <Line x1={cx} y1={shoulderY} x2={(leftHipX + rightHipX) / 2} y2={hipY} stroke="#22c55e" strokeWidth={3} strokeLinecap="round" />

          {/* Left Arm (Purple) */}
          <Line x1={leftShoulderX} y1={shoulderY} x2={leftElbowX} y2={leftElbowY} stroke="#c084fc" strokeWidth={3} strokeLinecap="round" />
          <Line x1={leftElbowX} y1={leftElbowY} x2={leftWristX} y2={leftWristY} stroke="#c084fc" strokeWidth={3} strokeLinecap="round" />

          {/* Right Arm (Emerald) */}
          <Line x1={rightShoulderX} y1={shoulderY} x2={rightElbowX} y2={rightElbowY} stroke="#22c55e" strokeWidth={3} strokeLinecap="round" />
          <Line x1={rightElbowX} y1={rightElbowY} x2={rightWristX} y2={rightWristY} stroke="#22c55e" strokeWidth={3} strokeLinecap="round" />

          {/* Left Leg */}
          <Line x1={leftHipX} y1={hipY} x2={leftKneeX} y2={leftKneeY} stroke="#c084fc" strokeWidth={3.5} strokeLinecap="round" />
          <Line x1={leftKneeX} y1={leftKneeY} x2={leftAnkleX} y2={leftAnkleY} stroke="#c084fc" strokeWidth={3.5} strokeLinecap="round" />

          {/* Right Leg */}
          <Line x1={rightHipX} y1={hipY} x2={rightKneeX} y2={rightKneeY} stroke="#22c55e" strokeWidth={3.5} strokeLinecap="round" />
          <Line x1={rightKneeX} y1={rightKneeY} x2={rightAnkleX} y2={rightAnkleY} stroke="#22c55e" strokeWidth={3.5} strokeLinecap="round" />

          {/* Joint Pivot Points */}
          {[
            [leftShoulderX, shoulderY],
            [rightShoulderX, shoulderY],
            [leftElbowX, leftElbowY],
            [rightElbowX, rightElbowY],
            [leftWristX, leftWristY],
            [rightWristX, rightWristY],
            [leftHipX, hipY],
            [rightHipX, hipY],
            [leftKneeX, leftKneeY],
            [rightKneeX, rightKneeY],
            [leftAnkleX, leftAnkleY],
            [rightAnkleX, rightAnkleY],
          ].map(([x, y], idx) => (
            <G key={`joint-${idx}`}>
              <Circle cx={x} cy={y} r={4} fill="#09090b" stroke="#38bdf8" strokeWidth={1.5} />
              <Circle cx={x} cy={y} r={1.5} fill="#fff" />
            </G>
          ))}

          {/* Dynamic Angle Callout Badge */}
          <Rect x={12} y={12} width={130} height={26} rx={6} fill="rgba(9, 9, 11, 0.85)" stroke="#22c55e" strokeWidth={1} />
          <SvgText x={20} y={29} fill="#22c55e" fontSize="11" fontWeight="bold" fontFamily="system-ui">
            {angleLabel}: {activeAngle}
          </SvgText>

          {/* Optimal Corridor Pill */}
          <Rect x={W - 120} y={12} width={108} height={26} rx={6} fill="rgba(34, 197, 94, 0.15)" stroke="#22c55e" strokeWidth={1} />
          <SvgText x={W - 110} y={29} fill="#4ade80" fontSize="10" fontWeight="bold" fontFamily="system-ui">
            TARGET CORRIDOR
          </SvgText>
        </Svg>

        {/* Controls Overlay */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            onPress={() => setIsPlaying(!isPlaying)}
            style={styles.playBtn}
          >
            {isPlaying ? <Pause color="#000" size={12} /> : <Play color="#000" size={12} />}
            <Text style={styles.playBtnText}>{isPlaying ? 'PAUSE' : 'ANIMATE'}</Text>
          </TouchableOpacity>

          <View style={styles.phaseIndicator}>
            <Activity color="#eab308" size={12} />
            <Text style={styles.phaseIndicatorText}>
              {p < 0.3 ? 'PHASE 1: SETUP' : p < 0.7 ? 'PHASE 2: EXECUTE' : 'PHASE 3: PEAK TARGET'}
            </Text>
          </View>
        </View>
      </View>

      {/* Coaching Cue Banner */}
      {coachingCue && (
        <View style={styles.cueBox}>
          <Text style={styles.cueLabel}>COACHING CUE</Text>
          <Text style={styles.cueText}>{coachingCue}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#18181b',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#27272a',
    marginVertical: 8,
  },
  canvasWrapper: {
    position: 'relative',
    backgroundColor: '#09090b',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  svg: {
    backgroundColor: 'transparent',
  },
  controlsRow: {
    position: 'absolute',
    bottom: 8,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#22c55e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  playBtnText: {
    color: '#000',
    fontSize: 9,
    fontWeight: '900',
  },
  phaseIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(9, 9, 11, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  phaseIndicatorText: {
    color: '#eab308',
    fontSize: 9,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  cueBox: {
    backgroundColor: '#18181b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
  },
  cueLabel: {
    color: '#71717a',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 2,
  },
  cueText: {
    color: '#f4f4f5',
    fontSize: 11,
    fontStyle: 'italic',
    lineHeight: 15,
  },
});
