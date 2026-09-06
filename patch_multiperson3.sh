sed -i.bak '/let realDetectionCount = 0;/a\
  let lastValidAthleteRoot: { x: number; y: number } | null = null;\
' src/services/nativeVideoAnalyzer.ts

sed -i.bak 's/if (prevKey && prevKey.landmarks\[23\] && prevKey.landmarks\[24\] && detected\[23\] && detected\[24\]) {/if (lastValidAthleteRoot \&\& detected[23] \&\& detected[24]) {/g' src/services/nativeVideoAnalyzer.ts

sed -i.bak 's/const prevRootX = (prevKey.landmarks\[23\].x + prevKey.landmarks\[24\].x) \/ 2;/const prevRootX = lastValidAthleteRoot.x;/g' src/services/nativeVideoAnalyzer.ts

sed -i.bak 's/const prevRootY = (prevKey.landmarks\[23\].y + prevKey.landmarks\[24\].y) \/ 2;/const prevRootY = lastValidAthleteRoot.y;/g' src/services/nativeVideoAnalyzer.ts

sed -i.bak '/if (detected && detected\[23\] && detected\[24\]) {/a\
              lastValidAthleteRoot = root;\
' src/services/nativeVideoAnalyzer.ts
