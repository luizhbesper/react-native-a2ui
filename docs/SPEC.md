# SPEC — react-native-a2ui

> Status: **v2 — Approved** · Owner: Luiz Esper · July 2026
> Target protocol: **A2UI v0.9.1** (tracking v1.0 RC) · Engine: **`@a2ui/web_core` 0.10.x**
> This document is the source of truth for architecture and scope. Milestone-level task breakdowns live in [`docs/specs/`](./specs/). Decisions are recorded in [`docs/adr/`](./adr/). Supersedes spec v1 (see [CRITIQUE.md](./CRITIQUE.md) for what changed and why).

---

## 1. Mission & Positioning

Build the **canonical open-source React Native renderer for Google's A2UI protocol** — the missing renderer in the ecosystem (React, Lit, Angular, Flutter are official; Compose and SwiftUI are on Google's roadmap; **React Native is not**).

**One-liner:** "Your agent returns components, not text. Render them as real native mobile UI, streaming, on the open A2UI standard."

**Why this wins:**
- Google explicitly solicits community renderers (listing = PR to `docs/public/reference/renderers.md` in `google/A2UI` + a Discussions post).
- The only existing RN attempt (`sivamrudram-eng/a2ui-react-native`) is an early scaffold: 8 of 16 planned components, ~5 commits, never published to npm, and it reimplements the protocol instead of reusing Google's core.
- **We build on `@a2ui/web_core`** — the same official engine that powers `@a2ui/react`, `@a2ui/lit`, and `@a2ui/angular`. This gives us protocol conformance by construction and the strongest possible argument for official listing: *"the React Native layer for the core you already maintain."*

**Non-goals (MVP):**
- No agent/server SDK — we consume agent output; Google's SDKs produce it.
- No native modules — pure TypeScript/JS, works in **Expo Go and bare react-native-cli** unchanged. This is a deliberate adoption lever.
- No opinionated design system — design tokens + renderer-owned styling, mirroring Google's approach (§5).

## 2. Protocol Summary

Reference: `google/A2UI` → `specification/v0_9/` (docs + JSON schemas in `specification/v0_9/json/`). Official example streams are vendored into `packages/react-native-a2ui/conformance/fixtures/` for the conformance suite.

### 2.1 Messages

**Server → client** (JSONL stream or arrays inside A2A DataParts): `createSurface` (surfaceId, catalogId, optional theme), `updateComponents` (flat adjacency list, children by ID, one `root`), `updateDataModel` (JSON Pointer upsert/delete), `deleteSurface`.

**Client → server:** `action` (name, surfaceId, sourceComponentId, timestamp, context with path references resolved at fire time), `error`, plus `a2uiClientCapabilities` metadata on every outbound message.

**Processing rules:** batches are non-transactional; a failing message is reported and the rest still processed; no repaint until the whole batch is done (no flicker).

> All of the above is implemented by `@a2ui/web_core`. Our job is to *drive* it and *render* its output — not to reimplement it. See ADR-0001.

### 2.2 Data binding

- Bindable props are `Dynamic*` types: literal | JSON Pointer path | FunctionCall (client functions: `required`, `email`, custom).
- Path-bound components re-render automatically on data changes (web_core exposes `@preact/signals-core` signals — fine-grained reactivity for free).
- Template lists: `children: { path, componentId }` instantiate a template per array item with item-scoped paths.
- Two-way inputs (TextField, CheckBox, Slider, ChoicePicker, DateTimeInput) write user edits back to the bound path.

### 2.3 Basic catalog — 18 components (v0.9.1)

Text, Image, Icon, Video, AudioPlayer, Row, Column, List, Card, Tabs, Divider, Modal, Button, CheckBox, TextField, DateTimeInput, ChoicePicker, Slider.

Component props MUST be derived from the vendored catalog schemas — never hand-guessed.

### 2.4 A2A transport values

