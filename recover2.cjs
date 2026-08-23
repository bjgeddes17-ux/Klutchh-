const fs = require('fs');
const code = fs.readFileSync('src/components/VideoPosePlayer.tsx', 'utf8');

// The first 182 characters were kept at the beginning of the string!
// No, wait. The beginning of the messed up file is exactly the beginning of the original file, up to `startIndex`!
// The new code was: `code.substring(0, startIndex) + newLoop + code.substring(endIndex)`
// Where `endIndex` was 182.
// So the original file is just `code.substring(0, 182) + code.substring(code.indexOf("t } from"))` !

const originalCode = code.substring(0, 182) + code.substring(code.indexOf("t } from"));
fs.writeFileSync('src/components/VideoPosePlayer.original.tsx', originalCode);
console.log("Recovered!");
