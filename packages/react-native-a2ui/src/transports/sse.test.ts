import { describe, expect, it } from 'vitest';
import type { ProtocolEngine } from '../engine/types';
import { sseTransport } from './sse';
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

describe('sseTransport', () => {
  it('parses SSE event framing, ignoring comments and non-data fields', async () => {
    const { engine, batches } = fakeEngine();
    const stream = streamOf([
      ': a heartbeat comment\n',
      'event: message\n',
      'data: {"version":"v0.9","a":1}\n',
      '\n',
      'data: {"version":"v0.9",\n', // event data assembled across multiple data: lines
      'data: "b":2}\n',
      '\n',
    ]);

    await sseTransport(stream).start(engine).done;

    expect(batches).toEqual([[{ version: 'v0.9', a: 1 }], [{ version: 'v0.9', b: 2 }]]);
  });

  it('reassembles an SSE data payload split across chunk boundaries', async () => {
    const { engine, batches } = fakeEngine();
    const evt = 'data: {"version":"v0.9","x":1}\n\n';
    const stream = streamOf([enc.encode(evt.slice(0, 15)), enc.encode(evt.slice(15))]);

    await sseTransport(stream).start(engine).done;

    expect(batches).toEqual([[{ version: 'v0.9', x: 1 }]]);
  });

  it('skips and reports malformed SSE data while continuing', async () => {
    const { engine, batches } = fakeEngine();
    const errors: TransportError[] = [];
    const stream = streamOf(['data: not json\n\n', 'data: {"version":"v0.9","ok":1}\n\n']);

    await sseTransport(stream, { onError: (e) => errors.push(e) }).start(engine).done;

    expect(batches).toEqual([[{ version: 'v0.9', ok: 1 }]]);
    expect(errors).toHaveLength(1);
  });
});
