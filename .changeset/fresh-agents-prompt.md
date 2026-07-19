---
"@react-native-a2ui/llm": minor
---

Add `@react-native-a2ui/llm`, a new package for driving A2UI agents with LLMs, starting with prompt generation.

`generateSystemPrompt(components, examples?)` turns a registered component catalog into a system prompt a model can answer with valid A2UI messages. Each component is described as `{ name, description?, schema }`, where `schema` is either a Zod schema (for your custom components) or a plain JSON Schema object (the shape the basic catalog is defined in). Every component is rendered as a self-contained JSON Schema behind a `component: { const: <name> }` discriminant — Zod schemas are converted with the same `zod-to-json-schema` call the A2UI engine uses — and preceded by a short protocol preamble. A set of few-shot examples (`DEFAULT_EXAMPLES`, overridable) shows the model what A2UI output looks like.

The package has no dependency on `@a2ui/web_core`; its schema output is kept in parity with the engine's `A2uiSchemaManager`/inline-catalog approach, with the deltas documented in source.
