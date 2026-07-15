/** Jest handles RN component tests only (*.test.tsx). Pure-TS tests (*.test.ts) run on Vitest. */
module.exports = {
  preset: '@react-native/jest-preset',
  testMatch: ['<rootDir>/src/**/*.test.tsx'],
};
