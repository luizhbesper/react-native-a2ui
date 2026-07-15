import { createContext, type ReactNode, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import type { SurfaceTheme } from '../engine/types';
import { type DeepPartial, resolveTheme, type Theme } from './tokens';

const ThemeContext = createContext<Theme | null>(null);

export interface A2UIThemeProviderProps {
  children: ReactNode;
  /** App-level partial override, deep-merged over the defaults. */
  theme?: DeepPartial<Theme>;
  /** The surface's wire theme (createSurface.theme); `primaryColor` wins last. */
  surfaceTheme?: SurfaceTheme;
}

/** Resolves tokens for the current device color scheme and provides them downstream. */
export function A2UIThemeProvider({ children, theme, surfaceTheme }: A2UIThemeProviderProps) {
  // useColorScheme() may also return 'unspecified'; resolveTheme treats anything but 'dark' as light.
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const value = useMemo(
    () => resolveTheme({ scheme, userTheme: theme, surfaceTheme }),
    [scheme, theme, surfaceTheme],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Read the resolved theme. Throws if used outside an `<A2UIThemeProvider>`. */
export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (theme === null) {
    throw new Error('useTheme must be used within an <A2UIThemeProvider>');
  }
  return theme;
}
