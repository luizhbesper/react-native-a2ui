const path = require('node:path');

// react-native bundles react 19.2.3 while react-test-renderer (the reconciler) uses the
// hoisted 19.2.7; the two dispatchers can't mix, so components using hooks internally
// (FlatList/VirtualizedList) crash. Pin every `react` import to the reconciler's copy.
const reactDir = path.dirname(require.resolve('react/package.json'));

/** Jest handles RN component tests only (*.test.tsx). Pure-TS tests (*.test.ts) run on Vitest. */
module.exports = {
  preset: '@react-native/jest-preset',
  testMatch: ['<rootDir>/src/**/*.test.tsx'],
  moduleNameMapper: {
    '^react$': reactDir,
    '^react/(.*)$': path.join(reactDir, '$1'),
  },
};
