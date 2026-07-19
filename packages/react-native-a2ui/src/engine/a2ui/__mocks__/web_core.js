// Jest-only stub for @a2ui/web_core/v0_9 (wired via jest.config.js moduleNameMapper).
// The barrel smoke test just proves the entry point resolves under the RN preset; it never
// constructs the engine, and A2uiEngine.ts references these names only inside method/field
// bodies that don't run at import time, so an empty module is enough. The real engine is
// exercised on Vitest (A2uiEngine.test.ts, conformance) and on device via Metro.
// ponytail: empty stub — a Jest test that actually builds the engine would get undefined here;
// engine behavior belongs in Vitest (*.test.ts) per .claude/rules/testing.md.
module.exports = {};
