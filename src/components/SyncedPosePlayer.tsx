import React, { useState, useRef } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import { ResizeMode, Video } from 'expo-av';
import { Canvas, Circle } from '@shopify/react-native-skia';

interface Landmark {
  x: number; // 0 to 1 normalized
  y: number; // 0 to 1 normalized
}

interface FrameData {
  timestampMs: number;
  landmarks: Landmark[];
  angles?: { label: string; value: number; x: number; y: number }[];
}

export default function SyncedPosePlayer({ 
  videoSource, 
  poseDataSequence 
}: { 
  videoSource: any; 
  poseDataSequence: FrameData[] 
}) {
  const videoRef = useRef<Video>(null);
  const [currentPositionMs, setCurrentPositionMs] = useState(0);
  
  // Layout metrics
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // 1. Capture exact video file dimensions on load
  const handleLoad = (status: any) => {
    if (status.isLoaded && status.naturalSize) {
      setNaturalSize({
        width: status.naturalSize.width,
        height: status.naturalSize.height,
      });
    }
  };

  // 2. Track playback time continuously
  const handlePlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setCurrentPositionMs(status.positionMillis);
    }
  };

  // 3. Match container layout changes (handles fullscreen toggles)
  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setContainerSize({ width, height });
  };

  // 4. Calculate exact letterbox/pillarbox scaling matrix
  const getScaleMetrics = () => {
    if (!naturalSize.width || !containerSize.width) return { scale: 1, offsetX: 0, offsetY: 0 };

    const containerAspect = containerSize.width / containerSize.height;
    const mediaAspect = naturalSize.width / naturalSize.height;

    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;

    if (containerAspect > mediaAspect) {
      scale = containerSize.height / naturalSize.height;
      offsetX = (containerSize.width - (naturalSize.width * scale)) / 2;
    } else {
      scale = containerSize.width / naturalSize.width;
      offsetY = (containerSize.height - (naturalSize.height * scale)) / 2;
    }

    return { scale, offsetX, offsetY };
  };

  const { scale, offsetX, offsetY } = getScaleMetrics();

  // 5. Find the exact frame landmarks matching the current video millisecond
  const currentFrame = poseDataSequence && poseDataSequence.length > 0 ? poseDataSequence.reduce((prev, curr) => {
    return Math.abs(curr.timestampMs - currentPositionMs) < Math.abs(prev.timestampMs - currentPositionMs)
      ? curr
      : prev;
  }, poseDataSequence[0]) : null;

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <Video
        ref={videoRef}
        source={videoSource}
        style={StyleSheet.absoluteFill}
        resizeMode={ResizeMode.CONTAIN}
        onLoad={handleLoad}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        shouldPlay
        isLooping
      />

      {/* Skia Canvas perfectly overlaid on the exact container bounds */}
      {containerSize.width > 0 && currentFrame && currentFrame.landmarks && (
        <Canvas style={StyleSheet.absoluteFill}>
          {currentFrame.landmarks.map((pt, idx) => {
            const screenX = pt.x * (naturalSize.width * scale) + offsetX;
            const screenY = pt.y * (naturalSize.height * scale) + offsetY;
            return (
              <Circle key={idx} cx={screenX} cy={screenY} r={6} color="#00FF80" />
            );
          })}
        </Canvas>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 450,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
});
