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
 * Newline-delimited JSON: one A2UI message (or a JSON array batch) per line. Lines are
 * buffered across chunk boundaries, so a single object split over reads reassembles; a
 * malformed line is reported via `onError` and skipped, and the stream continues.
 */
export function jsonlTransport(source: TransportSource, options: TransportOptions = {}): Transport {
  return {
    start(engine: ProtocolEngine): TransportHandle {
      const controller = new AbortController();
      let buffer = '';

      const consume = (line: string) => {
        const text = line.trim();
        if (!text) return;
        let value: unknown;
        try {
          value = JSON.parse(text);
        } catch (cause) {
          options.onError?.({ message: 'malformed JSONL line skipped', raw: text, cause });
          return;
        }
        feedBatch(engine, value);
      };

      const done = pumpStream(source, controller.signal, {
        onText: (chunk) => {
          buffer += chunk;
          let nl = buffer.indexOf('\n');
          while (nl !== -1) {
            consume(buffer.slice(0, nl));
            buffer = buffer.slice(nl + 1);
            nl = buffer.indexOf('\n');
          }
        },
        onFlush: () => {
          consume(buffer);
          buffer = '';
        },
        onError: options.onError,
      });

      return { done, close: () => controller.abort() };
    },
  };
}
