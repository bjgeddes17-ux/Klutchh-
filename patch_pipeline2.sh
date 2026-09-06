sed -i.bak 's/if (detectedCropped && detectedCropped.length >= 29 && cvResult.scaleX !== 1) {/if (false) {/g' src/services/nativeVideoAnalyzer.ts
