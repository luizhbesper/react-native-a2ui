import { describe, expect, it } from 'vitest';
import { geminiClient } from './gemini';

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

describe('geminiClient', () => {
  it('posts a streamGenerateContent SSE request and yields candidate part text', async () => {
    let url: string | undefined;
    let init: RequestInit | undefined;
    const fetchMock = (async (u: string, i: RequestInit) => {
      url = u;
      init = i;
      return sseResponse(
        'data: {"candidates":[{"content":{"parts":[{"text":"Hello"}]}}]}\n\n',
        'data: {"candidates":[{"content":{"parts":[{"text":" world"}]}}]}\n\n',
      );
    }) as unknown as typeof fetch;

    const client = geminiClient({ apiKey: 'secret', fetch: fetchMock });
    const out = await collect(client({ system: 'sys', prompt: 'hi' }));

    expect(out).toBe('Hello world');
    expect(url).toContain(':streamGenerateContent?alt=sse');
    const headers = init?.headers as Record<string, string>;
    expect(headers['x-goog-api-key']).toBe('secret');
    const requestBody = JSON.parse(init?.body as string);
    expect(requestBody.systemInstruction).toEqual({ parts: [{ text: 'sys' }] });
    expect(requestBody.contents).toEqual([{ role: 'user', parts: [{ text: 'hi' }] }]);
  });
});
