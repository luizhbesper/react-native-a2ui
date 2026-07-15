import { act, render } from '@testing-library/react-native';
import { StyleSheet, Text } from 'react-native';
import type { ComponentNode, ProtocolEngine, SurfaceHandle } from '../engine/types';
import { A2UIProvider } from '../renderer/A2UIProvider';
import { useValue } from '../renderer/hooks';
import type { CatalogComponentProps, ComponentRegistry } from '../renderer/registry';
import { Surface } from '../renderer/Surface';
import { basicCatalog } from './index';

// A path-aware in-memory ProtocolEngine. Unlike the flat fake in renderer.test.tsx, this
// one stores a nested data object so template scoping (relative `{ path }` bindings under a
// list item) propagates the way web_core's data model does.
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

function createFakeEngine() {
  const nodes = new Map<string, ComponentNode>();
  const data: Record<string, unknown> = {};
  const valueListeners = new Map<string, Set<(v: unknown) => void>>();
  const treeListeners = new Set<(ready: boolean) => void>();
  const surfaceListeners = new Set<(ids: string[]) => void>();
  let surfaceExists = false;
  let rootReady = false;

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
    setValue: (pointer, value) => setNested(data, pointer, value),
    subscribeTree: (cb) => {
      if (rootReady) cb(true);
      treeListeners.add(cb);
      return () => treeListeners.delete(cb);
    },
    dispatchAction: () => {},
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
    // ponytail: over-notify — every write refreshes all subscribers with their current
    // value. web_core's signal graph is precise; tests just need correct propagation.
    writeValue(pointer: string, value: unknown) {
      setNested(data, pointer, value);
      for (const [ptr, cbs] of valueListeners) {
        const v = getNested(data, ptr);
        for (const cb of cbs) cb(v);
      }
    },
  };
}

// Test-only leaves. Leaf renders a static label; Bound proves item-scoped relative binding.
const Leaf = ({ node }: CatalogComponentProps) => <Text>{String(node.properties.text)}</Text>;
const Bound = ({ node }: CatalogComponentProps) => {
  const bind = typeof node.properties.bind === 'string' ? node.properties.bind : 'name';
  const value = useValue(bind);
  return <Text>{String(value ?? '')}</Text>;
};
const registry: ComponentRegistry = { ...basicCatalog, Leaf, Bound };

function mount(fake: ReturnType<typeof createFakeEngine>) {
  return render(
    <A2UIProvider engine={fake.engine} registry={registry}>
      <Surface surfaceId="s1" />
    </A2UIProvider>,
  );
}

function rootStyle(screen: Awaited<ReturnType<typeof render>>) {
  const json = screen.toJSON();
  const node = Array.isArray(json) ? json[0] : json;
  return StyleSheet.flatten(node?.props.style) ?? {};
}

