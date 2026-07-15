import { describe, expect, it } from 'vitest';
import { VERSION } from './index';

// Pipeline sanity: proves the Vitest runner works. Replaced by real engine tests in M0.
describe('package entry', () => {
  it('exports a version', () => {
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
