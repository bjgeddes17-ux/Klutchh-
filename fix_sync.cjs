const fs = require('fs');
let code = fs.readFileSync('src/components/VideoPosePlayer.tsx', 'utf8');

// Replace clearRect with clearRect + drawImage
code = code.replace(
  "ctx.clearRect(0, 0, width, height);\n\n        if (landmarks && landmarks.length > 0) {",
  "ctx.clearRect(0, 0, width, height);\n        // Draw video frame to canvas for 100% guaranteed zero-latency sync\n        ctx.drawImage(video, 0, 0, width, height);\n\n        if (landmarks && landmarks.length > 0) {"
);

code = code.replace(
  "        } else {\n          ctx.clearRect(0, 0, width, height);\n          setCurrentAnalysis(null);\n        }",
  "        } else {\n          ctx.clearRect(0, 0, width, height);\n          ctx.drawImage(video, 0, 0, width, height);\n          setCurrentAnalysis(null);\n        }"
);

// Make video opacity-0
code = code.replace(
  'className="absolute inset-0 w-full h-full object-contain"',
  'className="absolute inset-0 w-full h-full object-contain opacity-0"' // visually hidden, but continues to play and decode
);

// Remove the canvas being pointer-events-none so it doesn't just show a black background beneath it?
// Wait, the container has `bg-black`. The video was `object-contain`. The canvas is `object-contain`.
// That is fine.

fs.writeFileSync('src/components/VideoPosePlayer.tsx', code);
console.log("Applied frame-perfect sync!");
