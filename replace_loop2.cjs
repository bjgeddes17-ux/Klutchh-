const fs = require('fs');
let code = fs.readFileSync('src/components/VideoPosePlayer.tsx', 'utf8');

const startMarker = "  // Engine for continuous drawing of skeleton over video loop\n  useEffect(() => {\n    let animationFrameId: number;";
const endMarker = "      }\n      animationFrameId = requestAnimationFrame(processFrame);\n    };\n    animationFrameId = requestAnimationFrame(processFrame);\n    return () => cancelAnimationFrame(animationFrameId);\n  }, [analysisResult]);";

const startIndex = code.indexOf(startMarker);
const endIndex = code.indexOf(endMarker) + endMarker.length;

if (startIndex === -1 || endIndex < startMarker.length) {
    console.error("Markers not found");
    process.exit(1);
}

const newLoop = `  // Engine for continuous drawing of skeleton over video loop
  useEffect(() => {
    let animationFrameId: number;
    let videoFrameCallbackId: number;
    let isProcessing = false;

    const processFrame = async (now: DOMHighResTimeStamp, metadata?: any) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas) {
        // Sync dimensions strictly
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
            // CRITICAL: hardware-synced time
            const videoTime = metadata && typeof metadata.mediaTime === 'number' 
              ? metadata.mediaTime 
              : video.currentTime;
            
            let landmarksToDraw: MediaPipeLandmark[] | null = null;
            let rulesToDraw: any = {};
            let anglesToDraw: any = {};
            let phaseToDraw = sportRule.phases[0];

            if (analysisResult?.allFrames && analysisResult.allFrames.length > 0) {
                const sorted = [...analysisResult.allFrames].sort((a,b) => a.timestamp - b.timestamp);
                
                // High-performance binary search to find closest extracted frame
                let low = 0;
                let high = sorted.length - 1;
                let bestMatch = sorted[0];
                let minDiff = Infinity;
                
                while (low <= high) {
                  const mid = (low + high) >> 1;
                  const diff = Math.abs(sorted[mid].timestamp - videoTime);
                  
                  if (diff < minDiff) {
                    minDiff = diff;
                    bestMatch = sorted[mid];
                  }
                  
                  if (sorted[mid].timestamp < videoTime) {
                    low = mid + 1;
                  } else if (sorted[mid].timestamp > videoTime) {
                    high = mid - 1;
                  } else {
                    break;
                  }
                }

                // Strictly render exact frame without linear interpolation sliding
                const distanceToClosest = Math.abs(bestMatch.timestamp - videoTime);
                if (distanceToClosest < 0.25) { 
                    landmarksToDraw = bestMatch.landmarks;
                    rulesToDraw = bestMatch.ruleResults || {};
                    anglesToDraw = bestMatch.angles || {};
                    phaseToDraw = bestMatch.detectedPhase || sportRule.phases[0];
                }
            } else if (analysisResult?.keyframes && analysisResult.keyframes.length > 0) {
              const before = [...analysisResult.keyframes].reverse().find((kf) => kf.timestamp <= videoTime);
              const after = analysisResult.keyframes.find((kf) => kf.timestamp > videoTime);
              
              if (before || after) {
                const closest = (before && after) 
                  ? (Math.abs(videoTime - before.timestamp) < Math.abs(after.timestamp - videoTime) ? before : after)
                  : (before || after)!;
                
                if (Math.abs(closest.timestamp - videoTime) < 0.25) {
                   landmarksToDraw = closest.landmarks;
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
                rulesToDraw,
                anglesToDraw,
                sportRule,
                phaseToDraw
              );
            } else {
              ctx.clearRect(0, 0, width, height);
            }
          } catch (e) {
             console.error("Frame render error", e);
          } finally {
            isProcessing = false;
          }
        }
      }

      if ('requestVideoFrameCallback' in HTMLVideoElement.prototype && videoRef.current && videoRef.current.readyState >= 2) {
        videoFrameCallbackId = (videoRef.current as any).requestVideoFrameCallback(processFrame);
      } else {
        animationFrameId = requestAnimationFrame((now) => processFrame(now));
      }
    };

    if ('requestVideoFrameCallback' in HTMLVideoElement.prototype && videoRef.current && videoRef.current.readyState >= 2) {
      videoFrameCallbackId = (videoRef.current as any).requestVideoFrameCallback(processFrame);
    } else {
      animationFrameId = requestAnimationFrame((now) => processFrame(now));
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (videoFrameCallbackId && 'cancelVideoFrameCallback' in HTMLVideoElement.prototype && videoRef.current) {
        (videoRef.current as any).cancelVideoFrameCallback(videoFrameCallbackId);
      }
    };
  }, [analysisResult, sportRule]);`;

const newCode = code.substring(0, startIndex) + newLoop + code.substring(endIndex);
fs.writeFileSync('src/components/VideoPosePlayer.tsx', newCode);
console.log("Replaced successfully");
