import React, { useRef, useState, useMemo } from 'react';
import { View, StyleSheet, Dimensions, LayoutChangeEvent } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Canvas, Line, Circle, vec } from '@shopify/react-native-skia';
import { SportRule, FrameAnalysis } from '../../types';

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
}) => {
  const videoRef = useRef<Video>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 340, height: 220 });

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setContainerSize({ width, height });
    }
  };

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

  const { width, height } = containerSize;

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
          }
        }}
        style={styles.video}
      />

      {/* Hardware-Accelerated Native Skia Skeleton */}
      <Canvas style={styles.canvas}>
        {currentFrame?.landmarks && (
          <>
            {/* Skeletal Bones */}
            {POSE_CONNECTIONS.map(([i1, i2], connIdx) => {
              const p1 = currentFrame.landmarks[i1];
              const p2 = currentFrame.landmarks[i2];
              if (!p1 || !p2 || (p1.visibility && p1.visibility < 0.3) || (p2.visibility && p2.visibility < 0.3)) {
                return null;
              }
              return (
                <Line
                  key={`bone-${connIdx}`}
                  p1={vec(p1.x * width, p1.y * height)}
                  p2={vec(p2.x * width, p2.y * height)}
                  color="rgba(239, 68, 68, 0.85)"
                  strokeWidth={3}
                />
              );
            })}

            {/* Joints */}
            {currentFrame.landmarks.map((lm, i) => {
              if (lm.visibility && lm.visibility < 0.3) return null;
              const isHighlight = i === 11 || i === 12 || i === 23 || i === 24 || i === 25 || i === 26;
              return (
                <Circle
                  key={`joint-${i}`}
                  cx={lm.x * width}
                  cy={lm.y * height}
                  r={isHighlight ? 5 : 3.5}
                  color={isHighlight ? "#ef4444" : "#ffffff"}
                />
              );
            })}
          </>
        )}
      </Canvas>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  canvas: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
});
