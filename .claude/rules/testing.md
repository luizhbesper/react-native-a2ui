---
paths:
  - "packages/**/*.{ts,tsx}"
  - "**/jest.config.js"
  - "**/vitest.config.ts"
---

# Testing

- Runners split by extension: `*.test.ts` runs on Vitest (pure TS: engine, transports, theme, llm); `*.test.tsx` runs on Jest + `@testing-library/react-native` (components, renderer). Never mix.
- RNTL 14: `render` is async — always `await render(...)`.
- One behavior per test, named for the behavior: `resolves path context at fire time`, not `test action 2`. Assert outcomes, not implementation details.
- One test file per module. If a case is covered by the conformance suite or another unit test, don't repeat it.
- Cover the happy path plus the edge cases named in the task spec — no invented padding.
- No snapshots except the LLM system-prompt text (M2-T3), which is reviewed and updated deliberately. Everything else uses explicit assertions.
- No network in tests: mocked streams/fetch only. Conformance fixtures are local.
- Never weaken a conformance assertion to make it pass — fix the code or file the upstream bug.
