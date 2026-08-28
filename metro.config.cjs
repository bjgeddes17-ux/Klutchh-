const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// MediaPipe's web bundle uses dynamic imports that Metro can't handle.
// We exclude it from the transformation process to prevent bundling errors.
config.resolver.sourceExts.push('mjs');

module.exports = config;
