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

/**
 * Uploads a Klutchh bundle directly to the user's Google Drive.
 */
export async function exportToGoogleDrive(report: SavedReport, videoUri: string, accessToken: string) {
  try {
    const videoBase64 = await FileSystem.readAsStringAsync(videoUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

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
        measuredAngles: {},
        ruleResultsSummary: {},
        sequenceComparison: report.sequenceComparison!,
        kineticSequence: report.kineticSequence!,
        dynamicMetrics: report.dynamicMetrics as any,
        preRenderedFrames: report.preRenderedFrames,
      },
      videoBase64,
    };

    const fileName = `Klutchh_${report.athleteName?.replace(/\s+/g, '_')}_${Date.now()}.klutchh`;
    const metadata = {
      name: fileName,
      mimeType: 'application/json',
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([JSON.stringify(bundle)], { type: 'application/json' }));

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: form,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Drive upload failed: ${errorText}`);
    }

    const data = await response.json();
    console.log('[KlutchhStorage] Saved to Drive:', data.id);
    return data;
  } catch (err) {
    console.error('[KlutchhStorage] Google Drive export failed:', err);
    throw err;
  }
}
