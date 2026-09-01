const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'idb-keyval': path.resolve(__dirname, 'src/utils/idb-keyval.native.ts')
};

module.exports = config;

