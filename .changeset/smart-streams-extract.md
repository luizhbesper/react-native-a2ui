---
"@react-native-a2ui/llm": minor
"react-native-a2ui": minor
---

Add streaming extraction, provider clients, and a one-call `streamA2UI` helper to `@react-native-a2ui/llm` — everything needed to drive live A2UI UI from a real model.

- `extract(chunks)` tolerantly pulls A2UI JSON messages out of a model's token stream: it handles fenced ` ```json ` blocks, objects split across streamed chunks, and surrounding prose, and skips any garbage between messages. Each candidate is parsed with `JSON.parse` — nothing from the wire is ever evaluated.
- `anthropicClient`, `openaiClient`, and `geminiClient` are thin clients built on raw `fetch` (no provider SDKs), so they work in React Native and Expo Go with minimal dependencies. Each takes an API key (from your env or a dev-only screen — never commit it) and streams the model's text tokens. The Anthropic client follows the current Messages API streaming shape and defaults to the latest Claude model.
- `streamA2UI({ client, prompt, engine, catalog?, system? })` wires a client through extraction into any `ProtocolEngine`, feeding messages to the surface as they arrive. Pass a `catalog` to have it build the system prompt for you via `generateSystemPrompt`.

`react-native-a2ui` now also exposes its protocol-neutral engine types at the `react-native-a2ui/engine-types` subpath, so tooling and integrations can depend on the `ProtocolEngine` interface without pulling in the renderer.
