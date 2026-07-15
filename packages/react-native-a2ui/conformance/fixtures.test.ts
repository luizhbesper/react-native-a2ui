/// <reference types="vite/client" />
import { describe, expect, it } from 'vitest';

// Fixture sanity for M0-T2: every vendored v0_9 fixture parses as JSON, and every
// example stream matches its declared message-list shape. Vendored verbatim from
// @a2ui/web_core@0.10.4 — see fixtures/README.md. Counts guard against a partial
// re-vendor (or an empty glob) silently passing; update them when re-vendoring.
//
// Loaded via import.meta.glob `?raw` (not node:fs) so this stays typeable without
// pulling node types into the RN library's tsconfig.
const raw = import.meta.glob('./fixtures/v0_9/**/*.json', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const jsonFiles = Object.entries(raw).sort(([a], [b]) => a.localeCompare(b));
const exampleStreams = jsonFiles.filter(([f]) => f.includes('/examples/'));

describe('v0_9 conformance fixtures', () => {
  it('vendored the complete tree', () => {
    expect(jsonFiles.length).toBe(63);
    expect(exampleStreams.length).toBe(50);
  });

  for (const [rel, content] of jsonFiles) {
    it(`${rel} parses as a JSON object`, () => {
      const doc = JSON.parse(content);
      expect(typeof doc).toBe('object');
      expect(doc).not.toBeNull();
    });
  }

  for (const [rel, content] of exampleStreams) {
    it(`${rel} is a well-formed message list`, () => {
      const doc = JSON.parse(content);
      expect(typeof doc.name).toBe('string');
      expect(typeof doc.description).toBe('string');
      expect(Array.isArray(doc.messages)).toBe(true);
      expect(doc.messages.length).toBeGreaterThan(0);
      for (const msg of doc.messages) {
        expect(msg).toBeTypeOf('object');
        expect(msg.version).toBe('v0.9');
        // version + at least one operation key (createSurface, updateComponents, ...)
        expect(Object.keys(msg).length).toBeGreaterThanOrEqual(2);
      }
    });
  }
});
