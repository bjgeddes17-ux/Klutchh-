import { SportRule, SkillLevel, AthleteCategory, AnalysisResult } from '../../types';
import { generateFallbackAnalysisResult } from '../../utils/videoAnalyzer';

/**
 * BiometricBridge (Native)
 * 
 * This bridge is now configured for STANDALONE LOCAL EXECUTION.
 * It removes the reliance on external APIs and ensures the app
 * remains functional even if the cloud project is deleted.
 */
export const BiometricBridge = {
  async analyze(
    videoUri: string,
    sportRule: SportRule,
    skillLevel: SkillLevel,
    category: AthleteCategory,
    fps: number = 30,
    onProgress?: (progress: number) => void,
    anchor?: any
  ): Promise<AnalysisResult> {
    console.log('[BiometricBridge] STANDALONE LOCAL ANALYSIS:', videoUri);

    if (onProgress) onProgress(10);
    
    try {
      // The local engine extracts 30fps telemetry directly from the file
      const result = await generateFallbackAnalysisResult(
        videoUri,
        sportRule,
        skillLevel,
        category,
        fps,
        onProgress
      );
      return result;
    } catch (error) {
      console.error('[BiometricBridge] CRITICAL FAILURE:', error);
      throw error;
    }
  }
};
