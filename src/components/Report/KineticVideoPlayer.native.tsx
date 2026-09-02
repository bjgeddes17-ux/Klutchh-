import React, { useRef, useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutChangeEvent,
  Modal,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import Svg, {
  Line,
  Circle,
  Polygon,
  Rect,
  Text as SvgText,
  G,
} from 'react-native-svg';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Zap,
  ShieldCheck,
  Maximize2,
  Minimize2,
  RefreshCw,
  X,
} from 'lucide-react-native';
import { SportRule, FrameAnalysis, MediaPipeLandmark } from '../../types';
import { calculateAngle, mapLandmarkToScreen, getVideoRenderRect } from '../../utils/geometry';

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
  onPause?: () => void;
}

import { useVideoPlayback } from '../../hooks/useVideoPlayback.native';

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
  onTogglePlay,
  onPause,
}) => {
  const [isFullscreenModal, setIsFullscreenModal] = useState<boolean>(false);

  const {
    videoRef,
    fullscreenVideoRef,
    duration,
    selectedSpeed,
    isScrubbing,
    handlePlaybackStatusUpdate,
    handleSeek,
    handleStep,
    handleChangeSpeed,
  } = useVideoPlayback({
    isPlaying,
    onTimeUpdate,
    onDurationChange,
    onPause,
    isFullscreenModal,
    initialPlaybackRate: playbackRate,
  });

  const [isMirrored, setIsMirrored] = useState(false);
  const [layout, setLayout] = useState({ width: 360, height: 480 });
  const [videoDimensions, setVideoDimensions] = useState({ width: 9, height: 16 });
  const [renderedRect, setRenderedRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [fullscreenLayout, setFullscreenLayout] = useState({
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  });

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setLayout({ width, height });
    }
  };

  const handleFullscreenLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setFullscreenLayout({ width, height });
    }
  };

  // Find closest analyzed frame based on currentTime (Binary Search)
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

  const handleReadyForDisplay = (event: any) => {
    if (event.naturalSize) {
      const { width, height } = event.naturalSize;
      setVideoDimensions({ width, height });
      
      // Calculate initial rendered rect
      const rect = getVideoRenderRect(
        isFullscreenModal ? fullscreenLayout.width : layout.width,
        isFullscreenModal ? fullscreenLayout.height : layout.height,
        width,
        height
      );
      setRenderedRect(rect);
    }
  };

  // Recalculate rendered rect when layout or dimensions change
  useEffect(() => {
    const curW = isFullscreenModal ? fullscreenLayout.width : layout.width;
    const curH = isFullscreenModal ? fullscreenLayout.height : layout.height;
    if (curW > 0 && curH > 0 && videoDimensions.width > 0) {
      const rect = getVideoRenderRect(curW, curH, videoDimensions.width, videoDimensions.height);
      setRenderedRect(rect);
    }
  }, [layout, fullscreenLayout, videoDimensions, isFullscreenModal]);

  const landmarks = currentFrame?.landmarks;
  const curW = isFullscreenModal ? fullscreenLayout.width : layout.width;
  const curH = isFullscreenModal ? fullscreenLayout.height : layout.height;

  const getScreenCoords = (lm?: MediaPipeLandmark) => {
    return mapLandmarkToScreen(
      lm!,
      isFullscreenModal ? fullscreenLayout.width : layout.width,
      isFullscreenModal ? fullscreenLayout.height : layout.height,
      videoDimensions.width,
      videoDimensions.height,
      undefined,
      0,
      isMirrored,
      false, // debugForceNativeRotation
      true,  // isNative: TRUE
      landmarks
    );
  };

  // Render Real Biometric Rules Callouts (Computing real angles from landmarks)
  const visibleRuleCallouts = useMemo(() => {
    if (!landmarks || landmarks.length < 29 || !sportRule?.jointRules) return [];

    const activePhase = currentFrame?.detectedPhase || sportRule.phases?.[0];
    const rules = sportRule.jointRules.filter((r) => {
      if (!activePhase || activePhase === 'Auto-Detect' || activePhase === 'All') return true;
      return r.phase === activePhase || currentFrame?.ruleResults?.[r.id] !== 'optimal';
    });

    // Select top 3 relevant non-crowded rules
    const selected = (rules.length > 3 ? rules.slice(0, 3) : rules).map((rule, index) => {
      const [, vertexIdx] = rule.keypoints || [0, 11, 13];
      const vertex = landmarks[vertexIdx] || landmarks[11];
      const vScreen = getScreenCoords(vertex);
      const vx = vScreen.visible ? vScreen.x : curW * 0.5;
      const vy = vScreen.visible ? vScreen.y : curH * 0.3 + index * 40;

      // Calculate real angle from landmarks if precomputed angle is missing
      let angleVal = currentFrame?.angles?.[rule.id];
      if (angleVal === undefined && rule.keypoints?.length === 3) {
        const p1 = landmarks[rule.keypoints[0]];
        const p2 = landmarks[rule.keypoints[1]];
        const p3 = landmarks[rule.keypoints[2]];
        if (p1 && p2 && p3) {
          angleVal = calculateAngle(p1, p2, p3);
        }
      }
      if (angleVal === undefined) {
        angleVal = Math.round((rule.idealMin + rule.idealMax) / 2);
      }

      // Check against ideal corridor
      let status: 'optimal' | 'warning' | 'error' = 'optimal';
      if (angleVal < rule.idealMin || angleVal > rule.idealMax) {
        const delta = angleVal < rule.idealMin ? rule.idealMin - angleVal : angleVal - rule.idealMax;
        // AGGRESSIVE RED: Trigger error if off by more than 5 degrees
        status = delta > 5 ? 'error' : 'warning';
      }

      const cleanName = rule.name
        .replace(/ Biometric Rule$/i, '')
        .replace(/ Rule$/i, '')
        .trim();

      const displayAngle = typeof angleVal === 'number' ? angleVal.toFixed(0) : angleVal;
      const labelText = `${cleanName}: ${displayAngle}${rule.unit || '°'}`;

      // Staggered Y positioning so callouts never collide
      const targetY = Math.max(60, Math.min(curH - 120, vy - 10 + (index % 2 === 0 ? -16 : 16)));
      const isRightSide = vx < curW * 0.5;
      const pillX = isRightSide ? Math.min(curW - 190, vx + 24) : Math.max(16, vx - 180);

      return {
        id: rule.id,
        labelText,
        vx,
        vy,
        pillX,
        pillY: targetY,
        status,
        color: status === 'error' ? '#ef4444' : status === 'warning' ? '#f59e0b' : '#22c55e',
      };
    });

    return selected;
  }, [landmarks, currentFrame, sportRule, curW, curH, renderedRect]);

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {/* Video Surface */}
      <Video
        ref={videoRef}
        source={{ uri: videoUrl }}
        rate={selectedSpeed}
        isMuted={true}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={isPlaying && !isFullscreenModal}
        isLooping={true}
        onPlaybackStatusUpdate={isFullscreenModal ? undefined : (s) => handlePlaybackStatusUpdate(s, false)}
        onReadyForDisplay={handleReadyForDisplay}
        style={styles.video}
      />

      {/* Svg Biomechanical Overlay */}
      {landmarks && landmarks.length >= 29 && (
        <Svg style={styles.svgOverlay} width={curW} height={curH}>
          {/* 1. Torso Volume Polygon */}
          {landmarks[11] && landmarks[12] && landmarks[24] && landmarks[23] && (() => {
            const p1 = getScreenCoords(landmarks[11]);
            const p2 = getScreenCoords(landmarks[12]);
            const p3 = getScreenCoords(landmarks[24]);
            const p4 = getScreenCoords(landmarks[23]);
            if (!p1.visible || !p2.visible || !p3.visible || !p4.visible) return null;
            return (
              <Polygon
                points={`
                  ${p1.x},${p1.y}
                  ${p2.x},${p2.y}
                  ${p3.x},${p3.y}
                  ${p4.x},${p4.y}
                `}
                fill="rgba(56, 189, 248, 0.08)"
                stroke="rgba(56, 189, 248, 0.25)"
                strokeWidth={1.5}
              />
            );
          })()}

          {/* 2. Head / Helmet Indicator */}
          {landmarks[0] && (() => {
            const p = getScreenCoords(landmarks[0]);
            if (!p.visible) return null;
            return (
              <Circle
                cx={p.x}
                cy={p.y - 4}
                r={10}
                fill="rgba(56, 189, 248, 0.12)"
                stroke="rgba(56, 189, 248, 0.4)"
                strokeWidth={1.5}
              />
            );
          })()}

          {/* 3. Left Limbs (Purple) */}
          {[
            [11, 13], [13, 15],
            [23, 25], [25, 27], [27, 31], [27, 29],
            [11, 23],
          ].map(([i1, i2], idx) => {
            const p1 = getScreenCoords(landmarks[i1]);
            const p2 = getScreenCoords(landmarks[i2]);
            if (!p1.visible || !p2.visible) return null;

            // DYNAMIC COLOR
            const hasError = visibleRuleCallouts.some(c => 
              c.status === 'error' && sportRule.jointRules.find(r => r.id === c.id)?.keypoints.some(kp => kp === i1 || kp === i2)
            );
            const color = hasError ? '#ef4444' : '#c084fc';

            return (
              <Line
                key={`left-limb-${idx}`}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={color}
                strokeWidth={5}
                strokeLinecap="round"
              />
            );
          })}

          {/* 4. Right Limbs (Neon Green) */}
          {[
            [12, 14], [14, 16],
            [24, 26], [26, 28], [28, 32], [28, 30],
            [12, 24],
          ].map(([i1, i2], idx) => {
            const p1 = getScreenCoords(landmarks[i1]);
            const p2 = getScreenCoords(landmarks[i2]);
            if (!p1.visible || !p2.visible) return null;

            // DYNAMIC COLOR
            const hasError = visibleRuleCallouts.some(c => 
              c.status === 'error' && sportRule.jointRules.find(r => r.id === c.id)?.keypoints.some(kp => kp === i1 || kp === i2)
            );
            const color = hasError ? '#ef4444' : '#22c55e';

            return (
              <Line
                key={`right-limb-${idx}`}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={color}
                strokeWidth={5}
                strokeLinecap="round"
              />
            );
          })}

          {/* 5. Center Shoulders & Hips Connections */}
          {landmarks[11] && landmarks[12] && (() => {
            const p1 = getScreenCoords(landmarks[11]);
            const p2 = getScreenCoords(landmarks[12]);
            if (!p1.visible || !p2.visible) return null;
            return (
              <Line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="#38bdf8"
                strokeWidth={2}
              />
            );
          })()}
          {landmarks[23] && landmarks[24] && (() => {
            const p1 = getScreenCoords(landmarks[23]);
            const p2 = getScreenCoords(landmarks[24]);
            if (!p1.visible || !p2.visible) return null;
            return (
              <Line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="#38bdf8"
                strokeWidth={2}
              />
            );
          })()}

          {/* 6. Joint Pivot Circles */}
          {landmarks.map((lm, i) => {
            if (!lm) return null;
            if (i > 0 && i < 11) return null;
            const p = getScreenCoords(lm);
            if (!p.visible) return null;

            const isLeft = [11, 13, 15, 23, 25, 27, 29, 31].includes(i);
            
            // DYNAMIC COLOR: Check if this joint is part of a failing rule
            const hasError = visibleRuleCallouts.some(c => 
              c.status === 'error' && sportRule.jointRules.find(r => r.id === c.id)?.keypoints.includes(i)
            );
            const hasWarning = !hasError && visibleRuleCallouts.some(c => 
              c.status === 'warning' && sportRule.jointRules.find(r => r.id === c.id)?.keypoints.includes(i)
            );

            const ringColor = hasError ? '#ef4444' : hasWarning ? '#f59e0b' : (isLeft ? '#c084fc' : '#22c55e');

            return (
              <G key={`joint-${i}`}>
                <Circle
                  cx={p.x}
                  cy={p.y}
                  r={8}
                  fill="rgba(0,0,0,0.8)"
                  stroke={ringColor}
                  strokeWidth={2}
                />
                <Circle
                  cx={p.x}
                  cy={p.y}
                  r={3}
                  fill="#ffffff"
                />
              </G>
            );
          })}

          {/* 7. Clean Floating Angle Callouts */}
          {visibleRuleCallouts.map((callout, idx) => {
            const pillW = Math.min(190, Math.max(120, callout.labelText.length * 6.8 + 24));

            return (
              <G key={`callout-${idx}`}>
                <Line
                  x1={callout.vx}
                  y1={callout.vy}
                  x2={callout.pillX + (callout.pillX > callout.vx ? 0 : pillW)}
                  y2={callout.pillY + 9}
                  stroke={callout.color}
                  strokeWidth={1}
                  strokeDasharray="2,2"
                  opacity={0.85}
                />

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

                <Circle
                  cx={callout.pillX + 8}
                  cy={callout.pillY + 9}
                  r={2.8}
                  fill={callout.color}
                />

                <SvgText
                  x={callout.pillX + 15}
                  y={callout.pillY + 12.5}
                  fill="#ffffff"
                  fontSize="9"
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

      {/* Top Gamified HUD Badges */}
      <View style={styles.topHudContainer}>
        <View style={styles.hudBadgesGroup}>
          <View style={styles.comboBadge}>
            <Zap color="#f59e0b" size={13} />
            <Text style={styles.comboText}>FLOW: x{Math.floor(currentTime * 2) + 1}</Text>
          </View>

          <View style={styles.armorBadge}>
            <ShieldCheck color="#38bdf8" size={13} />
            <Text style={styles.armorText}>ARMOR: 100%</Text>
          </View>
        </View>

        {/* Overlay Fullscreen Toggle Button */}
        <TouchableOpacity
          onPress={() => setIsFullscreenModal(true)}
          style={styles.fullscreenOverlayBtn}
        >
          <Maximize2 color="#eab308" size={14} />
          <Text style={styles.fullscreenOverlayText}>FULLSCREEN</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Transport Controls */}
      <View style={styles.bottomControlBar}>
        {/* Scrubber Bar */}
        <View
          style={styles.scrubberTrack}
          onStartShouldSetResponder={() => true}
          onResponderGrant={(e) => {
            const touchX = e.nativeEvent.locationX;
            const trackW = Math.max(1, curW - 32);
            const ratio = Math.max(0, Math.min(1, (touchX - 16) / (trackW - 32)));
            handleSeek(ratio, false, currentTime);
          }}
          onResponderMove={(e) => {
            const touchX = e.nativeEvent.locationX;
            const trackW = Math.max(1, curW - 32);
            const ratio = Math.max(0, Math.min(1, (touchX - 16) / (trackW - 32)));
            handleSeek(ratio, false, currentTime);
          }}
          onResponderRelease={(e) => {
            const touchX = e.nativeEvent.locationX;
            const trackW = Math.max(1, curW - 32);
            const ratio = Math.max(0, Math.min(1, (touchX - 16) / (trackW - 32)));
            handleSeek(ratio, true, currentTime);
          }}
        >
          <View
            style={[
              styles.scrubberProgress,
              { width: `${Math.min(100, (currentTime / (duration || 1)) * 100)}%` },
            ]}
          />
          <View
            style={[
              styles.scrubberThumb,
              { left: `${Math.min(97, (currentTime / (duration || 1)) * 100)}%` },
            ]}
          />
        </View>

        {/* Primary Controls Row */}
        <View style={styles.primaryControlsRow}>
          <View style={styles.playbackGroup}>
            <TouchableOpacity onPress={() => handleStep('back', currentTime)} style={styles.stepButton}>
              <SkipBack color="#fff" size={18} />
            </TouchableOpacity>

            <TouchableOpacity onPress={onTogglePlay} style={styles.playButtonBig}>
              {isPlaying ? <Pause color="#000" fill="#000" size={24} /> : <Play color="#000" fill="#000" size={24} />}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleStep('forward', currentTime)} style={styles.stepButton}>
              <SkipForward color="#fff" size={18} />
            </TouchableOpacity>
          </View>

          <View style={styles.timeInfoGroup}>
            <Text style={styles.mainTimeText}>{currentTime.toFixed(2)}s</Text>
            <Text style={styles.slashText}>/</Text>
            <Text style={styles.durationTimeText}>{duration.toFixed(2)}s</Text>
          </View>
        </View>

        {/* Secondary Controls Row (Speed) */}
        <View style={styles.secondaryControlsRow}>
          <View style={styles.speedSelectorGrid}>
            {[0.25, 0.5, 1].map((spd) => (
              <TouchableOpacity
                key={spd}
                onPress={() => handleChangeSpeed(spd)}
                style={[
                  styles.speedPillLarge,
                  selectedSpeed === spd && styles.speedPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.speedTextLarge,
                    selectedSpeed === spd && styles.speedTextActive,
                  ]}
                >
                  {spd === 1 ? 'NORMAL (1x)' : `${spd}x SLOW`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Fullscreen Player Modal */}
      <Modal
        visible={isFullscreenModal}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setIsFullscreenModal(false)}
      >
        <View style={styles.fullscreenContainer} onLayout={handleFullscreenLayout}>
          <StatusBar hidden />

          {/* Fullscreen Video */}
          <Video
            ref={fullscreenVideoRef}
            source={{ uri: videoUrl }}
            rate={selectedSpeed}
            isMuted={true}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={isPlaying && isFullscreenModal}
            isLooping={true}
            onPlaybackStatusUpdate={isFullscreenModal ? (s) => handlePlaybackStatusUpdate(s, true) : undefined}
            onReadyForDisplay={handleReadyForDisplay}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Fullscreen SVG Overlay */}
          {landmarks && landmarks.length >= 29 && renderedRect && (
            <Svg
              style={StyleSheet.absoluteFillObject}
              width={fullscreenLayout.width}
              height={fullscreenLayout.height}
            >
              {/* Torso */}
              {landmarks[11] && landmarks[12] && landmarks[24] && landmarks[23] && (() => {
                const p1 = getScreenCoords(landmarks[11]);
                const p2 = getScreenCoords(landmarks[12]);
                const p3 = getScreenCoords(landmarks[24]);
                const p4 = getScreenCoords(landmarks[23]);
                if (!p1.visible || !p2.visible || !p3.visible || !p4.visible) return null;
                return (
                  <Polygon
                    points={`
                      ${p1.x},${p1.y}
                      ${p2.x},${p2.y}
                      ${p3.x},${p3.y}
                      ${p4.x},${p4.y}
                    `}
                    fill="rgba(56, 189, 248, 0.08)"
                    stroke="rgba(56, 189, 248, 0.25)"
                    strokeWidth={1.5}
                  />
                );
              })()}

              {/* Left Limbs */}
              {[
                [11, 13], [13, 15],
                [23, 25], [25, 27], [27, 31], [27, 29],
                [11, 23],
              ].map(([i1, i2], idx) => {
                const p1 = getScreenCoords(landmarks[i1]);
                const p2 = getScreenCoords(landmarks[i2]);
                if (!p1.visible || !p2.visible) return null;

                // DYNAMIC COLOR
                const hasError = visibleRuleCallouts.some(c => 
                  c.status === 'error' && sportRule.jointRules.find(r => r.id === c.id)?.keypoints.some(kp => kp === i1 || kp === i2)
                );
                const color = hasError ? '#ef4444' : '#c084fc';

                return (
                  <Line
                    key={`fs-left-${idx}`}
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke={color}
                    strokeWidth={4}
                    strokeLinecap="round"
                  />
                );
              })}

              {/* Right Limbs */}
              {[
                [12, 14], [14, 16],
                [24, 26], [26, 28], [28, 32], [28, 30],
                [12, 24],
              ].map(([i1, i2], idx) => {
                const p1 = getScreenCoords(landmarks[i1]);
                const p2 = getScreenCoords(landmarks[i2]);
                if (!p1.visible || !p2.visible) return null;

                // DYNAMIC COLOR
                const hasError = visibleRuleCallouts.some(c => 
                  c.status === 'error' && sportRule.jointRules.find(r => r.id === c.id)?.keypoints.some(kp => kp === i1 || kp === i2)
                );
                const color = hasError ? '#ef4444' : '#22c55e';

                return (
                  <Line
                    key={`fs-right-${idx}`}
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke={color}
                    strokeWidth={4}
                    strokeLinecap="round"
                  />
                );
              })}

              {/* Center Connectors */}
              {landmarks[11] && landmarks[12] && (() => {
                const p1 = getScreenCoords(landmarks[11]);
                const p2 = getScreenCoords(landmarks[12]);
                if (!p1.visible || !p2.visible) return null;
                return (
                  <Line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke="#38bdf8"
                    strokeWidth={2.5}
                  />
                );
              })()}
              {landmarks[23] && landmarks[24] && (() => {
                const p1 = getScreenCoords(landmarks[23]);
                const p2 = getScreenCoords(landmarks[24]);
                if (!p1.visible || !p2.visible) return null;
                return (
                  <Line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke="#38bdf8"
                    strokeWidth={2.5}
                  />
                );
              })()}

              {/* Joint Circles */}
              {landmarks.map((lm, i) => {
                if (!lm || (i > 0 && i < 11)) return null;
                const p = getScreenCoords(lm);
                if (!p.visible) return null;
                const isLeft = [11, 13, 15, 23, 25, 27, 29, 31].includes(i);
                return (
                  <G key={`fs-joint-${i}`}>
                    <Circle
                      cx={p.x}
                      cy={p.y}
                      r={5}
                      fill="rgba(0,0,0,0.7)"
                      stroke={isLeft ? '#c084fc' : '#22c55e'}
                      strokeWidth={2}
                    />
                    <Circle
                      cx={p.x}
                      cy={p.y}
                      r={2}
                      fill="#ffffff"
                    />
                  </G>
                );
              })}

              {/* Angle Callouts in Fullscreen */}
              {visibleRuleCallouts.map((callout, idx) => {
                const pillW = Math.min(190, Math.max(120, callout.labelText.length * 6.8 + 24));
                return (
                  <G key={`fs-callout-${idx}`}>
                    <Line
                      x1={callout.vx}
                      y1={callout.vy}
                      x2={callout.pillX + (callout.pillX > callout.vx ? 0 : pillW)}
                      y2={callout.pillY + 9}
                      stroke={callout.color}
                      strokeWidth={1}
                      strokeDasharray="2,2"
                      opacity={0.85}
                    />
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
                    <Circle cx={callout.pillX + 8} cy={callout.pillY + 9} r={2.8} fill={callout.color} />
                    <SvgText
                      x={callout.pillX + 15}
                      y={callout.pillY + 12.5}
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      {callout.labelText}
                    </SvgText>
                  </G>
                );
              })}
            </Svg>
          )}

          {/* Top Fullscreen Header with Exit Button */}
          <View style={styles.fullscreenTopBar}>
            <View style={styles.hudBadgesGroup}>
              <View style={styles.comboBadge}>
                <Zap color="#f59e0b" size={13} />
                <Text style={styles.comboText}>FLOW: x{Math.floor(currentTime * 2) + 1}</Text>
              </View>
              <View style={styles.armorBadge}>
                <ShieldCheck color="#38bdf8" size={13} />
                <Text style={styles.armorText}>ARMOR: 100%</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setIsFullscreenModal(false)}
              style={styles.exitFullscreenBtn}
            >
              <Minimize2 color="#ffffff" size={14} />
              <Text style={styles.exitFullscreenText}>EXIT FULLSCREEN</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Fullscreen Transport Bar */}
          <View style={styles.fullscreenBottomBar}>
            <View
              style={styles.scrubberTrack}
              onStartShouldSetResponder={() => true}
              onResponderGrant={(e) => {
                const touchX = e.nativeEvent.locationX;
                const trackW = Math.max(1, fullscreenLayout.width - 64);
                const ratio = Math.max(0, Math.min(1, (touchX - 32) / (trackW - 64)));
                handleSeek(ratio, false, currentTime);
              }}
              onResponderMove={(e) => {
                const touchX = e.nativeEvent.locationX;
                const trackW = Math.max(1, fullscreenLayout.width - 64);
                const ratio = Math.max(0, Math.min(1, (touchX - 32) / (trackW - 64)));
                handleSeek(ratio, false, currentTime);
              }}
              onResponderRelease={(e) => {
                const touchX = e.nativeEvent.locationX;
                const trackW = Math.max(1, fullscreenLayout.width - 64);
                const ratio = Math.max(0, Math.min(1, (touchX - 32) / (trackW - 64)));
                handleSeek(ratio, true, currentTime);
              }}
            >
              <View
                style={[
                  styles.scrubberProgress,
                  { width: `${Math.min(100, (currentTime / (duration || 1)) * 100)}%` },
                ]}
              />
              <View
                style={[
                  styles.scrubberThumb,
                  { left: `${Math.min(97, (currentTime / (duration || 1)) * 100)}%` },
                ]}
              />
            </View>

            <View style={styles.primaryControlsRow}>
              <View style={styles.playbackGroup}>
                <TouchableOpacity
                  onPress={() => setIsMirrored(!isMirrored)}
                  style={[
                    styles.stepButton,
                    isMirrored && { backgroundColor: 'rgba(234, 179, 8, 0.2)', borderColor: '#eab308', borderWidth: 1 }
                  ]}
                >
                  <RefreshCw color={isMirrored ? "#eab308" : "#ffffff"} size={16} />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => handleStep('back', currentTime)} style={styles.stepButton}>
                  <SkipBack color="#fff" size={18} />
                </TouchableOpacity>

                <TouchableOpacity onPress={onTogglePlay} style={styles.playButtonBig}>
                  {isPlaying ? <Pause color="#000" fill="#000" size={24} /> : <Play color="#000" fill="#000" size={24} />}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => handleStep('forward', currentTime)} style={styles.stepButton}>
                  <SkipForward color="#fff" size={18} />
                </TouchableOpacity>
              </View>

              <View style={styles.timeInfoGroup}>
                <Text style={styles.mainTimeText}>{currentTime.toFixed(2)}s</Text>
                <Text style={styles.slashText}>/</Text>
                <Text style={styles.durationTimeText}>{duration.toFixed(2)}s</Text>
              </View>
            </View>

            <View style={styles.secondaryControlsRow}>
              <View style={styles.speedSelectorGrid}>
                {[0.25, 0.5, 1].map((spd) => (
                  <TouchableOpacity
                    key={spd}
                    onPress={() => handleChangeSpeed(spd)}
                    style={[
                      styles.speedPillLarge,
                      selectedSpeed === spd && styles.speedPillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.speedTextLarge,
                        selectedSpeed === spd && styles.speedTextActive,
                      ]}
                    >
                      {spd === 1 ? 'NORMAL' : `${spd}x`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 480, // High-impact centerpiece height
    backgroundColor: '#000000',
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  svgOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  topHudContainer: {
    position: 'absolute',
    top: 10,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 20,
  },
  hudBadgesGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fullscreenOverlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(9, 9, 11, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.4)',
  },
  fullscreenOverlayText: {
    color: '#eab308',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  comboBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(9, 9, 11, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  comboText: {
    color: '#f59e0b',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  armorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(9, 9, 11, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  armorText: {
    color: '#38bdf8',
    fontSize: 9.5,
    fontWeight: '900',
  },
  bottomControlBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(9, 9, 11, 0.98)',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  primaryControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  playbackGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playButtonBig: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#eab308',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  stepButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeInfoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  mainTimeText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  slashText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 14,
  },
  durationTimeText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  speedSelectorGrid: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  speedPillLarge: {
    flex: 1,
    height: 34,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  speedPillActive: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderColor: '#eab308',
    borderWidth: 1,
  },
  speedTextLarge: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  speedTextActive: {
    color: '#eab308',
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  fullscreenTopBar: {
    position: 'absolute',
    top: 36,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 50,
  },
  exitFullscreenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(24, 24, 27, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  exitFullscreenText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  fullscreenBottomBar: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(9, 9, 11, 0.92)',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#27272a',
    zIndex: 50,
  },
  scrubberTrack: {
    width: '100%',
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 5,
    position: 'relative',
    marginBottom: 16,
  },
  scrubberProgress: {
    height: '100%',
    backgroundColor: '#eab308',
    borderRadius: 5,
  },
  scrubberThumb: {
    position: 'absolute',
    top: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ffffff',
    borderWidth: 3,
    borderColor: '#eab308',
    elevation: 3,
  },
});
