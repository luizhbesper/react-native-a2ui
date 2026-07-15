# Roadmap — react-native-a2ui

> AI-first timeline: work is measured in **implementation sessions** (one focused Claude Code session ≈ one task), not weeks. Task-level breakdowns live in [specs/](./specs/). Live progress in [STATUS.md](./STATUS.md).

## M0 — Engine spike + adapter (~3-5 sessions)

Prove the architecture's one real bet: `@a2ui/web_core` running under Hermes/Metro.

- Spike: web_core + signals + zod in a minimal RN runtime; render nothing, just process official example streams. **Go/no-go on ADR-0001** (fallback: vendored fork behind the same interface).
- `ProtocolEngine` interface finalized against real web_core APIs; `A2uiEngine` adapter (~300 lines ceiling).
- Conformance harness: replay every vendored official example stream → assert component tree + data model. Green = M0 exit.

**Exit:** conformance suite green in CI on the adapter alone (no rendering yet).

## M1 — Renderer + basic catalog (~8-12 sessions)

- `<A2UIProvider>`, `<Surface>`, node renderer, catalog registry, `useA2UI()` hooks.
- Theme tokens + auto dark mode + `createSurface.theme.primaryColor` mapping.
- **18 basic-catalog components** (props generated from vendored schemas), grouped into sessions: layout (Row, Column, Card, Divider, List) → content (Text, Image, Icon) → inputs (Button, TextField, CheckBox, Slider, ChoicePicker, DateTimeInput) → containers (Tabs, Modal) → media stubs (Video, AudioPlayer — placeholder rendering, native playback M4).
- Two-way binding, action dispatch, template lists via FlatList.
- Example app renders official fixture streams (booking demo, quickstart).

**Exit:** official examples render correctly in the example app from local fixtures; RNTL suite green; video of a form streaming in and submitting an action.

## M2 — Live agents (~4-6 sessions)

- Transports: JSONL fetch-streaming, SSE, A2A envelope (header/MIME/capabilities).
- `@react-native-a2ui/llm`: catalog → system prompt generation (port `A2uiSchemaManager` approach), tolerant streaming JSON extraction, Claude/Gemini/OpenAI-compatible clients.
- Example app: chat screen where a real model composes UI live.

**Exit:** the launch demo — a real agent building native UI on device, recorded as GIF. Works in Expo Go.

## M3 — Launch (~3-5 sessions)

- Streaming polish: Reanimated entrance animations (optional peer, no-op fallback), skeletons for unbound data.
- BYOC docs + custom component example (chart).
- Fumadocs site live on Vercel: quickstart, API reference, theming, BYOC, llms.txt + llms-full.txt.
- First npm release via CI (Changesets + OIDC provenance). README with GIF, badges, topics, social preview.
- **Listing PR to `google/A2UI`** (`docs/public/reference/renderers.md`) + Discussions post + engage Issue #428.
- Announcements: Show HN, r/reactnative, X, Expo Discord.

**Exit:** `npm install react-native-a2ui` works; listing PR open; site indexed.

## M4 — Ecosystem & parity (post-MVP, ongoing)

- `@react-native-a2ui/expo-ui`: adapter catalog on `@expo/ui` (native SwiftUI/Compose feel, Expo Go since SDK 56).
- AG-UI bridge (LangGraph / Mastra / CopilotKit backends for free).
- NativeWind / react-native-reusables adapter catalog (when NativeWind v5 stabilizes).
- Full media parity: Video/AudioPlayer via expo-av adapter, native date/time pickers.
- v1.0 RC tracking: adapter for the new wire format the day the RC lands (engine boundary = only the adapter changes).
- On-device LLM adapter (react-native-executorch / @react-native-ai).
- Maestro E2E on the example app; 200+ component perf profiling fixture.
- Conformance badge program: publish results per spec version on the docs site.

## Later / exploratory

- Second protocol implementation behind `ProtocolEngine` (proves the modularity claim; candidates: MCP Apps-style UI, AG-UI native).
- react-native-web story: same package rendering on web via RN-web (compare with `@a2ui/react`).
- Server-driven theming extensions if the spec grows them (v1.0 watch).
