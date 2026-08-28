import { Platform } from 'react-native';

// platform.native.ts (Native Implementation)
// Metro will pick this file for Android/iOS builds.

export const isWeb = false;
export const isNative = true;
export const isAndroid = Platform.OS === 'android';
export const isIOS = Platform.OS === 'ios';

export function reloadApp() {
  // On Native, we don't reload the JS bundle this way
  console.log('Native: Reload requested');
}

export function getBaseUrl() {
  return 'klutchh://app';
}

export async function copyToClipboard(text: string) {
  // Native clipboard requires expo-clipboard
  console.log('Native Clipboard:', text);
  return false;
}
