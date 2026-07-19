import type { ProtocolEngine } from '../engine/types';
import {
  feedBatch,
  pumpStream,
  type Transport,
  type TransportHandle,
  type TransportOptions,
  type TransportSource,
} from './types';

/**
 * Server-Sent Events framing: `data:` field lines are assembled per event (joined with
 * newlines), an event is dispatched on a blank line, and comments (`:` lines) plus other
 * fields (`event`/`id`/`retry`) are ignored. Each event's data is one A2UI message/batch.
 * Lines and payloads buffer across chunk boundaries; malformed data is reported and skipped.
 */
export function sseTransport(source: TransportSource, options: TransportOptions = {}): Transport {
  return {
    start(engine: ProtocolEngine): TransportHandle {
      const controller = new AbortController();
      let buffer = '';
      let data: string[] = [];

      const dispatch = () => {
        if (data.length === 0) return;
        const payload = data.join('\n');
        data = [];
        let value: unknown;
        try {
          value = JSON.parse(payload);
        } catch (cause) {
          options.onError?.({ message: 'malformed SSE data skipped', raw: payload, cause });
          return;
        }
        feedBatch(engine, value);
      };

      const feedLine = (raw: string) => {
        const line = raw.endsWith('\r') ? raw.slice(0, -1) : raw;
        if (line === '') {
          dispatch(); // blank line terminates the current event
          return;
        }
        if (line.startsWith(':')) return; // comment
        const colon = line.indexOf(':');
        const field = colon === -1 ? line : line.slice(0, colon);
        let value = colon === -1 ? '' : line.slice(colon + 1);
        if (value.startsWith(' ')) value = value.slice(1);
        if (field === 'data') data.push(value);
      };

      const done = pumpStream(source, controller.signal, {
        onText: (chunk) => {
          buffer += chunk;
          let nl = buffer.indexOf('\n');
          while (nl !== -1) {
            feedLine(buffer.slice(0, nl));
            buffer = buffer.slice(nl + 1);
            nl = buffer.indexOf('\n');
          }
        },
        onFlush: () => {
          // Lenient EOF: dispatch a final event even without a trailing blank line (a
          // streaming agent may close right after the last data line). Strict SSE discards
          // an unterminated event; here the stream has ended, so emit what we have.
          if (buffer) {
            feedLine(buffer);
            buffer = '';
          }
          dispatch();
        },
        onError: options.onError,
      });

      return { done, close: () => controller.abort() };
    },
  };
}
