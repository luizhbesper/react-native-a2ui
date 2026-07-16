import { describe, expect, it } from 'vitest';
import type { ProtocolEngine } from '../engine/types';
import { jsonlTransport } from './jsonl';
import type { TransportError, TransportSource } from './types';

/** A spy ProtocolEngine capturing the batches a transport feeds in. */
function fakeEngine() {
  const batches: unknown[][] = [];
  const engine: ProtocolEngine = {
    processMessages: (b) => {
      batches.push(b);
    },
    getSurface: () => undefined,
    subscribeSurfaces: () => () => {},
    onClientMessage: () => () => {},
    getClientCapabilities: () => ({}),
  };
  return { engine, batches };
}

const enc = new TextEncoder();

/** A ReadableStream that emits the given chunks then closes. */
function streamOf(chunks: Array<string | Uint8Array>): TransportSource {
  return new ReadableStream({
    start(c) {
      for (const chunk of chunks) c.enqueue(chunk);
      c.close();
    },
  });
}

const tick = () => new Promise((r) => setTimeout(r, 10));

describe('jsonlTransport', () => {
  it('reassembles a JSON object split across chunk boundaries', async () => {
    const { engine, batches } = fakeEngine();
    const msg = '{"version":"v0.9","createSurface":{"surfaceId":"s1"}}\n';
    const stream = streamOf([enc.encode(msg.slice(0, 20)), enc.encode(msg.slice(20))]);

    await jsonlTransport(stream).start(engine).done;

    expect(batches).toEqual([[{ version: 'v0.9', createSurface: { surfaceId: 's1' } }]]);
  });

  it('skips and reports a malformed line while continuing the stream', async () => {
    const { engine, batches } = fakeEngine();
    const errors: TransportError[] = [];
    const stream = streamOf([
      '{"version":"v0.9","a":1}\n',
      'not json\n',
      '{"version":"v0.9","b":2}\n',
    ]);

    await jsonlTransport(stream, { onError: (e) => errors.push(e) }).start(engine).done;

    expect(batches).toEqual([[{ version: 'v0.9', a: 1 }], [{ version: 'v0.9', b: 2 }]]);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.raw).toBe('not json');
  });

  it('parses a final line that has no trailing newline', async () => {
    const { engine, batches } = fakeEngine();
    const stream = streamOf(['{"version":"v0.9","a":1}']);

    await jsonlTransport(stream).start(engine).done;

    expect(batches).toEqual([[{ version: 'v0.9', a: 1 }]]);
  });

  it('feeds a JSON array line as a single batch', async () => {
    const { engine, batches } = fakeEngine();
    const stream = streamOf(['[{"version":"v0.9","a":1},{"version":"v0.9","b":2}]\n']);

    await jsonlTransport(stream).start(engine).done;

    expect(batches).toEqual([
      [
        { version: 'v0.9', a: 1 },
        { version: 'v0.9', b: 2 },
      ],
    ]);
  });

  it('close() aborts cleanly with no further engine calls', async () => {
    const { engine, batches } = fakeEngine();
    let cancelled = false;
    const stream = new ReadableStream<string>({
      start(c) {
        c.enqueue('{"version":"v0.9","a":1}\n'); // no close(): stream stays open
      },
      cancel() {
        cancelled = true;
      },
    });

    const handle = jsonlTransport(stream).start(engine);
    await tick(); // let the first line process
    expect(batches).toHaveLength(1);

    handle.close();
    await handle.done; // resolves cleanly (does not reject) after abort
    expect(cancelled).toBe(true);

    await tick();
    expect(batches).toHaveLength(1); // nothing fed after close
  });
});
