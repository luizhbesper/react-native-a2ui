/**
 * Tolerant extraction of A2UI JSON values from a model's token stream.
 *
 * A model is prompted to emit A2UI messages as JSON, but real output wraps them in prose,
 * fenced ```json blocks, and splits objects across streamed chunks. This is a small brace/
 * bracket-depth scanner (string-aware) that pulls each complete top-level JSON value out of
 * the stream and skips everything between them. It is deliberately NOT a streaming-JSON
 * library nor the transports' strict JSONL parser (that reads whole-line JSON) — the wire is
 * untrusted prose, so nothing here is eval'd; each candidate goes through `JSON.parse`.
 */

/** First index of `{` or `[` in `buf` at or after `from`, or -1 if neither appears. */
function firstBracket(buf: string, from: number): number {
  const a = buf.indexOf('{', from);
  const b = buf.indexOf('[', from);
  if (a === -1) return b;
  if (b === -1) return a;
  return Math.min(a, b);
}

/**
 * Scan one balanced JSON value starting at `buf[start]` (which is `{` or `[`), tracking string
 * state so braces inside strings don't count. Returns the exclusive end index, or -1 if the
 * value is not yet complete (more chunks needed).
 */
function scanValue(buf: string, start: number): number {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < buf.length; i++) {
    const ch = buf[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{' || ch === '[') depth++;
    else if (ch === '}' || ch === ']') {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  return -1;
}

/**
 * Pull every complete top-level JSON value from the front of `buf`, skipping prose and garbage
 * between them. Returns the parsed values and the unconsumed remainder (an incomplete value or
 * trailing prose) to carry into the next chunk.
 */
function drain(buf: string): { values: unknown[]; rest: string } {
  const values: unknown[] = [];
  let i = 0;
  while (i < buf.length) {
    const start = firstBracket(buf, i);
    if (start === -1) {
      i = buf.length; // only prose/garbage left — discard it
      break;
    }
    const end = scanValue(buf, start);
    if (end === -1) {
      i = start; // an incomplete value — keep it for the next chunk
      break;
    }
    try {
      values.push(JSON.parse(buf.slice(start, end)));
      i = end;
    } catch {
      i = start + 1; // balanced but not valid JSON — skip this bracket, keep scanning
    }
  }
  return { values, rest: buf.slice(i) };
}

/**
 * Extract A2UI JSON values from a stream of text chunks, yielding each complete top-level
 * object or array as it is parsed. A trailing incomplete value is dropped when the stream ends.
 */
// ponytail: re-scans from the value start on each chunk — O(n²) only while accumulating one
// incomplete value, fine for UI-message-sized JSON; persist scan state if streaming huge objects.
export async function* extract(chunks: AsyncIterable<string>): AsyncGenerator<unknown> {
  let buf = '';
  for await (const chunk of chunks) {
    buf += chunk;
    const { values, rest } = drain(buf);
    for (const value of values) yield value;
    buf = rest;
  }
}
