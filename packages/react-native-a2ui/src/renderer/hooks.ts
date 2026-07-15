import { createContext, useContext, useMemo, useSyncExternalStore } from 'react';
import type { ProtocolEngine, SurfaceHandle } from '../engine/types';
import type { DeepPartial, Theme } from '../theme/tokens';
import type { ComponentRegistry } from './registry';

/** What `<A2UIProvider>` shares with every surface beneath it. */
export interface A2UIContextValue {
  engine: ProtocolEngine;
  registry: ComponentRegistry;
  /** App-level theme override, deep-merged over the defaults for every surface. */
  theme?: DeepPartial<Theme>;
  /** Called with a node's `type` when it has no registry entry. */
  onUnknownComponent?: (type: string) => void;
}

const A2UIContext = createContext<A2UIContextValue | null>(null);

/** Reads the `<A2UIProvider>` context. Throws if used outside one. */
export function useA2UI(): A2UIContextValue {
  const value = useContext(A2UIContext);
  if (value === null) {
    throw new Error('A2UI renderer components must be used within an <A2UIProvider>');
  }
  return value;
}

export const A2UIContextProvider = A2UIContext.Provider;

const SurfaceContext = createContext<SurfaceHandle | null>(null);

/** Reads the surface a node is being rendered into. Throws if used outside a `<Surface>`. */
export function useSurface(): SurfaceHandle {
  const surface = useContext(SurfaceContext);
  if (surface === null) {
    throw new Error('A2UI node components must be rendered inside a <Surface>');
  }
  return surface;
}

export const SurfaceContextProvider = SurfaceContext.Provider;

/**
 * Subscribes to one data-model pointer and returns its latest value, re-rendering only
 * this component when that pointer changes (fine-grained reactivity). The value is
 * `undefined` until the first write — web_core's data model does not replay on subscribe.
 */
export function useValue(pointer: string): unknown {
  const surface = useSurface();
  const store = useMemo(() => {
    let value: unknown;
    return {
      subscribe: (onChange: () => void) =>
        surface.subscribeValue(pointer, (next) => {
          value = next;
          onChange();
        }),
      getSnapshot: () => value,
    };
  }, [surface, pointer]);
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}
