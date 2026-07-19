import { describe, expect, it } from 'vitest';
import { extract } from './extract';

async function* fromChunks(...chunks: string[]): AsyncGenerator<string> {
  for (const c of chunks) yield c;
}

async function collect(chunks: string[]): Promise<unknown[]> {
  const out: unknown[] = [];
  for await (const value of extract(fromChunks(...chunks))) out.push(value);
  return out;
}

describe('extract', () => {
  it('pulls a JSON object out of a fenced code block', async () => {
    const out = await collect([
      '```json\n{"version":"v0.9","createSurface":{"surfaceId":"s"}}\n```',
    ]);
    expect(out).toEqual([{ version: 'v0.9', createSurface: { surfaceId: 's' } }]);
  });

  it('reassembles an object split across chunk boundaries', async () => {
    const out = await collect([
      '{"version":"v0.9","update',
      'Components":{"surfaceId":"s","components":[]}}',
    ]);
    expect(out).toEqual([
      { version: 'v0.9', updateComponents: { surfaceId: 's', components: [] } },
    ]);
  });

  it('extracts an object surrounded by prose', async () => {
    const out = await collect(['Sure! Here is the UI: {"a":1} — hope that helps.']);
    expect(out).toEqual([{ a: 1 }]);
  });

  it('skips garbage between objects and keeps extracting', async () => {
    const out = await collect(['{"a":1} !!! not json !!! {"b":2}']);
    expect(out).toEqual([{ a: 1 }, { b: 2 }]);
  });

  it('keeps braces inside string values from breaking the framing', async () => {
    const out = await collect(['{"text":"a {curly} ', 'brace"}']);
    expect(out).toEqual([{ text: 'a {curly} brace' }]);
  });

  it('drops an incomplete trailing object when the stream ends', async () => {
    const out = await collect(['{"a":1}{"b":2', ',"c":']);
    expect(out).toEqual([{ a: 1 }]);
  });
});
