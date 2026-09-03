import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Line, Circle, Rect, Polygon, G, Path, Text as SvgText } from 'react-native-svg';
import { Play, Pause, Activity, Zap } from 'lucide-react-native';

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

  useEffect(() => {
    if (!isPlaying) return;

    const cycleMs = 2800;
    const interval = setInterval(() => {
      const elapsed = (Date.now()) % cycleMs;
      const t = elapsed / cycleMs;
      const smooth = (Math.sin(t * Math.PI * 2 - Math.PI / 2) + 1) / 2;
      setFrameProgress(smooth);
    }, 25);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const W = 340;
  const H = 210;
  const cx = W / 2;

  const titleLower = (drillTitle + ' ' + targetJoint + ' ' + category).toLowerCase();
  
  const isHinge = titleLower.includes('hinge') || titleLower.includes('squat') || titleLower.includes('hip') || titleLower.includes('tackle') || titleLower.includes('dip');
  const isRotational = titleLower.includes('rotat') || titleLower.includes('whip') || titleLower.includes('pass') || titleLower.includes('swing') || titleLower.includes('strike') || titleLower.includes('drive');
  const isLanding = titleLower.includes('land') || titleLower.includes('decel') || titleLower.includes('armor') || titleLower.includes('knee') || titleLower.includes('footwork');
  const isVertical = titleLower.includes('vertical') || titleLower.includes('jump') || titleLower.includes('reach') || titleLower.includes('header') || titleLower.includes('arc') || titleLower.includes('release') || titleLower.includes('shoot');

  const p = frameProgress;

  let headY = 38;
  let shoulderY = 62;
  let hipY = 108;
  let leftKneeY = 144;
  let rightKneeY = 144;
  let leftAnkleY = 182;
  let rightAnkleY = 182;

  let leftShoulderX = cx - 22;
  let rightShoulderX = cx + 22;
  let leftHipX = cx - 18;
  let rightHipX = cx + 18;

  let leftElbowX = cx - 36;
  let leftElbowY = 82;
  let rightElbowX = cx + 36;
  let rightElbowY = 82;

  let leftWristX = cx - 46;
  let leftWristY = 102;
  let rightWristX = cx + 46;
  let rightWristY = 102;

  let leftKneeX = cx - 22;
  let rightKneeX = cx + 22;
  let leftAnkleX = cx - 24;
  let rightAnkleX = cx + 24;

  let activeAngle = '124°';
  let angleLabel = 'Kinetic Flexion';
  let phaseName = 'SETUP & LOAD';

  if (p < 0.33) {
    phaseName = '1. PREP & LOAD';
  } else if (p < 0.66) {
    phaseName = '2. FORCE DRIVE';
  } else {
    phaseName = '3. PEAK RELEASE';
  }

  if (isHinge) {
    headY = 40 + p * 18;
    shoulderY = 64 + p * 22;
    hipY = 105 + p * 28;
    leftHipX = cx - 18 - p * 16;
    rightHipX = cx + 18 - p * 16;
    leftKneeY = 142 + p * 12;
    rightKneeY = 142 + p * 12;
    leftKneeX = cx - 26 - p * 10;
    rightKneeX = cx + 16 - p * 10;
    leftElbowY = 82 + p * 18;
    rightElbowY = 82 + p * 18;
    leftWristY = 102 + p * 22;
    rightWristY = 102 + p * 22;
    activeAngle = `${Math.round(152 - p * 42)}°`;
    angleLabel = 'Hip Hinge Angle';
  } else if (isRotational) {
    const rot = (p - 0.5) * 2;
    leftShoulderX = cx - 22 + rot * 22;
    rightShoulderX = cx + 22 - rot * 22;
    leftElbowX = cx - 36 + rot * 45;
    leftElbowY = 82 - Math.abs(rot) * 12;
    rightElbowX = cx + 36 + rot * 50;
    rightElbowY = 82 + rot * 8;
    leftWristX = cx - 46 + rot * 72;
    leftWristY = 102 - Math.abs(rot) * 22;
    rightWristX = cx + 46 + rot * 78;
    rightWristY = 102 + rot * 12;
    activeAngle = `${Math.round(82 + p * 58)}°`;
    angleLabel = 'Torso Separation';
  } else if (isLanding) {
    leftKneeY = 144 + p * 22;
    leftKneeX = cx - 22;
    rightKneeY = 144 - p * 18;
    rightAnkleY = 182 - p * 30;
    hipY = 108 + p * 16;
    headY = 38 + p * 10;
    activeAngle = `${Math.round(162 - p * 38)}°`;
    angleLabel = 'Cushion Flexion';
  } else if (isVertical) {
    headY = 38 - p * 16;
    shoulderY = 62 - p * 20;
    hipY = 108 - p * 22;
    leftWristY = 102 - p * 62;
    rightWristY = 102 - p * 62;
    leftElbowY = 82 - p * 42;
    rightElbowY = 82 - p * 42;
    leftWristX = cx - 14;
    rightWristX = cx + 14;
    activeAngle = `${Math.round(138 + p * 40)}°`;
    angleLabel = 'Vertical Extension';
  }

  return (
    <View style={styles.container}>
      <View style={styles.canvasWrapper}>
        <Svg width={W} height={H} style={styles.svg}>
          <Line x1={15} y1={H - 18} x2={W - 15} y2={H - 18} stroke="#3f3f46" strokeWidth={2} strokeLinecap="round" />
          <Line x1={cx} y1={15} x2={cx} y2={H - 18} stroke="#27272a" strokeWidth={1} strokeDasharray="4,4" />
          <Line x1={40} y1={60} x2={W - 40} y2={60} stroke="#18181b" strokeWidth={1} strokeDasharray="2,2" />

          <Path
            d={`M ${cx - 40} 90 Q ${cx} ${70} ${cx + 40} 90`}
            fill="none"
            stroke="rgba(56, 189, 248, 0.25)"
            strokeWidth={1.5}
            strokeDasharray="3,3"
          />

          <Polygon
            points={`
              ${leftShoulderX},${shoulderY}
              ${rightShoulderX},${shoulderY}
              ${rightHipX},${hipY}
              ${leftHipX},${hipY}
            `}
            fill="rgba(34, 197, 94, 0.12)"
            stroke="rgba(34, 197, 94, 0.5)"
            strokeWidth={1.5}
          />

          <Circle cx={cx} cy={headY} r={12} fill="rgba(34, 197, 94, 0.2)" stroke="#22c55e" strokeWidth={1.5} />
          <Circle cx={cx} cy={headY} r={15} fill="none" stroke="rgba(34, 197, 94, 0.3)" strokeWidth={1} strokeDasharray="2,2" />

          <Line x1={cx} y1={shoulderY} x2={(leftHipX + rightHipX) / 2} y2={hipY} stroke="#22c55e" strokeWidth={3.5} strokeLinecap="round" />

          <Line x1={leftShoulderX} y1={shoulderY} x2={leftElbowX} y2={leftElbowY} stroke="#c084fc" strokeWidth={3.5} strokeLinecap="round" />
          <Line x1={leftElbowX} y1={leftElbowY} x2={leftWristX} y2={leftWristY} stroke="#c084fc" strokeWidth={3.5} strokeLinecap="round" />

          <Line x1={rightShoulderX} y1={shoulderY} x2={rightElbowX} y2={rightElbowY} stroke="#22c55e" strokeWidth={3.5} strokeLinecap="round" />
          <Line x1={rightElbowX} y1={rightElbowY} x2={rightWristX} y2={rightWristY} stroke="#22c55e" strokeWidth={3.5} strokeLinecap="round" />

          <Line x1={leftHipX} y1={hipY} x2={leftKneeX} y2={leftKneeY} stroke="#c084fc" strokeWidth={4} strokeLinecap="round" />
          <Line x1={leftKneeX} y1={leftKneeY} x2={leftAnkleX} y2={leftAnkleY} stroke="#c084fc" strokeWidth={4} strokeLinecap="round" />

          <Line x1={rightHipX} y1={hipY} x2={rightKneeX} y2={rightKneeY} stroke="#22c55e" strokeWidth={4} strokeLinecap="round" />
          <Line x1={rightKneeX} y1={rightKneeY} x2={rightAnkleX} y2={rightAnkleY} stroke="#22c55e" strokeWidth={4} strokeLinecap="round" />

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
              <Circle cx={x} cy={y} r={4.5} fill="#09090b" stroke="#38bdf8" strokeWidth={2} />
              <Circle cx={x} cy={y} r={1.8} fill="#ffffff" />
            </G>
          ))}

          <Line x1={cx} y1={hipY} x2={cx + (p * 35)} y2={hipY - 20} stroke="#38bdf8" strokeWidth={2} strokeLinecap="round" />

          <Rect x={10} y={10} width={138} height={28} rx={6} fill="rgba(9, 9, 11, 0.9)" stroke="#22c55e" strokeWidth={1} />
          <SvgText x={18} y={28} fill="#22c55e" fontSize="11" fontWeight="bold" fontFamily="monospace">
            {angleLabel}: {activeAngle}
          </SvgText>

          <Rect x={W - 124} y={10} width={114} height={28} rx={6} fill="rgba(34, 197, 94, 0.18)" stroke="#22c55e" strokeWidth={1} />
          <SvgText x={W - 114} y={28} fill="#4ade80" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
            ✓ TARGET CORRIDOR
          </SvgText>
        </Svg>

        <View style={styles.controlsRow}>
          <TouchableOpacity
            onPress={() => setIsPlaying(!isPlaying)}
            style={styles.playBtn}
          >
            {isPlaying ? <Pause color="#000" size={12} /> : <Play color="#000" size={12} />}
            <Text style={styles.playBtnText}>{isPlaying ? 'PAUSE' : 'PLAY'}</Text>
          </TouchableOpacity>

          <View style={styles.phaseIndicator}>
            <Activity color="#38bdf8" size={12} />
            <Text style={styles.phaseIndicatorText}>{phaseName}</Text>
          </View>
        </View>
      </View>

      {coachingCue && (
        <View style={styles.cueBox}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <Zap color="#eab308" size={12} />
            <Text style={styles.cueLabel}>EXPERT COACHING DIRECTIVE</Text>
          </View>
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
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  canvasWrapper: {
    position: 'relative',
    backgroundColor: '#09090b',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  playBtnText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '900',
  },
  phaseIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(9, 9, 11, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  phaseIndicatorText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  cueBox: {
    backgroundColor: '#18181b',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
  },
  cueLabel: {
    color: '#eab308',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  cueText: {
    color: '#f4f4f5',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
});