describe('layout catalog', () => {
  it('Row lays out its children horizontally in order', async () => {
    const fake = createFakeEngine();
    const screen = await mount(fake);
    await act(async () => {
      fake.createSurface();
    });
    await act(async () => {
      fake.setNode({ id: 'a', type: 'Leaf', properties: { text: 'one' } });
      fake.setNode({ id: 'b', type: 'Leaf', properties: { text: 'two' } });
      fake.setNode({ id: 'root', type: 'Row', properties: { children: ['a', 'b'] } });
    });

    expect(screen.getByText('one')).toBeTruthy();
    expect(screen.getByText('two')).toBeTruthy();
    expect(rootStyle(screen).flexDirection).toBe('row');
  });

  it('Column stacks its children vertically', async () => {
    const fake = createFakeEngine();
    const screen = await mount(fake);
    await act(async () => {
      fake.createSurface();
    });
    await act(async () => {
      fake.setNode({ id: 'a', type: 'Leaf', properties: { text: 'top' } });
      fake.setNode({
        id: 'root',
        type: 'Column',
        properties: { children: ['a'], justify: 'center' },
      });
    });

    expect(screen.getByText('top')).toBeTruthy();
    expect(rootStyle(screen).flexDirection).toBe('column');
    expect(rootStyle(screen).justifyContent).toBe('center');
  });

  it('Card renders its single child', async () => {
    const fake = createFakeEngine();
    const screen = await mount(fake);
    await act(async () => {
      fake.createSurface();
    });
    await act(async () => {
      fake.setNode({ id: 'c', type: 'Leaf', properties: { text: 'inside' } });
      fake.setNode({ id: 'root', type: 'Card', properties: { child: 'c' } });
    });

    expect(screen.getByText('inside')).toBeTruthy();
  });

  it('Card without a child renders an empty container without throwing', async () => {
    const fake = createFakeEngine();
    const screen = await mount(fake);
    await act(async () => {
      fake.createSurface();
    });
    await act(async () => {
      fake.setNode({ id: 'root', type: 'Card', properties: {} });
    });

    expect(screen.toJSON()).toBeTruthy();
  });

  it('Divider defaults to a horizontal rule', async () => {
    const fake = createFakeEngine();
    const screen = await mount(fake);
    await act(async () => {
      fake.createSurface();
    });
    await act(async () => {
      fake.setNode({ id: 'root', type: 'Divider', properties: {} });
    });

    const style = rootStyle(screen);
    expect(style.height).toBe(1);
    expect(style.width).toBeUndefined();
    expect(style.backgroundColor).toBeDefined();
  });

  it('Divider draws a vertical rule when axis is vertical', async () => {
    const fake = createFakeEngine();
    const screen = await mount(fake);
    await act(async () => {
      fake.createSurface();
    });
    await act(async () => {
      fake.setNode({ id: 'root', type: 'Divider', properties: { axis: 'vertical' } });
    });

    const style = rootStyle(screen);
    expect(style.width).toBe(1);
    expect(style.height).toBeUndefined();
  });

  it('List renders its static children', async () => {
    const fake = createFakeEngine();
    const screen = await mount(fake);
    await act(async () => {
      fake.createSurface();
    });
    await act(async () => {
      fake.setNode({ id: 'a', type: 'Leaf', properties: { text: 'first' } });
      fake.setNode({ id: 'b', type: 'Leaf', properties: { text: 'second' } });
      fake.setNode({ id: 'root', type: 'List', properties: { children: ['a', 'b'] } });
    });

    expect(screen.getByText('first')).toBeTruthy();
    expect(screen.getByText('second')).toBeTruthy();
  });

  it('List expands a template over a bound data list and reacts to writes', async () => {
    const fake = createFakeEngine();
    const screen = await mount(fake);
    await act(async () => {
      fake.createSurface();
    });
    await act(async () => {
      fake.setNode({ id: 'item', type: 'Bound', properties: { bind: 'name' } });
      fake.setNode({
        id: 'root',
        type: 'List',
        properties: { children: { componentId: 'item', path: '/items' } },
      });
    });
    // No data written yet: template yields no items.
    expect(screen.queryByText('Apple')).toBeNull();

    await act(async () => {
      fake.writeValue('/items', [{ name: 'Apple' }, { name: 'Banana' }]);
    });
    expect(screen.getByText('Apple')).toBeTruthy();
    expect(screen.getByText('Banana')).toBeTruthy();

    // A per-item write updates only that item's scoped binding.
    await act(async () => {
      fake.writeValue('/items/1/name', 'Cherry');
    });
    expect(screen.getByText('Apple')).toBeTruthy();
    expect(screen.getByText('Cherry')).toBeTruthy();
    expect(screen.queryByText('Banana')).toBeNull();
  });

  it('List renders an empty template list for an empty or null bound value', async () => {
    const fake = createFakeEngine();
    const screen = await mount(fake);
    await act(async () => {
      fake.createSurface();
    });
    await act(async () => {
      fake.setNode({ id: 'item', type: 'Bound', properties: { bind: 'name' } });
      fake.setNode({
        id: 'root',
        type: 'List',
        properties: { children: { componentId: 'item', path: '/items' } },
      });
      fake.writeValue('/items', [{ name: 'Apple' }]);
    });
    expect(screen.getByText('Apple')).toBeTruthy();

    await act(async () => {
      fake.writeValue('/items', []);
    });
    expect(screen.queryByText('Apple')).toBeNull();

    await act(async () => {
      fake.writeValue('/items', null);
    });
    expect(screen.queryByText('Apple')).toBeNull();
    expect(screen.toJSON()).toBeTruthy();
  });
});
