import type { ProtocolEngine } from 'react-native-a2ui/engine-types';
import { describe, expect, it } from 'vitest';
import type { LLMClient } from './clients/types';
import { streamA2UI } from './stream';

/** A no-op ProtocolEngine that records the batches fed to `processMessages`. */
function recordingEngine(batches: unknown[][]): ProtocolEngine {
  return {
    processMessages: (batch) => {
      batches.push(batch);
    },
    getSurface: () => undefined,
    subscribeSurfaces: () => () => {},
    onClientMessage: () => () => {},
    getClientCapabilities: () => ({}),
  } satisfies ProtocolEngine;
}

describe('streamA2UI', () => {
  it('extracts A2UI messages from the client stream and feeds them to the engine', async () => {
    const batches: unknown[][] = [];
    const client: LLMClient = async function* () {
      yield 'Sure!\n```json\n{"version":"v0.9","createSurface":';
      yield '{"surfaceId":"s","catalogId":"basic"}}\n```\n';
      yield '{"version":"v0.9","updateComponents":{"surfaceId":"s","components":[]}}';
    };

    await streamA2UI({ client, prompt: 'book a table', engine: recordingEngine(batches) });

    expect(batches).toEqual([
      [{ version: 'v0.9', createSurface: { surfaceId: 's', catalogId: 'basic' } }],
      [{ version: 'v0.9', updateComponents: { surfaceId: 's', components: [] } }],
    ]);
  });

  it('builds a system prompt from a catalog and passes it to the client', async () => {
    let seenSystem: string | undefined;
    const client: LLMClient = async function* (request) {
      seenSystem = request.system;
      yield* []; // capture the system prompt, emit no tokens
    };

    await streamA2UI({
      client,
      prompt: 'hi',
      engine: recordingEngine([]),
      catalog: [
        { name: 'Text', schema: { properties: { text: { type: 'string' } }, required: ['text'] } },
      ],
    });

    expect(seenSystem).toContain('### Text');
    expect(seenSystem).toContain('A2UI');
  });
});
