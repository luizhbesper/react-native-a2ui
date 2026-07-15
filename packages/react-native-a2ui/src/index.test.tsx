import { VERSION } from './index';

// Smoke test: the public barrel re-exports RN-backed renderer + theme modules, so it
// loads only under Jest. Proves the entry point resolves without throwing.
describe('package entry', () => {
  it('exports a version', () => {
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
