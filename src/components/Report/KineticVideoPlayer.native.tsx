import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutChangeEvent,
  Modal,
  StatusBar,
  Dimensions,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Animated, { useSharedValue, useAnimatedReaction, runOnJS, useFrameCallback } from 'react-native-reanimated';
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
  Target,
  Compass,
} from 'lucide-react-native';
import { SportRule, FrameAnalysis, MediaPipeLandmark } from '../../types';
import { calculateAngle, mapLandmarkToScreen, getVideoRenderRect, smoothLandmarkTimeSeries } from '../../utils/geometry';
import { detectMovementKeyframes } from '../../services/movementKeyframeEngine';
import { interpolatePoseAtTime } from '../../utils/poseInterpolation';

// Dynamic Biomechanical Deviation Color Scale (Green -> Blue -> Purple -> Red)
function getSegmentColor(
  kp1: number,
  kp2: number,
  landmarks: MediaPipeLandmark[] | null | undefined,
  sportRule: SportRule,
  activePhase?: string,
  customRules?: typeof sportRule.jointRules
): { color: string; strokeWidth: number } {
  const rulesToUse = customRules && customRules.length > 0 ? customRules : sportRule?.jointRules;
  if (!landmarks || landmarks.length < 17 || !rulesToUse) {
    return { color: '#3b82f6', strokeWidth: 2.0 };
  }

  let maxDelta = 0;
  let hasMatchingRule = false;

  for (const rule of rulesToUse) {
    if (!rule.keypoints || rule.keypoints.length !== 3) continue;
    if (!rule.keypoints.includes(kp1) && !rule.keypoints.includes(kp2)) continue;

    // Filter out rules that belong to a different sub-discipline or phase
    const isPuttingRule = rule.id.includes('putt') || rule.name.toLowerCase().includes('putting');
    const isPuttingPhase = activePhase ? activePhase.toLowerCase().includes('putt') : false;

    if (sportRule.id === 'golf') {
      if (isPuttingRule && !isPuttingPhase) continue;
      if (!isPuttingRule && isPuttingPhase) continue;
    }

    if (activePhase && activePhase !== 'Auto-Detect' && activePhase !== 'All' && rule.phase) {
      const normRulePhase = rule.phase.toLowerCase();
      const normActivePhase = activePhase.toLowerCase();
      const isPhaseMatch = normRulePhase.includes(normActivePhase) || normActivePhase.includes(normRulePhase) || normRulePhase === 'dynamic';
      if (!isPhaseMatch) continue;
    }

    const [k1, k2, k3] = rule.keypoints;
    const p1 = landmarks[k1];
    const p2 = landmarks[k2];
    const p3 = landmarks[k3];
    if (!p1 || !p2 || !p3) continue;

    const angle = calculateAngle(p1, p2, p3);
    if (angle === undefined || isNaN(angle)) continue;

    hasMatchingRule = true;

    // Apply level-based tolerance margin (15 degrees natural corridor buffer)
    const margin = 15;
    const minBound = Math.max(0, rule.idealMin - margin);
    const maxBound = Math.min(180, rule.idealMax + margin);

    if (angle < minBound) {
      const delta = minBound - angle;
      if (delta > maxDelta) maxDelta = delta;
    } else if (angle > maxBound) {
      const delta = angle - maxBound;
      if (delta > maxDelta) maxDelta = delta;
    }
  }

  if (!hasMatchingRule) {
    return { color: '#3b82f6', strokeWidth: 2.0 }; // Default Structural Bone: Electric Blue
  }

  if (maxDelta === 0) return { color: '#10b981', strokeWidth: 2.2 }; // Optimal Corridor: Emerald Green
  if (maxDelta <= 12) return { color: '#3b82f6', strokeWidth: 2.2 }; // Slight Variance: Electric Blue
  if (maxDelta <= 25) return { color: '#a855f7', strokeWidth: 2.5 }; // Moderate Variance: Neon Purple
  return { color: '#ef4444', strokeWidth: 3.0 }; // Severe Mechanical Fault: Crimson Red
}

function getJointColor(
  jointIdx: number,
  landmarks: MediaPipeLandmark[] | null | undefined,
  sportRule: SportRule,
  activePhase?: string,
  customRules?: typeof sportRule.jointRules
): string {
  const rulesToUse = customRules && customRules.length > 0 ? customRules : sportRule?.jointRules;
  if (!landmarks || landmarks.length < 17 || !rulesToUse) return '#3b82f6';

  let maxDelta = 0;
  let hasMatchingRule = false;

  for (const rule of rulesToUse) {
    if (!rule.keypoints || !rule.keypoints.includes(jointIdx)) continue;

    const isPuttingRule = rule.id.includes('putt') || rule.name.toLowerCase().includes('putting');
    const isPuttingPhase = activePhase ? activePhase.toLowerCase().includes('putt') : false;

    if (sportRule.id === 'golf') {
      if (isPuttingRule && !isPuttingPhase) continue;
      if (!isPuttingRule && isPuttingPhase) continue;
    }

    if (activePhase && activePhase !== 'Auto-Detect' && activePhase !== 'All' && rule.phase) {
      const normRulePhase = rule.phase.toLowerCase();
      const normActivePhase = activePhase.toLowerCase();
      const isPhaseMatch = normRulePhase.includes(normActivePhase) || normActivePhase.includes(normRulePhase) || normRulePhase === 'dynamic';
      if (!isPhaseMatch) continue;
    }

    const [k1, k2, k3] = rule.keypoints;
    const p1 = landmarks[k1];
    const p2 = landmarks[k2];
    const p3 = landmarks[k3];
    if (!p1 || !p2 || !p3) continue;

    const angle = calculateAngle(p1, p2, p3);
    if (angle === undefined || isNaN(angle)) continue;

    hasMatchingRule = true;

    const margin = 15;
    const minBound = Math.max(0, rule.idealMin - margin);
    const maxBound = Math.min(180, rule.idealMax + margin);

    if (angle < minBound) {
      const delta = minBound - angle;
      if (delta > maxDelta) maxDelta = delta;
    } else if (angle > maxBound) {
      const delta = angle - maxBound;
      if (delta > maxDelta) maxDelta = delta;
    }
  }

  if (!hasMatchingRule) return '#3b82f6'; // Neutral Joint Pivot

  if (maxDelta === 0) return '#10b981'; // Emerald Green (Optimal)
  if (maxDelta <= 12) return '#3b82f6'; // Electric Blue (Good)
  if (maxDelta <= 25) return '#a855f7'; // Neon Purple (Warning)
  return '#ef4444'; // Crimson Red (Error)
}

