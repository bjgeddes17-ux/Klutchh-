const fs = require('fs');
let code = fs.readFileSync('src/utils/videoAnalyzer.ts', 'utf8');

// Add to synthesizeAnalysis arguments
code = code.replace(
  "  useOptionBPipeline: boolean\n): Promise<AnalysisResult> {",
  "  useOptionBPipeline: boolean,\n  startTime?: number,\n  endTime?: number,\n  cropBox?: { x: number; y: number; width: number; height: number }\n): Promise<AnalysisResult> {"
);

// Add to synthesizeAnalysis call
code = code.replace(
  "      const analysisResult = await synthesizeAnalysis(\n        allSampledFrames,\n        phaseWinners,\n        validFrames,\n        totalSymmetry,\n        totalKneeSafety,\n        sportRule,\n        athleteCategory,\n        skillLevel,\n        videoUrl,\n        calibratedFps,\n        useOptionBPipeline\n      );",
  "      const analysisResult = await synthesizeAnalysis(\n        allSampledFrames,\n        phaseWinners,\n        validFrames,\n        totalSymmetry,\n        totalKneeSafety,\n        sportRule,\n        athleteCategory,\n        skillLevel,\n        videoUrl,\n        calibratedFps,\n        useOptionBPipeline,\n        startTime,\n        endTime,\n        cropBox\n      );"
);

fs.writeFileSync('src/utils/videoAnalyzer.ts', code);
console.log("Updated videoAnalyzer.ts");
