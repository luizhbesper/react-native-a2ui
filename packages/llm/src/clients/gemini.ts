import { type LLMClient, type PromptRequest, sseRequest } from './types';

// Gemini streaming: POST models/{model}:streamGenerateContent?alt=sse (SSE framing, shared with
// the other providers); the key travels in the `x-goog-api-key` header, output text in
// `candidates[0].content.parts[].text`.
const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-2.0-flash';

/** Options for {@link geminiClient}; `apiKey` is required, the rest have defaults. */
export interface GeminiClientOptions {
  apiKey: string;
  model?: string;
  /** Injectable `fetch` (defaults to the global) — used to feed mocked streams in tests. */
  fetch?: typeof fetch;
}

/** An {@link LLMClient} backed by the Gemini `streamGenerateContent` endpoint. */
export function geminiClient(options: GeminiClientOptions): LLMClient {
  const { apiKey, model = DEFAULT_MODEL, fetch: fetchImpl = fetch } = options;
  return async function* (request: PromptRequest) {
    const url = `${BASE}/${model}:streamGenerateContent?alt=sse`;
    const init: RequestInit = {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        ...(request.system ? { systemInstruction: { parts: [{ text: request.system }] } } : {}),
        contents: [{ role: 'user', parts: [{ text: request.prompt }] }],
      }),
    };
    for await (const data of sseRequest(fetchImpl, url, init)) {
      const event = JSON.parse(data) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const parts = event.candidates?.[0]?.content?.parts;
      if (parts) for (const part of parts) if (part.text) yield part.text;
    }
  };
}
