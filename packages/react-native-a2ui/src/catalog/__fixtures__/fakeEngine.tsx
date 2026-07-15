// Shared RNTL harness for catalog component tests: a path-aware in-memory ProtocolEngine
// plus mount/rootStyle helpers. Unlike the flat fake in renderer.test.tsx, this stores a
// nested data object so template scoping (relative `{ path }` bindings under a list item)
// propagates the way web_core's data model does. Lives under __fixtures__ so it's excluded
// from the build and never matched by Jest's `*.test.tsx` testMatch.

import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import type { ComponentNode, ProtocolEngine, SurfaceHandle } from '../../engine/types';
import { A2UIProvider } from '../../renderer/A2UIProvider';
import type { ComponentRegistry } from '../../renderer/registry';
import { Surface } from '../../renderer/Surface';

function getNested(root: unknown, pointer: string): unknown {
  if (pointer === '/' || pointer === '') return root;
  let cur: unknown = root;
  for (const seg of pointer.split('/').slice(1)) {
    if (cur === null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[seg];
  }
  return cur;
}

function setNested(root: Record<string, unknown>, pointer: string, value: unknown): void {
  const segs = pointer.split('/').slice(1);
  const last = segs.pop();
  if (last === undefined) return;
  let cur: Record<string, unknown> = root;
  for (const s of segs) {
    const next = cur[s];
    if (typeof next !== 'object' || next === null) cur[s] = {};
    cur = cur[s] as Record<string, unknown>;
  }
  cur[last] = value;
}

/** An in-memory ProtocolEngine plus imperative helpers to stream a surface, nodes, and data. */
export function createFakeEngine() {
  const nodes = new Map<string, ComponentNode>();
  const data: Record<string, unknown> = {};
  const valueListeners = new Map<string, Set<(v: unknown) => void>>();
  const treeListeners = new Set<(ready: boolean) => void>();
  const surfaceListeners = new Set<(ids: string[]) => void>();
  let surfaceExists = false;
  let rootReady = false;
  const dispatched: {
    name: string;
    sourceComponentId: string;
    context?: Record<string, unknown>;
  }[] = [];

  // ponytail: over-notify — every write refreshes all subscribers with their current
  // value. web_core's signal graph is precise; tests just need correct propagation.
  function notify() {
    for (const [ptr, cbs] of valueListeners) {
      const v = getNested(data, ptr);
      for (const cb of cbs) cb(v);
    }
  }

  const surface: SurfaceHandle = {
    theme: undefined,
    getNode: (id) => nodes.get(id),
    getValue: (pointer) => getNested(data, pointer),
    subscribeValue: (pointer, cb) => {
      let set = valueListeners.get(pointer);
      if (!set) {
        set = new Set();
        valueListeners.set(pointer, set);
      }
      set.add(cb);
      return () => set.delete(cb);
    },
    // Mirrors the real engine: a client-side write both persists and notifies, so two-way
    // inputs re-read reactively after writing back.
    setValue: (pointer, value) => {
      setNested(data, pointer, value);
      notify();
    },
    subscribeTree: (cb) => {
      if (rootReady) cb(true);
      treeListeners.add(cb);
      return () => treeListeners.delete(cb);
    },
    dispatchAction: (name, sourceComponentId, context) => {
      dispatched.push({ name, sourceComponentId, context });
    },
  };

  const engine: ProtocolEngine = {
    processMessages: () => {},
    getSurface: (id) => (surfaceExists && id === 's1' ? surface : undefined),
    subscribeSurfaces: (cb) => {
      surfaceListeners.add(cb);
      cb(surfaceExists ? ['s1'] : []);
      return () => surfaceListeners.delete(cb);
    },
    onClientMessage: () => () => {},
    getClientCapabilities: () => ({}),
  };

  return {
    engine,
    /** Records every `surface.dispatchAction` call, verbatim (context unresolved). */
    dispatched,
    createSurface() {
      surfaceExists = true;
      for (const cb of surfaceListeners) cb(['s1']);
    },
    setNode(node: ComponentNode) {
      nodes.set(node.id, node);
      if (node.id === 'root') {
        rootReady = true;
        for (const cb of treeListeners) cb(true);
      }
    },
    /** Server-driven write (streamed data-model update): persists and notifies. */
    writeValue(pointer: string, value: unknown) {
      setNested(data, pointer, value);
      notify();
    },
  };
}

/** Renders `<Surface surfaceId="s1">` under a provider wired to the fake engine and registry. */
export function mount(fake: ReturnType<typeof createFakeEngine>, registry: ComponentRegistry) {
  return render(
    <A2UIProvider engine={fake.engine} registry={registry}>
      <Surface surfaceId="s1" />
    </A2UIProvider>,
  );
}

/** Flattened style of the rendered root host node. */
export function rootStyle(screen: Awaited<ReturnType<typeof render>>) {
  const json = screen.toJSON();
  const node = Array.isArray(json) ? json[0] : json;
  return StyleSheet.flatten(node?.props.style) ?? {};
}
