import { describe, expect, it } from 'vitest';
import { A2uiEngine } from '../src/engine/a2ui/A2uiEngine';
import { A2UI_DATA_PART_MIME, a2aTransport } from '../src/transports/a2a';
import { declaredSurfaceIds, loadExampleStreams, replay, type Stream } from './helpers';

// M2-T2 exit criterion: the A2A envelope must be transparent. Every vendored basic-catalog
// example stream, wrapped into an A2A DataPart and replayed through a2aTransport, must build
// trees identical to a direct (non-enveloped) replay through the same engine. This is the
// anti-regression proof that the envelope only reframes — it never drops, reorders, or
// corrupts a message.

const enc = new TextEncoder();

/** Every component id declared across a stream's updateComponents messages. */
function componentIds(stream: Stream): string[] {
  const ids = new Set<string>();
  for (const msg of stream.messages) {
    const update = msg.updateComponents as { components?: { id?: string }[] } | undefined;
    for (const c of update?.components ?? []) if (c.id) ids.add(c.id);
  }
  return [...ids];
}

/** Replay a whole stream as a single A2A DataPart batch through a2aTransport. */
async function replayEnveloped(stream: Stream): Promise<A2uiEngine> {
  const engine = new A2uiEngine();
  const envelope = {
    role: 'user',
    parts: [{ kind: 'data', metadata: { mimeType: A2UI_DATA_PART_MIME }, data: stream.messages }],
  };
  const source = new ReadableStream<Uint8Array>({
    start(c) {
      c.enqueue(enc.encode(`${JSON.stringify(envelope)}\n`));
      c.close();
    },
  });
  await a2aTransport(source).start(engine).done;
  return engine;
}

const basicStreams = loadExampleStreams().filter(({ rel }) => rel.includes('/basic/examples/'));

describe('A2A envelope transparency: enveloped replay builds trees identical to direct replay', () => {
  it.each(basicStreams)('$rel is identical through the A2A envelope', async ({ stream }) => {
    const direct = replay(stream).engine;
    const enveloped = await replayEnveloped(stream);

    for (const surfaceId of declaredSurfaceIds(stream)) {
      const directSurface = direct.getSurface(surfaceId);
      const envelopedSurface = enveloped.getSurface(surfaceId);
      expect(envelopedSurface, `surface ${surfaceId} missing through the envelope`).toBeDefined();
      for (const id of componentIds(stream)) {
        expect(envelopedSurface?.getNode(id)).toEqual(directSurface?.getNode(id));
      }
    }
  });
});