- Extension URI: `https://a2ui.org/a2a-extension/a2ui/v0.9`
- Activation header: `X-A2A-Extensions`
- Payload MIME: `application/json+a2ui` (A2A DataParts)
- Capabilities: server via AgentCard params; client via `a2uiClientCapabilities` (supported catalog IDs, inline catalog support).

### 2.5 Robustness requirement

v0.9 is prompt-first: the LLM emits free-form JSON guided by schema-in-prompt. The renderer must never trust the wire: web_core's Zod validation + graceful degradation (invalid message → report, skip, keep rendering), per-component error boundaries, no `eval` of anything from the wire, unknown component → render nothing + dev warning. A crashing component must never take down the host app.

## 3. Architecture

```
┌────────────────────────────────────────────────────────────┐
│ App (Expo or bare RN)                                      │
│  <A2UIProvider engine catalogs theme>                      │
│    <Surface surfaceId="main" />                            │
└──────────────┬─────────────────────────────────────────────┘
               │ subscribes (signals)
┌──────────────▼─────────────────────────────────────────────┐
│ react-native-a2ui                                          │
│  renderer/   Provider, Surface, node renderer, hooks       │
│  catalog/    basic catalog (18 comps, StyleSheet + tokens) │
│  engine/     ProtocolEngine interface + A2uiEngine adapter │──▶ @a2ui/web_core
│  transports/ jsonl · sse · a2a envelope                    │    (official Google core:
│  theme/      tokens, dark mode, createSurface.theme        │     validation, data model,
└────────────────────────────────────────────────────────────┘     binding, registry)
```

### 3.1 Modularity boundary (ProtocolEngine)

The renderer consumes a small **`ProtocolEngine`** interface — surfaces, component tree access, data binding subscription, action dispatch — defined in `src/engine/types.ts`. `A2uiEngine` (backed by `@a2ui/web_core`) is implementation #1. A future protocol (or A2UI v1.0 with breaking changes, or a fallback fork of web_core) is a new implementation of the same interface; the renderer and catalog never import web_core directly. Package extraction happens only when a second implementation exists (YAGNI).

### 3.2 Package layout (monorepo, pnpm workspaces)

| Package | Contents | When |
|---|---|---|
| `react-native-a2ui` | renderer + engine adapter + basic catalog + transports | MVP (M0–M1) |
| `@react-native-a2ui/llm` | direct-LLM helper: catalog → system prompt, streaming JSON extraction | M2 |
| `@react-native-a2ui/expo-ui` | adapter catalog rendering via `@expo/ui` (native SwiftUI/Compose feel) | M4 |
| `apps/example` | Expo app: gallery + fixtures + live agent chat demo | M1+ |
| `website` | Fumadocs site with llms.txt | M3 |

One installable package at MVP. Transports live inside the main package until a real consumer needs them standalone.

### 3.3 Rendering strategy

- `<Surface>` renders the component tree from the engine; each node resolves its `component` name through the catalog registry.
- Each rendered node subscribes only to its own bound signals (fine-grained reactivity — a data change re-renders exactly the affected leaves, never the whole surface). Signals integrate with React via `useSyncExternalStore`.
- Template lists render through `FlatList`, keyed by item.
- Progressive streaming: paint as soon as a valid root tree exists; new components mount as they arrive; entrance animations via Reanimated as an **optional peer** (graceful no-op when absent).

### 3.4 BYOC (custom catalogs)

Mirror the official React renderer ergonomics:

```ts
const catalog = createCatalog({
  catalogId: 'https://myapp.com/a2ui/catalog.json',
  includeBasicCatalog: true,
  components: {
    SpendingChart: {
      description: 'Bar chart of spending by category',
      schema: z.object({ categories: z.array(z.string()), total: z.number() }),
      render: ({ props }) => <SpendingChart {...props} />,
    },
  },
});
```

Zod is the validation source (same as web_core); `description` + schema feed agent-side prompt generation in `@react-native-a2ui/llm`. Renderer props are inferred from the schema (type-safe).

## 4. Transports

Common interface: `Transport { connect, send(clientMessage), onMessages(cb), close }`.

