const path = require('node:path');

// react-native bundles react 19.2.3 while react-test-renderer (the reconciler) uses the
// hoisted 19.2.7; the two dispatchers can't mix, so components using hooks internally
// (FlatList/VirtualizedList) crash. Pin every `react` import to the reconciler's copy.
const reactDir = path.dirname(require.resolve('react/package.json'));

/** Jest handles RN component tests only (*.test.tsx). Pure-TS tests (*.test.ts) run on Vitest. */
module.exports = {
  preset: '@react-native/jest-preset',
  testMatch: ['<rootDir>/src/**/*.test.tsx'],
  // Mounting virtualized components (FlatList/VirtualizedList) in the test renderer is heavy;
  // the 5s default is tight on slower CI runners. Give RNTL tests headroom (passes locally in <1s).
  testTimeout: 20000,
  moduleNameMapper: {
    '^react$': reactDir,
    '^react/(.*)$': path.join(reactDir, '$1'),
    // The public barrel now re-exports the web_core-backed engine, so barrel-importing tests
    // transitively load @a2ui/web_core — a Metro/Hermes-targeted engine (modern JS the RN
    // preset can't transform). Jest tests never drive the real engine (its behavior lives in
    // Vitest: A2uiEngine.test.ts + conformance), so stub it, like the preset stubs native modules.
    '^@a2ui/web_core/v0_9$': '<rootDir>/src/engine/a2ui/__mocks__/web_core.js',
  },
};
