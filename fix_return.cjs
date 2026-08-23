const fs = require('fs');
let code = fs.readFileSync('src/utils/videoAnalyzer.ts', 'utf8');

code = code.replace(
  "  return {\n    keyframes,\n    allFrames: allSampledFrames,\n    aiReport,\n    overallSymmetry,",
  "  return {\n    startTime,\n    endTime,\n    cropBox,\n    keyframes,\n    allFrames: allSampledFrames,\n    aiReport,\n    overallSymmetry,"
);

fs.writeFileSync('src/utils/videoAnalyzer.ts', code);
console.log("Updated videoAnalyzer.ts");
