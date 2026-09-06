sed -i.bak 's/const cvResult = await CVPipeline.executeAttentionCrop(/const detectedCropped = await detectPoseFromUri(thumbnail.uri); \/\/ Bypassing CV Pipeline for stability\n          \/* const cvResult = await CVPipeline.executeAttentionCrop(/g' src/services/nativeVideoAnalyzer.ts

sed -i.bak 's/const detectedCropped = await detectPoseFromUri(cvResult.enhancedUri);/const detectedCropped_old = null; \*\//g' src/services/nativeVideoAnalyzer.ts
