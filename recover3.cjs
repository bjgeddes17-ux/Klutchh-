const fs = require('fs');
const code = fs.readFileSync('src/components/VideoPosePlayer.tsx', 'utf8');

// The original file is exactly:
// The first 182 characters of the messed up file.
// PLUS the contents of the messed up file starting from the SECOND occurrence of "t } from".

const firstPart = code.substring(0, 182);

// Find the first occurrence
const firstOcc = code.indexOf("t } from");
// Find the second occurrence
const secondOcc = code.indexOf("t } from", firstOcc + 1);

if (secondOcc === -1) {
    console.error("Second occurrence not found!");
    process.exit(1);
}

const secondPart = code.substring(secondOcc);

fs.writeFileSync('src/components/VideoPosePlayer.original.tsx', firstPart + secondPart);
console.log("Recovered properly!");
