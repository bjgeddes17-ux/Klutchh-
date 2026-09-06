sed -i.bak '/import { detectPoseFromUri, isNativePoseDetectorAvailable }/a\
import { CVPipeline } from "../utils/cvPipeline";' src/services/nativeVideoAnalyzer.ts

sed -i.bak '/const detected = await detectPoseFromUri(thumbnail.uri);/c\
          // --- Advanced CV Pipeline Intercept ---\
          // Hook 1: Dynamic Contrast Normalization (Native OpenCV stub)\
          // CVPipeline.applyHistogramEqualization(thumbnail.uri);\
          // Hook 2: Grayscale & Luminance Stripping (Native OpenCV stub)\
          // CVPipeline.applyLuminanceGrayscale(thumbnail.uri);\
          \
          // Hook 3: Attention Cropping (2-Pass Sniper Approach)\
          const cvResult = await CVPipeline.executeAttentionCrop(\
            thumbnail.uri, \
            thumbnail.width, \
            thumbnail.height\
          );\
          \
          // Run the High-Res Pass 2 scan on the cropped image\
          const detectedCropped = await detectPoseFromUri(cvResult.enhancedUri);\
          \
          let detected = detectedCropped;\
          if (detectedCropped && detectedCropped.length >= 29 && cvResult.scaleX !== 1) {\
            // Remap coordinates back to the original 1080p canvas space\
            detected = CVPipeline.remapCoordinates(\
              detectedCropped, \
              cvResult.offsetX, \
              cvResult.offsetY, \
              cvResult.scaleX, \
              cvResult.scaleY,\
              thumbnail.width,\
              thumbnail.height\
            ) as any;\
          }\
          // --- End CV Pipeline ---' src/services/nativeVideoAnalyzer.ts
