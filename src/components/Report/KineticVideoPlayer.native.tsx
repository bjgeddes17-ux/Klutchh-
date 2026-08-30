import React, { useRef, useState, useMemo, useImperativeHandle, forwardRef } from 'react';
import { View, StyleSheet, LayoutChangeEvent, Text } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Canvas, Line, Circle, vec } from '@shopify/react-native-skia';
import { SportRule, FrameAnalysis } from '../../types';
import { mapLandmarkToPixels } from '../../shared/geometry';

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
}

export interface KineticVideoPlayerRef {
  seek: (time: number) => void;
}

const POSE_CONNECTIONS: [number, number][] = [
  // Head / Neck
  [0, 11], [0, 12],
  // Shoulders & Torso
  [11, 12], [11, 23], [12, 24], [23, 24],
  // Arms
  [11, 13], [13, 15],
  [12, 14], [14, 16],
  // Legs
  [23, 25], [25, 27], [27, 29], [29, 31],
  [24, 26], [26, 28], [28, 30], [30, 32],
];

export const KineticVideoPlayer = React.memo(forwardRef<KineticVideoPlayerRef, KineticVideoPlayerProps>(({
  videoUrl,
  sportRule,
  sortedFrames,
  isPlaying,
  currentTime,
  onTimeUpdate,
  onDurationChange,
  playbackRate = 1,
  isDataReady,
}, ref) => {
  const videoRef = useRef<Video>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 340, height: 220 });
  const [videoNaturalSize, setVideoNaturalSize] = useState<{ width: number; height: number } | null>(null);

  useImperativeHandle(ref, () => ({
    seek: (time: number) => {
      if (videoRef.current) {
        videoRef.current.setPositionAsync(time * 1000);
      }
    }
  }));

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setContainerSize({ width, height });
    }
  };

  // Calculate pixel-perfect letterboxed video placement
  const layoutMetrics = useMemo(() => {
    const { width: cw, height: ch } = containerSize;
    if (!videoNaturalSize || videoNaturalSize.width <= 0 || videoNaturalSize.height <= 0) {
      return { drawWidth: cw, drawHeight: ch, offsetX: 0, offsetY: 0 };
    }
    const videoAspect = videoNaturalSize.width / videoNaturalSize.height;
    const containerAspect = cw / ch;

    let drawWidth = cw;
    let drawHeight = ch;
    let offsetX = 0;
    let offsetY = 0;

    if (containerAspect > videoAspect) {
      drawHeight = ch;
      drawWidth = drawHeight * videoAspect;
      offsetX = (cw - drawWidth) / 2;
    } else {
      drawWidth = cw;
      drawHeight = drawWidth / videoAspect;
      offsetY = (ch - drawHeight) / 2;
    }

    return { drawWidth, drawHeight, offsetX, offsetY };
  }, [containerSize, videoNaturalSize]);

  // Binary search for exact current frame
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

  const { drawWidth, drawHeight, offsetX, offsetY } = layoutMetrics;

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <Video
        ref={videoRef}
        source={{ uri: videoUrl }}
        rate={playbackRate}
        isMuted={true}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={isPlaying}
        isLooping={false}
        onPlaybackStatusUpdate={(status) => {
          if (status.isLoaded) {
            onTimeUpdate(status.positionMillis / 1000);
            if (status.durationMillis && onDurationChange) {
              onDurationChange(status.durationMillis / 1000);
            }
            if ((status as any).naturalSize && (status as any).naturalSize.width > 0) {
              const { width, height } = (status as any).naturalSize;
              if (!videoNaturalSize || videoNaturalSize.width !== width || videoNaturalSize.height !== height) {
                setVideoNaturalSize({ width, height });
              }
            }
          }
        }}
        style={styles.video}
      />

      {/* Hardware-Accelerated Native Skia Skeleton */}
      <Canvas style={styles.canvas}>
        {isDataReady && currentFrame?.landmarks && (
          <>
            {/* Enhanced Skeletal Bones */}
            {POSE_CONNECTIONS.map(([i1, i2], connIdx) => {
              const p1 = currentFrame.landmarks[i1];
              const p2 = currentFrame.landmarks[i2];
              if (!p1 || !p2 || (p1.visibility && p1.visibility < 0.4) || (p2.visibility && p2.visibility < 0.4)) {
                return null;
              }
              const point1Pixels = mapLandmarkToPixels(p1, drawWidth, drawHeight, offsetX, offsetY);
              const point2Pixels = mapLandmarkToPixels(p2, drawWidth, drawHeight, offsetX, offsetY);
              const point1 = vec(point1Pixels.x, point1Pixels.y);
              const point2 = vec(point2Pixels.x, point2Pixels.y);
              return (
                <React.Fragment key={`bone-${connIdx}`}>
                  {/* Outer Glow */}
                  <Line
                    p1={point1}
                    p2={point2}
                    color="#facc15"
                    strokeWidth={8}
                    opacity={0.15}
                  />
                  {/* Inner Core */}
                  <Line
                    p1={point1}
                    p2={point2}
                    color="#ffffff"
                    strokeWidth={2}
                    opacity={1}
                  />
                </React.Fragment>
              );
            })}

            {/* Enhanced Joints */}
            {currentFrame.landmarks.map((lm, i) => {
              if (lm.visibility && lm.visibility < 0.4) return null;
              const isHighlight = i === 11 || i === 12 || i === 23 || i === 24 || i === 25 || i === 26;
              const jointPixels = mapLandmarkToPixels(lm, drawWidth, drawHeight, offsetX, offsetY);
              const cx = jointPixels.x;
              const cy = jointPixels.y;
              return (
                <React.Fragment key={`joint-group-${i}`}>
                  <Circle
                    cx={cx}
                    cy={cy}
                    r={isHighlight ? 9 : 6}
                    color="#facc15"
                    opacity={0.25}
                  />
                  <Circle
                    cx={cx}
                    cy={cy}
                    r={isHighlight ? 4 : 2.5}
                    color="#ffffff"
                    opacity={1}
                  />
                </React.Fragment>
              );
            })}
          </>
        )}
      </Canvas>

      {/* Biometric Metric Labels */}
      {currentFrame && (
        <View style={StyleSheet.absoluteFill}>
          {sportRule.jointRules.map((rule, idx) => {
            const [kp1, kp2, kp3] = rule.keypoints;
            const p1 = currentFrame.landmarks[kp1];
            const vertex = currentFrame.landmarks[kp2];
            const p3 = currentFrame.landmarks[kp3];
            
            if (!p1 || !vertex || !p3) return null;
            
            const angleVal = currentFrame.angles[rule.id] ?? 0;
            const status = currentFrame.ruleResults[rule.id] || 'optimal';
            const vertexPixels = mapLandmarkToPixels(vertex, drawWidth, drawHeight, offsetX, offsetY);
            
            return (
              <View 
                key={rule.id}
                style={[
                  styles.metricLabel,
                  {
                    left: vertexPixels.x + 10,
                    top: vertexPixels.y - 10,
                    borderColor: status === 'error' ? '#ef4444' : status === 'warning' ? '#a855f7' : '#facc15'
                  }
                ]}
              >
                <Text style={styles.metricText}>
                  {rule.name}: {angleVal.toFixed(1)}{rule.unit}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  video: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  canvas: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 10,
  },
  metricLabel: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  metricText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
