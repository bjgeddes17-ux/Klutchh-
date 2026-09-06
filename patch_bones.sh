sed -i.bak 's/\[11, 13\], \[13, 15\], \/\/ Left Arm/\[11, 13\], \[13, 15\], \[15, 19\], \[15, 21\], \/\/ Left Arm/g' src/components/Report/KineticVideoPlayer.native.tsx
sed -i.bak 's/\[12, 14\], \[14, 16\], \/\/ Right Arm/\[12, 14\], \[14, 16\], \[16, 20\], \[16, 22\], \/\/ Right Arm/g' src/components/Report/KineticVideoPlayer.native.tsx
sed -i.bak 's/if (distNorm > 0.38) return null;/if (distNorm > 0.75) return null; \/\/ Expanded threshold to allow extended arms/g' src/components/Report/KineticVideoPlayer.native.tsx
