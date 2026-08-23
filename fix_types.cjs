const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

code = code.replace(
  "export interface AnalysisResult {\n  keyframes: FrameAnalysis[];",
  "export interface AnalysisResult {\n  keyframes: FrameAnalysis[];\n  startTime?: number;\n  endTime?: number;\n  cropBox?: { x: number; y: number; width: number; height: number };"
);

fs.writeFileSync('src/types.ts', code);
console.log("Updated types.ts");
