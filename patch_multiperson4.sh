sed -i.bak '/lastValidAthleteRoot = root;/d' src/services/nativeVideoAnalyzer.ts

sed -i.bak '/y: (detected\[23\].y + detected\[24\].y) \/ 2,/a\
              lastValidAthleteRoot = root;\
' src/services/nativeVideoAnalyzer.ts
