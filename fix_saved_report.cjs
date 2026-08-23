const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

code = code.replace(
  "  videoUrl?: string;",
  "  videoUrl?: string;\n  startTime?: number;\n  endTime?: number;\n  cropBox?: { x: number; y: number; width: number; height: number };"
);

fs.writeFileSync('src/types.ts', code);
console.log("Updated SavedReport in types.ts");
