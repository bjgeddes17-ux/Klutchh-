sed -i.bak 's/const maxBurstFps = Math.min(45, hw.maxSupportedFps || 45);/const maxBurstFps = Math.min(60, hw.maxSupportedFps || 60);/g' src/services/nativeVideoAnalyzer.ts
sed -i.bak 's/const MAX_FRAMES_BUDGET = 110;/const MAX_FRAMES_BUDGET = 150;/g' src/services/nativeVideoAnalyzer.ts
sed -i.bak 's/burstFps: 45,/burstFps: 60,/g' src/services/nativeVideoAnalyzer.ts
