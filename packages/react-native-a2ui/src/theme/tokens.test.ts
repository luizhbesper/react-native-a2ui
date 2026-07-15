import { describe, expect, it } from 'vitest';
import { resolveTheme } from './tokens';

describe('resolveTheme', () => {
  it('resolves the full default token set for the light scheme', () => {
    const theme = resolveTheme({ scheme: 'light' });
    expect(theme.colors.primary).toBe('#1177ee');
    expect(theme.colors.background).toBe('#eeeeee');
    expect(theme.spacing.m).toBe(8);
    expect(theme.fontSizes.m).toBe(16);
    expect(theme.radii.base).toBe(4);
    expect(theme.lineHeights.body).toBe(1.5);
  });

  it('lets a wire primaryColor override colors.primary only', () => {
    const theme = resolveTheme({
      scheme: 'light',
      surfaceTheme: { primaryColor: '#FF0000' },
    });
    expect(theme.colors.primary).toBe('#FF0000');
    // Every other color stays at its default.
    expect(theme.colors.background).toBe('#eeeeee');
    expect(theme.colors.onPrimary).toBe('#ffffff');
  });

  it('deep-merges a partial user theme without dropping sibling tokens', () => {
    const theme = resolveTheme({
      scheme: 'light',
      userTheme: { colors: { primary: '#00ff00' } },
    });
    expect(theme.colors.primary).toBe('#00ff00');
    // Sibling token within the overridden group survives (deep, not shallow, merge).
    expect(theme.colors.background).toBe('#eeeeee');
    // Untouched groups survive too.
    expect(theme.spacing.m).toBe(8);
  });

  it('selects the dark token set by scheme', () => {
    expect(resolveTheme({ scheme: 'dark' }).colors.background).toBe('#111111');
    expect(resolveTheme({ scheme: 'light' }).colors.background).toBe('#eeeeee');
    // null / undefined scheme falls back to light.
    expect(resolveTheme({ scheme: null }).colors.background).toBe('#eeeeee');
    expect(resolveTheme().colors.background).toBe('#eeeeee');
  });
});
