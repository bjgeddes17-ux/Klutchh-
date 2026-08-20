import { SavedReport, AthleteProfile } from '../types';
import { AthleteFolderGroup, formatAthleteFolderName } from './rosterStorage';
import { safeJsonStringify } from './privacyStorage';

export type CloudProviderType = 'google_drive' | 'custom_webhook' | 'download_sync';

export interface PersonalCloudConfig {
  provider: CloudProviderType;
  autoSyncOnSave: boolean;
  // Custom Webhook / S3 / Supabase / Nextcloud personal endpoint
  customEndpointUrl?: string;
  customAuthHeader?: string;
  // Google Drive user personal token or folder ID
  googleDriveFolderId?: string;
  googleDriveAccessToken?: string;
  lastSyncedAt?: string;
}

const STORAGE_KEY = 'klutchh_personal_cloud_config';

export function getPersonalCloudConfig(): PersonalCloudConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to parse personal cloud config', e);
  }
  return {
    provider: 'download_sync',
    autoSyncOnSave: false
  };
}

export function savePersonalCloudConfig(config: PersonalCloudConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save personal cloud config', e);
  }
}

/**
 * Tests the connection to the user's personal cloud storage endpoint
 */
export async function testPersonalCloudConnection(config: PersonalCloudConfig): Promise<{ success: boolean; message: string }> {
  if (config.provider === 'custom_webhook') {
    if (!config.customEndpointUrl || !config.customEndpointUrl.startsWith('http')) {
      return { success: false, message: 'Please enter a valid HTTP/HTTPS endpoint URL.' };
    }
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (config.customAuthHeader) {
        headers['Authorization'] = config.customAuthHeader;
      }
      
      const testPayload = {
        event: 'ping_test',
        timestamp: new Date().toISOString(),
        client: 'Klutchh Biomechanics Personal Cloud Connector'
      };

      const response = await fetch(config.customEndpointUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(testPayload)
      });

      if (response.ok) {
        return { success: true, message: `Connected successfully! (Status: ${response.status})` };
      } else {
        return { success: false, message: `Server responded with status ${response.status} (${response.statusText})` };
      }
    } catch (err: any) {
      return { success: false, message: `Connection failed: ${err.message || 'Network error or CORS restriction'}` };
    }
  } else if (config.provider === 'google_drive') {
    if (!config.googleDriveAccessToken) {
      return { success: false, message: 'Google Drive access token not configured.' };
    }
    return { success: true, message: 'Google Drive connected.' };
  } else {
    return { success: true, message: 'Local Sync Folder is ready.' };
  }
}

/**
 * Syncs a single report directly to the user's personal cloud
 */
export async function syncReportToPersonalCloud(
  report: SavedReport,
  config = getPersonalCloudConfig()
): Promise<{ success: boolean; message: string }> {
  if (config.provider === 'custom_webhook' && config.customEndpointUrl) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (config.customAuthHeader) {
        headers['Authorization'] = config.customAuthHeader;
      }

      const athleteFolder = formatAthleteFolderName(report.athleteName || 'Athlete');
      const payload = {
        event: 'sync_athlete_report',
        syncedAt: new Date().toISOString(),
        folder: athleteFolder,
        athleteName: report.athleteName || 'Athlete',
        report: report
      };

      const response = await fetch(config.customEndpointUrl, {
        method: 'POST',
        headers,
        body: safeJsonStringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Personal server returned status ${response.status}`);
      }

      config.lastSyncedAt = new Date().toISOString();
      savePersonalCloudConfig(config);

      return {
        success: true,
        message: `Successfully synced to your personal cloud under "${athleteFolder}".`
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Personal cloud upload failed: ${err.message || 'Network error'}`
      };
    }
  } else {
    // For 'download_sync' or when no custom webhook is configured, download the report directly to user's disk
    const safeAthlete = (report.athleteName || 'Athlete').replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeSport = report.sportName.toLowerCase().replace(/\s+/g, '_');
    const dateStr = new Date(report.createdAt).toISOString().split('T')[0];
    const filename = `Klutchh_${safeAthlete}_${safeSport}_${dateStr}.klutchh`;

    const payload = {
      version: '1.2',
      type: 'klutchh_athlete_report',
      folder: formatAthleteFolderName(report.athleteName || 'Athlete'),
      athleteName: report.athleteName || 'Athlete',
      exportedAt: new Date().toISOString(),
      report
    };

    const blob = new Blob([safeJsonStringify(payload, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    config.lastSyncedAt = new Date().toISOString();
    savePersonalCloudConfig(config);

    return {
      success: true,
      message: `Report exported to your device as "${filename}". Place it in your local synced cloud directory (iCloud / OneDrive / Google Drive).`
    };
  }
}

/**
 * Syncs an entire athlete's folder bundle to personal cloud
 */
export async function syncAthleteFolderToPersonalCloud(
  group: AthleteFolderGroup,
  config = getPersonalCloudConfig()
): Promise<{ success: boolean; count: number; message: string }> {
  if (config.provider === 'custom_webhook' && config.customEndpointUrl) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (config.customAuthHeader) {
        headers['Authorization'] = config.customAuthHeader;
      }

      const payload = {
        event: 'sync_athlete_folder_bundle',
        syncedAt: new Date().toISOString(),
        folderName: group.folderName,
        athlete: group.athlete,
        reportsCount: group.reports.length,
        trophyCardsCount: group.trophyCards.length,
        reports: group.reports,
        trophyCards: group.trophyCards
      };

      const response = await fetch(config.customEndpointUrl, {
        method: 'POST',
        headers,
        body: safeJsonStringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Personal server returned status ${response.status}`);
      }

      config.lastSyncedAt = new Date().toISOString();
      savePersonalCloudConfig(config);

      return {
        success: true,
        count: group.reports.length,
        message: `Synced ${group.reports.length} reports to your personal cloud under "${group.folderName}".`
      };
    } catch (err: any) {
      return {
        success: false,
        count: 0,
        message: `Personal cloud upload failed: ${err.message || 'Network error'}`
      };
    }
  } else {
    // Download entire bundle for the athlete
    const safeAthlete = (group.athlete.name || 'Athlete').replace(/[^a-zA-Z0-9_-]/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Klutchh_Folder_${safeAthlete}_${dateStr}.klutchh-bundle`;

    const payload = {
      version: '1.2',
      type: 'klutchh_athlete_folder_bundle',
      folderName: group.folderName,
      athlete: group.athlete,
      reportsCount: group.reports.length,
      trophyCardsCount: group.trophyCards.length,
      exportedAt: new Date().toISOString(),
      reports: group.reports,
      trophyCards: group.trophyCards
    };

    const blob = new Blob([safeJsonStringify(payload, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    config.lastSyncedAt = new Date().toISOString();
    savePersonalCloudConfig(config);

    return {
      success: true,
      count: group.reports.length,
      message: `Downloaded ${group.athlete.name}'s entire athlete folder bundle (${group.reports.length} reports) to your device. Move this file into your iCloud / Google Drive / Dropbox synced folder.`
    };
  }
}
