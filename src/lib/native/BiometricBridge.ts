import { AnalysisResult, SportRule, SkillLevel, AthleteCategory } from '../../types';
import { Platform } from 'react-native';

/**
 * BiometricBridge: The Expo "Native Bridge" (Path A)
 * Optimized for Web/Native conditional loading.
 */

export const BiometricBridge = {
  async analyze(
    videoUri: string,
    sportRule: SportRule,
    skillLevel: SkillLevel,
    athleteCategory: AthleteCategory,
    fps: number,
    onProgress: (p: number) => void,
    anchor?: string,
    crop?: { x: number; y: number; width: number; height: number }
  ): Promise<AnalysisResult> {
    
    const isWeb = Platform.OS === 'web';
    
    // Only attempt native handoff if not on web
    if (!isWeb) {
      try {
        // Dynamic import ensures expo-modules-core isn't parsed by the web bundler
        const { requireNativeModule } = await import('expo-modules-core');
        const KlutchhModule = requireNativeModule('KlutchhBiometrics');
        
        if (KlutchhModule) {
          console.log("[Path A] Expo Native Bridge initiated.");
          const result = await KlutchhModule.analyzeVideo({
            videoUri,
            sportId: sportRule.id,
            skillLevel,
            category: athleteCategory,
            fps,
            anchor,
            crop: crop ? { x: crop.x, y: crop.y, w: crop.width, h: crop.height } : undefined
          });
          
          return result;
        }
      } catch (error) {
        console.warn("[Path A] Expo Native Module not found or failed, falling back to Web Engine.");
      }
    }

    // Path B / Standard Web Path
    console.log("[Path B] Web Engine initiated.");
    const { analyzeVideoBiometrics } = await import('../../utils/videoAnalyzer');
    
    return analyzeVideoBiometrics(
      videoUri,
      sportRule,
      skillLevel,
      athleteCategory,
      fps,
      true, // useWebCodecs
      onProgress,
      anchor as any,
      crop,
      0, // startTime
      undefined // endTime
    );
  }
};
