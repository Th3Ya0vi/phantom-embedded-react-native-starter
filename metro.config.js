// metro.config.js
const os = require('os');

// Polyfill for older Node versions
if (!os.availableParallelism) {
  os.availableParallelism = () => os.cpus().length;
}
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 1. Enable Package Exports (required for Phantom SDK)
config.resolver.unstable_enablePackageExports = true;

// 2. Add support for symlinks (REQUIRED for pnpm)
config.resolver.unstable_conditionNames = ['browser', 'require', 'import', 'node'];

module.exports = config;