import { Platform } from 'react-native';

export const isWeb = Platform.OS === 'web';
export const isNative = !isWeb;
export const isAndroid = Platform.OS === 'android';
export const isIOS = Platform.OS === 'ios';

export function reloadApp() {
  if (isWeb && typeof window !== 'undefined') {
    window.location.reload();
  } else {
    console.log('App reload requested on Native - No-op');
  }
}

export function getBaseUrl() {
  if (isWeb && typeof window !== 'undefined') {
    return window.location.origin + window.location.pathname;
  }
  return 'klutchh://app';
}

export async function copyToClipboard(text: string) {
  if (isWeb && typeof navigator !== 'undefined') {
    await navigator.clipboard.writeText(text);
    return true;
  }
  // Native clipboard requires expo-clipboard, which might not be installed.
  // For now, we stub it to prevent crashes.
  console.log('Clipboard copy requested on Native:', text);
  return false;
}