interface KineticVideoPlayerProps {
  videoUrl: string;
  sportRule: SportRule;
  techniqueId?: string;
  sortedFrames: FrameAnalysis[];
  isPlaying: boolean;
  currentTime: number;
  duration?: number;
  onTimeUpdate: (time: number) => void;
  onDurationChange?: (duration: number) => void;
  playbackRate?: number;
  isDataReady: boolean;
  viewMode?: 'student' | 'coach';
  onTogglePlay?: () => void;
  onPause?: () => void;
  hideSkeleton?: boolean;
  initialSkeletonScale?: number;
  filmstripFrames?: { timestamp: number; dataUrl: string }[];
  sourceDimensions?: { width: number; height: number };
}

import { useVideoPlayback } from '../../hooks/useVideoPlayback.native';

export const KineticVideoPlayer: React.FC<KineticVideoPlayerProps> = ({
  videoUrl,
  sportRule,
  techniqueId,
  sortedFrames,
  isPlaying,
  currentTime,
  duration: propDuration,
  onTimeUpdate,
  onDurationChange,
  playbackRate = 1,
  isDataReady,
  viewMode = 'student',
  onTogglePlay,
  onPause,
  hideSkeleton = false,
  initialSkeletonScale = 1.0,
  filmstripFrames = [],
  sourceDimensions,
}) => {
  const activeTechnique = useMemo(() => {
    return sportRule.techniques?.find((t) => t.id === techniqueId) || sportRule.techniques?.[0];
  }, [sportRule, techniqueId]);

  const activeTechniqueRules = useMemo(() => {
    return activeTechnique?.jointRules && activeTechnique.jointRules.length > 0
      ? activeTechnique.jointRules
      : sportRule.jointRules || [];
  }, [activeTechnique, sportRule]);

  const [isFullscreenModal, setIsFullscreenModal] = useState<boolean>(false);
  const [showSkeleton, setShowSkeleton] = useState<boolean>(!hideSkeleton);

  // Smart Biomechanical Alignment: 1:1 natural scale and 0 offsets for frame-perfect tracking
  const [skeletonScale, setSkeletonScale] = useState<number>(initialSkeletonScale || 1.0);
  const [skeletonOffsetX, setSkeletonOffsetX] = useState<number>(0);
  const [skeletonOffsetY, setSkeletonOffsetY] = useState<number>(0);

  const [trackWidth, setTrackWidth] = useState<number>(0);
  const [fsTrackWidth, setFsTrackWidth] = useState<number>(0);

  const fallbackDuration = useMemo(() => {
    if (sortedFrames && sortedFrames.length > 0) {
      const last = sortedFrames[sortedFrames.length - 1].timestamp;
      if (last > 0.5) return last;
    }
    return 3.5;
  }, [sortedFrames]);

  const {
    videoRef,
    fullscreenVideoRef,
    duration: nativeDuration,
    selectedSpeed,
    isScrubbing,
    handlePlaybackStatusUpdate,
    handleSeek,
    handleSeekToTime,
    handleStep,
    handleChangeSpeed,
  } = useVideoPlayback({
    isPlaying,
    onTimeUpdate,
    onDurationChange,
    onPause,
    onTogglePlay,
    isFullscreenModal,
    initialPlaybackRate: playbackRate,
    initialDuration: propDuration || fallbackDuration,
  });

  const duration = propDuration || nativeDuration;

  const movementKeyframes = useMemo(() => {
    return detectMovementKeyframes(sortedFrames, sportRule, duration || fallbackDuration, techniqueId);
  }, [sortedFrames, sportRule, duration, fallbackDuration, techniqueId]);

  const [isMirrored, setIsMirrored] = useState(false);
  const [layout, setLayout] = useState({ width: 360, height: 480 });
  const [videoDimensions, setVideoDimensions] = useState(
    sourceDimensions && sourceDimensions.width > 0 && sourceDimensions.height > 0
      ? { width: sourceDimensions.width, height: sourceDimensions.height }
      : { width: 9, height: 16 }
  );
  const [containerAspectRatio, setContainerAspectRatio] = useState<number | null>(
    sourceDimensions && sourceDimensions.width > 0 && sourceDimensions.height > 0
      ? sourceDimensions.width / sourceDimensions.height
      : null
  );
  const [renderedRect, setRenderedRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [fullscreenLayout, setFullscreenLayout] = useState({
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  });

  // Keep videoDimensions synchronized if sourceDimensions arrives or updates
  useEffect(() => {
    if (sourceDimensions && sourceDimensions.width > 0 && sourceDimensions.height > 0) {
      setVideoDimensions({ width: sourceDimensions.width, height: sourceDimensions.height });
      const aspect = sourceDimensions.width / sourceDimensions.height;
      setContainerAspectRatio(aspect);
    }
  }, [sourceDimensions]);

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

  // UI-Thread Reanimated Shared Value for Zero-Bridge Latency Pose Synchronization
  const currentTimeSV = useSharedValue(currentTime);
  const isPlayingSV = useSharedValue(isPlaying);
  const speedSV = useSharedValue(selectedSpeed);
  const durationSV = useSharedValue(duration || fallbackDuration);

  useEffect(() => {
    isPlayingSV.value = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    speedSV.value = selectedSpeed;
  }, [selectedSpeed]);

  useEffect(() => {
    durationSV.value = duration || fallbackDuration;
  }, [duration, fallbackDuration]);

  useEffect(() => {
    if (!isScrubbing.current) {
      currentTimeSV.value = currentTime;
    }
  }, [currentTime]);

  useFrameCallback((frameInfo) => {
    'worklet';
    if (isPlayingSV.value && frameInfo.timeSincePreviousFrame) {
      const dt = frameInfo.timeSincePreviousFrame / 1000;
      let nextTime = currentTimeSV.value + dt * speedSV.value;
      const maxD = durationSV.value || 3.5;
      
      // Stop exactly at the end
      if (nextTime >= maxD) {
        nextTime = maxD;
        isPlayingSV.value = false;
      }
      currentTimeSV.value = nextTime;
    }
  }, isPlaying);

  useAnimatedReaction(
    () => currentTimeSV.value,
    (val, prev) => {
      // Sync back to JS thread for UI (Slider, Text)
      // Throttled to ~30fps for bridge efficiency
      if (val !== prev && isPlayingSV.value && Math.abs(val - (prev || 0)) > 0.032) {
        runOnJS(onTimeUpdate)(val);
      }
    },
    [isPlaying]
  );

  // Continuous High-Precision Pose Interpolation Engine (< 1ms drift)
  const { currentFrame, interpolatedLandmarks, isPastData, driftMs } = useMemo(() => {
    return interpolatePoseAtTime(sortedFrames, currentTime, duration || fallbackDuration);
  }, [sortedFrames, currentTime, duration, fallbackDuration]);

  // Online Temporal Smoothing Filter (One-Euro / EMA):
  // Eliminates high-frequency frame extraction jitter while preserving instant dynamic reaction on fast swings/kicks
  const lastRenderedLandmarksRef = useRef<MediaPipeLandmark[] | null>(null);
  const smoothedLandmarks = useMemo(() => {
    const raw = interpolatedLandmarks || currentFrame?.landmarks;
    if (!raw || raw.length === 0) {
      lastRenderedLandmarksRef.current = null;
      return raw;
    }

    if (!lastRenderedLandmarksRef.current || !isPlaying) {
      lastRenderedLandmarksRef.current = raw;
      return raw;
    }

    // Adaptive alpha: fast movements (> 0.08 units) respond immediately, slow/static poses are stabilized
    const smoothed = smoothLandmarkTimeSeries(raw, lastRenderedLandmarksRef.current, 0.72);
    lastRenderedLandmarksRef.current = smoothed;
    return smoothed;
  }, [interpolatedLandmarks, currentFrame, isPlaying]);

  const handleReadyForDisplay = (event: any) => {
    if (event.naturalSize) {
      const { width, height } = event.naturalSize;
      
      // Pass natural sizes directly to let the geometry engine handle rotation/mapping
      setVideoDimensions({ width, height });
      
      // ASPECT RATIO LOCK
      if (width > 0 && height > 0) {
        // Correct aspect ratio for container based on visual orientation
        const isLayoutPortrait = (isFullscreenModal ? fullscreenLayout.height : layout.height) > 
                                (isFullscreenModal ? fullscreenLayout.width : layout.width);
        const visualAspect = (isLayoutPortrait && width > height) ? height / width : width / height;
        setContainerAspectRatio(visualAspect);
      }
      
      const rect = getVideoRenderRect(
        isFullscreenModal ? fullscreenLayout.width : layout.width,
        isFullscreenModal ? fullscreenLayout.height : layout.height,
        width,
        height
      );
      setRenderedRect(rect);
    }
  };

  // Determine intrinsic aspect ratio of the video stream
  const effectiveAspect = useMemo(() => {
    if (videoDimensions.width > 0 && videoDimensions.height > 0) {
      return videoDimensions.width / videoDimensions.height;
    }
    if (containerAspectRatio && containerAspectRatio > 0) {
      return containerAspectRatio;
    }
    return 16 / 9;
  }, [containerAspectRatio, videoDimensions]);

  // Viewport for fullscreen mode: centered letterboxed/pillarboxed video surface
  const fullscreenViewport = useMemo(() => {
    const screenW = fullscreenLayout.width > 0 ? fullscreenLayout.width : Dimensions.get('window').width;
    const screenH = fullscreenLayout.height > 0 ? fullscreenLayout.height : Dimensions.get('window').height;

    const screenAspect = screenW / (screenH || 1);
    let width = screenW;
    let height = screenH;
    let x = 0;
    let y = 0;

    if (screenAspect > effectiveAspect) {
      // Screen is wider than video: black bars on left and right (pillarbox)
      height = screenH;
      width = Math.round(screenH * effectiveAspect);
      x = Math.round((screenW - width) / 2);
      y = 0;
    } else {
      // Screen is taller than video: black bars on top and bottom (letterbox)
      width = screenW;
      height = Math.round(screenW / effectiveAspect);
      x = 0;
      y = Math.round((screenH - height) / 2);
    }

    return { x, y, width, height };
  }, [fullscreenLayout, effectiveAspect]);

  // Recalculate rendered rect when layout or dimensions change
  useEffect(() => {
    const curW = isFullscreenModal ? fullscreenLayout.width : layout.width;
    const curH = isFullscreenModal ? fullscreenLayout.height : layout.height;
    if (curW > 0 && curH > 0 && videoDimensions.width > 0) {
      const rect = getVideoRenderRect(curW, curH, videoDimensions.width, videoDimensions.height);
      setRenderedRect(rect);
    }
  }, [layout, fullscreenLayout, videoDimensions, isFullscreenModal]);

  const landmarks = smoothedLandmarks || interpolatedLandmarks || currentFrame?.landmarks;
  const curW = isFullscreenModal ? (fullscreenLayout.width || Dimensions.get('window').width) : layout.width;
  const curH = isFullscreenModal ? (fullscreenLayout.height || Dimensions.get('window').height) : layout.height;

  const getScreenCoords = (lm?: MediaPipeLandmark, isFs?: boolean) => {
    if (!lm) return { x: 0, y: 0, visible: false };
    if ((lm.visibility ?? 1) < 0.35) return { x: 0, y: 0, visible: false };
    // Filter out zero / corner-clamped uninitialized points
    if (lm.x <= 0.015 && lm.y <= 0.015) return { x: 0, y: 0, visible: false };

    let targetLm = lm;
    if (skeletonScale !== 1.0 || skeletonOffsetY !== 0 || skeletonOffsetX !== 0) {
      // Calculate center anchor of body using hips (landmarks 23 and 24)
      const anchorX = (landmarks && landmarks[23]?.x !== undefined && landmarks[24]?.x !== undefined)
        ? (landmarks[23].x + landmarks[24].x) / 2
        : 0.5;
      const anchorY = (landmarks && landmarks[23]?.y !== undefined && landmarks[24]?.y !== undefined)
        ? (landmarks[23].y + landmarks[24].y) / 2
        : 0.55;

      const scaledX = anchorX + (lm.x - anchorX) * skeletonScale + skeletonOffsetX;
      const scaledY = anchorY + (lm.y - anchorY) * skeletonScale + skeletonOffsetY;
      targetLm = {
        ...lm,
        x: scaledX,
        y: scaledY,
      };
    }

    const isFsMode = isFs !== undefined ? isFs : isFullscreenModal;
    
    if (isFsMode) {
      const stageW = fullscreenLayout.width || Dimensions.get('window').width;
      const stageH = fullscreenLayout.height || Dimensions.get('window').height;
      return mapLandmarkToScreen(
        targetLm,
        stageW,
        stageH,
        videoDimensions.width,
        videoDimensions.height,
        undefined,
        0,
        isMirrored,
        false,
        true,
        landmarks,
        fullscreenViewport
      );
    } else {
      const stageW = layout.width || 360;
      const stageH = layout.height || 480;
      const stageRect = renderedRect || getVideoRenderRect(
        stageW,
        stageH,
        videoDimensions.width > 0 ? videoDimensions.width : 9,
        videoDimensions.height > 0 ? videoDimensions.height : 16
      );
      return mapLandmarkToScreen(
        targetLm,
        stageW,
        stageH,
        videoDimensions.width,
        videoDimensions.height,
        undefined,
        0,
        isMirrored,
        false,
        true,
        landmarks,
        stageRect
      );
    }
  };

  // Sync Video CurrentTime on Fullscreen Toggle
  useEffect(() => {
    if (isFullscreenModal && fullscreenVideoRef.current) {
      fullscreenVideoRef.current.setPositionAsync(Math.round(currentTime * 1000), {
        toleranceMillisBefore: 0,
        toleranceMillisAfter: 0,
      }).catch(() => {});
    } else if (!isFullscreenModal && videoRef.current) {
      videoRef.current.setPositionAsync(Math.round(currentTime * 1000), {
        toleranceMillisBefore: 0,
        toleranceMillisAfter: 0,
      }).catch(() => {});
    }
  }, [isFullscreenModal]);

  // Render Real Biometric Rules Callouts (Computing real angles from landmarks)
  const visibleRuleCallouts = useMemo(() => {
    if (!landmarks || landmarks.length < 17 || !activeTechniqueRules || activeTechniqueRules.length === 0) return [];

    const activePhase = currentFrame?.detectedPhase || activeTechnique?.phases?.[0] || sportRule.phases?.[0];
    const rules = activeTechniqueRules.filter((r) => {
      // Filter out mismatched sub-discipline rules (e.g. putting rules during full swing)
      const isPuttingRule = r.id.includes('putt') || r.name.toLowerCase().includes('putting');
      const isPuttingPhase = activePhase ? activePhase.toLowerCase().includes('putt') : false;
      if (sportRule.id === 'golf') {
        if (isPuttingRule && !isPuttingPhase) return false;
        if (!isPuttingRule && isPuttingPhase) return false;
      }

      if (!activePhase || activePhase === 'Auto-Detect' || activePhase === 'All') return true;
      // STRICT PHASE GATING: Only display rules corresponding to the active kinetic movement phase
      const normRulePhase = r.phase.toLowerCase();
      const normActivePhase = activePhase.toLowerCase();
      return normRulePhase.includes(normActivePhase) || normActivePhase.includes(normRulePhase) || normRulePhase === 'dynamic';
    });

    const validRulesWithAngles: { rule: typeof activeTechniqueRules[0]; angleVal: number; vertexScreen: { x: number; y: number } }[] = [];

    for (const rule of rules) {
      if (!rule.keypoints || rule.keypoints.length !== 3) continue;
      const [kp1, kp2, kp3] = rule.keypoints;
      const p1 = landmarks[kp1];
      const p2 = landmarks[kp2];
      const p3 = landmarks[kp3];
      if (!p1 || !p2 || !p3) continue;

      // Check keypoint visibility
      const v1 = p1.visibility ?? 1;
      const v2 = p2.visibility ?? 1;
      const v3 = p3.visibility ?? 1;
      if (v1 < 0.38 || v2 < 0.38 || v3 < 0.38) continue;

      // Check for collapsed degenerate points
      const d1 = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      const d2 = Math.hypot(p3.x - p2.x, p3.y - p2.y);
      if (d1 < 0.012 || d2 < 0.012) continue;

      let angleVal = currentFrame?.angles?.[rule.id];
      if (angleVal === undefined) {
        angleVal = calculateAngle(p1, p2, p3);
      }
      if (angleVal === undefined || isNaN(angleVal)) continue;

      // Filter out degenerate angle singularities (e.g. 0-8° or 179-180° for spine/knee)
      if (angleVal <= 8 || angleVal >= 179) continue;

      const vScreen = getScreenCoords(p2);
      if (!vScreen.visible) continue;

      validRulesWithAngles.push({ rule, angleVal, vertexScreen: vScreen });
    }

    // Select top 3 relevant non-crowded rules
    const selected = validRulesWithAngles.slice(0, 3).map(({ rule, angleVal, vertexScreen }, index) => {
      const vx = vertexScreen.x;
      const vy = vertexScreen.y;

      // Check against ideal corridor with consistent 15-degree natural tolerance buffer
      const margin = 15;
      const minBound = Math.max(0, rule.idealMin - margin);
      const maxBound = Math.min(180, rule.idealMax + margin);

      let status: 'optimal' | 'warning' | 'error' = 'optimal';
      if (angleVal < minBound || angleVal > maxBound) {
        const delta = angleVal < minBound ? minBound - angleVal : angleVal - maxBound;
        status = delta > 25 ? 'error' : 'warning';
      }

      const cleanName = rule.name
        .replace(/ Biometric Rule$/i, '')
        .replace(/ Rule$/i, '')
        .trim();

      const displayAngle = typeof angleVal === 'number' ? angleVal.toFixed(0) : angleVal;
      const labelText = `${cleanName}: ${displayAngle}${rule.unit || '°'}`;

      // Staggered Y positioning so callouts never collide
      const targetY = Math.max(30, Math.min(curH - 60, vy - 10 + (index % 2 === 0 ? -16 : 16)));
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
  }, [landmarks, currentFrame, sportRule, curW, curH, isFullscreenModal, fullscreenViewport, skeletonScale, skeletonOffsetY, skeletonOffsetX, isMirrored]);

  // Filmstrip Playback Logic: 15 FPS timer-based playback when in Filmstrip mode
  const currentFilmstripFrame = useMemo(() => {
    if (!filmstripFrames || filmstripFrames.length === 0) return null;
    // Find the closest image frame for the current timestamp
    let closestIdx = 0;
    let minDiff = Infinity;
    for (let i = 0; i < filmstripFrames.length; i++) {
      const diff = Math.abs(filmstripFrames[i].timestamp - currentTime);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }
    return filmstripFrames[closestIdx];
  }, [filmstripFrames, currentTime]);

  return (
    <View 
      style={[
        styles.container, 
        containerAspectRatio ? { aspectRatio: Math.max(0.6, Math.min(1.2, containerAspectRatio)), minHeight: 520, maxHeight: 680 } : {}
      ]} 
      onLayout={handleLayout}
    >
      {/* 
          HARDWARE VIDEO PLAYER
          Direct native ExoPlayer decoding for continuous 60 FPS playback and scrub without image jumps.
      */}
      <Video
        ref={videoRef}
        source={{ uri: videoUrl }}
        rate={selectedSpeed}
        isMuted={true}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={isPlaying && !isFullscreenModal}
        isLooping={false}
        progressUpdateIntervalMillis={16}
        onPlaybackStatusUpdate={isFullscreenModal ? undefined : (s) => handlePlaybackStatusUpdate(s, false)}
        onReadyForDisplay={handleReadyForDisplay}
        style={styles.video}
      />

      {/* Svg Biomechanical Overlay */}
      {showSkeleton && landmarks && landmarks.length >= 17 && (
        <Svg pointerEvents="none" style={[styles.svgOverlay, { opacity: isPastData ? 0.35 : 1 }]} width={curW} height={curH}>
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
                strokeWidth={1.0}
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
                r={6}
                fill="rgba(56, 189, 248, 0.12)"
                stroke="rgba(56, 189, 248, 0.4)"
                strokeWidth={1.0}
              />
            );
          })()}

          {/* 3. 3D Depth-Sorted Bone Segments (Lead, Trail, and Torso) */}
          {(() => {
            const allBonePairs = [
              [11, 13], [13, 15], // Left Arm
              [12, 14], [14, 16], // Right Arm
              [23, 25], [25, 27], [27, 31], [27, 29], // Left Leg & Foot
              [24, 26], [26, 28], [28, 32], [28, 30], // Right Leg & Foot
              [11, 23], [12, 24], // Spine/Sides
              [11, 12], [23, 24]  // Clavicle & Pelvis Bridges
            ];

            const sortedBones = allBonePairs.map(([i1, i2]) => {
              const lm1 = landmarks[i1];
              const lm2 = landmarks[i2];
              const avgZ = ((lm1?.z || 0) + (lm2?.z || 0)) / 2;
              return { i1, i2, lm1, lm2, avgZ };
            }).sort((a, b) => b.avgZ - a.avgZ); // Deepest background limbs drawn first

            const activePhase = currentFrame?.detectedPhase || activeTechnique?.phases?.[0] || sportRule.phases?.[0];

            return sortedBones.map(({ i1, i2, lm1, lm2, avgZ }, idx) => {
              if (!lm1 || !lm2) return null;
              if ((lm1.visibility ?? 1) < 0.35 || (lm2.visibility ?? 1) < 0.35) return null;
              if ((lm1.x <= 0.02 && lm1.y <= 0.02) || (lm2.x <= 0.02 && lm2.y <= 0.02)) return null;

              // Reject anatomically impossible stretched limbs (spiderweb lines across screen)
              const distNorm = Math.hypot(lm1.x - lm2.x, lm1.y - lm2.y);
              if (distNorm > 0.38) return null;

              const p1 = getScreenCoords(lm1);
              const p2 = getScreenCoords(lm2);
              if (!p1.visible || !p2.visible) return null;

              const { color, strokeWidth } = getSegmentColor(i1, i2, landmarks, sportRule, activePhase, activeTechniqueRules);
              const depthOpacity = avgZ > 0.15 ? 0.72 : 1.0;

              return (
                <Line
                  key={`bone-3d-${i1}-${i2}-${idx}`}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={color}
                  strokeWidth={avgZ > 0.15 ? Math.max(1.2, strokeWidth - 0.5) : strokeWidth}
                  strokeLinecap="round"
                  opacity={depthOpacity}
                />
              );
            });
          })()}

          {/* 6. Joint Pivot Circles */}
          {landmarks.map((lm, i) => {
            if (!lm) return null;
            if (i > 0 && i < 11) return null;
            const p = getScreenCoords(lm);
            if (!p.visible) return null;

            const activePhase = currentFrame?.detectedPhase || activeTechnique?.phases?.[0] || sportRule.phases?.[0];
            const ringColor = getJointColor(i, landmarks, sportRule, activePhase, activeTechniqueRules);

            return (
              <G key={`joint-${i}`}>
                <Circle
                  cx={p.x}
                  cy={p.y}
                  r={3.2}
                  fill="rgba(0,0,0,0.85)"
                  stroke={ringColor}
                  strokeWidth={1.4}
                />
                <Circle
                  cx={p.x}
                  cy={p.y}
                  r={1.0}
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
            <Text style={styles.comboText}>
              {sportRule?.name ? `${sportRule.name.toUpperCase()}` : 'AI BIOMETRICS'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowSkeleton(prev => !prev)}
            style={[
              styles.skeletonTogglePill,
              showSkeleton ? styles.skeletonToggleActive : styles.skeletonToggleInactive,
            ]}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: showSkeleton ? '#22c55e' : '#71717a',
              }}
            />
            <Text style={styles.skeletonToggleText}>
              {showSkeleton ? 'SKELETON: ON' : 'SKELETON: OFF'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Fullscreen Button */}
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => setIsFullscreenModal(true)}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            style={styles.fullscreenOverlayBtn}
          >
            <Maximize2 color="#eab308" size={13} />
            <Text style={styles.fullscreenOverlayText}>EXPAND</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Floating Semi-Transparent Glass Control Deck */}
      <View style={styles.bottomControlBar}>
        {/* Scrubber Bar with Keyframe Ticks */}
        <View
          style={styles.scrubberTrack}
          onLayout={(e) => {
            const w = e.nativeEvent.layout.width;
            if (w > 0) setTrackWidth(w);
          }}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={(e) => {
            if (onPause) onPause();
            const tw = trackWidth > 0 ? trackWidth : Math.max(1, curW - 32);
            const ratio = Math.max(0, Math.min(1, e.nativeEvent.locationX / tw));
            handleSeek(ratio, false, currentTime);
          }}
          onResponderMove={(e) => {
            const tw = trackWidth > 0 ? trackWidth : Math.max(1, curW - 32);
            const ratio = Math.max(0, Math.min(1, e.nativeEvent.locationX / tw));
            handleSeek(ratio, false, currentTime);
          }}
          onResponderRelease={(e) => {
            const tw = trackWidth > 0 ? trackWidth : Math.max(1, curW - 32);
            const ratio = Math.max(0, Math.min(1, e.nativeEvent.locationX / tw));
            handleSeek(ratio, true, currentTime);
          }}
        >
          {/* Keyframe Markers on Timeline */}
          {movementKeyframes?.map((kf) => {
            const tickLeft = Math.max(0, Math.min(100, (kf.timestamp / (duration || 1)) * 100));
            return (
              <View
                key={`tick-${kf.id}`}
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: `${tickLeft}%`,
                  top: -2,
                  marginLeft: -2,
                  width: 4,
                  height: 12,
                  borderRadius: 2,
                  backgroundColor: kf.status === 'error' ? '#ef4444' : kf.status === 'warning' ? '#eab308' : '#38bdf8',
                  zIndex: 2,
                }}
              />
            );
          })}

          <View
            pointerEvents="none"
            style={[
              styles.scrubberProgress,
              { width: `${Math.min(100, Math.max(0, (currentTime / (duration || 1)) * 100))}%` },
            ]}
          />
          <View
            pointerEvents="none"
            style={[
              styles.scrubberThumb,
              { left: `${Math.min(97, Math.max(0, (currentTime / (duration || 1)) * 100))}%` },
            ]}
          />
        </View>

        {/* Primary Controls Row */}
        <View style={styles.primaryControlsRow}>
          <View style={styles.playbackGroup}>
            <TouchableOpacity
              onPress={() => handleStep('back', currentTime)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.stepButton}
              accessibilityLabel="Step back 1 frame"
            >
              <SkipBack color="#fff" size={16} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleStep('forward', currentTime)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.stepButton}
              accessibilityLabel="Step forward 1 frame"
            >
              <SkipForward color="#fff" size={16} />
            </TouchableOpacity>
          </View>

          {/* Digital Clock */}
          <View style={styles.timeInfoGroup}>
            <Text style={styles.mainTimeText}>{currentTime.toFixed(2)}s</Text>
            <Text style={styles.slashText}>/</Text>
            <Text style={styles.durationTimeText}>{duration.toFixed(2)}s</Text>
          </View>
        </View>

        {/* Movement-Specific Keyframes Jump Strip */}
        {movementKeyframes && movementKeyframes.length > 0 && (
          <View style={styles.keyframesSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {movementKeyframes.map((kf) => {
                const isActive = Math.abs(currentTime - kf.timestamp) < 0.2;
                return (
                  <TouchableOpacity
                    key={kf.id}
                    onPress={() => handleSeekToTime(kf.timestamp)}
                    style={[
                      styles.keyframeChip,
                      isActive ? styles.keyframeChipActive : styles.keyframeChipInactive,
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <View
                        style={{
                          width: 4,
                          height: 4,
                          borderRadius: 2,
                          backgroundColor: isActive
                            ? '#000000'
                            : kf.status === 'error'
                            ? '#ef4444'
                            : kf.status === 'warning'
                            ? '#eab308'
                            : '#22c55e',
                        }}
                      />
                      <Text
                        style={[
                          styles.keyframeChipText,
                          { color: isActive ? '#000000' : '#ffffff' },
                        ]}
                        numberOfLines={1}
                      >
                        {kf.name}
                      </Text>
                      <Text
                        style={{
                          color: isActive ? '#1c1917' : '#eab308',
                          fontSize: 8.5,
                          fontWeight: '800',
                          fontFamily: 'monospace',
                        }}
                      >
                        {kf.timestamp.toFixed(2)}s
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
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

          {/* Centered Fullscreen Content Viewport (Exact Letterboxed/Pillarboxed Area) */}
          <View
            style={{
              position: 'absolute',
              left: fullscreenViewport.x,
              top: fullscreenViewport.y,
              width: fullscreenViewport.width,
              height: fullscreenViewport.height,
              overflow: 'hidden',
              backgroundColor: '#000000',
            }}
          >
            {/* Fullscreen Video Display */}
            <Video
              ref={fullscreenVideoRef}
              source={{ uri: videoUrl }}
              rate={selectedSpeed}
              isMuted={true}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={isPlaying && isFullscreenModal}
              isLooping={false}
              progressUpdateIntervalMillis={16}
              onPlaybackStatusUpdate={isFullscreenModal ? (s) => handlePlaybackStatusUpdate(s, true) : undefined}
              onReadyForDisplay={handleReadyForDisplay}
              style={{ width: '100%', height: '100%' }}
            />
          </View>

          {/* Fullscreen SVG Overlay */}
          {showSkeleton && landmarks && landmarks.length >= 17 && (
            <Svg
              pointerEvents="none"
              style={[StyleSheet.absoluteFillObject, { opacity: isPastData ? 0.35 : 1 }]}
              width={curW}
              height={curH}
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
                    strokeWidth={1.2}
                  />
                );
              })()}

              {/* 3. 3D Depth-Sorted Bone Segments (Lead, Trail, and Torso) */}
              {(() => {
                const allBonePairs = [
                  [11, 13], [13, 15], // Left Arm
                  [12, 14], [14, 16], // Right Arm
                  [23, 25], [25, 27], [27, 31], [27, 29], // Left Leg & Foot
                  [24, 26], [26, 28], [28, 32], [28, 30], // Right Leg & Foot
                  [11, 23], [12, 24], // Spine/Sides
                  [11, 12], [23, 24]  // Clavicle & Pelvis Bridges
                ];

                const sortedBones = allBonePairs.map(([i1, i2]) => {
                  const lm1 = landmarks[i1];
                  const lm2 = landmarks[i2];
                  const avgZ = ((lm1?.z || 0) + (lm2?.z || 0)) / 2;
                  return { i1, i2, lm1, lm2, avgZ };
                }).sort((a, b) => b.avgZ - a.avgZ); // Deepest background limbs drawn first

                const activePhase = currentFrame?.detectedPhase || sportRule.phases?.[0];

                return sortedBones.map(({ i1, i2, lm1, lm2, avgZ }, idx) => {
                  if (!lm1 || !lm2) return null;
                  if ((lm1.visibility ?? 1) < 0.35 || (lm2.visibility ?? 1) < 0.35) return null;
                  if ((lm1.x <= 0.02 && lm1.y <= 0.02) || (lm2.x <= 0.02 && lm2.y <= 0.02)) return null;

                  // Reject anatomically impossible stretched limbs (spiderweb lines across screen)
                  const distNorm = Math.hypot(lm1.x - lm2.x, lm1.y - lm2.y);
                  if (distNorm > 0.38) return null;

                  const p1 = getScreenCoords(lm1);
                  const p2 = getScreenCoords(lm2);
                  if (!p1.visible || !p2.visible) return null;

                  const { color, strokeWidth } = getSegmentColor(i1, i2, landmarks, sportRule, activePhase);
                  const depthOpacity = avgZ > 0.15 ? 0.72 : 1.0;

                  return (
                    <Line
                      key={`fs-bone-3d-${i1}-${i2}-${idx}`}
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke={color}
                      strokeWidth={avgZ > 0.15 ? Math.max(1.2, strokeWidth - 0.5) : strokeWidth}
                      strokeLinecap="round"
                      opacity={depthOpacity}
                    />
                  );
                });
              })()}

              {/* Joint Circles */}
              {landmarks.map((lm, i) => {
                if (!lm || (i > 0 && i < 11)) return null;
                const p = getScreenCoords(lm);
                if (!p.visible) return null;
                const activePhase = currentFrame?.detectedPhase || sportRule.phases?.[0];
                const ringColor = getJointColor(i, landmarks, sportRule, activePhase);
                return (
                  <G key={`fs-joint-${i}`}>
                    <Circle
                      cx={p.x}
                      cy={p.y}
                      r={3.8}
                      fill="rgba(0,0,0,0.85)"
                      stroke={ringColor}
                      strokeWidth={1.4}
                    />
                    <Circle
                      cx={p.x}
                      cy={p.y}
                      r={1.2}
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

          {/* Fullscreen Diagnostic Overlay */}
          <View 
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 60,
              left: 16,
              zIndex: 99,
              backgroundColor: 'rgba(9, 9, 11, 0.85)',
              padding: 8,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.1)',
              minWidth: 120,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981' }} />
              <Text style={{ color: '#10b981', fontSize: 8, fontWeight: '900' }}>FS SYNC</Text>
            </View>
            <Text style={{ color: '#a1a1aa', fontSize: 8 }}>TIME: <Text style={{ color: '#fff', fontWeight: 'bold' }}>{currentTime.toFixed(4)}s</Text></Text>
            <Text style={{ color: '#a1a1aa', fontSize: 8 }}>DRIFT: <Text style={{ color: Math.abs(currentTime - (currentFrame?.timestamp || 0)) > 0.05 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
              {((currentTime - (currentFrame?.timestamp || 0)) * 1000).toFixed(2)}ms
            </Text></Text>
          </View>

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

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity
                onPress={() => setIsFullscreenModal(false)}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                style={styles.exitFullscreenBtn}
              >
                <Minimize2 color="#ffffff" size={14} />
                <Text style={styles.exitFullscreenText}>EXIT FULLSCREEN</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Fullscreen Transport Bar */}
          <View style={styles.fullscreenBottomBar}>
            <View
              style={styles.scrubberTrack}
              onLayout={(e) => {
                const w = e.nativeEvent.layout.width;
                if (w > 0) setFsTrackWidth(w);
              }}
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
              onResponderGrant={(e) => {
                const tw = fsTrackWidth > 0 ? fsTrackWidth : Math.max(1, fullscreenLayout.width - 64);
                const ratio = Math.max(0, Math.min(1, e.nativeEvent.locationX / tw));
                handleSeek(ratio, false, currentTime);
              }}
              onResponderMove={(e) => {
                const tw = fsTrackWidth > 0 ? fsTrackWidth : Math.max(1, fullscreenLayout.width - 64);
                const ratio = Math.max(0, Math.min(1, e.nativeEvent.locationX / tw));
                handleSeek(ratio, false, currentTime);
              }}
              onResponderRelease={(e) => {
                const tw = fsTrackWidth > 0 ? fsTrackWidth : Math.max(1, fullscreenLayout.width - 64);
                const ratio = Math.max(0, Math.min(1, e.nativeEvent.locationX / tw));
                handleSeek(ratio, true, currentTime);
              }}
            >
              {/* Keyframe Markers on Fullscreen Timeline */}
              {movementKeyframes?.map((kf) => {
                const tickLeft = Math.max(0, Math.min(100, (kf.timestamp / (duration || 1)) * 100));
                return (
                  <View
                    key={`fs-tick-${kf.id}`}
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      left: `${tickLeft}%`,
                      top: -2,
                      marginLeft: -2,
                      width: 4,
                      height: 12,
                      borderRadius: 2,
                      backgroundColor: kf.status === 'error' ? '#ef4444' : kf.status === 'warning' ? '#eab308' : '#38bdf8',
                      zIndex: 2,
                    }}
                  />
                );
              })}

              <View
                pointerEvents="none"
                style={[
                  styles.scrubberProgress,
                  { width: `${Math.min(100, Math.max(0, (currentTime / (duration || 1)) * 100))}%` },
                ]}
              />
              <View
                pointerEvents="none"
                style={[
                  styles.scrubberThumb,
                  { left: `${Math.min(97, Math.max(0, (currentTime / (duration || 1)) * 100))}%` },
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

                <TouchableOpacity onPress={() => handleStep('back', currentTime)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} style={styles.stepButton}>
                  <SkipBack color="#fff" size={18} />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => handleStep('forward', currentTime)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} style={styles.stepButton}>
                  <SkipForward color="#fff" size={18} />
                </TouchableOpacity>
              </View>

              <View style={styles.timeInfoGroup}>
                <Text style={styles.mainTimeText}>{currentTime.toFixed(2)}s</Text>
                <Text style={styles.slashText}>/</Text>
                <Text style={styles.durationTimeText}>{duration.toFixed(2)}s</Text>
              </View>
            </View>

            {/* Fullscreen Movement-Specific Keyframes Strip */}
            {movementKeyframes && movementKeyframes.length > 0 && (
              <View style={{ marginTop: 8 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {movementKeyframes.map((kf) => {
                    const isActive = Math.abs(currentTime - kf.timestamp) < 0.2;
                    return (
                      <TouchableOpacity
                        key={`fs-chip-${kf.id}`}
                        onPress={() => handleSeekToTime(kf.timestamp)}
                        style={[
                          styles.keyframeChip,
                          isActive ? styles.keyframeChipActive : styles.keyframeChipInactive,
                        ]}
                        activeOpacity={0.7}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <View
                            style={{
                              width: 4,
                              height: 4,
                              borderRadius: 2,
                              backgroundColor: isActive
                                ? '#000000'
                                : kf.status === 'error'
                                ? '#ef4444'
                                : kf.status === 'warning'
                                ? '#eab308'
                                : '#22c55e',
                            }}
                          />
                          <Text
                            style={[
                              styles.keyframeChipText,
                              { color: isActive ? '#000000' : '#ffffff' },
                            ]}
                            numberOfLines={1}
                          >
                            {kf.name}
                          </Text>
                          <Text
                            style={{
                              color: isActive ? '#1c1917' : '#eab308',
                              fontSize: 8.5,
                              fontWeight: '800',
                              fontFamily: 'monospace',
                            }}
                          >
                            {kf.timestamp.toFixed(2)}s
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignSelf: 'stretch',
    minHeight: 560,
    maxHeight: 720,
    backgroundColor: '#050508',
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    marginBottom: 24,
    elevation: 12,
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
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 30,
  },
  hudBadgesGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fullscreenOverlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(10, 15, 29, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.5)',
  },
  fullscreenOverlayText: {
    color: '#eab308',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  comboBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(10, 15, 29, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
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
  skeletonTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  skeletonToggleActive: {
    backgroundColor: 'rgba(10, 15, 29, 0.75)',
    borderColor: 'rgba(34, 197, 94, 0.5)',
  },
  skeletonToggleInactive: {
    backgroundColor: 'rgba(10, 15, 29, 0.65)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  skeletonToggleText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  bottomControlBar: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(10, 15, 29, 0.78)',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    zIndex: 30,
  },
  primaryControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  playbackGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playButtonBig: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eab308',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  stepButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  timeInfoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 3,
  },
  mainTimeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  slashText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
  },
  durationTimeText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '600',
  },
  speedSelectorGrid: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  speedPillLarge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  speedPillActive: {
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
    borderColor: '#eab308',
  },
  speedTextLarge: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  speedTextActive: {
    color: '#eab308',
  },
  keyframesSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  keyframeChip: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  keyframeChipActive: {
    backgroundColor: '#eab308',
    borderColor: '#fef08a',
  },
  keyframeChipInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  keyframeChipText: {
    fontSize: 9.5,
    fontWeight: '800',
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
    backgroundColor: 'rgba(10, 15, 29, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
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
    backgroundColor: 'rgba(10, 15, 29, 0.8)',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    zIndex: 50,
  },
  armorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(10, 15, 29, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  armorText: {
    color: '#38bdf8',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  secondaryControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  scrubberTrack: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 4,
    position: 'relative',
    marginBottom: 8,
  },
  scrubberProgress: {
    height: '100%',
    backgroundColor: '#eab308',
    borderRadius: 4,
  },
  scrubberThumb: {
    position: 'absolute',
    top: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 2.5,
    borderColor: '#eab308',
    elevation: 3,
  },
});
