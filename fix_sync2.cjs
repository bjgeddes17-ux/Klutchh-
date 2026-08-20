const fs = require('fs');
let code = fs.readFileSync('src/components/AnalysisReportPage.tsx', 'utf8');

// Replace clearRect with clearRect + drawImage
code = code.replace(
  "            if (landmarksToDraw && landmarksToDraw.length > 0) {\n              ctx.clearRect(0, 0, width, height);\n              drawPoseSkeleton(",
  "            if (landmarksToDraw && landmarksToDraw.length > 0) {\n              ctx.clearRect(0, 0, width, height);\n              ctx.drawImage(video, 0, 0, width, height);\n              drawPoseSkeleton("
);

code = code.replace(
  "            } else {\n              ctx.clearRect(0, 0, width, height);\n            }",
  "            } else {\n              ctx.clearRect(0, 0, width, height);\n              ctx.drawImage(video, 0, 0, width, height);\n            }"
);

// We need to hide the video and move onClick to the canvas
code = code.replace(
  '              onClick={togglePlay}\n              className="w-full h-full object-contain cursor-pointer"',
  '              className="absolute inset-0 w-full h-full object-contain opacity-0"'
);

code = code.replace(
  '              className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"',
  '              onClick={togglePlay}\n              className="absolute inset-0 w-full h-full object-contain z-10 cursor-pointer"'
);

fs.writeFileSync('src/components/AnalysisReportPage.tsx', code);
console.log("Applied frame-perfect sync to AnalysisReportPage!");
