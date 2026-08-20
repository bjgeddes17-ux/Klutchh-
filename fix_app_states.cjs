const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Insert states
code = code.replace(
  "  const useOptionBPipeline = false;",
  "  const useOptionBPipeline = false;\n  const [currentStartTime, setCurrentStartTime] = useState<number>(0);\n  const [currentEndTime, setCurrentEndTime] = useState<number | undefined>(undefined);\n  const [currentCropBox, setCurrentCropBox] = useState<{ x: number; y: number; width: number; height: number } | undefined>(undefined);"
);

fs.writeFileSync('src/App.tsx', code);
console.log("Fixed App.tsx states");
