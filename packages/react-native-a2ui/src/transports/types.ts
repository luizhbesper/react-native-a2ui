// Transports read a server→client byte/text stream and feed decoded A2UI message
// batches into any ProtocolEngine. Per the import-direction table (ADR-0005) they depend
// on the neutral engine interface only — no web_core, no React/RN — so this module stays
// Vitest-loadable pure TS running on platform globals (ReadableStream/TextDecoder/
// AbortController) that RN/Hermes provide and tests mock.
//
// Scope: inbound framing/parsing + clean abort. Reconnection, backoff, retry, and the
// outbound/capabilities (A2A envelope) path are out of scope here — see M2-T2.

import type { ProtocolEngine } from '../engine/types';

/** A recoverable transport failure: a malformed frame skipped, or a terminal read error. */
export interface TransportError {
  /** Human-readable reason. */
  readonly message: string;
  /** The raw frame text that failed to parse, when the failure was a bad frame. */
  readonly raw?: string;
  /** The underlying thrown value. */
  readonly cause?: unknown;
}

/** Options shared by every transport. */
export interface TransportOptions {
  /** Reports a skipped malformed frame (stream continues) or a terminal read error. */
  readonly onError?: (error: TransportError) => void;
}

/** A running transport, feeding the engine in the background until the stream ends or `close()`. */
export interface TransportHandle {
  /** Resolves when the stream ends or after `close()`. Never rejects. */
  readonly done: Promise<void>;
  /** Aborts the stream; no further engine calls happen after this. */
  close(): void;
}

/** A source stream of A2UI wire bytes (or already-decoded text). */
export type TransportSource = ReadableStream<Uint8Array | string>;

/**
 * A stream transport. `start` begins reading its source and feeding decoded A2UI batches
 * into `engine.processMessages`, returning a handle to await or close. JSONL and SSE are
 * the two implementations (jsonl.ts / sse.ts); the interface is generic over any framing.
 */
export interface Transport {
  start(engine: ProtocolEngine): TransportHandle;
}

/** Feeds one parsed wire value into the engine (a JSON array is a batch; anything else is one message). */
export function feedBatch(engine: ProtocolEngine, value: unknown): void {
  engine.processMessages(Array.isArray(value) ? value : [value]);
}

/** The shared per-chunk callbacks a framing transport plugs into `pumpStream`. */
export interface StreamHandlers {
  /** Decoded text for a chunk; the transport buffers and frames it. */
  onText(text: string): void;
  /** Stream ended normally — flush any buffered final frame. Not called after abort. */
  onFlush(): void;
  /** A terminal read failure (source errored while not aborting). */
  onError?(error: TransportError): void;
}

/**
 * Reads `source` to completion, decoding bytes to UTF-8 text (streaming, so multi-byte
 * runes split across chunks reassemble) and invoking `handlers` per chunk. Honors `signal`
 * (from `close()`): on abort it cancels the reader and skips the final flush so no engine
 * call happens after close. Never throws — a terminal read error routes to `onError`.
 */
export async function pumpStream(
  source: TransportSource,
  signal: AbortSignal,
  handlers: StreamHandlers,
): Promise<void> {
  const reader = source.getReader();
  const decoder = new TextDecoder();
  const onAbort = () => {
    void reader.cancel().catch(() => {});
  };
  signal.addEventListener('abort', onAbort);
  try {
    while (!signal.aborted) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value === undefined) continue;
      handlers.onText(typeof value === 'string' ? value : decoder.decode(value, { stream: true }));
    }
    if (!signal.aborted) {
      const tail = decoder.decode();
      if (tail) handlers.onText(tail);
      handlers.onFlush();
    }
  } catch (cause) {
    // A cancel triggered by abort resolves cleanly, so a throw while not aborted is a real
    // source failure; reconnection is out of scope (M2-T1), so surface it and stop.
    if (!signal.aborted) handlers.onError?.({ message: 'stream read failed', cause });
  } finally {
    signal.removeEventListener('abort', onAbort);
    try {
      reader.releaseLock();
    } catch {
      // Reader already released/cancelled — nothing to unlock.
    }
  }
}
