import { type LLMClient, type PromptRequest, sseRequest } from './types';

// Chat Completions streaming: POST /v1/chat/completions with `stream: true`; output text arrives
// as `choices[0].delta.content` deltas, terminated by a `data: [DONE]` sentinel.
const ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-4o';

/** Options for {@link openaiClient}; `apiKey` is required, the rest have defaults. */
export interface OpenAIClientOptions {
  apiKey: string;
  model?: string;
  /** Injectable `fetch` (defaults to the global) — used to feed mocked streams in tests. */
  fetch?: typeof fetch;
}

/** An {@link LLMClient} backed by the OpenAI Chat Completions streaming endpoint. */
export function openaiClient(options: OpenAIClientOptions): LLMClient {
  const { apiKey, model = DEFAULT_MODEL, fetch: fetchImpl = fetch } = options;
  return async function* (request: PromptRequest) {
    const messages = [
      ...(request.system ? [{ role: 'system', content: request.system }] : []),
      { role: 'user', content: request.prompt },
    ];
    const init: RequestInit = {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, stream: true }),
    };
    for await (const data of sseRequest(fetchImpl, ENDPOINT, init)) {
      if (data === '[DONE]') break;
      const event = JSON.parse(data) as {
        choices?: { delta?: { content?: string } }[];
      };
      const text = event.choices?.[0]?.delta?.content;
      if (text) yield text;
    }
  };
}
