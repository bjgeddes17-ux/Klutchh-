const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Ensure we keep default extensions but can add/remove specific ones if needed
// MediaPipe's web bundle uses dynamic imports that Metro can't handle, 
// but for native we should be careful.
if (process.env.EXPO_PUBLIC_PLATFORM !== 'web') {
  config.resolver.sourceExts = [...config.resolver.sourceExts];
}

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'idb-keyval': path.resolve(__dirname, 'src/utils/idb-keyval.native.ts')
};

module.exports = config;
