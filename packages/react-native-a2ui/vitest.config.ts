import { defineConfig } from 'vitest/config';

/** Vitest handles pure-TS tests only (*.test.ts). RN component tests (*.test.tsx) run on Jest. */
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'conformance/**/*.test.ts'],
  },
});
