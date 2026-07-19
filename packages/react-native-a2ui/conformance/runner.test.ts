import { describe, expect, it } from 'vitest';
import {
  declaredSurfaceIds,
  loadExampleStreams,
  replay,
  replayProbing,
  type Stream,
} from './helpers';

// M0-T4 conformance harness: the harness IS the test. Every vendored official example
// stream is replayed through the A2uiEngine adapter (no rendering). Each basic-catalog
// stream gets the structural invariant; the core examples additionally get explicit
// tree/data-model assertions. Never weaken an assertion to pass — fix the adapter or
// file the upstream bug.
//
// Scope: basic catalog only. The 7 minimal-catalog streams are out of scope for M0 —
// A2uiEngine registers only the basic catalog (M0-T3) and web_core ships no minimal
// catalog implementation (minimal's `capitalize` function has no impl to reuse), so
// their createSurface is rejected by design. A future task can add minimal support.

const streams = loadExampleStreams();
const basicStreams = streams.filter(({ rel }) => rel.includes('/basic/examples/'));
const minimalStreams = streams.filter(({ rel }) => rel.includes('/minimal/examples/'));

const byName = (suffix: string): Stream => {
  const found = streams.find(({ rel }) => rel.endsWith(suffix));
  if (!found) throw new Error(`fixture not found: ${suffix}`);
  return found.stream;
};

describe('conformance: every basic-catalog example stream builds cleanly', () => {
  it('vendored the full set of example streams, split basic/minimal', () => {
    expect(streams.length).toBe(50);
    expect(basicStreams.length).toBe(43);
    // Documented out-of-scope boundary (see file header): not replayed for M0.
    expect(minimalStreams.length).toBe(7);
  });

  it.each(basicStreams)('$rel replays with no errors and builds every surface root', ({
    stream,
  }) => {
    const { engine, errors } = replay(stream);
    expect(errors).toEqual([]);
    const ids = declaredSurfaceIds(stream);
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) {
      const handle = engine.getSurface(id);
      expect(handle, `surface ${id} missing`).toBeDefined();
      expect(handle?.getNode('root'), `surface ${id} has no root`).toBeDefined();
    }
  });
});

describe('conformance: core example explicit assertions', () => {
  it('00_simple-text renders a Text root with the streamed text', () => {
    const { engine } = replay(byName('00_simple-text.json'));
    const root = engine.getSurface('gallery-simple-text')?.getNode('root');
    expect(root?.type).toBe('Text');
    expect(root?.properties.text).toBe('Hello, Minimal Catalog!');
  });

  it('00_row-layout renders a Row root over two Text children', () => {
    const { engine } = replay(byName('00_row-layout.json'));
    const surface = engine.getSurface('gallery-row-layout');
    expect(surface?.getNode('root')?.type).toBe('Row');
    expect(surface?.getNode('left_text')?.type).toBe('Text');
    expect(surface?.getNode('right_text')?.type).toBe('Text');
  });

  it('00_interactive-button renders a Button in the tree', () => {
    const { engine } = replay(byName('00_interactive-button.json'));
    expect(engine.getSurface('gallery-interactive-button')?.getNode('action_button')?.type).toBe(
      'Button',
    );
  });

  it('00_simple-login-form renders a Column with both TextField inputs', () => {
    const { engine } = replay(byName('00_simple-login-form.json'));
    const surface = engine.getSurface('gallery-simple-login-form');
    expect(surface?.getNode('root')?.type).toBe('Column');
    expect(surface?.getNode('username_field')?.type).toBe('TextField');
    expect(surface?.getNode('password_field')?.type).toBe('TextField');
  });

  it('00_incremental binds a data-model list and the late-appended row', () => {
    const { engine, values } = replayProbing(byName('00_incremental.json'), 'gallery-incremental', [
      '/restaurants/0/title',
      '/restaurants/3/title',
    ]);
    expect(values.get('/restaurants/0/title')).toBe('The Golden Fork');
    expect(values.get('/restaurants/3/title')).toBe('Spice Route');
    expect(engine.getSurface('gallery-incremental')?.getNode('rc_button')?.type).toBe('Button');
  });
});
