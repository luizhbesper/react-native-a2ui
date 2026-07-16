import type { ClientCapabilities, ClientMessage, ProtocolEngine } from '../engine/types';
import {
  feedBatch,
  pumpStream,
  type Transport,
  type TransportHandle,
  type TransportOptions,
  type TransportSource,
} from './types';

// A2A envelope transport: A2UI batches ride inside A2A message `parts`. A server→client
// DataPart tagged with the A2UI MIME carries a batch of A2UI messages; outbound client
// messages are wrapped back into an A2A message and POSTed with the extension activation
// header + capabilities. Concrete values are the A2UI A2A extension (docs/SPEC.md §2.4).
// Per ADR-0005 this depends on the neutral ProtocolEngine only — no web_core, no RN.

/** The A2UI A2A extension URI, sent as the `X-A2A-Extensions` activation header value. */
export const A2UI_A2A_EXTENSION_URI = 'https://a2ui.org/a2a-extension/a2ui/v0.9';

/** The MIME type marking an A2A DataPart's `data` as an A2UI message batch. */
export const A2UI_DATA_PART_MIME = 'application/json+a2ui';

/** Options for the A2A envelope transport. */
export interface A2ATransportOptions extends TransportOptions {
  /** Where outbound client messages (actions/errors) are POSTed as A2A messages. Omit for inbound-only. */
  readonly endpoint?: string;
  /** Injected fetch (RN/tests). Defaults to the platform `fetch`. */
  readonly fetch?: typeof fetch;
  /** Receives non-A2UI parts (text/file/other DataParts), surfaced rather than fed to the engine. */
  readonly onPart?: (part: unknown) => void;
}

/** An A2A message carries an ordered list of parts; only A2UI DataParts are consumed. */
function partsOf(message: unknown): unknown[] {
  if (
    message &&
    typeof message === 'object' &&
    Array.isArray((message as { parts?: unknown }).parts)
  ) {
    return (message as { parts: unknown[] }).parts;
  }
  return [message]; // tolerate a bare part framed on its own
}

/** True when a part is an A2UI DataPart (its `data` is an A2UI message batch). The wire is untrusted. */
function a2uiBatchOf(part: unknown): unknown[] | undefined {
  if (!part || typeof part !== 'object') return undefined;
  const p = part as { metadata?: { mimeType?: unknown }; data?: unknown };
  if (p.metadata?.mimeType !== A2UI_DATA_PART_MIME) return undefined;
  return Array.isArray(p.data) ? p.data : [p.data];
}

/** Map a neutral ClientMessage to the A2UI client-to-server wire shape (client_to_server.json). */
function toWireClientMessage(msg: ClientMessage): Record<string, unknown> {
  if (msg.type === 'action') {
    return {
      version: 'v0.9',
      action: {
        name: msg.name,
        surfaceId: msg.surfaceId,
        sourceComponentId: msg.sourceComponentId,
        timestamp: msg.timestamp,
        context: msg.context,
      },
    };
  }
  return {
    version: 'v0.9',
    error: {
      code: msg.code,
      message: msg.message,
      ...(msg.surfaceId ? { surfaceId: msg.surfaceId } : {}),
    },
  };
}

/** Wrap and POST one outbound client message as an A2A message, with the extension header + capabilities. */
async function sendA2A(
  options: A2ATransportOptions,
  capabilities: ClientCapabilities,
  msg: ClientMessage,
): Promise<void> {
  const doFetch = options.fetch ?? fetch;
  const body = {
    kind: 'message',
    role: 'user',
    parts: [
      {
        kind: 'data',
        metadata: { mimeType: A2UI_DATA_PART_MIME },
        data: [toWireClientMessage(msg)],
      },
    ],
    metadata: { a2uiClientCapabilities: capabilities },
  };
  try {
    await doFetch(options.endpoint as string, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-A2A-Extensions': A2UI_A2A_EXTENSION_URI },
      body: JSON.stringify(body),
    });
  } catch (cause) {
    options.onError?.({ message: 'A2A outbound request failed', cause });
  }
}

/**
 * A2A envelope transport. Reads JSONL-framed A2A messages from `source`, unwrapping each
 * `application/json+a2ui` DataPart into an A2UI batch fed to the engine (non-A2UI parts go
 * to `onPart`); and, when `endpoint` is set, wraps outbound client messages back into A2A
 * messages POSTed with the extension header and `a2uiClientCapabilities`.
 */
export function a2aTransport(
  source: TransportSource,
  options: A2ATransportOptions = {},
): Transport {
  return {
    start(engine: ProtocolEngine): TransportHandle {
      const controller = new AbortController();

      // Outbound stays live until close() (bidirectional: the user can act after the server's
      // stream ends), so it is not torn down when `done` resolves.
      const capabilities = engine.getClientCapabilities();
      const unsubscribe = options.endpoint
        ? engine.onClientMessage((msg) => {
            void sendA2A(options, capabilities, msg);
          })
        : undefined;

      // Inbound: JSONL line framing (one A2A message per line). ponytail: mirrors jsonl.ts's
      // 6-line framer; extract a shared line-framer only if a third stream consumer appears.
      // ponytail: JSONL framing (not A2A's SSE/JSON-RPC transport) — a full A2A client is out
      // of scope (M2-T2); this transport is the envelope wrap/unwrap only.
      let buffer = '';
      const consume = (line: string) => {
        const text = line.trim();
        if (!text) return;
        let message: unknown;
        try {
          message = JSON.parse(text);
        } catch (cause) {
          options.onError?.({ message: 'malformed A2A frame skipped', raw: text, cause });
          return;
        }
        for (const part of partsOf(message)) {
          const batch = a2uiBatchOf(part);
          if (batch) feedBatch(engine, batch);
          else options.onPart?.(part);
        }
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

      return {
        done,
        close: () => {
          unsubscribe?.();
          controller.abort();
        },
      };
    },
  };
}
