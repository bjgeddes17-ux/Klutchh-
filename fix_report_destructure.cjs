const fs = require('fs');
let code = fs.readFileSync('src/components/AnalysisReportPage.tsx', 'utf8');

code = code.replace(
  "  onUpdateDrillProgress\n}) => {",
  "  onUpdateDrillProgress,\n  startTime = 0,\n  endTime,\n  cropBox\n}) => {"
);

fs.writeFileSync('src/components/AnalysisReportPage.tsx', code);
console.log("Updated AnalysisReportPage.tsx");
