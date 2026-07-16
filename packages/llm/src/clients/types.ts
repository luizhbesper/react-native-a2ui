/**
 * Shared client contract and SSE plumbing for the provider clients.
 *
 * A client is a thin factory over raw `fetch` — no provider SDKs — so it stays React Native /
 * Expo Go compatible and dependency-free. Each provider client (anthropic/gemini/openai)
 * implements `LLMClient` by POSTing to its documented streaming endpoint and yielding decoded
 * text tokens.
 */

/** A prompt to send: an optional system prompt and the user's request text. */
export interface PromptRequest {
  /** System prompt (e.g. the A2UI catalog prompt); omitted when not provided. */
  system?: string;
  /** The user's request. */
  prompt: string;
}

/** Streams plain-text output tokens for a prompt. */
export type LLMClient = (request: PromptRequest) => AsyncIterable<string>;

/**
 * Read a Server-Sent Events response body and yield each `data:` payload string (the JSON of one
 * event, or a sentinel such as `[DONE]`). Buffers across reads so an event split over network
 * chunks reassembles; other SSE fields (`event:`, `id:`, comments) are ignored.
 */
// ponytail: single-line `data:` payloads only — all three providers put one JSON object per
// `data:` line; add multi-line data concatenation if a provider ever needs it.
async function* sseData(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      for (let nl = buf.indexOf('\n'); nl !== -1; nl = buf.indexOf('\n')) {
        const line = buf.slice(0, nl).replace(/\r$/, '');
        buf = buf.slice(nl + 1);
        if (line.startsWith('data:')) {
          const payload = line.slice(5).trim();
          if (payload) yield payload;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/** POST a streaming request and yield its SSE `data:` payloads. Throws on a non-OK response. */
export async function* sseRequest(
  fetchImpl: typeof fetch,
  url: string,
  init: RequestInit,
): AsyncGenerator<string> {
  const res = await fetchImpl(url, init);
  if (!res.ok || !res.body) {
    throw new Error(`LLM request failed: ${res.status} ${res.statusText}`);
  }
  yield* sseData(res.body);
}
