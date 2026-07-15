# Architecture — react-native-a2ui

> How the pieces fit. Scope and rationale live in [SPEC.md](./SPEC.md); decisions in [adr/](./adr/).

## System overview

```mermaid
flowchart TB
    subgraph Agent side
        AGENT[Agent / LLM<br/>Gemini · Claude · A2A server]
    end

    subgraph Transport
        T[JSONL · SSE · A2A envelope<br/>src/transports/]
    end

    subgraph Engine
        PE[ProtocolEngine interface<br/>src/engine/types.ts]
        AE[A2uiEngine adapter<br/>src/engine/a2ui/]
        WC[@a2ui/web_core<br/>official Google core]
        PE --- AE --> WC
    end

    subgraph Renderer
        P[A2UIProvider]
        S[Surface]
        NR[Node renderer<br/>catalog registry lookup]
        CAT[Basic catalog — 18 components<br/>StyleSheet + tokens]
        P --> S --> NR --> CAT
    end

    AGENT -->|A2UI messages| T -->|parsed batches| AE
    WC -->|signals: tree + data| S
    CAT -->|user input| WC
    AE -->|action / error events| T -->|client messages| AGENT
```

## Layers and dependency rules

| Layer | Directory | May import | Must NOT import |
|---|---|---|---|
| Engine interface | `src/engine/types.ts` | nothing (pure types) | React, RN, web_core |
| A2UI engine adapter | `src/engine/a2ui/` | web_core, engine types | React, RN |
| Transports | `src/transports/` | engine types | React, RN, web_core |
| Renderer | `src/renderer/` | React, RN, engine types | web_core, catalog internals |
| Catalog | `src/catalog/` | React, RN, theme, renderer contracts | web_core, transports |
| Theme | `src/theme/` | RN (`useColorScheme`) | everything else |

**The one rule that keeps us modular:** only `src/engine/a2ui/` knows web_core exists. Renderer, catalog, and transports speak `ProtocolEngine` types exclusively. A future protocol (or an A2UI v1.0 break, or a forked core) is a new folder under `src/engine/`, and nothing above it changes. (ADR-0005)

## ProtocolEngine interface (sketch)

```ts
interface ProtocolEngine {
  /** Feed one parsed server→client message batch. Never throws on bad input. */
  processMessages(batch: unknown[]): void;
  /** Surfaces currently alive. */
  getSurface(id: string): SurfaceHandle | undefined;
  subscribeSurfaces(cb: (ids: string[]) => void): Unsubscribe;
  /** Outbound: actions, errors, capabilities. */
  onClientMessage(cb: (msg: ClientMessage) => void): Unsubscribe;
}

interface SurfaceHandle {
  subscribeTree(cb: (rootReady: boolean) => void): Unsubscribe;
  getNode(id: string): ComponentNode | undefined;
  subscribeValue(pointer: string, cb: (v: unknown) => void): Unsubscribe; // fine-grained
  setValue(pointer: string, value: unknown): void;                        // two-way inputs
  dispatchAction(name: string, sourceComponentId: string, context?: unknown): void;
  theme: SurfaceTheme;
}
```

Exact shape is finalized in M0 against real web_core APIs — the adapter should stay under ~300 lines; if it grows past that, we are reimplementing instead of adapting.

## Rendering path (fine-grained reactivity)

1. `<Surface surfaceId>` subscribes to root-readiness; paints as soon as a valid root tree exists (progressive streaming).
2. The node renderer resolves `component` names through the catalog registry (allow-list; unknown → render nothing + dev warning).
3. Each node subscribes **only to its own bound values** via `useSyncExternalStore` over web_core signals. A data-model write re-renders exactly the affected leaves — never the surface.
4. Template lists (`children: { path, componentId }`) render as `FlatList`, one template instance per item, item-scoped data paths.
5. Two-way inputs call `setValue` on edit; `dispatchAction` resolves path-based context at fire time (engine does this).
6. Batch processing repaints once per batch (protocol no-flicker rule) — entrance animations trigger per batch.

## Error containment

```
transport error ──▶ onProtocolError callback (typed) + dev overlay
invalid message ──▶ web_core validation → skip message, process rest, report
unknown component ─▶ render nothing + warning event
crashing component ▶ per-node ErrorBoundary → fallback view, surface survives
```

Nothing from the wire is ever evaluated. The component allow-list is the registered catalogs.

## Theme flow

```
createSurface.theme.primaryColor ─┐
<A2UIProvider theme={...}> ───────┼─▶ resolved tokens (colors/spacing/radii/typography)
useColorScheme() (dark mode) ─────┘        │
                                           ▼
                            catalog components (StyleSheet)
```

Token names mirror the official web renderers' CSS variables (`--a2ui-color-primary` → `colors.primary`) so theming docs translate 1:1 from Google's.

## Repo layout

```
packages/react-native-a2ui/     the installable library (structure above)
  conformance/                  vendored official example streams + replay harness
apps/example/                   Expo app: fixture gallery + live agent chat
website/                        Fumadocs (docs.  llms.txt, llms-full.txt)
docs/                           SPEC, ADRs, ROADMAP, STATUS, milestone specs
.claude/                        rules, skills, settings — the AI implementation harness
```
