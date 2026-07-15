import { act } from '@testing-library/react-native';
import { Text } from 'react-native';
import { useValue } from '../renderer/hooks';
import type { CatalogComponentProps, ComponentRegistry } from '../renderer/registry';
import { createFakeEngine, mount as mountWith, rootStyle } from './__fixtures__/fakeEngine';
import { basicCatalog } from './index';

// Test-only leaves. Leaf renders a static label; Bound proves item-scoped relative binding.
const Leaf = ({ node }: CatalogComponentProps) => <Text>{String(node.properties.text)}</Text>;
const Bound = ({ node }: CatalogComponentProps) => {
  const bind = typeof node.properties.bind === 'string' ? node.properties.bind : 'name';
  const value = useValue(bind);
  return <Text>{String(value ?? '')}</Text>;
};
const registry: ComponentRegistry = { ...basicCatalog, Leaf, Bound };

function mount(fake: ReturnType<typeof createFakeEngine>) {
  return mountWith(fake, registry);
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
