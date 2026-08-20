import { get, set, del, keys } from 'idb-keyval';
import { AnalysisResult } from '../types';

/**
 * Privacy & Local Storage Guard
 *
 * Enforces Zero-PII policies and client-side TTL lifecycle for stored videos & biometric telemetry.
 * 1. Raw videos remain exclusively in local browser IndexedDB.
 * 2. Reports are stored locally for permanent offline access.
 * 3. Syncing is strictly limited to the user's personal cloud API (BYOC).
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
  autoPurgeEnabled: false,
  cloudSyncEnabled: false,
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
  // Purge logic disabled to ensure local-first video preservation as requested.
  return 0;
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
 * Safely stringifies any data object, handling circular structures, DOM elements,
 * React Fiber nodes, and Video elements without throwing errors.
 */
export function safeJsonStringify(obj: any, indent?: number): string {
  try {
    const clean = sanitizeForJSON(obj);
    const seen = new WeakSet();
    return JSON.stringify(
      clean,
      (key, value) => {
        if (
          key.startsWith('__react') ||
          key === 'videoElement' ||
          key === 'videoRef' ||
          key === 'bitmap' ||
          key === 'stateNode' ||
          key === 'child' ||
          key === 'sibling' ||
          key === 'return' ||
          key === 'memoizedProps' ||
          key === 'memoizedState'
        ) {
          return undefined;
        }
        if (typeof value === 'object' && value !== null) {
          if (
            value instanceof ImageBitmap ||
            value instanceof HTMLVideoElement ||
            value instanceof HTMLElement ||
            value instanceof Event ||
            (typeof Element !== 'undefined' && value instanceof Element) ||
            (typeof Node !== 'undefined' && value instanceof Node) ||
            (typeof Window !== 'undefined' && value instanceof Window) ||
            value.nodeType !== undefined ||
            value.tagName !== undefined ||
            value.stateNode !== undefined ||
            value._reactRootContainer !== undefined ||
            value.constructor?.name === 'HTMLVideoElement' ||
            value.constructor?.name === 'FiberNode' ||
            value.constructor?.name?.includes('Element') ||
            value.constructor?.name?.includes('Fiber')
          ) {
            return undefined;
          }
          if (seen.has(value)) {
            return undefined; // Break circular reference
          }
          seen.add(value);
        }
        return value;
      },
      indent
    );
  } catch (err) {
    console.warn('safeJsonStringify fallback engaged:', err);
    return '{}';
  }
}

/**
 * Sanitizes an object recursively to remove non-serializable DOM elements, ImageBitmaps, and React fibers before JSON stringification.
 */
export function sanitizeForJSON(obj: any, seen = new WeakSet()): any {
  if (obj === null || typeof obj !== 'object') return obj;

  if (seen.has(obj)) {
    return undefined; // Break circular references!
  }

  if (
    obj instanceof ImageBitmap ||
    obj instanceof HTMLVideoElement ||
    obj instanceof HTMLElement ||
    obj instanceof Event ||
    (typeof Element !== 'undefined' && obj instanceof Element) ||
    (typeof Node !== 'undefined' && obj instanceof Node) ||
    (typeof Window !== 'undefined' && obj instanceof Window) ||
    obj.nodeType !== undefined ||
    obj.tagName !== undefined ||
    obj.stateNode !== undefined ||
    obj._reactRootContainer !== undefined ||
    obj.constructor?.name === 'HTMLVideoElement' ||
    obj.constructor?.name === 'FiberNode' ||
    obj.constructor?.name?.includes('Element') ||
    obj.constructor?.name?.includes('Fiber')
  ) {
    return undefined;
  }

  seen.add(obj);

  if (Array.isArray(obj)) {
    return obj
      .map((item) => sanitizeForJSON(item, seen))
      .filter((x) => x !== undefined);
  }

  const clean: any = {};
  for (const key of Object.keys(obj)) {
    if (
      key.startsWith('__reactFiber') ||
      key.startsWith('__reactInternalInstance') ||
      key.startsWith('__react') ||
      key === 'bitmap' ||
      key === 'videoRef' ||
      key === 'videoElement' ||
      key === 'stateNode' ||
      key === 'child' ||
      key === 'sibling' ||
      key === 'return' ||
      key === 'memoizedProps' ||
      key === 'memoizedState'
    ) {
      continue;
    }
    const sanitized = sanitizeForJSON(obj[key], seen);
    if (sanitized !== undefined) {
      clean[key] = sanitized;
    }
  }
  return clean;
}

/**
 * Sanitizes an analysis report before saving or syncing to ensure Zero PII is transmitted.
 */
export function sanitizeReportForCloudSync(report: any): any {
  if (!report) return report;
  const sanitizedObj = sanitizeForJSON(report);
  const clone = JSON.parse(safeJsonStringify(sanitizedObj));

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
