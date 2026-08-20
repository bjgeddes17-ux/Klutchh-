const fs = require('fs');
const code = fs.readFileSync('src/components/VideoPosePlayer.tsx', 'utf8');

// Find the line where the duplicate starts
const duplicateIndex = code.indexOf("t } from '../utils/mediapipePose';");
const originalRest = code.substring(duplicateIndex);

const missingFirstPart = "import React, { useEffect, useRef, useState } from 'react';\nimport { SportRule, FrameAnalysis, MediaPipeLandmark, SkillLevel, SportId } from '../types';\nimport { detectPoseForVideoFrame, initializePoseLandmarker, PoseDetectionResul";

const originalCode = missingFirstPart + originalRest;

fs.writeFileSync('src/components/VideoPosePlayer.original.tsx', originalCode);
console.log("Recovered original file to VideoPosePlayer.original.tsx");