- `JsonlStreamTransport` — fetch streaming, incremental line parsing across chunk boundaries.
- `SSETransport` — EventSource-style over fetch.
- `A2ATransport` — DataPart envelope, extension header, capabilities injection (values in §2.4).
- `AGUIBridge` (M4) — consume A2UI over AG-UI events; unlocks LangGraph/Mastra/CopilotKit backends.

## 5. Styling — design tokens, zero dependencies

Google's pattern across official renderers is **tokens + renderer-owned look** (CSS variables like `--a2ui-color-primary` on web with low-specificity overrides and auto dark mode; Material on Flutter/Compose). We mirror it exactly:

1. Default catalog styled with **plain `StyleSheet`** driven by a token object: `colors` (incl. `primary`), `spacing`, `radii`, `typography`. Zero styling dependencies → works in Expo Go, bare CLI, and react-native-web with no asterisks.
2. **Auto dark mode** via `useColorScheme()`, overridable.
3. `createSurface.theme.primaryColor` maps into the token set (matching the web renderers' `--a2ui-color-primary`).
4. `<A2UIProvider theme>` deep-merges tokens; per-component style override map for finer control.
5. Design-system integration is BYOC + adapter catalogs (`@expo/ui` first, NativeWind/react-native-reusables later) — never a dependency of the core package.

## 6. Testing & Conformance

- **Conformance suite:** replay every official example stream from `google/A2UI` (vendored) → assert resulting component tree + data model. Green conformance is the compliance badge for the listing PR. Runs in CI on every PR.
- **Unit (Vitest, `*.test.ts`):** engine adapter, transports (chunk boundaries, malformed lines), action context resolution, theme mapping.
- **Component (Jest + jest `react-native` preset + RNTL, `*.test.tsx`):** each basic-catalog component — render, props from schema, two-way binding, action firing.
- **Test rules:** TDD (failing test first), happy path + named edge cases, no redundant tests, no gratuitous snapshots. See `.claude/rules/testing.md`.
- **E2E (post-MVP):** Maestro flow on the example app.

## 7. Distribution & Operations

- **npm:** `react-native-a2ui` (verified available; the abandoned community renderer never published). Scoped `@react-native-a2ui/*` for satellites.
- **Release:** Changesets → Version PR → merge to `main` → GitHub Actions publish via npm **Trusted Publishing (OIDC)** with provenance. `CHANGELOG.md` at repo root, one entry per released version.
- **Branches:** `main` (releases) ← `dev` (integration) ← `feature/*`.
- **CI:** lint (Biome) + typecheck + tests (both runners) + build + conformance on every PR.
- **Docs:** Fumadocs on Vercel with `llms.txt` / `llms-full.txt`; README optimized for GitHub search (keyword-rich name/About/topics, social preview, quick start above the fold).

## 8. Success Metrics & Risks

**Metrics:** listed on a2ui.org ecosystem page; 500+ stars in 90 days; ≥3 external contributors; runs in Expo Go (zero native code) at M2; conformance suite green against every spec release.

| Risk | Mitigation |
|---|---|
| `web_core` turns out DOM-coupled at runtime | Deps verified pure-JS (signals, zod, date-fns). M0 opens with a Hermes/Metro spike; fallback = vendored fork behind the same `ProtocolEngine` interface (ADR-0001). |
| Google ships an official RN renderer | Move fast; built-on-web_core + conformance-green makes ours the one they link. Engage early (Issue #428, Discussions). |
| v1.0 breaks the wire format | Engine boundary isolates it: bump web_core, adapt the adapter; renderer untouched. Schemas vendored per version. |
| Prompt-first JSON is messy in practice | web_core validation + tolerant extraction in `llm` package + degrade-gracefully rules (§2.5). |
| Perf on large surfaces | Signal-level subscriptions (no surface-wide re-render), FlatList for templates, 200+ component profiling fixture in the example app. |
| web_core versioning drift (pkg 0.10.x vs spec 0.9.1) | Track the npm package as the source of truth for wire compat; pin minor, renovate on release notes. |
