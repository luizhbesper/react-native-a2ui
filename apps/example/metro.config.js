// Expo monorepo Metro config. Required because this is a pnpm workspace: Metro must watch
// the repo root to follow the `react-native-a2ui` symlink and hoisted deps, and to bundle
// the vendored fixture JSON the gallery imports from packages/react-native-a2ui/conformance/.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
// Resolve the workspace library to its TypeScript source (bob ships a `source` export
// condition), so the demo tracks src with no build step — lib/ is gitignored. Package exports
// is already on in Expo; adding `source` only affects packages that declare it (this lib).
config.resolver.unstable_conditionNames = [
  ...(config.resolver.unstable_conditionNames ?? []),
  'source',
];

module.exports = config;
