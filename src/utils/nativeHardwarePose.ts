import { registerPlugin, Capacitor } from '@capacitor/core';
import type { MediaPipeLandmark } from '../types';

export interface HardwareCapabilities {
  supported: boolean;
  isGpuAccelerated: boolean;
  modelType: string;
  delegate: string;
  platform: string;
}

export interface NativePoseDetectionResult {
  landmarks: MediaPipeLandmark[];
  hasPose: boolean;
}

export interface NativeVideoAnalysisResult {
  totalFrames: number;
  durationMs: number;
  frames: Array<{
    index: number;
    timestamp: number;
    landmarks: MediaPipeLandmark[];
  }>;
}

export interface NativeHardwarePosePluginInterface {
  getHardwareCapabilities(): Promise<HardwareCapabilities>;
  detectFromBase64(options: { base64: string }): Promise<NativePoseDetectionResult>;
  processVideoFrames(options: { videoPath: string; fps?: number }): Promise<NativeVideoAnalysisResult>;
}

const NativeHardwarePose = registerPlugin<NativeHardwarePosePluginInterface>('NativeHardwarePose');

export class NativeHardwarePoseService {
  private static isChecked = false;
  private static isAvailable = false;
  private static capabilities: HardwareCapabilities | null = null;

  static async isHardwareAccelerated(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;
    if (this.isChecked) return this.isAvailable;

    try {
      const caps = await NativeHardwarePose.getHardwareCapabilities();
      this.capabilities = caps;
      this.isAvailable = !!caps?.supported;
      this.isChecked = true;
      console.log('⚡ Native Hardware Acceleration Active:', caps);
      return this.isAvailable;
    } catch (err) {
      console.log('Native hardware pose plugin not available, using web GPU worker pipeline:', err);
      this.isChecked = true;
      this.isAvailable = false;
      return false;
    }
  }

  static async getCapabilities(): Promise<HardwareCapabilities | null> {
    if (!this.isChecked) {
      await this.isHardwareAccelerated();
    }
    return this.capabilities;
  }

  static async detectPoseFromBase64(base64: string): Promise<MediaPipeLandmark[]> {
    try {
      const result = await NativeHardwarePose.detectFromBase64({ base64 });
      return result.landmarks || [];
    } catch (err) {
      console.warn('Native hardware pose inference failed, fallback required:', err);
      return [];
    }
  }

  static async processVideoNatively(videoPath: string, fps: number = 24): Promise<NativeVideoAnalysisResult | null> {
    try {
      return await NativeHardwarePose.processVideoFrames({ videoPath, fps });
    } catch (err) {
      console.warn('Native video hardware pipeline error:', err);
      return null;
    }
  }
}
