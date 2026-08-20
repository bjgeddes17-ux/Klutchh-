const fs = require('fs');
const code = fs.readFileSync('src/components/VideoPosePlayer.tsx', 'utf8');

const lines = code.split('\n');

const newLoop = `  useEffect(() => {
    let animationFrameId: number;
    let videoFrameCallbackId: number;
    let lastDetectTriggerTime = 0;
    const MAX_VIDEO_DURATION = 30.0; // Max 30s clip limit

    const processFrame = (now: DOMHighResTimeStamp, metadata?: any) => {
      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!canvas || !video) {
          if ('requestVideoFrameCallback' in HTMLVideoElement.prototype && video && video.readyState >= 2) {
            videoFrameCallbackId = (video as any).requestVideoFrameCallback(processFrame);
          } else {
            animationFrameId = requestAnimationFrame((n) => processFrame(n));
          }
          return;
        }

        const width = video.videoWidth || 960;
        const height = video.videoHeight || 540;

        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          if ('requestVideoFrameCallback' in HTMLVideoElement.prototype && video.readyState >= 2) {
            videoFrameCallbackId = (video as any).requestVideoFrameCallback(processFrame);
          } else {
            animationFrameId = requestAnimationFrame((n) => processFrame(n));
          }
          return;
        }

        let videoTime = metadata && typeof metadata.mediaTime === 'number'
          ? metadata.mediaTime
          : video.currentTime || 0;

        let rawTime = video.currentTime || 0;

        if (video) {
          const capDuration = Math.min(video.duration || 30.0, MAX_VIDEO_DURATION);
          if (duration !== capDuration) setDuration(capDuration);
          if (rawTime >= MAX_VIDEO_DURATION) {
            video.currentTime = 0;
            rawTime = 0;
          }
        }
        setCurrentTime(rawTime);

        if (activeVideoUrl && video.readyState >= 2 && !isDetectingRef.current && (now - lastDetectTriggerTime > 30)) {
          isDetectingRef.current = true;
          lastDetectTriggerTime = now;
          const captureTime = videoTime;
          detectPoseForVideoFrame(video, Date.now()).then((poseResult) => {
            if (poseResult.landmarks && poseResult.landmarks.length > 0) {
              const roundedKey = Math.round(captureTime * 30) / 30;
              poseCacheRef.current.set(roundedKey, { landmarks: poseResult.landmarks, timestamp: captureTime });
              if (poseCacheRef.current.size > 150) {
                const firstKey = poseCacheRef.current.keys().next().value;
                if (firstKey !== undefined) poseCacheRef.current.delete(firstKey);
              }
            }
          }).catch((e) => console.warn("Pose detection error:", e))
            .finally(() => { isDetectingRef.current = false; });
        }

        if (!activeVideoUrl || video.readyState < 2) {
          ctx.clearRect(0, 0, width, height);
          setCurrentAnalysis(null);
          
          if ('requestVideoFrameCallback' in HTMLVideoElement.prototype && video.readyState >= 2) {
            videoFrameCallbackId = (video as any).requestVideoFrameCallback(processFrame);
          } else {
            animationFrameId = requestAnimationFrame((n) => processFrame(n));
          }
          return;
        }

        let landmarks: MediaPipeLandmark[] | null = null;
        const cacheEntries = (Array.from(poseCacheRef.current.values()) as PoseCacheEntry[]);

        if (cacheEntries.length > 0) {
          let closest = cacheEntries[0];
          let minDiff = Math.abs(closest.timestamp - videoTime);
          for (let i = 1; i < cacheEntries.length; i++) {
            const diff = Math.abs(cacheEntries[i].timestamp - videoTime);
            if (diff < minDiff) {
              minDiff = diff;
              closest = cacheEntries[i];
            }
          }

          cacheEntries.sort((a, b) => a.timestamp - b.timestamp);
          
          let before = cacheEntries[0];
          let after = cacheEntries[cacheEntries.length - 1];
          
          for (let i = 0; i < cacheEntries.length - 1; i++) {
            if (cacheEntries[i].timestamp <= videoTime && cacheEntries[i+1].timestamp >= videoTime) {
              before = cacheEntries[i];
              after = cacheEntries[i+1];
              break;
            }
          }
          
          if (before && after && before !== after) {
            const timeSpan = after.timestamp - before.timestamp;
            const distanceToClosest = Math.min(Math.abs(videoTime - before.timestamp), Math.abs(after.timestamp - videoTime));
            
            if (distanceToClosest < 0.25) {
              if (timeSpan < 0.2) {
                const ratio = (videoTime - before.timestamp) / timeSpan;
                landmarks = before.landmarks.map((lm, i) => ({
                  ...lm,
                  x: lm.x + (after.landmarks[i].x - lm.x) * ratio,
                  y: lm.y + (after.landmarks[i].y - lm.y) * ratio,
                  z: (lm.z || 0) + ((after.landmarks[i].z || 0) - (lm.z || 0)) * ratio,
                  visibility: lm.visibility + (after.landmarks[i].visibility - lm.visibility) * ratio
                }));
              } else {
                landmarks = Math.abs(videoTime - before.timestamp) < Math.abs(videoTime - after.timestamp) ? before.landmarks : after.landmarks;
              }
            } else {
              landmarks = null;
            }
          } else {
            landmarks = before?.landmarks || null;
          }
        }

        const isRealDetection = landmarks !== null && landmarks.length > 0;
        if (!isRealDetection && lastLandmarksRef.current) {
          landmarks = lastLandmarksRef.current;
        }

        ctx.clearRect(0, 0, width, height);

        if (landmarks && landmarks.length > 0) {
          lastLandmarksRef.current = landmarks;
          const calculatedAngles: Record<string, number> = {};
          const ruleResults: Record<string, 'optimal' | 'good' | 'warning' | 'error'> = {};

          sportRule.jointRules.forEach((rule) => {
            const [kp1, kp2, kp3] = rule.keypoints;
            const p1 = landmarks![kp1];
            const vertex = landmarks![kp2];
            const p3 = landmarks![kp3];

            const angle = calculateAngle(p1, vertex, p3);
            calculatedAngles[rule.id] = angle;

            const tolerance = rule.tolerancesByLevel[skillLevel] || {
              idealMin: rule.idealMin,
              idealMax: rule.idealMax,
              toleranceMargin: 10
            };

            const idealMin = tolerance.idealMin;
            const idealMax = tolerance.idealMax;
            const margin = tolerance.toleranceMargin || 10;
            const dev = Math.min(Math.abs(angle - idealMin), Math.abs(angle - idealMax));

            if (angle >= idealMin && angle <= idealMax) ruleResults[rule.id] = 'optimal';
            else if (dev <= margin) ruleResults[rule.id] = 'good';
            else ruleResults[rule.id] = 'warning';
          });

          setCurrentAnalysis({
            timestamp: rawTime,
            landmarks: landmarks,
            angles: calculatedAngles,
            ruleResults,
            detectedPhase: sportRule.phases[0],
            isRealDetection
          });

          if (showSkeletonOverlay) {
            drawPoseSkeleton(
              ctx,
              width,
              height,
              landmarks,
              ruleResults,
              calculatedAngles,
              sportRule,
              sportRule.phases[0]
            );
          }
        } else {
          ctx.clearRect(0, 0, width, height);
          setCurrentAnalysis(null);
        }

      } catch (e) {
        console.error("Frame loop error:", e);
      }

      const video = videoRef.current;
      if (video && 'requestVideoFrameCallback' in HTMLVideoElement.prototype && video.readyState >= 2) {
        videoFrameCallbackId = (video as any).requestVideoFrameCallback(processFrame);
      } else {
        animationFrameId = requestAnimationFrame((n) => processFrame(n));
      }
    };

    const video = videoRef.current;
    if (video && 'requestVideoFrameCallback' in HTMLVideoElement.prototype && video.readyState >= 2) {
      videoFrameCallbackId = (video as any).requestVideoFrameCallback(processFrame);
    } else {
      animationFrameId = requestAnimationFrame((n) => processFrame(n));
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (videoFrameCallbackId && videoRef.current && 'cancelVideoFrameCallback' in HTMLVideoElement.prototype) {
        (videoRef.current as any).cancelVideoFrameCallback(videoFrameCallbackId);
      }
    };
  }, [activeVideoUrl, sportRule, skillLevel, showSkeletonOverlay]);`;

const newCode = lines.slice(0, 93).join('\n') + '\n' + newLoop + '\n' + lines.slice(323).join('\n');

fs.writeFileSync('src/components/VideoPosePlayer.tsx', newCode);
console.log("Replaced perfectly via lines");
