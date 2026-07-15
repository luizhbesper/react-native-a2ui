/// <reference types="vite/client" />
import { A2uiEngine } from '../src/engine/a2ui/A2uiEngine';
import type { ClientMessage } from '../src/engine/types';

// Replay machinery for the M0-T4 conformance harness (runner.test.ts): feed each
// vendored official example stream through A2uiEngine and observe the result.

/** One official example stream: a named server→client message list. */
export interface Stream {
  name: string;
  description: string;
  messages: Record<string, unknown>[];
}

// Loaded via import.meta.glob `?raw` (not node:fs) to match fixtures.test.ts and
// keep node types out of the RN library's tsconfig.
const rawStreams = import.meta.glob('./fixtures/v0_9/**/examples/*.json', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/** Every vendored example stream, parsed, sorted by fixture path. */
export function loadExampleStreams(): { rel: string; stream: Stream }[] {
  return Object.entries(rawStreams)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([rel, content]) => ({ rel, stream: JSON.parse(content) as Stream }));
}

/** The surface ids a stream declares via its createSurface operations. */
export function declaredSurfaceIds(stream: Stream): string[] {
  const ids: string[] = [];
  for (const msg of stream.messages) {
    const create = msg.createSurface as { surfaceId?: string } | undefined;
    if (create?.surfaceId) ids.push(create.surfaceId);
  }
  return ids;
}

/** Replay a whole stream through a fresh engine, capturing outbound client errors. */
export function replay(stream: Stream): { engine: A2uiEngine; errors: ClientMessage[] } {
  const engine = new A2uiEngine();
  const errors: ClientMessage[] = [];
  engine.onClientMessage((m) => {
    if (m.type === 'error') errors.push(m);
  });
  engine.processMessages(stream.messages);
  return { engine, errors };
}

/**
 * Replay a stream while observing data-model pointers, returning the last value seen
 * per pointer. web_core's subscribe does not emit the current value on subscribe, so
 * probes attach the moment the surface exists — before its data updates — and record
 * each subsequent change.
 */
export function replayProbing(
  stream: Stream,
  surfaceId: string,
  pointers: string[],
): { engine: A2uiEngine; errors: ClientMessage[]; values: Map<string, unknown> } {
  const engine = new A2uiEngine();
  const errors: ClientMessage[] = [];
  engine.onClientMessage((m) => {
    if (m.type === 'error') errors.push(m);
  });
  const values = new Map<string, unknown>();
  let subscribed = false;
  for (const msg of stream.messages) {
    engine.processMessages([msg]);
    if (subscribed) continue;
    const handle = engine.getSurface(surfaceId);
    if (handle) {
      for (const p of pointers) handle.subscribeValue(p, (v) => values.set(p, v));
      subscribed = true;
    }
  }
  return { engine, errors, values };
}
