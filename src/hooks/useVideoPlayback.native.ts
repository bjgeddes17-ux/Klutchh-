import { useRef, useState, useCallback } from 'react';
import { Video, AVPlaybackStatus } from 'expo-av';

interface UseVideoPlaybackProps {
  isPlaying: boolean;
  onTimeUpdate: (time: number) => void;
  onDurationChange?: (duration: number) => void;
  onPause?: () => void;
  isFullscreenModal: boolean;
  initialPlaybackRate?: number;
}

export const useVideoPlayback = ({
  isPlaying,
  onTimeUpdate,
  onDurationChange,
  onPause,
  isFullscreenModal,
  initialPlaybackRate = 1,
}: UseVideoPlaybackProps) => {
  const videoRef = useRef<Video>(null);
  const fullscreenVideoRef = useRef<Video>(null);
  const isScrubbing = useRef(false);
  
  const [duration, setDuration] = useState<number>(3.39);
  const [selectedSpeed, setSelectedSpeed] = useState<number>(initialPlaybackRate);

  const handlePlaybackStatusUpdate = useCallback((status: AVPlaybackStatus, fromFullscreen: boolean) => {
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
  }, [isFullscreenModal, onTimeUpdate, onDurationChange]);

  const handleSeek = useCallback((ratio: number, finished: boolean = false, currentTime: number) => {
    isScrubbing.current = !finished;
    
    // Pause on seek start to prevent fighting
    if (!finished && isPlaying && onPause) {
      onPause();
    }

    const targetSec = Math.max(0, Math.min(duration, ratio * duration));
    
    // Always update parent time so skeleton moves instantly
    onTimeUpdate(targetSec);
    
    // Perform actual video seek with zero tolerance for frame-accurate scrubbing
    const seekParams = { toleranceMillisBefore: 0, toleranceMillisAfter: 0 };
    const seekTime = targetSec * 1000;

    if (isFullscreenModal) {
      fullscreenVideoRef.current?.setPositionAsync(seekTime, seekParams);
    } else {
      videoRef.current?.setPositionAsync(seekTime, seekParams);
    }
  }, [duration, isPlaying, isFullscreenModal, onPause, onTimeUpdate]);

  const handleStep = useCallback((direction: 'back' | 'forward', currentTime: number) => {
    const stepTime = 0.05; // ~1-2 frames
    const target = direction === 'back'
      ? Math.max(0, currentTime - stepTime)
      : Math.min(duration, currentTime + stepTime);
    
    const seekParams = { toleranceMillisBefore: 0, toleranceMillisAfter: 0 };
    const seekTime = target * 1000;

    if (isFullscreenModal) {
      fullscreenVideoRef.current?.setPositionAsync(seekTime, seekParams);
    } else {
      videoRef.current?.setPositionAsync(seekTime, seekParams);
    }
  }, [duration, isFullscreenModal]);

  const handleChangeSpeed = useCallback((speed: number) => {
    setSelectedSpeed(speed);
    if (isFullscreenModal) {
      fullscreenVideoRef.current?.setRateAsync(speed, true);
    } else {
      videoRef.current?.setRateAsync(speed, true);
    }
  }, [isFullscreenModal]);

  return {
    videoRef,
    fullscreenVideoRef,
    duration,
    selectedSpeed,
    isScrubbing,
    handlePlaybackStatusUpdate,
    handleSeek,
    handleStep,
    handleChangeSpeed,
    setDuration,
  };
};
