import { type ReactNode, useMemo } from 'react';
import type { ProtocolEngine } from '../engine/types';
import type { DeepPartial, Theme } from '../theme/tokens';
import { A2UIContextProvider } from './hooks';
import type { ComponentRegistry } from './registry';

export interface A2UIProviderProps {
  children: ReactNode;
  /** The protocol engine driving surfaces (an A2uiEngine, or any ProtocolEngine). */
  engine: ProtocolEngine;
  /** The catalog: maps a node's `type` to its renderer. Unknown types render nothing. */
  registry: ComponentRegistry;
  /** App-level theme override, deep-merged over the defaults for every surface. */
  theme?: DeepPartial<Theme>;
  /** Called with a node's `type` when it has no registry entry. */
  onUnknownComponent?: (type: string) => void;
}

/** Provides the engine, catalog registry, and theme to the `<Surface>`s beneath it. */
export function A2UIProvider({
  children,
  engine,
  registry,
  theme,
  onUnknownComponent,
}: A2UIProviderProps) {
  const value = useMemo(
    () => ({ engine, registry, theme, onUnknownComponent }),
    [engine, registry, theme, onUnknownComponent],
  );
  return <A2UIContextProvider value={value}>{children}</A2UIContextProvider>;
}
