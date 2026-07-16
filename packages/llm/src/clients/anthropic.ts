import { type LLMClient, type PromptRequest, sseRequest } from './types';

// Messages API streaming: request shape, headers, and default model follow the current
// Anthropic docs (POST /v1/messages, `anthropic-version` + `x-api-key`, `stream: true`).
const ENDPOINT = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const DEFAULT_MODEL = 'claude-opus-4-8';
const DEFAULT_MAX_TOKENS = 4096;

/** Options for {@link anthropicClient}; `apiKey` is required, the rest have defaults. */
export interface AnthropicClientOptions {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  /** Injectable `fetch` (defaults to the global) — used to feed mocked streams in tests. */
  fetch?: typeof fetch;
}

/** An {@link LLMClient} backed by the Anthropic Messages API streaming endpoint. */
export function anthropicClient(options: AnthropicClientOptions): LLMClient {
  const {
    apiKey,
    model = DEFAULT_MODEL,
    maxTokens = DEFAULT_MAX_TOKENS,
    fetch: fetchImpl = fetch,
  } = options;
  return async function* (request: PromptRequest) {
    const init: RequestInit = {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        stream: true,
        ...(request.system ? { system: request.system } : {}),
        messages: [{ role: 'user', content: request.prompt }],
      }),
    };
    for await (const data of sseRequest(fetchImpl, ENDPOINT, init)) {
      // Output text arrives as content_block_delta events with a text_delta; other events
      // (message_start/stop, ping, thinking) carry no output text and are ignored.
      const event = JSON.parse(data) as {
        type?: string;
        delta?: { type?: string; text?: string };
      };
      if (
        event.type === 'content_block_delta' &&
        event.delta?.type === 'text_delta' &&
        event.delta.text
      ) {
        yield event.delta.text;
      }
    }
  };
}
