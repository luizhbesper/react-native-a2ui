import { act, render } from '@testing-library/react-native';
import { Text } from 'react-native';
import type { ComponentNode, ProtocolEngine, SurfaceHandle } from '../engine/types';
import { A2UIProvider } from './A2UIProvider';
import { useValue } from './hooks';
import { NodeRenderer } from './NodeRenderer';
import type { CatalogComponentProps, ComponentRegistry } from './registry';
import { Surface } from './Surface';

// A controllable in-memory ProtocolEngine. The renderer speaks the interface only
// (ADR-0005), so a fake — not the web_core-backed A2uiEngine — is the honest unit
// harness: it feeds arbitrary node types (including ones no catalog would validate)
// and drives value/tree/surface events by hand.
function createFakeEngine() {
  const nodes = new Map<string, ComponentNode>();
  const valueListeners = new Map<string, Set<(v: unknown) => void>>();
  const treeListeners = new Set<(ready: boolean) => void>();
  const surfaceListeners = new Set<(ids: string[]) => void>();
  let surfaceExists = false;
  let rootReady = false;

  const surface: SurfaceHandle = {
    theme: undefined,
    getNode: (id) => nodes.get(id),
    subscribeValue: (pointer, cb) => {
      let set = valueListeners.get(pointer);
      if (!set) {
        set = new Set();
        valueListeners.set(pointer, set);
      }
      set.add(cb);
      return () => set.delete(cb);
    },
    setValue: () => {},
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
    writeValue(pointer: string, value: unknown) {
      const set = valueListeners.get(pointer);
      if (set) for (const cb of set) cb(value);
    },
  };
}

// A container placeholder that renders its children by id — enough tree to test siblings.
const Container = ({ node }: CatalogComponentProps) => (
  <>
    {(node.properties.children as string[]).map((id) => (
      <NodeRenderer key={id} nodeId={id} />
    ))}
  </>
);

describe('renderer', () => {
  it('renders nothing until the root node exists, then paints (progressive)', async () => {
    const fake = createFakeEngine();
    const registry: ComponentRegistry = {
      Text: ({ node }) => <Text>{String(node.properties.text)}</Text>,
    };

    const screen = await render(
      <A2UIProvider engine={fake.engine} registry={registry}>
        <Surface surfaceId="s1" />
      </A2UIProvider>,
    );
    expect(screen.queryByText('hi')).toBeNull();

    await act(async () => {
      fake.createSurface();
    });
    expect(screen.queryByText('hi')).toBeNull();

    await act(async () => {
      fake.setNode({ id: 'root', type: 'Text', properties: { text: 'hi' } });
    });
    expect(screen.getByText('hi')).toBeTruthy();
  });

  it('renders nothing and reports the type when a component is not in the registry', async () => {
    const fake = createFakeEngine();
    const onUnknownComponent = jest.fn();

    const screen = await render(
      <A2UIProvider engine={fake.engine} registry={{}} onUnknownComponent={onUnknownComponent}>
        <Surface surfaceId="s1" />
      </A2UIProvider>,
    );
    await act(async () => {
      fake.createSurface();
    });
    await act(async () => {
      fake.setNode({ id: 'root', type: 'Mystery', properties: {} });
    });

    expect(onUnknownComponent).toHaveBeenCalledWith('Mystery');
    expect(screen.toJSON()).toBeNull();
  });

  it('re-renders only the node whose bound value changed, not its sibling', async () => {
    const fake = createFakeEngine();
    const rendersA = jest.fn();
    const rendersB = jest.fn();

    const BoundText = ({ node }: CatalogComponentProps) => {
      (node.id === 'a' ? rendersA : rendersB)();
      const value = useValue(String(node.properties.path));
      return <Text>{String(value ?? '')}</Text>;
    };
    const registry: ComponentRegistry = { Container, BoundText };

    const screen = await render(
      <A2UIProvider engine={fake.engine} registry={registry}>
        <Surface surfaceId="s1" />
      </A2UIProvider>,
    );
    await act(async () => {
      fake.createSurface();
    });
    await act(async () => {
      fake.setNode({ id: 'a', type: 'BoundText', properties: { path: '/a' } });
      fake.setNode({ id: 'b', type: 'BoundText', properties: { path: '/b' } });
      fake.setNode({ id: 'root', type: 'Container', properties: { children: ['a', 'b'] } });
    });

    const beforeA = rendersA.mock.calls.length;
    const beforeB = rendersB.mock.calls.length;

    await act(async () => {
      fake.writeValue('/a', 'changed');
    });

    expect(rendersA.mock.calls.length).toBe(beforeA + 1);
    expect(rendersB.mock.calls.length).toBe(beforeB);
    expect(screen.getByText('changed')).toBeTruthy();
  });

  it('contains a throwing component so the surface still renders its other nodes', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const fake = createFakeEngine();
    const Boom = () => {
      throw new Error('boom');
    };
    const registry: ComponentRegistry = {
      Boom,
      Container,
      Text: ({ node }) => <Text>{String(node.properties.text)}</Text>,
    };

    const screen = await render(
      <A2UIProvider engine={fake.engine} registry={registry}>
        <Surface surfaceId="s1" />
      </A2UIProvider>,
    );
    await act(async () => {
      fake.createSurface();
    });
    await act(async () => {
      fake.setNode({ id: 'boom', type: 'Boom', properties: {} });
      fake.setNode({ id: 'ok', type: 'Text', properties: { text: 'survived' } });
      fake.setNode({ id: 'root', type: 'Container', properties: { children: ['boom', 'ok'] } });
    });

    expect(screen.getByText('survived')).toBeTruthy();
    consoleError.mockRestore();
  });
});
