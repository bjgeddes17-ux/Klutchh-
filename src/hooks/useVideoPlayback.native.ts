import { useRef, useState, useCallback, useEffect } from 'react';
import { Video, AVPlaybackStatus } from 'expo-av';

interface UseVideoPlaybackProps {
  isPlaying: boolean;
  onTimeUpdate: (time: number) => void;
  onDurationChange?: (duration: number) => void;
  onPause?: () => void;
  onTogglePlay?: () => void;
  isFullscreenModal: boolean;
  initialPlaybackRate?: number;
  initialDuration?: number;
}

export const useVideoPlayback = ({
  isPlaying,
  onTimeUpdate,
  onDurationChange,
  onPause,
  onTogglePlay,
  isFullscreenModal,
  initialPlaybackRate = 1,
  initialDuration = 3.5,
}: UseVideoPlaybackProps) => {
  const videoRef = useRef<Video>(null);
  const fullscreenVideoRef = useRef<Video>(null);
  const isScrubbing = useRef(false);
  const seekLockoutTimer = useRef<NodeJS.Timeout | null>(null);

  const [duration, setDuration] = useState<number>(initialDuration);
  const [selectedSpeed, setSelectedSpeed] = useState<number>(initialPlaybackRate);

  // Synchronize duration when initialDuration changes
  useEffect(() => {
    if (initialDuration && initialDuration > 0.5) {
      setDuration(initialDuration);
    }
  }, [initialDuration]);

  const activeVideoRef = isFullscreenModal ? fullscreenVideoRef : videoRef;

  const handlePlaybackStatusUpdate = useCallback((status: AVPlaybackStatus, fromFullscreen: boolean) => {
    // Only accept updates from the active player to prevent fighting between instances
    if (status.isLoaded && (fromFullscreen === isFullscreenModal)) {
      const posSec = status.positionMillis / 1000;
      
      // If we are scrubbing, we already updated onTimeUpdate in handleSeek
      if (!isScrubbing.current) {
        onTimeUpdate(posSec);
      }
      
      if (status.durationMillis && status.durationMillis > 500) {
        const durSec = status.durationMillis / 1000;
        setDuration(durSec);
        onDurationChange?.(durSec);
      }
    }
  }, [isFullscreenModal, onTimeUpdate, onDurationChange]);

  const handleSeek = useCallback((ratio: number, finished: boolean = false, currentTime: number) => {
    isScrubbing.current = !finished;
    if (onPause) onPause();
    
    // Clear any previous debounce
    if (seekLockoutTimer.current) {
      clearTimeout(seekLockoutTimer.current);
    }

    const targetSec = Math.max(0, Math.min(duration, ratio * duration));
    
    // Always update UI time immediately so skeleton & thumb move without lag
    onTimeUpdate(targetSec);
    
    const seekTime = Math.round(targetSec * 1000);
    const targetRef = isFullscreenModal ? fullscreenVideoRef.current : videoRef.current;

    if (targetRef) {
      targetRef.pauseAsync().catch(() => {});
      targetRef.setPositionAsync(seekTime, {
        toleranceMillisBefore: 5,
        toleranceMillisAfter: 5,
      }).catch(() => {});
    }

    if (finished) {
      // Keep isScrubbing locked briefly (150ms) to allow video decoder to stabilize at seek point
      seekLockoutTimer.current = setTimeout(() => {
        isScrubbing.current = false;
      }, 150);
    }
  }, [duration, isFullscreenModal, onTimeUpdate, onPause]);

  const handleSeekToTime = useCallback((targetSec: number, resumePlay: boolean = false) => {
    isScrubbing.current = true;
    const clamped = Math.max(0, Math.min(duration, targetSec));
    onTimeUpdate(clamped);

    const seekTime = Math.round(clamped * 1000);
    const targetRef = isFullscreenModal ? fullscreenVideoRef.current : videoRef.current;

    if (targetRef) {
      targetRef.setPositionAsync(seekTime, {
        toleranceMillisBefore: 10,
        toleranceMillisAfter: 10,
      }).then(() => {
        if (resumePlay) {
          targetRef.playAsync().catch(() => {});
        }
      }).catch(() => {})
      .finally(() => {
        setTimeout(() => {
          isScrubbing.current = false;
        }, 150);
      });
    }
  }, [duration, isFullscreenModal, onTimeUpdate]);

  const handleStep = useCallback((direction: 'back' | 'forward', currentTime: number) => {
    isScrubbing.current = true;
    if (onPause) onPause();

    const stepTime = 0.04; // 1 video frame @ 25fps
    const target = direction === 'back'
      ? Math.max(0, currentTime - stepTime)
      : Math.min(duration, currentTime + stepTime);
    
    onTimeUpdate(target);
    const seekTime = Math.round(target * 1000);
    const targetRef = isFullscreenModal ? fullscreenVideoRef.current : videoRef.current;

    if (targetRef) {
      targetRef.setPositionAsync(seekTime, {
        toleranceMillisBefore: 0,
        toleranceMillisAfter: 0,
      }).catch(() => {})
      .finally(() => {
        setTimeout(() => {
          isScrubbing.current = false;
        }, 120);
      });
    }
  }, [duration, isFullscreenModal, onPause, onTimeUpdate]);

  const handleChangeSpeed = useCallback((speed: number) => {
    setSelectedSpeed(speed);
    if (isFullscreenModal) {
      fullscreenVideoRef.current?.setRateAsync(speed, true).catch(() => {});
    } else {
      videoRef.current?.setRateAsync(speed, true).catch(() => {});
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
    handleSeekToTime,
    handleStep,
    handleChangeSpeed,
    setDuration,
  };
};
