// src/utils/klutchhStorage.ts
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { AnalysisResult, SavedReport } from '../types';

/**
 * Klutchh File Bundle (.klutchh)
 * A proprietary format that bundles the AI Analysis JSON and the raw Video source.
 */
export interface KlutchhBundle {
  version: string;
  metadata: {
    athleteName: string;
    sportName: string;
    date: string;
    grade: string;
    score: number;
  };
  analysis: AnalysisResult;
  videoBase64: string; // The raw video file encoded as base64 for portability
}

/**
 * Ensures a dedicated permanent directory for saved offline video assets
 */
export async function getPersistentVideoDirectory(): Promise<string> {
  const dir = `${FileSystem.documentDirectory}klutchh_sessions/`;
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
  return dir;
}

/**
 * Copies a temporary captured/picked video to the app's permanent document directory
 * so it remains accessible offline indefinitely even if temp cache is purged.
 */
export async function persistSessionVideo(sourceUri: string, sessionId: string): Promise<string> {
  try {
    if (!sourceUri || sourceUri.startsWith('http')) {
      return sourceUri;
    }
    const targetDir = await getPersistentVideoDirectory();
    const targetUri = `${targetDir}session_${sessionId}.mp4`;
    
    // Copy to persistent document storage
    await FileSystem.copyAsync({
      from: sourceUri,
      to: targetUri,
    });
    console.log('[KlutchhStorage] Video persisted successfully to:', targetUri);
    return targetUri;
  } catch (err) {
    console.warn('[KlutchhStorage] Video copy failed, falling back to original uri:', err);
    return sourceUri;
  }
}

/**
 * Packs analysis and video into a .klutchh bundle and offers to save/share locally.
 */
export async function exportToKlutchhLocal(report: SavedReport, videoUri: string) {
  try {
    // 1. Convert video to base64
    console.log('[KlutchhStorage] Packing video for bundle...');
    const videoBase64 = await FileSystem.readAsStringAsync(videoUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // 2. Build the bundle
    const bundle: KlutchhBundle = {
      version: '1.0.0',
      metadata: {
        athleteName: report.athleteName || 'Athlete',
        sportName: report.sportName,
        date: report.createdAt,
        grade: report.overallGrade,
        score: report.overallScore,
      },
      analysis: {
        keyframes: report.keyframeList,
        allFrames: report.allFrames,
        aiReport: report.report,
        overallSymmetry: report.symmetryScore,
        overallKneeSafety: report.kneeSafetyScore,
        measuredAngles: {}, // Handled by frames
        ruleResultsSummary: {}, 
        sequenceComparison: report.sequenceComparison!,
        kineticSequence: report.kineticSequence!,
        dynamicMetrics: report.dynamicMetrics as any,
        preRenderedFrames: report.preRenderedFrames,
      },
      videoBase64,
    };

    // 3. Write to a temporary .klutchh file
    const fileName = `Klutchh_${report.athleteName?.replace(/\s+/g, '_')}_${Date.now()}.klutchh`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(bundle), {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // 4. Share/Save using native UI
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/octet-stream',
        dialogTitle: 'Save Klutchh Audit File',
        UTI: 'com.klutchh.audit',
      });
    }

    return fileUri;
  } catch (err) {
    console.error('[KlutchhStorage] Export failed:', err);
    throw err;
  }
}
