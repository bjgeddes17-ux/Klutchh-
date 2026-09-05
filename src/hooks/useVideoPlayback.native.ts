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

  const lastSeekTime = useRef<number>(-1);

  // Imperative Play/Pause Enforcement to guarantee controls stop/start the video instantly
  useEffect(() => {
    const playTarget = async () => {
      try {
        const ref = isFullscreenModal ? fullscreenVideoRef.current : videoRef.current;
        const otherRef = isFullscreenModal ? videoRef.current : fullscreenVideoRef.current;

        if (otherRef) {
          await otherRef.pauseAsync().catch(() => {});
        }

        if (!ref) return;

        if (isPlaying) {
          const status = await ref.getStatusAsync().catch(() => null);
          if (status && status.isLoaded) {
            // If near the end of video, reset to beginning before playing
            if (status.positionMillis >= (status.durationMillis || 3500) - 100) {
              await ref.setPositionAsync(0).catch(() => {});
            }
          }
          await ref.playAsync().catch(() => {});
        } else {
          await ref.pauseAsync().catch(() => {});
        }
      } catch (e) {
        // Safe catch for hardware unmounts
      }
    };

    playTarget();
  }, [isPlaying, isFullscreenModal]);

  const handlePlaybackStatusUpdate = useCallback((status: AVPlaybackStatus, fromFullscreen: boolean) => {
    // Only accept updates from the active player to prevent fighting between instances
    if (status.isLoaded && (fromFullscreen === isFullscreenModal)) {
      // If we are actively scrubbing or recently finished a seek, ignore position updates
      if (isScrubbing.current) return;

      const posSec = status.positionMillis / 1000;
      onTimeUpdate(posSec);
      
      if (status.durationMillis && status.durationMillis > 500) {
        const durSec = status.durationMillis / 1000;
        setDuration(durSec);
        onDurationChange?.(durSec);
      }

      // Handle video loop / completion cleanly so skeleton and playback remain in 100% lockstep
      if (status.didJustFinish) {
        if (!status.isLooping) {
          if (onPause) onPause();
        }
      }
    }
  }, [isFullscreenModal, onTimeUpdate, onDurationChange, onPause]);

  const handleSeek = useCallback((ratio: number, finished: boolean = false, currentTime: number) => {
    isScrubbing.current = true;
    if (onPause) onPause();
    
    if (seekLockoutTimer.current) {
      clearTimeout(seekLockoutTimer.current);
    }

    const targetSec = Math.max(0, Math.min(duration, ratio * duration));
    const seekTime = Math.round(targetSec * 1000);

    // Prevent redundant seeks to the same millisecond
    if (seekTime === lastSeekTime.current && !finished) return;
    lastSeekTime.current = seekTime;
    
    // UI update is INSTANT
    onTimeUpdate(targetSec);
    
    // Seek both refs: fast tolerance during drag for 60fps responsive scrubbing, exact zero tolerance on release
    const tolerance = finished ? 0 : 40;
    if (videoRef.current) {
      videoRef.current.setPositionAsync(seekTime, {
        toleranceMillisBefore: tolerance,
        toleranceMillisAfter: tolerance,
      }).catch(() => {});
    }
    if (fullscreenVideoRef.current) {
      fullscreenVideoRef.current.setPositionAsync(seekTime, {
        toleranceMillisBefore: tolerance,
        toleranceMillisAfter: tolerance,
      }).catch(() => {});
    }

    if (finished) {
      seekLockoutTimer.current = setTimeout(() => {
        isScrubbing.current = false;
        lastSeekTime.current = -1;
      }, 80);
    }
  }, [duration, isFullscreenModal, onTimeUpdate, onPause]);

  const handleSeekToTime = useCallback((targetSec: number, resumePlay: boolean = false) => {
    isScrubbing.current = true;
    const clamped = Math.max(0, Math.min(duration, targetSec));
    onTimeUpdate(clamped);

    const seekTime = Math.round(clamped * 1000);
    const promises: Promise<any>[] = [];
    if (videoRef.current) {
      promises.push(
        videoRef.current.setPositionAsync(seekTime, {
          toleranceMillisBefore: 10,
          toleranceMillisAfter: 10,
        }).then(() => {
          if (resumePlay && !isFullscreenModal) {
            return videoRef.current?.playAsync();
          }
        }).catch(() => {})
      );
    }
    if (fullscreenVideoRef.current) {
      promises.push(
        fullscreenVideoRef.current.setPositionAsync(seekTime, {
          toleranceMillisBefore: 10,
          toleranceMillisAfter: 10,
        }).then(() => {
          if (resumePlay && isFullscreenModal) {
            return fullscreenVideoRef.current?.playAsync();
          }
        }).catch(() => {})
      );
    }

    Promise.all(promises).finally(() => {
      setTimeout(() => {
        isScrubbing.current = false;
      }, 100);
    });
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
    const promises: Promise<any>[] = [];
    if (videoRef.current) {
      promises.push(
        videoRef.current.setPositionAsync(seekTime, {
          toleranceMillisBefore: 0,
          toleranceMillisAfter: 0,
        }).catch(() => {})
      );
    }
    if (fullscreenVideoRef.current) {
      promises.push(
        fullscreenVideoRef.current.setPositionAsync(seekTime, {
          toleranceMillisBefore: 0,
          toleranceMillisAfter: 0,
        }).catch(() => {})
      );
    }

    Promise.all(promises).finally(() => {
      setTimeout(() => {
        isScrubbing.current = false;
      }, 120);
    });
  }, [duration, isFullscreenModal, onPause, onTimeUpdate]);

  const handleChangeSpeed = useCallback((speed: number) => {
    setSelectedSpeed(speed);
    if (isFullscreenModal) {
      fullscreenVideoRef.current?.setRateAsync(speed, true).catch(() => {});
    } else {
      videoRef.current?.setRateAsync(speed, true).catch(() => {});
    }
  }, [isFullscreenModal]);

  // Clean unmount to release hardware decoders and video memory
  useEffect(() => {
    return () => {
      if (seekLockoutTimer.current) {
        clearTimeout(seekLockoutTimer.current);
      }
      videoRef.current?.unloadAsync().catch(() => {});
      fullscreenVideoRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

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
