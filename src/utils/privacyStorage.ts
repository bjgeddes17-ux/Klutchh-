import { get, set, del, keys } from 'idb-keyval';
import { AnalysisResult } from '../types';

/**
 * Privacy & Local Storage Guard
 *
 * Enforces Zero-PII policies and client-side TTL lifecycle for stored videos & biometric telemetry.
 * 1. Raw videos remain exclusively in local browser IndexedDB.
 * 2. Anonymized reports can be stored locally with optional auto-purge after X days (default 30 days).
 * 3. Any cloud synchronization is stripped of personal identifiers (PII).
 */

const STORAGE_KEY_PREFIX = 'video_ttl_';
const DEFAULT_RETENTION_DAYS = 30;

export interface StoragePolicy {
  retentionDays: number;
  autoPurgeEnabled: boolean;
  cloudSyncEnabled: boolean;
}

export const DEFAULT_STORAGE_POLICY: StoragePolicy = {
  retentionDays: DEFAULT_RETENTION_DAYS,
  autoPurgeEnabled: true,
  cloudSyncEnabled: true,
};

/**
 * Saves a video blob locally in IndexedDB with a creation timestamp for TTL enforcement.
 */
export async function saveLocalVideoWithTTL(reportId: string, videoBlob: Blob): Promise<void> {
  try {
    const key = `video-${reportId}`;
    const ttlKey = `${STORAGE_KEY_PREFIX}${reportId}`;
    await set(key, videoBlob);
    await set(ttlKey, { createdAt: Date.now(), reportId });
  } catch (err) {
    console.warn('Failed to save local video blob with TTL:', err);
  }
}

/**
 * Retrieves a locally saved video blob by report ID.
 */
export async function getLocalVideo(reportId: string): Promise<Blob | undefined> {
  try {
    const key = `video-${reportId}`;
    return await get(key);
  } catch (err) {
    console.warn('Failed to retrieve local video blob:', err);
    return undefined;
  }
}

/**
 * Automatically purges locally cached videos older than retentionDays.
 * Runs in background on app startup without user disruption.
 */
export async function autoPurgeExpiredLocalVideos(retentionDays: number = DEFAULT_RETENTION_DAYS): Promise<number> {
  try {
    const allKeys = await keys();
    const ttlKeys = allKeys.filter((k) => typeof k === 'string' && k.startsWith(STORAGE_KEY_PREFIX));
    const now = Date.now();
    const maxAgeMs = retentionDays * 24 * 60 * 60 * 1000;
    let purgedCount = 0;

    for (const ttlKey of ttlKeys) {
      const metadata: any = await get(ttlKey);
      if (metadata && metadata.createdAt && now - metadata.createdAt > maxAgeMs) {
        const videoKey = `video-${metadata.reportId}`;
        await del(videoKey);
        await del(ttlKey);
        purgedCount++;
      }
    }

    return purgedCount;
  } catch (err) {
    console.warn('Auto-purge error in IndexedDB:', err);
    return 0;
  }
}

/**
 * Deletes all local video blobs immediately (single-click privacy clear).
 */
export async function purgeAllLocalVideos(): Promise<number> {
  try {
    const allKeys = await keys();
    const videoKeys = allKeys.filter((k) => typeof k === 'string' && (k.startsWith('video-') || k.startsWith('frames_') || k.startsWith(STORAGE_KEY_PREFIX)));
    for (const k of videoKeys) {
      await del(k);
    }
    return videoKeys.length;
  } catch (err) {
    console.warn('Failed to purge local videos:', err);
    return 0;
  }
}

/**
 * Sanitizes an analysis report before saving or syncing to ensure Zero PII is transmitted.
 */
export function sanitizeReportForCloudSync(report: any): any {
  if (!report) return report;
  const clone = JSON.parse(JSON.stringify(report));

  // Strip raw video base64, video blobs, or personal local URLs
  delete clone.cloudVideoUrl;
  delete clone.customVideoBlob;
  if (clone.videoUrl && (clone.videoUrl.startsWith('blob:') || clone.videoUrl.startsWith('data:'))) {
    delete clone.videoUrl;
  }

  // Ensure athlete identifiers are anonymized
  if (clone.userEmail) {
    // Generate non-reversible hash / anonymized ID
    clone.athleteAnonId = `ath_${Math.abs(clone.userEmail.split('').reduce((a: number, b: string) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)).toString(16)}`;
    delete clone.userEmail;
  }

  return clone;
}
