import React, { useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutChangeEvent,
  Platform
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import Svg, {
  Line,
  Circle,
  Polygon,
  Rect,
  Text as SvgText,
  Path as SvgPath,
  G
} from 'react-native-svg';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Maximize,
  Zap,
  ShieldCheck
} from 'lucide-react-native';
import { SportRule, FrameAnalysis, MediaPipeLandmark } from '../../types';

interface KineticVideoPlayerProps {
  videoUrl: string;
  sportRule: SportRule;
  sortedFrames: FrameAnalysis[];
  isPlaying: boolean;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  onDurationChange?: (duration: number) => void;
  playbackRate?: number;
  isDataReady: boolean;
  viewMode?: 'student' | 'coach';
  onTogglePlay?: () => void;
}

export const KineticVideoPlayer: React.FC<KineticVideoPlayerProps> = ({
  videoUrl,
  sportRule,
  sortedFrames,
  isPlaying,
  currentTime,
  onTimeUpdate,
  onDurationChange,
  playbackRate = 1,
  isDataReady,
  viewMode = 'student',
  onTogglePlay
}) => {
  const videoRef = useRef<Video>(null);
  const [layout, setLayout] = useState({ width: 360, height: 640 });
  const [selectedSpeed, setSelectedSpeed] = useState<number>(playbackRate);
  const [duration, setDuration] = useState<number>(3.99);

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setLayout({ width, height });
    }
  };

  // Find the closest analyzed frame based on currentTime (Binary Search)
  const currentFrame = useMemo(() => {
    if (!sortedFrames.length) return null;
    let low = 0;
    let high = sortedFrames.length - 1;
    let idx = 0;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (sortedFrames[mid].timestamp <= currentTime) {
        idx = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return sortedFrames[idx];
  }, [sortedFrames, currentTime]);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      const posSec = status.positionMillis / 1000;
      onTimeUpdate(posSec);
      if (status.durationMillis) {
        const durSec = status.durationMillis / 1000;
        setDuration(durSec);
        onDurationChange?.(durSec);
      }
    }
  };

  const handleSeek = (ratio: number) => {
    const targetMs = Math.max(0, Math.min(duration, ratio * duration)) * 1000;
    videoRef.current?.setPositionAsync(targetMs);
  };

  const handleStep = (direction: 'back' | 'forward') => {
    const stepTime = 0.05; // 50ms per step
    const target = direction === 'back'
      ? Math.max(0, currentTime - stepTime)
      : Math.min(duration, currentTime + stepTime);
    videoRef.current?.setPositionAsync(target * 1000);
  };

  const handleChangeSpeed = (speed: number) => {
    setSelectedSpeed(speed);
    videoRef.current?.setRateAsync(speed, true);
  };

  // Extract landmarks & compute clean visual geometry
  const landmarks = currentFrame?.landmarks;
  const { width: W, height: H } = layout;

  // Render Biometric Rules Callouts (Matching Picture 1 with non-colliding staggered positioning)
  const visibleRuleCallouts = useMemo(() => {
    if (!landmarks || landmarks.length === 0 || !sportRule?.jointRules) return [];

    const activePhase = currentFrame?.detectedPhase || sportRule.phases?.[0];
    const rules = sportRule.jointRules.filter((r) => {
      if (!activePhase || activePhase === 'Auto-Detect' || activePhase === 'All') return true;
      return r.phase === activePhase || currentFrame?.ruleResults?.[r.id] !== 'optimal';
    });

    const selected = (rules.length > 4 ? rules.slice(0, 4) : rules).map((rule, index) => {
      const [, vertexIdx] = rule.keypoints;
      const vertex = landmarks[vertexIdx];
      const vx = vertex ? vertex.x * W : W * 0.5;
      const vy = vertex ? vertex.y * H : H * 0.3 + index * 45;

      const angleVal = currentFrame?.angles?.[rule.id] ?? 90;
      const status = currentFrame?.ruleResults?.[rule.id] || 'optimal';

      const cleanName = rule.name
        .replace(/ Biometric Rule$/i, '')
        .replace(/ Rule$/i, '')
        .trim();

      const displayAngle = typeof angleVal === 'number' ? angleVal.toFixed(1) : angleVal;
      const labelText = `${cleanName}: ${displayAngle}${rule.unit || '°'}`;

      // Staggered Y positioning so callouts never collide
      const targetY = Math.max(80, Math.min(H - 120, vy - 10 + (index % 2 === 0 ? -12 : 12)));
      const pillX = Math.min(W - 220, Math.max(20, vx + 16));

      return {
        id: rule.id,
        labelText,
        vx,
        vy,
        pillX,
        pillY: targetY,
        status,
        color: status === 'error' ? '#ef4444' : status === 'warning' ? '#f59e0b' : '#22c55e'
      };
    });

    return selected;
  }, [landmarks, currentFrame, sportRule, W, H]);

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {/* Video Surface */}
      <Video
        ref={videoRef}
        source={{ uri: videoUrl }}
        rate={selectedSpeed}
        isMuted={true}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={isPlaying}
        isLooping={true}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        style={styles.video}
      />

      {/* Svg High-Fidelity Biomechanical Overlay (Matching Picture 1) */}
      {landmarks && landmarks.length > 0 && (
        <Svg style={styles.svgOverlay} width={W} height={H}>
          {/* 1. Torso Volume Polygon */}
          {landmarks[11] && landmarks[12] && landmarks[24] && landmarks[23] && (
            <Polygon
              points={`
                ${landmarks[11].x * W},${landmarks[11].y * H}
                ${landmarks[12].x * W},${landmarks[12].y * H}
                ${landmarks[24].x * W},${landmarks[24].y * H}
                ${landmarks[23].x * W},${landmarks[23].y * H}
              `}
              fill="rgba(56, 189, 248, 0.08)"
              stroke="rgba(56, 189, 248, 0.25)"
              strokeWidth={1.5}
            />
          )}

          {/* 2. Head / Helmet Oval */}
          {landmarks[0] && (
            <Circle
              cx={landmarks[0].x * W}
              cy={landmarks[0].y * H - 6}
              r={12}
              fill="rgba(56, 189, 248, 0.12)"
              stroke="rgba(56, 189, 248, 0.4)"
              strokeWidth={1.5}
            />
          )}

          {/* 3. Left Limbs (Purple - Lead Side) */}
          {[
            [11, 13], [13, 15], // Left Arm
            [23, 25], [25, 27], [27, 31], [27, 29], // Left Leg & Foot
            [11, 23] // Left Torso
          ].map(([i1, i2], idx) => {
            const p1 = landmarks[i1];
            const p2 = landmarks[i2];
            if (!p1 || !p2 || (p1.visibility && p1.visibility < 0.25)) return null;
            return (
              <Line
                key={`left-limb-${idx}`}
                x1={p1.x * W}
                y1={p1.y * H}
                x2={p2.x * W}
                y2={p2.y * H}
                stroke="#c084fc"
                strokeWidth={3}
                strokeLinecap="round"
              />
            );
          })}

          {/* 4. Right Limbs (Neon Green - Trail Side) */}
          {[
            [12, 14], [14, 16], // Right Arm
            [24, 26], [26, 28], [28, 32], [28, 30], // Right Leg & Foot
            [12, 24] // Right Torso
          ].map(([i1, i2], idx) => {
            const p1 = landmarks[i1];
            const p2 = landmarks[i2];
            if (!p1 || !p2 || (p1.visibility && p1.visibility < 0.25)) return null;
            return (
              <Line
                key={`right-limb-${idx}`}
                x1={p1.x * W}
                y1={p1.y * H}
                x2={p2.x * W}
                y2={p2.y * H}
                stroke="#22c55e"
                strokeWidth={3}
                strokeLinecap="round"
              />
            );
          })}

          {/* 5. Center Shoulders & Hips Connections */}
          {landmarks[11] && landmarks[12] && (
            <Line
              x1={landmarks[11].x * W}
              y1={landmarks[11].y * H}
              x2={landmarks[12].x * W}
              y2={landmarks[12].y * H}
              stroke="#38bdf8"
              strokeWidth={2.5}
            />
          )}
          {landmarks[23] && landmarks[24] && (
            <Line
              x1={landmarks[23].x * W}
              y1={landmarks[23].y * H}
              x2={landmarks[24].x * W}
              y2={landmarks[24].y * H}
              stroke="#38bdf8"
              strokeWidth={2.5}
            />
          )}

          {/* 6. Joint Pivot Circles */}
          {landmarks.map((lm, i) => {
            if (!lm || (lm.visibility && lm.visibility < 0.25)) return null;
            if (i > 0 && i < 11) return null; // skip facial clutter

            const isLeft = [11, 13, 15, 23, 25, 27, 29, 31].includes(i);
            const ringColor = isLeft ? '#c084fc' : '#22c55e';

            return (
              <G key={`joint-${i}`}>
                <Circle
                  cx={lm.x * W}
                  cy={lm.y * H}
                  r={5}
                  fill="rgba(0,0,0,0.6)"
                  stroke={ringColor}
                  strokeWidth={1.5}
                />
                <Circle
                  cx={lm.x * W}
                  cy={lm.y * H}
                  r={2.5}
                  fill="#ffffff"
                />
              </G>
            );
          })}

          {/* 7. Biometric Angle Callouts (Clean Floating Pills with Leader Lines) */}
          {visibleRuleCallouts.map((callout, idx) => {
            const textLength = callout.labelText.length;
            const pillW = Math.min(220, Math.max(140, textLength * 7.2 + 24));

            return (
              <G key={`callout-${idx}`}>
                {/* Thin leader line from joint vertex to pill */}
                <Line
                  x1={callout.vx}
                  y1={callout.vy}
                  x2={callout.pillX}
                  y2={callout.pillY + 9}
                  stroke={callout.color}
                  strokeWidth={1}
                  strokeDasharray="2,2"
                  opacity={0.8}
                />

                {/* Dark translucent pill card */}
                <Rect
                  x={callout.pillX}
                  y={callout.pillY}
                  width={pillW}
                  height={18}
                  rx={9}
                  fill="rgba(9, 9, 11, 0.92)"
                  stroke={callout.color}
                  strokeWidth={1}
                />

                {/* Status Dot */}
                <Circle
                  cx={callout.pillX + 8}
                  cy={callout.pillY + 9}
                  r={3}
                  fill={callout.color}
                />

                {/* Label Text */}
                <SvgText
                  x={callout.pillX + 16}
                  y={callout.pillY + 13}
                  fill="#ffffff"
                  fontSize="9.5"
                  fontWeight="bold"
                  fontFamily="system-ui"
                >
                  {callout.labelText}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      )}

      {/* Top Gamified HUD Badges (Matching Picture 1) */}
      <View style={styles.topHudContainer}>
        <View style={styles.comboBadge}>
          <Zap color="#f59e0b" size={14} />
          <Text style={styles.comboText}>COMBO: x{Math.floor(currentTime * 2) + 1}</Text>
        </View>

        <View style={styles.armorBadge}>
          <ShieldCheck color="#38bdf8" size={14} />
          <Text style={styles.armorText}>ARMOR: 100%</Text>
        </View>
      </View>

      {/* Bottom Floating Transport Controls (Matching Picture 1) */}
      <View style={styles.bottomControlBar}>
        {/* Amber Scrubber Bar */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => {
            const touchX = e.nativeEvent.locationX;
            const scrubberW = W - 32;
            const ratio = Math.max(0, Math.min(1, touchX / scrubberW));
            handleSeek(ratio);
          }}
          style={styles.scrubberTrack}
        >
          <View
            style={[
              styles.scrubberProgress,
              { width: `${Math.min(100, (currentTime / (duration || 1)) * 100)}%` }
            ]}
          />
          <View
            style={[
              styles.scrubberThumb,
              { left: `${Math.min(97, (currentTime / (duration || 1)) * 100)}%` }
            ]}
          />
        </TouchableOpacity>

        {/* Buttons Row */}
        <View style={styles.transportRow}>
          {/* Play/Pause Button */}
          <TouchableOpacity
            onPress={onTogglePlay}
            style={styles.playButton}
          >
            {isPlaying ? <Pause color="#000" size={16} /> : <Play color="#000" size={16} />}
            <Text style={styles.playButtonText}>{isPlaying ? 'PAUSE' : 'PLAY'}</Text>
          </TouchableOpacity>

          {/* Step Backward */}
          <TouchableOpacity
            onPress={() => handleStep('back')}
            style={styles.iconButton}
          >
            <SkipBack color="#fff" size={16} />
          </TouchableOpacity>

          {/* Step Forward */}
          <TouchableOpacity
            onPress={() => handleStep('forward')}
            style={styles.iconButton}
          >
            <SkipForward color="#fff" size={16} />
          </TouchableOpacity>

          {/* Timestamp Pill */}
          <View style={styles.timePill}>
            <Text style={styles.timeText}>
              {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
            </Text>
          </View>
        </View>

        {/* Speed Pills and Fullscreen */}
        <View style={styles.secondaryControlsRow}>
          <View style={styles.speedGroup}>
            {[0.25, 0.5, 1].map((spd) => (
              <TouchableOpacity
                key={spd}
                onPress={() => handleChangeSpeed(spd)}
                style={[
                  styles.speedPill,
                  selectedSpeed === spd && styles.speedPillActive
                ]}
              >
                <Text
                  style={[
                    styles.speedPillText,
                    selectedSpeed === spd && styles.speedPillTextActive
                  ]}
                >
                  {spd}x
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.fullscreenButton}>
            <Maximize color="#fff" size={16} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
    borderRadius: 24,
    overflow: 'hidden',
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  svgOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  topHudContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 20,
  },
  comboBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eab308',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    shadowColor: '#eab308',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 5,
  },
  comboText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 12,
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  armorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(24, 24, 27, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  armorText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  bottomControlBar: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    zIndex: 20,
    gap: 10,
  },
  scrubberTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    position: 'relative',
    justifyContent: 'center',
  },
  scrubberProgress: {
    height: '100%',
    backgroundColor: '#eab308',
    borderRadius: 4,
  },
  scrubberThumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#f59e0b',
    top: -4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  transportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eab308',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  playButtonText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 12,
    fontStyle: 'italic',
  },
  iconButton: {
    backgroundColor: 'rgba(24, 24, 27, 0.8)',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  timePill: {
    backgroundColor: 'rgba(24, 24, 27, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  secondaryControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  speedGroup: {
    flexDirection: 'row',
    backgroundColor: 'rgba(24, 24, 27, 0.8)',
    borderRadius: 10,
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  speedPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  speedPillActive: {
    backgroundColor: '#eab308',
  },
  speedPillText: {
    color: '#71717a',
    fontSize: 11,
    fontWeight: 'bold',
  },
  speedPillTextActive: {
    color: '#000',
    fontWeight: '900',
  },
  fullscreenButton: {
    backgroundColor: 'rgba(24, 24, 27, 0.8)',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
});
