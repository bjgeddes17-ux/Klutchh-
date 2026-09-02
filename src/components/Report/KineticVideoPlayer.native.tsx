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
  const videoRef = useRef<Video>(null);
  const fullscreenVideoRef = useRef<Video>(null);
  const isScrubbing = useRef(false);
  const [layout, setLayout] = useState({ width: 360, height: 640 });
  const [selectedSpeed, setSelectedSpeed] = useState<number>(playbackRate);
  const [duration, setDuration] = useState<number>(3.99);
  const [videoDimensions, setVideoDimensions] = useState({ width: 9, height: 16 });
  const [renderedRect, setRenderedRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isFullscreenModal, setIsFullscreenModal] = useState<boolean>(false);
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

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus, fromFullscreen: boolean) => {
    // Only accept updates from the active player to prevent "fighting" between instances
    if (status.isLoaded && !isScrubbing.current && (fromFullscreen === isFullscreenModal)) {
      const posSec = status.positionMillis / 1000;
      onTimeUpdate(posSec);
      if (status.durationMillis) {
        const durSec = status.durationMillis / 1000;
        setDuration(durSec);
        onDurationChange?.(durSec);
      }
    }
  };

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

  const handleSeek = (ratio: number, finished: boolean = false) => {
    isScrubbing.current = !finished;
    
    // Pause on seek start to prevent fighting
    if (!finished && isPlaying && onPause) {
      onPause();
    }

    const targetSec = Math.max(0, Math.min(duration, ratio * duration));
    
    // Always update parent time so skeleton moves
    onTimeUpdate(targetSec);
    
    // Perform actual video seek
    if (isFullscreenModal) {
      fullscreenVideoRef.current?.setPositionAsync(targetSec * 1000, { toleranceMillisBefore: 0, toleranceMillisAfter: 0 });
    } else {
      videoRef.current?.setPositionAsync(targetSec * 1000, { toleranceMillisBefore: 0, toleranceMillisAfter: 0 });
    }
  };

  const handleStep = (direction: 'back' | 'forward') => {
    const stepTime = 0.05;
    const target = direction === 'back'
      ? Math.max(0, currentTime - stepTime)
      : Math.min(duration, currentTime + stepTime);
    videoRef.current?.setPositionAsync(target * 1000);
  };

  const handleChangeSpeed = (speed: number) => {
    setSelectedSpeed(speed);
    videoRef.current?.setRateAsync(speed, true);
  };

  const landmarks = currentFrame?.landmarks;
  const curW = isFullscreenModal ? fullscreenLayout.width : layout.width;
  const curH = isFullscreenModal ? fullscreenLayout.height : layout.height;

  const getScreenCoords = (lm?: MediaPipeLandmark) => {
    if (!lm || !renderedRect) return { x: 0, y: 0, visible: false };
    
    // Using the pre-calculated renderedRect for absolute precision
    const lx = lm.x;
    const ly = lm.y;
    
    const confidenceValid = lm.visibility === undefined || lm.visibility >= 0.25;
    const visible = lx >= 0 && lx <= 1 && ly >= 0 && ly <= 1 && confidenceValid;
    
    const screenX = renderedRect.x + (lx * renderedRect.width);
    const screenY = renderedRect.y + (ly * renderedRect.height);
    
    return { x: screenX, y: screenY, visible };
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
        status = delta > 15 ? 'error' : 'warning';
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
        onPlaybackStatusUpdate={(s) => handlePlaybackStatusUpdate(s, false)}
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
            return (
              <Line
                key={`left-limb-${idx}`}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="#c084fc"
                strokeWidth={2.5}
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
            return (
              <Line
                key={`right-limb-${idx}`}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="#22c55e"
                strokeWidth={2.5}
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
            const ringColor = isLeft ? '#c084fc' : '#22c55e';

            return (
              <G key={`joint-${i}`}>
                <Circle
                  cx={p.x}
                  cy={p.y}
                  r={4}
                  fill="rgba(0,0,0,0.7)"
                  stroke={ringColor}
                  strokeWidth={1.5}
                />
                <Circle
                  cx={p.x}
                  cy={p.y}
                  r={1.8}
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
            isScrubbing.current = true;
            const touchX = e.nativeEvent.locationX;
            const scrubberW = curW - 32;
            const ratio = Math.max(0, Math.min(1, touchX / Math.max(1, scrubberW)));
            handleSeek(ratio, false);
          }}
          onResponderMove={(e) => {
            const touchX = e.nativeEvent.locationX;
            const scrubberW = curW - 32;
            const ratio = Math.max(0, Math.min(1, touchX / Math.max(1, scrubberW)));
            handleSeek(ratio, false);
          }}
          onResponderRelease={(e) => {
            const touchX = e.nativeEvent.locationX;
            const scrubberW = curW - 32;
            const ratio = Math.max(0, Math.min(1, touchX / Math.max(1, scrubberW)));
            handleSeek(ratio, true);
            isScrubbing.current = false;
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

        {/* Buttons Row */}
        <View style={styles.transportRow}>
          <TouchableOpacity
            onPress={onTogglePlay}
            style={styles.playButton}
          >
            {isPlaying ? <Pause color="#000" size={14} /> : <Play color="#000" size={14} />}
            <Text style={styles.playButtonText}>{isPlaying ? 'PAUSE' : 'PLAY'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleStep('back')}
            style={styles.iconButton}
          >
            <SkipBack color="#fff" size={14} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleStep('forward')}
            style={styles.iconButton}
          >
            <SkipForward color="#fff" size={14} />
          </TouchableOpacity>

          <View style={styles.timePill}>
            <Text style={styles.timeText}>
              {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
            </Text>
          </View>
        </View>

        {/* Speed Pills */}
        <View style={styles.secondaryControlsRow}>
          <View style={styles.speedGroup}>
            {[0.25, 0.5, 1].map((spd) => (
              <TouchableOpacity
                key={spd}
                onPress={() => handleChangeSpeed(spd)}
                style={[
                  styles.speedPill,
                  selectedSpeed === spd && styles.speedPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.speedText,
                    selectedSpeed === spd && styles.speedTextActive,
                  ]}
                >
                  {spd}x
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
            onPlaybackStatusUpdate={(s) => handlePlaybackStatusUpdate(s, true)}
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
                return (
                  <Line
                    key={`fs-left-${idx}`}
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke="#c084fc"
                    strokeWidth={3}
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
                return (
                  <Line
                    key={`fs-right-${idx}`}
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke="#22c55e"
                    strokeWidth={3}
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
                isScrubbing.current = true;
                const touchX = e.nativeEvent.locationX;
                const scrubberW = Math.max(1, fullscreenLayout.width - 60); 
                const ratio = Math.max(0, Math.min(1, touchX / scrubberW));
                handleSeek(ratio, false);
              }}
              onResponderMove={(e) => {
                const touchX = e.nativeEvent.locationX;
                const scrubberW = Math.max(1, fullscreenLayout.width - 60);
                const ratio = Math.max(0, Math.min(1, touchX / scrubberW));
                handleSeek(ratio, false);
              }}
              onResponderRelease={(e) => {
                const touchX = e.nativeEvent.locationX;
                const scrubberW = Math.max(1, fullscreenLayout.width - 60);
                const ratio = Math.max(0, Math.min(1, touchX / scrubberW));
                handleSeek(ratio, true);
                isScrubbing.current = false;
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

            <View style={styles.transportRow}>
              <TouchableOpacity
                onPress={onTogglePlay}
                style={styles.playButton}
              >
                {isPlaying ? <Pause color="#000" size={14} /> : <Play color="#000" size={14} />}
                <Text style={styles.playButtonText}>{isPlaying ? 'PAUSE' : 'PLAY'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleStep('back')}
                style={styles.iconButton}
              >
                <SkipBack color="#fff" size={14} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleStep('forward')}
                style={styles.iconButton}
              >
                <SkipForward color="#fff" size={14} />
              </TouchableOpacity>

              <View style={styles.timePill}>
                <Text style={styles.timeText}>
                  {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
                </Text>
              </View>

              <View style={styles.speedGroup}>
                {[0.25, 0.5, 1].map((spd) => (
                  <TouchableOpacity
                    key={spd}
                    onPress={() => handleChangeSpeed(spd)}
                    style={[
                      styles.speedPill,
                      selectedSpeed === spd && styles.speedPillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.speedText,
                        selectedSpeed === spd && styles.speedTextActive,
                      ]}
                    >
                      {spd}x
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
    aspectRatio: 16 / 9,
    minHeight: 220,
    maxHeight: 340,
    backgroundColor: '#000000',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#27272a',
    marginBottom: 14,
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
    backgroundColor: 'rgba(9, 9, 11, 0.94)',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
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
    height: 6,
    backgroundColor: '#27272a',
    borderRadius: 3,
    position: 'relative',
    marginBottom: 8,
  },
  scrubberProgress: {
    height: '100%',
    backgroundColor: '#eab308',
    borderRadius: 3,
  },
  scrubberThumb: {
    position: 'absolute',
    top: -3,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#eab308',
  },
  transportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eab308',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  playButtonText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '900',
  },
  iconButton: {
    backgroundColor: '#18181b',
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  timePill: {
    backgroundColor: '#18181b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  timeText: {
    color: '#a1a1aa',
    fontSize: 9.5,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  secondaryControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  speedGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  speedPill: {
    backgroundColor: '#18181b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  speedPillActive: {
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#eab308',
  },
  speedText: {
    color: '#71717a',
    fontSize: 8.5,
    fontWeight: 'bold',
  },
  speedTextActive: {
    color: '#eab308',
  },
});
