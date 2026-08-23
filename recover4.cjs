const fs = require('fs');
const code = fs.readFileSync('src/components/VideoPosePlayer.tsx', 'utf8');

const firstPart = code.substring(0, 182);

// Missing text: "rame, initializePoseLandmarker, PoseDetectionResul"
const missingText = "rame, initializePoseLandmarker, PoseDetectionResul";

// Find the second occurrence of "t } from"
const firstOcc = code.indexOf("t } from");
const secondOcc = code.indexOf("t } from", firstOcc + 1);

const secondPart = code.substring(secondOcc);

fs.writeFileSync('src/components/VideoPosePlayer.original.tsx', firstPart + missingText + secondPart);
console.log("Recovered perfectly!");
