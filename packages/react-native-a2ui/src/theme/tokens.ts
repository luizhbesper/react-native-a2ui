/**
 * A2UI design tokens for React Native.
 *
 * The protocol wire theme (basic catalog `$defs/theme`) carries only
 * `primaryColor`, `iconUrl`, `agentDisplayName`. The full design system lives
 * client-side. These tokens are a React-Native port of the official CSS custom
 * properties defined by web_core's reference renderer:
 *   node_modules/@a2ui/web_core/src/v0_9/basic_catalog/styles/default.js
 *
 * CSS `light-dark()` / `color-mix()` have no RN equivalent, so each token is
 * resolved to a concrete value and light/dark are two separate token sets.
 * Lengths are RN dp (numbers, 1rem = 16dp); line heights are ratios.
 *
 * Token -> CSS var mapping (`--a2ui-` prefix omitted):
 *   colors.primary        -> color-primary
 *   colors.primaryLight   -> color-primary-light
 *   colors.primaryDark    -> color-primary-dark
 *   colors.primaryHover   -> color-primary-hover
 *   colors.onPrimary      -> color-on-primary
 *   colors.secondary      -> color-secondary
 *   colors.secondaryLight -> color-secondary-light
 *   colors.secondaryDark  -> color-secondary-dark
 *   colors.secondaryHover -> color-secondary-hover
 *   colors.onSecondary    -> color-on-secondary
 *   colors.background     -> color-background
 *   colors.onBackground   -> color-on-background
 *   colors.surface        -> color-surface
 *   colors.onSurface      -> color-on-surface
 *   colors.input          -> color-input
 *   colors.onInput        -> color-on-input
 *   colors.border         -> color-border
 *   spacing.{xs,s,m,l,xl} -> spacing-{xs,s,m,l,xl}   (grid-base = m)
 *   fontSizes.{xs,s,m,l,xl,xxl} -> font-size-{xs,s,m,l,xl,2xl}
 *   lineHeights.headings  -> line-height-headings
 *   lineHeights.body      -> line-height-body
 *   radii.base            -> border-radius
 *   borderWidths.base     -> border-width
 *   fontFamilies.title    -> font-family-title   (CSS `inherit` -> undefined)
 *   fontFamilies.monospace-> font-family-monospace
 */

export interface Theme {
  colors: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    primaryHover: string;
    onPrimary: string;
    secondary: string;
    secondaryLight: string;
    secondaryDark: string;
    secondaryHover: string;
    onSecondary: string;
    background: string;
    onBackground: string;
    surface: string;
    onSurface: string;
    input: string;
    onInput: string;
    border: string;
  };
  spacing: { xs: number; s: number; m: number; l: number; xl: number };
  fontSizes: { xs: number; s: number; m: number; l: number; xl: number; xxl: number };
  lineHeights: { headings: number; body: number };
  radii: { base: number };
  borderWidths: { base: number };
  fontFamilies: { title?: string; monospace: string };
}

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

// --a2ui-grid-base 0.5rem; spacing derived off it in default.js.
const GRID = 8;
// --a2ui-font-size 1rem, --a2ui-font-scale 1.2.
const FONT_BASE = 16;
const FONT_SCALE = 1.2;

const SPACING: Theme['spacing'] = {
  xs: GRID / 4,
  s: GRID / 2,
  m: GRID,
  l: GRID * 2,
  xl: GRID * 4,
};

const FONT_SIZES: Theme['fontSizes'] = {
  xs: FONT_BASE / FONT_SCALE / FONT_SCALE,
  s: FONT_BASE / FONT_SCALE,
  m: FONT_BASE,
  l: FONT_BASE * FONT_SCALE,
  xl: FONT_BASE * FONT_SCALE * FONT_SCALE,
  xxl: FONT_BASE * FONT_SCALE * FONT_SCALE * FONT_SCALE,
};

// Scheme-independent scalar tokens.
const SCALARS = {
  spacing: SPACING,
  fontSizes: FONT_SIZES,
  lineHeights: { headings: 1.2, body: 1.5 },
  radii: { base: 4 },
  borderWidths: { base: 1 },
  // `inherit` has no RN meaning -> undefined uses the platform default font.
  fontFamilies: { title: undefined, monospace: 'monospace' },
} satisfies Omit<Theme, 'colors'>;

// ponytail: fixed variant hex, not a runtime color-mix engine. Recompute the
// primary*/secondary* variants from an arbitrary wire primaryColor only when
// buttons need real hover/press states (M1-T5).
export const LIGHT_THEME: Theme = {
  colors: {
    primary: '#1177ee',
    primaryLight: '#3a8ff1',
    primaryDark: '#0e65ca',
    primaryHover: '#0e65ca', // light-dark(dark, light) -> dark variant in light scheme
    onPrimary: '#ffffff',
    secondary: '#dddddd',
    secondaryLight: '#e3e3e3',
    secondaryDark: '#c4c4c4',
    secondaryHover: '#c4c4c4',
    onSecondary: '#333333',
    background: '#eeeeee',
    onBackground: '#333333',
    surface: '#e2e2e2',
    onSurface: '#333333',
    input: '#ffffff',
    onInput: '#333333',
    border: '#cccccc',
  },
  ...SCALARS,
};

export const DARK_THEME: Theme = {
  colors: {
    primary: '#1177ee',
    primaryLight: '#3a8ff1',
    primaryDark: '#0e65ca',
    primaryHover: '#3a8ff1', // light-dark(dark, light) -> light variant in dark scheme
    onPrimary: '#ffffff',
    secondary: '#333333',
    secondaryLight: '#474747',
    secondaryDark: '#2e2e2e',
    secondaryHover: '#474747',
    onSecondary: '#eeeeee',
    background: '#111111',
    onBackground: '#eeeeee',
    surface: '#1c1c1c',
    onSurface: '#eeeeee',
    input: '#2a2a2a',
    onInput: '#eeeeee',
    border: '#444444',
  },
  ...SCALARS,
};

// basic catalog theme.primaryColor pattern.
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepMerge<T>(base: T, override: unknown): T {
  if (!isObject(override)) return base;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(override)) {
    const current = out[key];
    out[key] = isObject(current) && isObject(value) ? deepMerge(current, value) : value;
  }
  return out as T;
}

export interface ResolveThemeInput {
  /** Device color scheme; null/undefined resolves to light. */
  scheme?: 'light' | 'dark' | null;
  /** App-level partial override, deep-merged over the defaults. */
  userTheme?: DeepPartial<Theme>;
  /** The surface's wire theme (createSurface.theme); `primaryColor` wins last. */
  surfaceTheme?: Record<string, unknown> | null;
}

/**
 * Resolve the effective theme: defaults for the scheme, then the app override,
 * then the wire `primaryColor` (which maps onto `colors.primary` only).
 */
export function resolveTheme({ scheme, userTheme, surfaceTheme }: ResolveThemeInput = {}): Theme {
  const base = scheme === 'dark' ? DARK_THEME : LIGHT_THEME;
  const merged = deepMerge(base, userTheme);
  const primaryColor = surfaceTheme?.primaryColor;
  if (typeof primaryColor === 'string' && HEX_COLOR.test(primaryColor)) {
    return { ...merged, colors: { ...merged.colors, primary: primaryColor } };
  }
  return merged;
}
