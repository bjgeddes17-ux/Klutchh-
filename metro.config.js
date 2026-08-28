const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// MediaPipe web bundle exclusion for React Native mobile builds
config.resolver.sourceExts = config.resolver.sourceExts.filter(ext => ext !== 'mjs');

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'idb-keyval': path.resolve(__dirname, 'src/utils/idb-keyval.native.ts')
};

module.exports = config;
