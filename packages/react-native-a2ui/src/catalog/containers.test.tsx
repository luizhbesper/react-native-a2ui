import { act, fireEvent } from '@testing-library/react-native';
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

describe('containers catalog — Tabs', () => {
  it('renders the first tab child and switches on header press', async () => {
    const { screen } = await withSurface((f) => {
      f.setNode({
        id: 'root',
        type: 'Tabs',
        properties: {
          tabs: [
            { title: 'One', child: 'c1' },
            { title: 'Two', child: 'c2' },
          ],
        },
      });
      f.setNode({ id: 'c1', type: 'Text', properties: { text: 'First panel' } });
      f.setNode({ id: 'c2', type: 'Text', properties: { text: 'Second panel' } });
    });
    // Only the active tab's child subtree is mounted.
    expect(screen.getByText('First panel')).toBeTruthy();
    expect(screen.queryByText('Second panel')).toBeNull();
    await act(async () => {
      fireEvent.press(screen.getByRole('tab', { name: 'Two' }));
    });
    expect(screen.getByText('Second panel')).toBeTruthy();
    expect(screen.queryByText('First panel')).toBeNull();
  });

  it('reacts to a bound tab title changing', async () => {
    const { fake, screen } = await withSurface((f) => {
      f.setNode({
        id: 'root',
        type: 'Tabs',
        properties: { tabs: [{ title: { path: '/t0' }, child: 'c1' }] },
      });
      f.setNode({ id: 'c1', type: 'Text', properties: { text: 'Panel' } });
    });
    await act(async () => {
      fake.writeValue('/t0', 'Home');
    });
    expect(screen.getByRole('tab', { name: 'Home' })).toBeTruthy();
  });

  it('renders nothing for an empty tabs array', async () => {
    const { screen } = await withSurface((f) => {
      f.setNode({ id: 'root', type: 'Tabs', properties: { tabs: [] } });
    });
    expect(screen.queryByRole('tab')).toBeNull();
  });
});

describe('containers catalog — Modal', () => {
  it('hides content until the trigger opens it, and a backdrop press closes it', async () => {
    const { screen } = await withSurface((f) => {
      f.setNode({
        id: 'root',
        type: 'Modal',
        properties: { trigger: 'trg', content: 'cnt' },
      });
      f.setNode({ id: 'trg', type: 'Text', properties: { text: 'Open' } });
      f.setNode({ id: 'cnt', type: 'Text', properties: { text: 'Inside the modal' } });
    });
    expect(screen.getByText('Open')).toBeTruthy();
    expect(screen.queryByText('Inside the modal')).toBeNull();
    await act(async () => {
      fireEvent.press(screen.getByRole('button'));
    });
    expect(screen.getByText('Inside the modal')).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Close'));
    });
    expect(screen.queryByText('Inside the modal')).toBeNull();
  });

  it('tolerates missing trigger/content without crashing', async () => {
    const { screen } = await withSurface((f) => {
      f.setNode({ id: 'root', type: 'Modal', properties: {} });
    });
    expect(screen.toJSON()).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('containers catalog — Video (stub)', () => {
  it('renders a labeled placeholder showing the source url', async () => {
    const { screen } = await withSurface((f) => {
      f.setNode({
        id: 'root',
        type: 'Video',
        properties: { url: 'https://cdn.example/clip.mp4' },
      });
    });
    expect(screen.getByText('Video')).toBeTruthy();
    expect(screen.getByText('https://cdn.example/clip.mp4')).toBeTruthy();
    expect(screen.getByLabelText('Video: https://cdn.example/clip.mp4')).toBeTruthy();
  });

  it('reacts to a bound url changing', async () => {
    const { fake, screen } = await withSurface((f) => {
      f.setNode({ id: 'root', type: 'Video', properties: { url: { path: '/src' } } });
    });
    await act(async () => {
      fake.writeValue('/src', 'movie.mp4');
    });
    expect(screen.getByText('movie.mp4')).toBeTruthy();
  });
});

describe('containers catalog — AudioPlayer (stub)', () => {
  it('renders a labeled placeholder showing the description', async () => {
    const { screen } = await withSurface((f) => {
      f.setNode({
        id: 'root',
        type: 'AudioPlayer',
        properties: { url: 'a.mp3', description: 'Episode 1: Intro' },
      });
    });
    expect(screen.getByText('Audio')).toBeTruthy();
    expect(screen.getByText('Episode 1: Intro')).toBeTruthy();
    expect(screen.getByLabelText('Audio: Episode 1: Intro')).toBeTruthy();
  });

  it('falls back to the url when no description is given', async () => {
    const { screen } = await withSurface((f) => {
      f.setNode({ id: 'root', type: 'AudioPlayer', properties: { url: 'podcast.mp3' } });
    });
    expect(screen.getByText('podcast.mp3')).toBeTruthy();
    expect(screen.getByLabelText('Audio: podcast.mp3')).toBeTruthy();
  });
});
