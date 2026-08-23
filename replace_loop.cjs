const fs = require('fs');
let code = fs.readFileSync('src/components/AnalysisReportPage.tsx', 'utf8');

const startMarker = "  // Continuous Pose Skeleton Canvas Overlay Loop\n  useEffect(() => {\n    let animationFrameId: number;\n    let isProcessing = false;";
const endMarker = "    animationFrameId = requestAnimationFrame(processFrame);\n    return () => cancelAnimationFrame(animationFrameId);\n  }, [sportRule, sortedFrames]);";

const startIndex = code.indexOf(startMarker);
const endIndex = code.indexOf(endMarker) + endMarker.length;

if (startIndex === -1 || endIndex < startMarker.length) {
    console.error("Markers not found");
    process.exit(1);
}

const newLoop = `  // Hardware-accelerated and strictly synced video drawing loop
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
            // CRITICAL: use mediaTime if available (the exact timestamp of the painted frame), 
            // fallback to currentTime only if unsupported.
            const currentTime = metadata && typeof metadata.mediaTime === 'number' 
              ? metadata.mediaTime 
              : video.currentTime;
            
            let landmarksToDraw: MediaPipeLandmark[] | null = null;
            let ruleResultsToDraw: any = {};
            let anglesToDraw: any = {};
            let activeFramePhase = sportRule.phases[0];

            if (sortedFrames.length > 0) {
              let closestFrame = sortedFrames[0];

              if (currentTime <= sortedFrames[0].timestamp) {
                closestFrame = sortedFrames[0];
              } else if (currentTime >= sortedFrames[sortedFrames.length - 1].timestamp) {
                closestFrame = sortedFrames[sortedFrames.length - 1];
              } else {
                // High-performance binary search to find the closest exact frame
                let low = 0;
                let high = sortedFrames.length - 1;
                let bestMatch = sortedFrames[0];
                let minDiff = Infinity;
                
                while (low <= high) {
                  const mid = (low + high) >> 1;
                  const diff = Math.abs(sortedFrames[mid].timestamp - currentTime);
                  
                  if (diff < minDiff) {
                    minDiff = diff;
                    bestMatch = sortedFrames[mid];
                  }
                  
                  if (sortedFrames[mid].timestamp < currentTime) {
                    low = mid + 1;
                  } else if (sortedFrames[mid].timestamp > currentTime) {
                    high = mid - 1;
                  } else {
                    break;
                  }
                }
                closestFrame = bestMatch;
              }

              // ONLY render if the extracted frame is reasonably close to the actual painted frame
              // We intentionally REMOVE interpolation so we strictly draw per-frame as extracted!
              const distanceToClosest = Math.abs(closestFrame.timestamp - currentTime);
              if (distanceToClosest < 0.25) { 
                landmarksToDraw = closestFrame.landmarks;
                ruleResultsToDraw = closestFrame.ruleResults || {};
                anglesToDraw = closestFrame.angles || {};
                activeFramePhase = closestFrame.detectedPhase || sportRule.phases[0];
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
console.log("Replaced successfully");
