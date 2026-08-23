const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Add states
code = code.replace(
  "  const [currentDynamicMetrics, setCurrentDynamicMetrics] = useState<any>(null);",
  "  const [currentDynamicMetrics, setCurrentDynamicMetrics] = useState<any>(null);\n  const [currentStartTime, setCurrentStartTime] = useState<number>(0);\n  const [currentEndTime, setCurrentEndTime] = useState<number | undefined>(undefined);\n  const [currentCropBox, setCurrentCropBox] = useState<{ x: number; y: number; width: number; height: number } | undefined>(undefined);"
);

// handleProcessingMagicComplete
code = code.replace(
  "      if (res.dynamicMetrics) {\n        setCurrentDynamicMetrics(res.dynamicMetrics);\n      }",
  "      if (res.dynamicMetrics) {\n        setCurrentDynamicMetrics(res.dynamicMetrics);\n      }\n      setCurrentStartTime(res.startTime || 0);\n      setCurrentEndTime(res.endTime);\n      setCurrentCropBox(res.cropBox);"
);

// handleLoadSavedReport
code = code.replace(
  "    if (report.report) setCurrentAIReport(report.report);",
  "    if (report.report) setCurrentAIReport(report.report);\n    setCurrentStartTime(report.startTime || 0);\n    setCurrentEndTime(report.endTime);\n    setCurrentCropBox(report.cropBox);"
);

// handleSaveReport
code = code.replace(
  "      sequenceComparison: currentSequenceComparison || undefined,",
  "      sequenceComparison: currentSequenceComparison || undefined,\n      startTime: currentStartTime,\n      endTime: currentEndTime,\n      cropBox: currentCropBox,"
);

// AnalysisReportPage props
code = code.replace(
  "            onVideoSelected={handleVideoSelected}\n          />",
  "            onVideoSelected={handleVideoSelected}\n            startTime={currentStartTime}\n            endTime={currentEndTime}\n            cropBox={currentCropBox}\n          />"
);

fs.writeFileSync('src/App.tsx', code);
console.log("Updated App.tsx");
