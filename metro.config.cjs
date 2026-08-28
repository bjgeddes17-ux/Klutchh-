const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// MediaPipe's web bundle uses dynamic imports that Metro can't handle.
// We exclude the problematic mjs files from being crawled if possible.
config.resolver.sourceExts = config.resolver.sourceExts.filter(ext => ext !== 'mjs');

// Explicitly block web-only libraries from being resolved in native builds
// This prevents the "mp4box main module not found" and MediaPipe bundle errors.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'idb-keyval': path.resolve(__dirname, 'src/utils/idb-keyval.native.ts')
};

config.resolver.blockList = [
  /node_modules\/mp4box\/.*/,
  /node_modules\/@mediapipe\/tasks-vision\/.*/,
  /src\/utils\/webcodecsPipeline\.ts/,
  /src\/utils\/mediapipePose\.ts/,
  /src\/utils\/frameExtractor\.ts/
];

module.exports = config;
