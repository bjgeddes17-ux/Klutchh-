const fs = require('fs');
const code = fs.readFileSync('src/components/VideoPosePlayer.tsx', 'utf8');

const lines = code.split('\n');
const fixedLines = [
  "import React, { useEffect, useRef, useState } from 'react';",
  "import { SportRule, FrameAnalysis, MediaPipeLandmark, SkillLevel, SportId } from '../types';",
  "import { detectPoseForVideoFrame, initializePoseLandmarker, PoseDetectionResult } from '../utils/mediapipePose';",
  ...lines.slice(5) // skip the first 5 lines which are mangled
];

fs.writeFileSync('src/components/VideoPosePlayer.tsx', fixedLines.join('\n'));
console.log("Fixed imports!");
