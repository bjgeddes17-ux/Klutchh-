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

const POSE_CONNECTIONS: { points: [number, number], color: string }[] = [
  // Head / Neck (Green)
  { points: [0, 11], color: '#22c55e' }, { points: [0, 12], color: '#22c55e' },
  // Shoulders & Torso (Green)
  { points: [11, 12], color: '#22c55e' }, { points: [11, 23], color: '#22c55e' }, { points: [12, 24], color: '#22c55e' }, { points: [23, 24], color: '#22c55e' },
  // Arms (Blue)
  { points: [11, 13], color: '#3b82f6' }, { points: [13, 15], color: '#3b82f6' },
  { points: [12, 14], color: '#3b82f6' }, { points: [14, 16], color: '#3b82f6' },
  // Pelvis / Hips (Purple)
  { points: [23, 24], color: '#a855f7' },
  // Legs (Red)
  { points: [23, 25], color: '#ef4444' }, { points: [25, 27], color: '#ef4444' }, { points: [27, 29], color: '#ef4444' }, { points: [29, 31], color: '#ef4444' },
  { points: [24, 26], color: '#ef4444' }, { points: [26, 28], color: '#ef4444' }, { points: [28, 30], color: '#ef4444' }, { points: [30, 32], color: '#ef4444' },
];

const getJointColor = (index: number) => {
  if (index === 0) return '#22c55e'; // Green head
  if (index >= 11 && index <= 16) return '#3b82f6'; // Blue arms
  if (index >= 23 && index <= 24) return '#a855f7'; // Purple hips
  if (index >= 25 && index <= 32) return '#ef4444'; // Red legs
  return '#22c55e'; // Default Green
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

  // Binary search for exact current frame + Interpolation
  const interpolatedFrame = useMemo(() => {
    if (!sortedFrames.length) return null;
    
    // Find the two frames surrounding localTime
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
    
    const frameA = sortedFrames[idx];
    const frameB = sortedFrames[idx + 1];
    
    if (!frameB) return frameA;
    
    // Calculate interpolation factor (0 to 1)
    const timeA = frameA.timestamp;
    const timeB = frameB.timestamp;
    const factor = (localTime - timeA) / (timeB - timeA);
    const safeFactor = Math.max(0, Math.min(1, factor));
    
    // Lerp landmarks
    const interpolatedLandmarks = frameA.landmarks.map((lmA, i) => {
      const lmB = frameB.landmarks[i];
      if (!lmA || !lmB) return lmA;
      return {
        x: lmA.x + (lmB.x - lmA.x) * safeFactor,
        y: lmA.y + (lmB.y - lmA.y) * safeFactor,
        z: (lmA.z || 0) + ((lmB.z || 0) - (lmA.z || 0)) * safeFactor,
        visibility: (lmA.visibility || 0) + ((lmB.visibility || 0) - (lmA.visibility || 0)) * safeFactor,
      };
    });
    
    return {
      ...frameA,
      landmarks: interpolatedLandmarks,
    };
  }, [sortedFrames, localTime]);

  const currentFrame = interpolatedFrame;

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
              {POSE_CONNECTIONS.map(({ points: [i1, i2], color: boneColor }, connIdx) => {
                const p1 = currentFrame.landmarks[i1];
                const p2 = currentFrame.landmarks[i2];
                if (!p1 || !p2 || (p1.visibility && p1.visibility < 0.4) || (p2.visibility && p2.visibility < 0.4)) {
                  return null;
                }
                
                const x1 = p1.x * drawWidth;
                const y1 = p1.y * drawHeight;
                const x2 = p2.x * drawWidth;
                const y2 = p2.y * drawHeight;
                
                const point1 = vec(x1, y1);
                const point2 = vec(x2, y2);
                
                const status = getConnectionStatus(i1, i2);
                const activeColor = status === 'error' ? '#ef4444' : status === 'warning' ? '#fbbf24' : boneColor;

                return (
                  <React.Fragment key={`bone-${connIdx}`}>
                    {/* Outer Glow */}
                    <Line 
                      p1={point1} 
                      p2={point2} 
                      color={activeColor} 
                      strokeWidth={14} 
                      opacity={0.15} 
                    />
                    {/* Thematic Bone */}
                    <Line 
                      p1={point1} 
                      p2={point2} 
                      color={activeColor} 
                      strokeWidth={5} 
                      opacity={0.5} 
                    />
                    {/* Core High-Contrast Line */}
                    <Line 
                      p1={point1} 
                      p2={point2} 
                      color="#ffffff" 
                      strokeWidth={2} 
                      opacity={0.9} 
                    />
                  </React.Fragment>
                );
              })}

              {/* Enhanced Joints */}
              {currentFrame.landmarks.map((lm, i) => {
                if (lm.visibility && lm.visibility < 0.4) return null;
                const isHighlight = i === 11 || i === 12 || i === 23 || i === 24 || i === 25 || i === 26 || i === 0;
                const cx = lm.x * drawWidth;
                const cy = lm.y * drawHeight;
                
                // Fix: Check if this joint is involved in any failing rule
                const activeRules = sportRule.jointRules.filter(r => r.keypoints.includes(i));
                const statuses = activeRules.map(r => currentFrame.ruleResults[r.id] || 'optimal');
                let jointColor = getJointColor(i);
                
                if (statuses.includes('error')) jointColor = '#ef4444';
                else if (statuses.includes('warning')) jointColor = '#fbbf24';

                return (
                  <React.Fragment key={`joint-group-${i}`}>
                    {/* Joint Glow */}
                    <Circle 
                      cx={cx} 
                      cy={cy} 
                      r={isHighlight ? 14 : 9} 
                      color={jointColor} 
                      opacity={0.2} 
                    />
                    {/* High-Contrast Core */}
                    <Circle 
                      cx={cx} 
                      cy={cy} 
                      r={isHighlight ? 4 : 3} 
                      color="#ffffff" 
                      opacity={1} 
                    />
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
                      top: vy - 50 + (idx * 15), 
                      borderColor: status === 'error' ? '#ef4444' : getJointColor(rule.keypoints[1]),
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
