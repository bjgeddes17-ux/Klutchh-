const fs = require('fs');
const code = fs.readFileSync('src/components/VideoPosePlayer.tsx', 'utf8');

// The file has a duplicate `useEffect(() => {` at line 93/94.
const lines = code.split('\n');

// We need to remove the extra `useEffect(() => {` at line 93
// Wait, let's just find `  useEffect(() => {\n  useEffect(() => {` and replace it with `  useEffect(() => {`
const newCode = code.replace("  useEffect(() => {\n  useEffect(() => {", "  useEffect(() => {");
fs.writeFileSync('src/components/VideoPosePlayer.tsx', newCode);
console.log("Fixed duplicate useEffect!");
