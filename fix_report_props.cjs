const fs = require('fs');
let code = fs.readFileSync('src/components/AnalysisReportPage.tsx', 'utf8');

code = code.replace(
  "  onVideoSelected: () => void;\n}",
  "  onVideoSelected: () => void;\n  startTime?: number;\n  endTime?: number;\n  cropBox?: { x: number; y: number; width: number; height: number };\n}"
);

code = code.replace(
  "  onBack,\n  onVideoSelected\n}) => {",
  "  onBack,\n  onVideoSelected,\n  startTime = 0,\n  endTime,\n  cropBox\n}) => {"
);

// In AnalysisReportPage useEffect for setting duration and currentTime
// We should make the video start at `startTime`
code = code.replace(
  "  const handleSeek = (time: number) => {\n    if (!videoRef.current) return;\n    videoRef.current.currentTime = time;\n    setCurrentTime(time);\n  };",
  "  const handleSeek = (time: number) => {\n    if (!videoRef.current) return;\n    videoRef.current.currentTime = time;\n    setCurrentTime(time);\n  };\n\n  useEffect(() => {\n    if (videoRef.current && startTime > 0) {\n      videoRef.current.currentTime = startTime;\n      setCurrentTime(startTime);\n    }\n  }, [startTime, videoUrl]);"
);

// We need to constrain the video playback to the trimmed segment in AnalysisReportPage
code = code.replace(
  "              onLoadedMetadata={() => videoRef.current && setDuration(videoRef.current.duration)}",
  "              onLoadedMetadata={() => {\n                if (videoRef.current) {\n                  setDuration(endTime && endTime <= videoRef.current.duration ? endTime : videoRef.current.duration);\n                }\n              }}"
);

code = code.replace(
  "              onTimeUpdate={() => videoRef.current && setCurrentTime(videoRef.current.currentTime)}\n              onSeeked={() => videoRef.current && setCurrentTime(videoRef.current.currentTime)}",
  "              onTimeUpdate={() => {\n                if (videoRef.current) {\n                  if (endTime && videoRef.current.currentTime >= endTime) {\n                    videoRef.current.currentTime = startTime;\n                    videoRef.current.pause();\n                    setIsPlaying(false);\n                  }\n                  setCurrentTime(videoRef.current.currentTime);\n                }\n              }}\n              onSeeked={() => {\n                if (videoRef.current) {\n                  if (endTime && videoRef.current.currentTime >= endTime) {\n                    videoRef.current.currentTime = startTime;\n                  }\n                  setCurrentTime(videoRef.current.currentTime);\n                }\n              }}"
);

// In stepFrame, we need to constrain to `endTime`
code = code.replace(
  "    videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + deltaSeconds));",
  "    videoRef.current.currentTime = Math.max(startTime, Math.min(endTime || duration, videoRef.current.currentTime + deltaSeconds));"
);

// Fix ctx.drawImage in AnalysisReportPage to apply spatial cropBox
// if cropBox exists, we draw a cropped region of the video.
code = code.replace(
  "              ctx.drawImage(video, 0, 0, width, height);\n              drawPoseSkeleton(",
  `              if (cropBox) {
                const vWidth = video.videoWidth || width;
                const vHeight = video.videoHeight || height;
                const sx = cropBox.x * vWidth;
                const sy = cropBox.y * vHeight;
                const sWidth = cropBox.width * vWidth;
                const sHeight = cropBox.height * vHeight;
                ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, width, height);
              } else {
                ctx.drawImage(video, 0, 0, width, height);
              }
              drawPoseSkeleton(`
);

code = code.replace(
  "            } else {\n              ctx.clearRect(0, 0, width, height);\n              ctx.drawImage(video, 0, 0, width, height);\n            }",
  `            } else {
              ctx.clearRect(0, 0, width, height);
              if (cropBox) {
                const vWidth = video.videoWidth || width;
                const vHeight = video.videoHeight || height;
                const sx = cropBox.x * vWidth;
                const sy = cropBox.y * vHeight;
                const sWidth = cropBox.width * vWidth;
                const sHeight = cropBox.height * vHeight;
                ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, width, height);
              } else {
                ctx.drawImage(video, 0, 0, width, height);
              }
            }`
);

fs.writeFileSync('src/components/AnalysisReportPage.tsx', code);
console.log("Updated AnalysisReportPage.tsx");
