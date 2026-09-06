sed -i.bak 's/if (detected\[23\] && detected\[24\]) {/if (detected \&\& detected\[23\] \&\& detected\[24\]) {/g' src/services/nativeVideoAnalyzer.ts
