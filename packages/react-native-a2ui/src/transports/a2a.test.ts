import { describe, expect, it } from 'vitest';
import type { ClientMessage, ProtocolEngine } from '../engine/types';
import { A2UI_A2A_EXTENSION_URI, A2UI_DATA_PART_MIME, a2aTransport } from './a2a';
import type { TransportSource } from './types';

/** A spy ProtocolEngine: captures inbound batches, exposes capabilities, and lets a test emit outbound. */
function fakeEngine(capabilities: Record<string, unknown> = {}) {
  const batches: unknown[][] = [];
  let outbound: ((msg: ClientMessage) => void) | undefined;
  const engine: ProtocolEngine = {
    processMessages: (b) => {
      batches.push(b);
    },
    getSurface: () => undefined,
    subscribeSurfaces: () => () => {},
    onClientMessage: (cb) => {
      outbound = cb;
      return () => {
        outbound = undefined;
      };
    },
    getClientCapabilities: () => capabilities,
  };
  return { engine, batches, emit: (msg: ClientMessage) => outbound?.(msg) };
}

/** A ReadableStream that emits the given chunks then closes. */
function streamOf(chunks: Array<string | Uint8Array>): TransportSource {
  return new ReadableStream({
    start(c) {
      for (const chunk of chunks) c.enqueue(chunk);
      c.close();
    },
  });
}

/** One A2A message carrying an A2UI DataPart batch, JSONL-framed. */
const dataPartLine = (data: unknown[]): string =>
  `${JSON.stringify({
    role: 'user',
    parts: [{ kind: 'data', metadata: { mimeType: A2UI_DATA_PART_MIME }, data }],
  })}\n`;

const tick = () => new Promise((r) => setTimeout(r, 10));

describe('a2aTransport inbound', () => {
  it('unwraps an application/json+a2ui DataPart batch and feeds it to the engine', async () => {
    const { engine, batches } = fakeEngine();
    const msgs = [
      { version: 'v0.9', createSurface: { surfaceId: 's1' } },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 's1',
          components: [{ id: 'root', component: 'Text', text: 'hi' }],
        },
      },
    ];

    await a2aTransport(streamOf([dataPartLine(msgs)])).start(engine).done;

    expect(batches).toEqual([msgs]);
  });

  it('passes non-A2UI parts through to onPart and never feeds them to the engine', async () => {
    const { engine, batches } = fakeEngine();
    const surfaced: unknown[] = [];
    const a2aMessage = {
      role: 'user',
      parts: [
        { kind: 'text', text: 'a human-readable summary' },
        {
          kind: 'data',
          metadata: { mimeType: A2UI_DATA_PART_MIME },
          data: [{ version: 'v0.9', createSurface: { surfaceId: 's1' } }],
        },
        { kind: 'data', metadata: { mimeType: 'application/json' }, data: { unrelated: true } },
      ],
    };

    await a2aTransport(streamOf([`${JSON.stringify(a2aMessage)}\n`]), {
      onPart: (p) => surfaced.push(p),
    }).start(engine).done;

    // Only the a2ui DataPart is consumed…
    expect(batches).toEqual([[{ version: 'v0.9', createSurface: { surfaceId: 's1' } }]]);
    // …the other parts are surfaced verbatim, not dropped or corrupted.
    expect(surfaced).toEqual([
      { kind: 'text', text: 'a human-readable summary' },
      { kind: 'data', metadata: { mimeType: 'application/json' }, data: { unrelated: true } },
    ]);
  });
});

describe('a2aTransport outbound', () => {
  const action: ClientMessage = {
    type: 'action',
    name: 'button_clicked',
    surfaceId: 's1',
    sourceComponentId: 'action_button',
    timestamp: '2026-07-16T00:00:00.000Z',
    context: {},
  };

  it('sends the X-A2A-Extensions activation header on outbound requests', async () => {
    const { engine, emit } = fakeEngine();
    const calls: Array<{ init?: RequestInit }> = [];
    const fetch: typeof globalThis.fetch = async (_input, init) => {
      calls.push({ init });
      return new Response(null, { status: 200 });
    };

    const handle = a2aTransport(streamOf([]), {
      endpoint: 'https://agent.example/a2ui',
      fetch,
    }).start(engine);
    emit(action);
    await tick();

    const headers = calls[0]?.init?.headers as Record<string, string> | undefined;
    expect(headers?.['X-A2A-Extensions']).toBe(A2UI_A2A_EXTENSION_URI);
    handle.close();
  });

  it('injects a2uiClientCapabilities and wraps the action in an A2UI DataPart', async () => {
    const capabilities = { 'v0.9': { supportedCatalogIds: ['basic'] } };
    const { engine, emit } = fakeEngine(capabilities);
    const bodies: unknown[] = [];
    const fetch: typeof globalThis.fetch = async (_input, init) => {
      bodies.push(JSON.parse(init?.body as string));
      return new Response(null, { status: 200 });
    };

    const handle = a2aTransport(streamOf([]), {
      endpoint: 'https://agent.example/a2ui',
      fetch,
    }).start(engine);
    emit(action);
    await tick();

    const body = bodies[0] as {
      metadata: { a2uiClientCapabilities: unknown };
      parts: Array<{ metadata: { mimeType: string }; data: unknown[] }>;
    };
    expect(body.metadata.a2uiClientCapabilities).toEqual(capabilities);
    expect(body.parts[0]?.metadata.mimeType).toBe(A2UI_DATA_PART_MIME);
    // The neutral ClientMessage is re-serialized to the A2UI client-to-server wire shape.
    expect(body.parts[0]?.data[0]).toEqual({
      version: 'v0.9',
      action: {
        name: 'button_clicked',
        surfaceId: 's1',
        sourceComponentId: 'action_button',
        timestamp: '2026-07-16T00:00:00.000Z',
        context: {},
      },
    });
    handle.close();
  });
});
