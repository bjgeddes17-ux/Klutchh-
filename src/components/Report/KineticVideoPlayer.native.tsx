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

// High-impact status color mapping
const getStatusColor = (status: string) => {
  switch (status) {
    case 'optimal': return '#22c55e'; // Signal-Green
    case 'warning': return '#06b6d4'; // Cyber-Cyan
    case 'error': return '#d946ef';   // Laser-Magenta
    default: return '#3b82f6';        // Deep-Space-Blue
  }
};

export const KineticVideoPlayer = React.memo(forwardRef<KineticVideoPlayerRef, KineticVideoPlayerProps>(({
  videoUrl,
  sportRule,
  sortedFrames,
  isPlaying,
  currentTime: externalTime,
  onTimeUpdate,
  onDurationChange,
  playbackRate = 1,
  isDataReady,
}, ref) => {
  const videoRef = useRef<Video>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 340, height: 220 });
  const [videoNaturalSize, setVideoNaturalSize] = useState<{ width: number; height: number } | null>(null);

  // Use local time for high-frequency skeleton updates to avoid React render lag from parent
  const [localTime, setLocalTime] = useState(0);

  useImperativeHandle(ref, () => ({
    seek: (time: number) => {
      setLocalTime(time);
      if (videoRef.current) {
        videoRef.current.setPositionAsync(time * 1000);
      }
    }
  }));

  // Sync internal time with external time only when it's a significant jump (e.g. seek from parent)
  React.useEffect(() => {
    if (Math.abs(localTime - externalTime) > 0.1) {
      setLocalTime(externalTime);
    }
  }, [externalTime]);

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
    
    // We must handle potential orientation issues. MediaPipe landmarks are normalized to the video buffer.
    // If the video is vertical (natural height > natural width), but container is horizontal.
    const videoAspect = videoNaturalSize.width / videoNaturalSize.height;
    const containerAspect = cw / ch;

    let drawWidth = cw;
    let drawHeight = ch;
    let offsetX = 0;
    let offsetY = 0;

    if (containerAspect > videoAspect) {
      // Pillarbox (bars on sides)
      drawHeight = ch;
      drawWidth = ch * videoAspect;
      offsetX = (cw - drawWidth) / 2;
    } else {
      // Letterbox (bars on top/bottom)
      drawWidth = cw;
      drawHeight = cw / videoAspect;
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
      if (sortedFrames[mid].timestamp <= localTime) {
        idx = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return sortedFrames[idx];
  }, [sortedFrames, localTime]);

  const { drawWidth, drawHeight, offsetX, offsetY } = layoutMetrics;

  // Helper to get status for a connection
  const getConnectionStatus = (p1: number, p2: number) => {
    if (!currentFrame) return 'optimal';
    
    // Find all rules that involve either of these points
    // Rules are usually defined as an angle at keypoints[1] (the vertex)
    const activeRules = sportRule.jointRules.filter(r => 
      r.keypoints[1] === p1 || r.keypoints[1] === p2 || 
      (r.keypoints.includes(p1) && r.keypoints.includes(p2))
    );
    
    if (activeRules.length === 0) return 'optimal';
    
    // Prioritize 'error' > 'warning' > 'good' > 'optimal'
    const statuses = activeRules.map(r => currentFrame.ruleResults[r.id] || 'optimal');
    if (statuses.includes('error')) return 'error';
    if (statuses.includes('warning')) return 'warning';
    return 'optimal';
  };

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
        progressUpdateIntervalMillis={16} // 60fps updates for smooth skeleton
        onPlaybackStatusUpdate={(status) => {
          if (status.isLoaded) {
            const time = status.positionMillis / 1000;
            setLocalTime(time);
            onTimeUpdate(time);
            if (status.durationMillis && onDurationChange) {
              onDurationChange(status.durationMillis / 1000);
            }
            if ((status as any).naturalSize && (status as any).naturalSize.width > 0) {
              const { width, height } = (status as any).naturalSize;
              // Only update if dimensions actually changed
              if (!videoNaturalSize || videoNaturalSize.width !== width || videoNaturalSize.height !== height) {
                setVideoNaturalSize({ width, height });
              }
            }
          }
        }}
        style={styles.video}
      />

      {/* 
        NEW: The Canvas and Metrics View are now precisely sized and positioned 
        to match the "CONTAIN"ed video frame. This eliminates drift and 
        ensures the skeleton is never "Giant".
      */}
      <View 
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: offsetX,
          top: offsetY,
          width: drawWidth,
          height: drawHeight,
          zIndex: 10,
        }}
      >
        <Canvas style={StyleSheet.absoluteFill}>
          {isDataReady && currentFrame?.landmarks && (
            <>
              {/* Enhanced Skeletal Bones */}
              {POSE_CONNECTIONS.map(([i1, i2], connIdx) => {
                const p1 = currentFrame.landmarks[i1];
                const p2 = currentFrame.landmarks[i2];
                if (!p1 || !p2 || (p1.visibility && p1.visibility < 0.4) || (p2.visibility && p2.visibility < 0.4)) {
                  return null;
                }
                
                // Landmarks are 0-1, drawWidth/drawHeight is the frame size
                const x1 = p1.x * drawWidth;
                const y1 = p1.y * drawHeight;
                const x2 = p2.x * drawWidth;
                const y2 = p2.y * drawHeight;
                
                const point1 = vec(x1, y1);
                const point2 = vec(x2, y2);
                
                const status = getConnectionStatus(i1, i2);
                const boneColor = getStatusColor(status);

                return (
                  <React.Fragment key={`bone-${connIdx}`}>
                    <Line p1={point1} p2={point2} color={boneColor} strokeWidth={8} opacity={0.15} />
                    <Line p1={point1} p2={point2} color="#ffffff" strokeWidth={2} opacity={1} />
                  </React.Fragment>
                );
              })}

              {/* Enhanced Joints */}
              {currentFrame.landmarks.map((lm, i) => {
                if (lm.visibility && lm.visibility < 0.4) return null;
                const isHighlight = i === 11 || i === 12 || i === 23 || i === 24 || i === 25 || i === 26;
                const cx = lm.x * drawWidth;
                const cy = lm.y * drawHeight;
                
                const status = getConnectionStatus(i, i);
                const jointColor = getStatusColor(status);

                return (
                  <React.Fragment key={`joint-group-${i}`}>
                    <Circle cx={cx} cy={cy} r={isHighlight ? 9 : 6} color={jointColor} opacity={0.25} />
                    <Circle cx={cx} cy={cy} r={isHighlight ? 4 : 2.5} color="#ffffff" opacity={1} />
                  </React.Fragment>
                );
              })}
            </>
          )}
        </Canvas>

        {/* Biometric Metric Labels - Now also precisely positioned within the frame */}
        {currentFrame && (
          <View style={StyleSheet.absoluteFill}>
            {sportRule.jointRules.map((rule, idx) => {
              const vertex = currentFrame.landmarks[rule.keypoints[1]];
              if (!vertex) return null;
              
              const angleVal = currentFrame.angles[rule.id] ?? 0;
              const status = currentFrame.ruleResults[rule.id] || 'optimal';
              
              // Map vertex to pixels within this relative frame
              const vx = vertex.x * drawWidth;
              const vy = vertex.y * drawHeight;
              
              // Collision avoidance: Stagger and alternate sides if needed
              // We'll alternate left/right to reduce overlap
              const isEven = idx % 2 === 0;
              const staggerY = idx * 22;
              
              return (
                <View 
                  key={rule.id}
                  style={[
                    styles.metricLabel,
                    {
                      left: isEven ? vx + 10 : vx - 130, // Alternate sides
                      top: vy - 50 + (idx * 15), // Smaller stagger
                      borderColor: getStatusColor(status),
                      maxWidth: 120,
                    }
                  ]}
                >
                  <Text style={styles.metricText} numberOfLines={1}>
                    {rule.name.split(' ')[0]}: {angleVal.toFixed(1)}°
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}));

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
