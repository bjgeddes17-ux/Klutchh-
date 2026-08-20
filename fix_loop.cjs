const fs = require('fs');
let code = fs.readFileSync('src/components/AnalysisReportPage.tsx', 'utf8');

const startMarker = "  // Hardware-accelerated and strictly synced video drawing loop\n  useEffect(() => {\n    const video = videoRef.current;";
const endMarker = "      } else {\n        animationFrameId = requestAnimationFrame((now) => processFrame(now));\n      }\n    };\n\n    if ('requestVideoFrameCallback' in HTMLVideoElement.prototype && video.readyState >= 2) {\n      videoFrameCallbackId = (video as any).requestVideoFrameCallback(processFrame);\n    } else {\n      animationFrameId = requestAnimationFrame((now) => processFrame(now));\n    }\n\n    return () => {\n      if (animationFrameId) cancelAnimationFrame(animationFrameId);\n      if (videoFrameCallbackId && 'cancelVideoFrameCallback' in HTMLVideoElement.prototype) {\n        (video as any).cancelVideoFrameCallback(videoFrameCallbackId);\n      }\n    };\n  }, [sportRule, sortedFrames]);";

const startIndex = code.indexOf(startMarker);
const endIndex = code.indexOf(endMarker) + endMarker.length;

if (startIndex === -1 || endIndex < startMarker.length) {
    console.error("Markers not found");
    process.exit(1);
}

const newLoop = `  // Hardware-accelerated, per-frame exact synced video drawing loop
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let isProcessing = false;
    let animationFrameId: number;
    let videoFrameCallbackId: number;

    const processFrame = async (now: DOMHighResTimeStamp, metadata?: any) => {
      const canvas = canvasRef.current;
      if (canvas && video) {
        const width = video.videoWidth || 640;
        const height = video.videoHeight || 360;
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }

        const ctx = canvas.getContext('2d');
        if (ctx && !isProcessing) {
          isProcessing = true;
          try {
            // CRITICAL: use mediaTime if available (the exact timestamp of the painted frame)
            const currentTime = metadata && typeof metadata.mediaTime === 'number' 
              ? metadata.mediaTime 
              : video.currentTime;
            
            let landmarksToDraw: MediaPipeLandmark[] | null = null;
            let ruleResultsToDraw: any = {};
            let anglesToDraw: any = {};
            let activeFramePhase = sportRule.phases[0];

            if (sortedFrames.length > 0) {
              let prevFrame = sortedFrames[0];
              let nextFrame = sortedFrames[sortedFrames.length - 1];

              if (currentTime <= sortedFrames[0].timestamp) {
                prevFrame = sortedFrames[0];
                nextFrame = sortedFrames[0];
              } else if (currentTime >= sortedFrames[sortedFrames.length - 1].timestamp) {
                prevFrame = sortedFrames[sortedFrames.length - 1];
                nextFrame = sortedFrames[sortedFrames.length - 1];
              } else {
                // High-performance binary search to find bounding keyframes
                let low = 0;
                let high = sortedFrames.length - 1;
                while (low <= high) {
                  const mid = (low + high) >> 1;
                  if (sortedFrames[mid].timestamp <= currentTime) {
                    prevFrame = sortedFrames[mid];
                    low = mid + 1;
                  } else {
                    nextFrame = sortedFrames[mid];
                    high = mid - 1;
                  }
                }
              }

              const timeSpan = nextFrame.timestamp - prevFrame.timestamp;
              const alpha = timeSpan > 0.001 ? Math.max(0, Math.min(1, (currentTime - prevFrame.timestamp) / timeSpan)) : 0;
              
              const closestFrame = alpha < 0.5 ? prevFrame : nextFrame;
              ruleResultsToDraw = closestFrame.ruleResults || {};
              anglesToDraw = closestFrame.angles || {};
              activeFramePhase = closestFrame.detectedPhase || sportRule.phases[0];

              const distanceToClosest = Math.abs(closestFrame.timestamp - currentTime);
              
              // Only draw if we are reasonably close to the current time
              if (distanceToClosest < 0.25) { 
                if (timeSpan < 0.2 && prevFrame.landmarks && nextFrame.landmarks && prevFrame.landmarks.length === nextFrame.landmarks.length) {
                  // Sub-frame linear interpolation of 3D MediaPipe landmarks for buttery smooth micro-sync
                  landmarksToDraw = prevFrame.landmarks.map((pt1, idx) => {
                    const pt2 = nextFrame.landmarks[idx] || pt1;
                    const vis1 = pt1.visibility ?? 1;
                    const vis2 = pt2.visibility ?? 1;
                    return {
                      x: pt1.x + (pt2.x - pt1.x) * alpha,
                      y: pt1.y + (pt2.y - pt1.y) * alpha,
                      z: (pt1.z || 0) + ((pt2.z || 0) - (pt1.z || 0)) * alpha,
                      visibility: vis1 + (vis2 - vis1) * alpha
                    };
                  });
                } else {
                  landmarksToDraw = closestFrame.landmarks;
                }
              }
            }

            if (landmarksToDraw && landmarksToDraw.length > 0) {
              ctx.clearRect(0, 0, width, height);
              drawPoseSkeleton(
                ctx,
                width,
                height,
                landmarksToDraw,
                ruleResultsToDraw,
                anglesToDraw,
                sportRule,
                activeFramePhase
              );
            } else {
              ctx.clearRect(0, 0, width, height);
            }
          } catch (err) {
            console.warn("Frame loop processing note:", err);
          } finally {
            isProcessing = false;
          }
        }
      }

      if ('requestVideoFrameCallback' in HTMLVideoElement.prototype && video.readyState >= 2) {
        videoFrameCallbackId = (video as any).requestVideoFrameCallback(processFrame);
      } else {
        animationFrameId = requestAnimationFrame((now) => processFrame(now));
      }
    };

    if ('requestVideoFrameCallback' in HTMLVideoElement.prototype && video.readyState >= 2) {
      videoFrameCallbackId = (video as any).requestVideoFrameCallback(processFrame);
    } else {
      animationFrameId = requestAnimationFrame((now) => processFrame(now));
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (videoFrameCallbackId && 'cancelVideoFrameCallback' in HTMLVideoElement.prototype) {
        (video as any).cancelVideoFrameCallback(videoFrameCallbackId);
      }
    };
  }, [sportRule, sortedFrames]);`;

const newCode = code.substring(0, startIndex) + newLoop + code.substring(endIndex);
fs.writeFileSync('src/components/AnalysisReportPage.tsx', newCode);
console.log("Replaced successfully in AnalysisReportPage");
