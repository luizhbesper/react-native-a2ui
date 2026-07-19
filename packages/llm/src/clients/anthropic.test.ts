import { describe, expect, it } from 'vitest';
import { anthropicClient } from './anthropic';

/** A mocked fetch Response whose body streams the given SSE text in the given chunks. */
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

describe('anthropicClient', () => {
  it('posts a Messages API streaming request and yields text_delta tokens', async () => {
    let url: string | undefined;
    let init: RequestInit | undefined;
    const fetchMock = (async (u: string, i: RequestInit) => {
      url = u;
      init = i;
      // One SSE event is split across two body chunks to exercise cross-chunk buffering.
      return sseResponse(
        'event: content_block_delta\ndata: {"type":"content_block_delta","delta":{"type":"text_del',
        'ta","text":"Book"}}\n\nevent: content_block_delta\ndata: {"type":"content_block_delta","delta":{"type":"text_delta","text":" a table"}}\n\nevent: message_stop\ndata: {"type":"message_stop"}\n\n',
      );
    }) as unknown as typeof fetch;

    const client = anthropicClient({ apiKey: 'secret', fetch: fetchMock });
    const out = await collect(client({ system: 'sys', prompt: 'hi' }));

    expect(out).toBe('Book a table');
    expect(url).toBe('https://api.anthropic.com/v1/messages');
    const headers = init?.headers as Record<string, string>;
    expect(headers['x-api-key']).toBe('secret');
    expect(headers['anthropic-version']).toBe('2023-06-01');
    const requestBody = JSON.parse(init?.body as string);
    expect(requestBody.stream).toBe(true);
    expect(requestBody.system).toBe('sys');
    expect(requestBody.messages).toEqual([{ role: 'user', content: 'hi' }]);
  });
});
