import { act } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { createFakeEngine, mount as mountWith } from './__fixtures__/fakeEngine';
import { basicCatalog } from './index';

function mount(fake: ReturnType<typeof createFakeEngine>) {
  return mountWith(fake, basicCatalog);
}

async function withSurface(setup: (fake: ReturnType<typeof createFakeEngine>) => void) {
  const fake = createFakeEngine();
  const screen = await mount(fake);
  await act(async () => {
    fake.createSurface();
  });
  await act(async () => {
    setup(fake);
  });
  return { fake, screen };
}

describe('content catalog — Text', () => {
  it('renders a literal string', async () => {
    const { screen } = await withSurface((fake) => {
      fake.setNode({ id: 'root', type: 'Text', properties: { text: 'Hello world' } });
    });
    expect(screen.getByText('Hello world')).toBeTruthy();
  });

  it('renders markdown-lite bold and italic spans', async () => {
    const { screen } = await withSurface((fake) => {
      fake.setNode({
        id: 'root',
        type: 'Text',
        properties: { text: 'plain **bold** and *italic*' },
      });
    });
    expect(StyleSheet.flatten(screen.getByText('bold').props.style).fontWeight).toBe('bold');
    expect(StyleSheet.flatten(screen.getByText('italic').props.style).fontStyle).toBe('italic');
  });

  it('applies a bold heading style for a heading variant', async () => {
    const { screen } = await withSurface((fake) => {
      fake.setNode({ id: 'root', type: 'Text', properties: { text: 'Title', variant: 'h1' } });
    });
    expect(StyleSheet.flatten(screen.getByText('Title').props.style).fontWeight).toBe('bold');
  });

  it('resolves a bound text and reacts to data writes', async () => {
    const { fake, screen } = await withSurface((f) => {
      f.setNode({ id: 'root', type: 'Text', properties: { text: { path: '/greeting' } } });
    });
    expect(screen.queryByText('Hi there')).toBeNull();

    await act(async () => {
      fake.writeValue('/greeting', 'Hi there');
    });
    expect(screen.getByText('Hi there')).toBeTruthy();
  });

  it('tolerates missing and null text without throwing', async () => {
    const { fake, screen } = await withSurface((f) => {
      f.setNode({ id: 'root', type: 'Text', properties: { text: { path: '/x' } } });
    });
    await act(async () => {
      fake.writeValue('/x', null);
    });
    expect(screen.toJSON()).toBeTruthy();
  });
});

describe('content catalog — Image', () => {
  it('renders a source uri, resize mode from fit, and accessibility label', async () => {
    const { screen } = await withSurface((fake) => {
      fake.setNode({
        id: 'root',
        type: 'Image',
        properties: {
          url: 'https://example.test/cat.png',
          description: 'A cat',
          fit: 'contain',
          variant: 'avatar',
        },
      });
    });
    const image = screen.getByLabelText('A cat');
    expect(image.props.source.uri).toBe('https://example.test/cat.png');
    expect(image.props.resizeMode).toBe('contain');
  });

  it('resolves a bound url and reacts to data writes', async () => {
    const { fake, screen } = await withSurface((f) => {
      f.setNode({
        id: 'root',
        type: 'Image',
        properties: { url: { path: '/photo' }, description: 'photo' },
      });
    });
    expect(screen.queryByLabelText('photo')).toBeNull();

    await act(async () => {
      fake.writeValue('/photo', 'https://example.test/a.png');
    });
    expect(screen.getByLabelText('photo').props.source.uri).toBe('https://example.test/a.png');
  });

  it('renders nothing for a missing url without throwing', async () => {
    const { screen } = await withSurface((fake) => {
      fake.setNode({ id: 'root', type: 'Image', properties: { description: 'nope' } });
    });
    expect(screen.queryByLabelText('nope')).toBeNull();
    expect(() => screen.toJSON()).not.toThrow();
  });
});

describe('content catalog — Icon', () => {
  it('renders a named icon with an accessibility label', async () => {
    const { screen } = await withSurface((fake) => {
      fake.setNode({ id: 'root', type: 'Icon', properties: { name: 'favorite' } });
    });
    expect(screen.getByLabelText('favorite')).toBeTruthy();
  });

  it('resolves a bound name and reacts to data writes', async () => {
    const { fake, screen } = await withSurface((f) => {
      f.setNode({ id: 'root', type: 'Icon', properties: { name: { path: '/icon' } } });
    });
    await act(async () => {
      fake.writeValue('/icon', 'home');
    });
    expect(screen.getByLabelText('home')).toBeTruthy();
  });

  it('tolerates an svgPath name without throwing', async () => {
    const { screen } = await withSurface((fake) => {
      fake.setNode({ id: 'root', type: 'Icon', properties: { name: { svgPath: 'M0 0 L1 1' } } });
    });
    expect(() => screen.toJSON()).not.toThrow();
  });
});
