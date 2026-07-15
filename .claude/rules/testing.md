# Testing

- **TDD**: write the failing test first. Each milestone task lists its tests — implement exactly those, then stop.
- **Runners by extension**: `*.test.ts` = Vitest (pure TS: engine, transports, theme logic, llm). `*.test.tsx` = Jest + `@testing-library/react-native` (components, renderer). Never mix.
- **Simple and assertive**: one behavior per test, named for the behavior (`resolves path context at fire time`, not `test action 2`). Assert outcomes, not implementation details.
- **No redundancy**: if a case is covered by the conformance suite or another unit test, don't repeat it. One test file per module.
- **Happy path + named edge cases** — the task spec names the edge cases; cover those, don't invent padding.
- **No gratuitous snapshots**: explicit assertions. Sanctioned snapshot exceptions: the LLM system-prompt text (M2-T3) — reviewed and updated deliberately.
- **No network in tests**: mocked streams/fetch only. Conformance fixtures are local.
- The conformance suite (`conformance/`) must stay green on every PR — it is the compliance badge. Never weaken an assertion to make it pass; fix the code or file the upstream bug.
