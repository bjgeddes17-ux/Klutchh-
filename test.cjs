const fs = require('fs');
const code = fs.readFileSync('src/components/VideoPosePlayer.tsx', 'utf8');

const prefix = code.substring(0, 182);
const suffixIndex = code.indexOf("t } from");
const suffix = code.substring(suffixIndex);

console.log("prefix length:", prefix.length);
console.log("suffix length:", suffix.length);
console.log("total length:", prefix.length + suffix.length);

fs.writeFileSync('src/components/VideoPosePlayer.original.tsx', prefix + suffix);
