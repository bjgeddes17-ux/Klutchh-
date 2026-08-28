// platform.ts (Web Implementation)
// This file is used on the Web to avoid importing react-native and crashing Vite.

export const isWeb = true;
export const isNative = false;
export const isAndroid = false;
export const isIOS = false;

export function reloadApp() {
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
}

export function getBaseUrl() {
  if (typeof window !== 'undefined') {
    return window.location.origin + window.location.pathname;
  }
  return '/';
}

export async function copyToClipboard(text: string) {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }
  return false;
}
