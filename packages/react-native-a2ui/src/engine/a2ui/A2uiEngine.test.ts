import { describe, expect, it } from 'vitest';
import type { ClientMessage } from '../types';
import { A2uiEngine } from './A2uiEngine';

// Registered basic-catalog id — must equal createSurface.catalogId.
// Source: conformance/fixtures/v0_9/catalogs/basic/catalog.json (`catalogId`).
const CATALOG_ID = 'https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json';

const createSurface = (surfaceId: string) => ({
  version: 'v0.9',
  createSurface: { surfaceId, catalogId: CATALOG_ID },
});
const updateComponents = (surfaceId: string, components: unknown[]) => ({
  version: 'v0.9',
  updateComponents: { surfaceId, components },
});
const updateDataModel = (surfaceId: string, path: string, value: unknown) => ({
  version: 'v0.9',
  updateDataModel: { surfaceId, path, value },
});
const deleteSurface = (surfaceId: string) => ({
  version: 'v0.9',
  deleteSurface: { surfaceId },
});

describe('A2uiEngine', () => {
  it('builds the component tree from a createSurface + updateComponents batch', () => {
    const engine = new A2uiEngine();
    engine.processMessages([createSurface('s1')]);

    let rootReady = false;
    engine.getSurface('s1')?.subscribeTree((ready) => {
      rootReady = ready;
    });

    engine.processMessages([
      updateComponents('s1', [{ id: 'root', component: 'Text', text: 'Hello' }]),
    ]);

    const root = engine.getSurface('s1')?.getNode('root');
    expect(root?.id).toBe('root');
    expect(root?.type).toBe('Text');
    expect(root?.properties).toMatchObject({ text: 'Hello' });
    expect(rootReady).toBe(true);
  });

  it('fires a value subscription when the data model is updated', () => {
    const engine = new A2uiEngine();
    engine.processMessages([createSurface('s1')]);

    const seen: unknown[] = [];
    engine.getSurface('s1')?.subscribeValue('/count', (v) => {
      seen.push(v);
    });

    engine.processMessages([updateDataModel('s1', '/count', 5)]);

    expect(seen).toContain(5);
  });

  it('processes the rest of a batch when one message is malformed and reports the error', () => {
    const engine = new A2uiEngine();
    const errors: ClientMessage[] = [];
    engine.onClientMessage((m) => {
      if (m.type === 'error') errors.push(m);
    });

    engine.processMessages([
      createSurface('s1'),
      { not: 'a valid message' },
      updateComponents('s1', [{ id: 'root', component: 'Text', text: 'ok' }]),
    ]);

    // The two valid messages still applied.
    expect(engine.getSurface('s1')?.getNode('root')?.type).toBe('Text');
    // The malformed one was reported, not thrown.
    expect(errors).toHaveLength(1);
  });

  it('does not throw when a message targets an unknown surface', () => {
    const engine = new A2uiEngine();

    expect(() => {
      engine.processMessages([
        updateComponents('ghost', [{ id: 'root', component: 'Text', text: 'x' }]),
        updateDataModel('ghost', '/x', 1),
      ]);
    }).not.toThrow();

    // Engine is still usable afterwards.
    engine.processMessages([createSurface('s1')]);
    expect(engine.getSurface('s1')).toBeDefined();
  });

  it('removes the surface and updates surface subscribers on deleteSurface', () => {
    const engine = new A2uiEngine();
    let ids: string[] = [];
    engine.subscribeSurfaces((next) => {
      ids = next;
    });

    engine.processMessages([createSurface('s1')]);
    expect(ids).toContain('s1');
    expect(engine.getSurface('s1')).toBeDefined();

    engine.processMessages([deleteSurface('s1')]);
    expect(engine.getSurface('s1')).toBeUndefined();
    expect(ids).not.toContain('s1');
  });

  it('emits an outbound action message when an action is dispatched', () => {
    const engine = new A2uiEngine();
    engine.processMessages([createSurface('s1')]);

    const outbound: ClientMessage[] = [];
    engine.onClientMessage((m) => {
      outbound.push(m);
    });

    engine.getSurface('s1')?.dispatchAction('submit', 'root', { foo: 'bar' });

    expect(outbound).toHaveLength(1);
    expect(outbound[0]).toMatchObject({
      type: 'action',
      name: 'submit',
      surfaceId: 's1',
      sourceComponentId: 'root',
    });
  });
});
