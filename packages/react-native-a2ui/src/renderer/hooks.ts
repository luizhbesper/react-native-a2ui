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

// The absolute JSON-pointer base that relative bindings resolve against. Root is '/';
// a template list nests it to the item's path (e.g. '/items/0') for its descendants.
const DataScopeContext = createContext<string>('/');

/** Reads the current data scope (absolute base pointer) a node renders under. */
export function useDataScope(): string {
  return useContext(DataScopeContext);
}

export const DataScopeContextProvider = DataScopeContext.Provider;

/**
 * Resolves a possibly-relative JSON pointer against a scope base, mirroring web_core's
 * DataContext: an absolute pointer wins as-is; '' or '.' is the base; otherwise it joins.
 */
export function resolvePointer(base: string, pointer: string): string {
  if (pointer.startsWith('/')) return pointer;
  if (pointer === '' || pointer === '.') return base;
  let b = base;
  if (b.endsWith('/') && b.length > 1) b = b.slice(0, -1);
  if (b === '/') b = '';
  return `${b}/${pointer}`;
}

/**
 * Subscribes to one data-model pointer and returns its latest value, re-rendering only
 * this component when that pointer changes (fine-grained reactivity). Relative pointers
 * resolve against the current data scope; the initial value is seeded from `getValue`
 * since web_core's data model does not replay on subscribe. A `null` pointer is a
 * non-binding: it returns `undefined` and subscribes to nothing, so literal (unbound)
 * DynamicString props don't subscribe to the scope root and lose fine-grained updates.
 */
export function useValue(pointer: string | null): unknown {
  const surface = useSurface();
  const scope = useDataScope();
  const absolute = pointer === null ? null : resolvePointer(scope, pointer);
  const store = useMemo(() => {
    if (absolute === null) {
      return { subscribe: () => () => {}, getSnapshot: () => undefined };
    }
    let value: unknown = surface.getValue(absolute);
    return {
      subscribe: (onChange: () => void) =>
        surface.subscribeValue(absolute, (next) => {
          value = next;
          onChange();
        }),
      getSnapshot: () => value,
    };
  }, [surface, absolute]);
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}
