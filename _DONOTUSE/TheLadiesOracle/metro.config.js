const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Enable faster builds
config.transformer.minifierConfig = {
  compress: false,
  mangle: false
};

// Enable caching
config.cacheStores = [
  require('metro-cache').FileStore
];

// Optimize resolution
config.resolver.sourceExts = ['jsx', 'js', 'ts', 'tsx', 'json'];
config.resolver.assetExts = ['png', 'jpg', 'jpeg', 'gif', 'webp'];

// Increase the max workers
config.maxWorkers = 4;

module.exports = config;