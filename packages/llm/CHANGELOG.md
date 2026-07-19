# @react-native-a2ui/llm

## 1.0.0

### Minor Changes

- 7a6b342: Add `@react-native-a2ui/llm`, a new package for driving A2UI agents with LLMs, starting with prompt generation.

  `generateSystemPrompt(components, examples?)` turns a registered component catalog into a system prompt a model can answer with valid A2UI messages. Each component is described as `{ name, description?, schema }`, where `schema` is either a Zod schema (for your custom components) or a plain JSON Schema object (the shape the basic catalog is defined in). Every component is rendered as a self-contained JSON Schema behind a `component: { const: <name> }` discriminant — Zod schemas are converted with the same `zod-to-json-schema` call the A2UI engine uses — and preceded by a short protocol preamble. A set of few-shot examples (`DEFAULT_EXAMPLES`, overridable) shows the model what A2UI output looks like.

  The package has no dependency on `@a2ui/web_core`; its schema output is kept in parity with the engine's `A2uiSchemaManager`/inline-catalog approach, with the deltas documented in source.

- a335272: Add streaming extraction, provider clients, and a one-call `streamA2UI` helper to `@react-native-a2ui/llm` — everything needed to drive live A2UI UI from a real model.

  - `extract(chunks)` tolerantly pulls A2UI JSON messages out of a model's token stream: it handles fenced ` ```json ` blocks, objects split across streamed chunks, and surrounding prose, and skips any garbage between messages. Each candidate is parsed with `JSON.parse` — nothing from the wire is ever evaluated.
  - `anthropicClient`, `openaiClient`, and `geminiClient` are thin clients built on raw `fetch` (no provider SDKs), so they work in React Native and Expo Go with minimal dependencies. Each takes an API key (from your env or a dev-only screen — never commit it) and streams the model's text tokens. The Anthropic client follows the current Messages API streaming shape and defaults to the latest Claude model.
  - `streamA2UI({ client, prompt, engine, catalog?, system? })` wires a client through extraction into any `ProtocolEngine`, feeding messages to the surface as they arrive. Pass a `catalog` to have it build the system prompt for you via `generateSystemPrompt`.

  `react-native-a2ui` now also exposes its protocol-neutral engine types at the `react-native-a2ui/engine-types` subpath, so tooling and integrations can depend on the `ProtocolEngine` interface without pulling in the renderer.

### Patch Changes

- Updated dependencies [48eff9c]
- Updated dependencies [cd3c46e]
- Updated dependencies [bfebdb1]
- Updated dependencies [4300fbd]
- Updated dependencies [5bb8150]
- Updated dependencies [503a5e1]
- Updated dependencies [a335272]
- Updated dependencies [5f8cc99]
- Updated dependencies [9726ee2]
- Updated dependencies [9a54bd1]
- Updated dependencies [9436dfb]
  - react-native-a2ui@0.1.0
