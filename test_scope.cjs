const fs = require('fs');
let code = fs.readFileSync('src/utils/videoAnalyzer.ts', 'utf8');

// The issue might be that I used `return {` instead of `safeResolve({`?
const index = code.indexOf('return {\n    startTime,\n    endTime,\n    cropBox,\n    keyframes,');
console.log("Index:", index);

