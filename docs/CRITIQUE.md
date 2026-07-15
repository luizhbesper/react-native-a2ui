# Critique — Spec v1 Review

> What the July 2026 research pass confirmed, corrected, and killed in spec v1 (`a2ui-react-native-spec.md`, Draft v1). Every change below is reflected in [SPEC.md](./SPEC.md) and recorded as an ADR where it is a decision.

## What v1 got right (kept)

- **Positioning and window.** RN is genuinely absent: not on Google's roadmap (Compose/SwiftUI are, ~Q3 2026), and the only community attempt is an unpublished 8-component scaffold. First-mover with conformance is the right strategy.
- **Robustness posture.** Prompt-first JSON ⇒ never trust the wire, error boundaries per component, degrade gracefully. Unchanged.
- **Styling philosophy.** "Tokens + renderer-owned look, no design-system dependency" is exactly what Google does (CSS vars on web, Material on Flutter/Compose). Confirmed by research, promoted from guess to verified decision (ADR-0002).
- **Streaming UX as differentiator.** Progressive paint + batch-aware entrance animations with Reanimated as optional peer. Kept as-is.
- **Conformance suite as the compliance badge** for the listing PR. Kept, now cheaper (see below).

## What v1 got wrong (corrected)

| # | v1 claim | Reality (verified) | Consequence |
|---|---|---|---|
| 1 | Build our own engine (`packages/core`: parser, validation, DataModel, SurfaceStore, dynamic resolution) | **`@a2ui/web_core` exists** (npm 0.10.4): Google's framework-agnostic core with message processing, Zod validation, reactive data model (`@preact/signals-core`), binding, and registry. Official React/Lit/Angular renderers are thin layers over it. Its deps are pure JS — no DOM. | **Biggest change.** We reuse it behind a thin `ProtocolEngine` interface (ADR-0001). Cuts ~3k lines and ~2 weeks, gives conformance by construction, and strengthens the listing pitch. v1's core modules section is dead. |
| 2 | Basic catalog ≈ 12-14 components, hand-listed | **18 components** in v0.9.1: adds Icon, Video, AudioPlayer, ChoicePicker (v1 said "MultipleChoice/Select"), Divider as first-class | Catalog scope corrected; props still generated from vendored schemas (kept). |
| 3 | 5 packages + 2 apps from day one (`core`, `react-native`, `transports`, `llm`, `nativewind`) | Premature. With web_core reused, `core` collapses into an adapter; transports have no standalone consumer yet | **One installable package at MVP.** `llm` at M2, `expo-ui` at M4. Extraction when a second consumer exists (ADR-0005). |
| 4 | npm name `react-native-a2ui`, competitor holds `a2ui-react-native` | Verified 2026-07-15: **both names are unpublished.** The community renderer reserved nothing | Name confirmed free (ADR-0003). Publish early to hold it. |
| 5 | "shadcn does not run in RN" → nativewind package post-MVP | Still true, but outdated on two fronts: **`@expo/ui` is now stable and inside Expo Go (SDK 56)** — the highest-leverage adapter, not even mentioned in v1; NativeWind is mid v4→v5/Tailwind-4 churn | First adapter = `@expo/ui` (M4). NativeWind demoted behind it. |
| 6 | Tooling: tsup + vitest only | RN component tests still require Jest (+RNTL); Vitest v4 covers pure TS. Biome v2 replaces ESLint+Prettier. builder-bob builds the RN package. npm Trusted Publishing (OIDC) removes NPM_TOKEN entirely | Full 2026 stack recorded in ADR-0004. Two test runners split by file convention (`.test.ts` vs `.test.tsx`). |
| 7 | Timeline 6 weeks, human-paced | Engine work mostly disappears with web_core; implementation is AI-driven with session-sized tasks | Roadmap re-cut: M0 shrinks to a spike + adapter (~3-5 sessions). See ROADMAP.md. |
| 8 | Version note: "v0.9.1, forward-compatible with v1.0 RC" | Correct, but incomplete: **npm package versions (0.10.x) drift from spec versions (0.9.x)** | Track the npm package as wire-compat source of truth; pin minor (SPEC §8 risk table). |

## What v1 missed entirely (added)

- **The listing process is concrete:** PR editing `docs/public/reference/renderers.md` in `google/A2UI` + Discussions post; Issue #428 is the RN thread to engage. v1 hand-waved "PR/discussion".
- **AI-first repo layer:** CLAUDE.md, rules, skills, session-sized task specs, STATUS.md handoff — v1 had one paragraph of "instructions for Claude"; this repo now treats the AI harness as a first-class deliverable.
- **AI-readable docs:** llms.txt / llms-full.txt on the docs site (Fumadocs native support) — table stakes for a protocol lib whose consumers are agent developers.
- **A2A extension concrete values** (header, URI, MIME) — v1 had them right but unverified; now confirmed against the extension spec.

## Verdict

v1 was directionally right on positioning, robustness, and styling — and wrong on the single most expensive line item (building the engine). The corrected plan ships the same product with roughly half the code surface, anchored on Google's own core, which is also the strongest card we hold for official listing.
