import { describe, expect, it } from 'vitest';
import { openaiClient } from './openai';

function sseResponse(...chunks: string[]): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
  return new Response(body, { status: 200 });
}

async function collect(tokens: AsyncIterable<string>): Promise<string> {
  let text = '';
  for await (const token of tokens) text += token;
  return text;
}

describe('openaiClient', () => {
  it('posts a Chat Completions streaming request and yields delta content up to [DONE]', async () => {
    let url: string | undefined;
    let init: RequestInit | undefined;
    const fetchMock = (async (u: string, i: RequestInit) => {
      url = u;
      init = i;
      return sseResponse(
        'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":" world"}}]}\n\n',
        'data: [DONE]\n\n',
      );
    }) as unknown as typeof fetch;

    const client = openaiClient({ apiKey: 'secret', fetch: fetchMock });
    const out = await collect(client({ system: 'sys', prompt: 'hi' }));

    expect(out).toBe('Hello world');
    expect(url).toBe('https://api.openai.com/v1/chat/completions');
    const headers = init?.headers as Record<string, string>;
    expect(headers.authorization).toBe('Bearer secret');
    const requestBody = JSON.parse(init?.body as string);
    expect(requestBody.stream).toBe(true);
    expect(requestBody.messages).toEqual([
      { role: 'system', content: 'sys' },
      { role: 'user', content: 'hi' },
    ]);
  });
});
