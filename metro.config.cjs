const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// MediaPipe's web bundle uses dynamic imports that Metro can't handle.
// We exclude the problematic mjs files from being crawled if possible, 
// and we remove mjs from sourceExts to prevent Metro from trying to bundle web-only logic.
config.resolver.sourceExts = config.resolver.sourceExts.filter(ext => ext !== 'mjs');

module.exports = config;
