# STATUS — live implementation tracker

> **The single source of truth for "where are we".** Every implementation session MUST update this file before ending. Read by `/implement-status`. Keep entries terse; newest first in the log.

## Current state

| Field | Value |
|---|---|
| Milestone | **M0 — Engine spike + adapter** (4/5 tasks done) |
| Current task | none — next up: `M0-T5` (client capabilities + action dispatch through the adapter) |
| Blockers | none |
| web_core | `@a2ui/web_core@0.10.4` pinned; use the `/v0_9` subpath (bare import = v0_8) |
| Conformance suite | runner green: 43 basic example streams replayed through the adapter (structural + core explicit). Minimal catalog's 7 streams out of scope (no minimal impl in web_core) |
| Last npm release | none |
| CI | workflows committed, first run pending on GitHub push |

## Next task (from [specs/M0.md](./specs/M0.md))

1. **M0-T5** — Client capabilities + action dispatch through the adapter (M0 exit).

## Decisions pending

- ~~Exact `ProtocolEngine` interface shape~~ — **resolved (M0-T3): finalized in `src/engine/types.ts`** against real web_core APIs (`processMessages`/`getSurface`/`subscribeSurfaces`/`onClientMessage`; `SurfaceHandle` = `getNode`/`subscribeValue`/`setValue`/`subscribeTree`/`dispatchAction`/`theme`). Capabilities + fire-time action context land in M0-T5.
- ~~Whether web_core ships `required`/`email`~~ — **resolved (M0-T1): yes.** `BASIC_FUNCTIONS` registers `required` and `email` (plus `regex`, `length`, `numeric`); no need to register them ourselves.

## Session log

<!-- Newest first. Format: date · session focus · what shipped · what's next -->

- **2026-07-15** · M0-T4 conformance harness · The harness IS the test — replays every vendored official example stream through `A2uiEngine` (no rendering). `conformance/helpers.ts` — `loadExampleStreams` (import.meta.glob `?raw`, matching fixtures.test.ts), `declaredSurfaceIds`, `replay` (fresh engine, collects outbound `type:'error'` messages), and `replayProbing` (subscribes data-model pointers the moment the surface exists, then finishes — needed because web_core's `dataModel.subscribe` guards its first sync run with `isSync`, so **subscribe does not emit the current value**; must subscribe before the mutating message). `conformance/runner.test.ts` — `it.each` structural invariant over the **43 basic** streams (replay emits zero errors; every declared surface exists with a `root` node) + explicit tree/data-model assertions for the core `00_*` examples (simple-text, row-layout, interactive-button, simple-login-form, incremental). **Scope call:** the 7 minimal-catalog streams are out of scope for M0 — the adapter registers only the basic catalog (M0-T3) and web_core ships no minimal catalog impl (minimal's `capitalize` function has no implementation to reuse), so their `createSurface` is rejected by design; documented + count-guarded in the runner, left for a future task. **CI needed no change** — `ci.yml` already runs `pnpm --filter '!website' test` and `vitest.config.ts` already globs `conformance/**/*.test.ts`, so the runner is picked up automatically. All green (vitest 170 incl. 49 conformance + jest 1), lint + typecheck clean. Tests only, not user-facing → no changeset. **Next: M0-T5 (M0 exit).**

- **2026-07-15** · M0-T3 ProtocolEngine interface + A2uiEngine adapter · Made the ADR-0005 modularity boundary real. `src/engine/types.ts` — the sanctioned single-impl `ProtocolEngine` + `SurfaceHandle` interface, imports nothing (protocol-neutral, no web_core/React leak). `src/engine/a2ui/A2uiEngine.ts` (129 lines, ≤300 budget) — impl #1, the only web_core importer, wraps `MessageProcessor` from the `/v0_9` subpath: registers the basic catalog (`new Catalog(BASIC_CATALOG_ID, BASIC_COMPONENTS, BASIC_FUNCTIONS)`), `processMessages` validates each message with web_core's own `A2uiMessageSchema` and processes it in isolation (non-transactional — one bad message reports via `onClientMessage` + skips, never throws/aborts the rest, per SPEC §2.5), `getSurface` returns a live `SurfaceHandle` over `componentsModel`/`dataModel`, outbound actions wired via the constructor `actionHandler` (payload shape is `{event:{name,context}}` — read from web_core source). TDD, 6 Vitest behaviors (tree build + reactive `subscribeTree`, value subscription, non-transactional error reporting, unknown-surfaceId no-throw, deleteSurface teardown, outbound action). All green (vitest 121 + jest 1), lint + typecheck clean. Not exported from `src/index.ts` yet (M1) and not user-facing → no changeset. **Next: M0-T4.**

- **2026-07-15** · M0-T2 vendor conformance fixtures · Vendored the v0_9 schema + example-stream tree verbatim from the pinned `@a2ui/web_core@0.10.4` (`src/v0_9/schemas/`) into `conformance/fixtures/v0_9/` — 63 JSON files (message/catalog schemas + 50 example streams: 43 basic, 7 minimal). Added provenance `fixtures/README.md` and the TDD fixture-sanity test `conformance/fixtures.test.ts` (every file parses as JSON; every example stream matches `{name, description, messages[]}` with each message `version: "v0.9"` + ≥1 op; hard count guard 63/50 against partial re-vendor). Vendored from the pin (not live upstream) so fixtures can't drift from the engine's schemas. Harness needed no config changes (vitest/tsconfig already include `conformance/`; `files` excludes it → not published, no changeset). **Next: M0-T3.**

- **2026-07-15** · M0-T1 web_core Hermes spike · **GO.** Added `@a2ui/web_core@0.10.4` to the library; ran its v0.9 engine on the iPhone 17 Pro simulator (Hermes) via a throwaway example screen — Metro bundled 1089 modules clean, no red-box. Verified end-to-end: `createSurface`/`updateComponents`/`updateDataModel` build the tree, reactive `dataModel.subscribe` fires (Preact signals work on Hermes), `getClientCapabilities()` (zod-to-json-schema) works, `Intl.NumberFormat` present. **No polyfills needed.** API notes: v0.9 lives under the `@a2ui/web_core/v0_9` subpath (bare import = v0_8); message `version` const is `"v0.9"`; catalog matched by exact `id` (`.../v0_9/catalogs/basic/catalog.json`); build the catalog with `new Catalog(id, BASIC_COMPONENTS, BASIC_FUNCTIONS)`; component envelope is `{id, component: <type>, ...props}`. Quirks to watch (off the core path, opt-in client functions only): `formatNumber`/`formatCurrency`/`pluralize` need `Intl` (default-on in RN 0.86), `openUrl` calls `new URL()` (RN's partial polyfill). Spike screen removed; web_core dep stays for M0-T3. **Next: M0-T2.**

- **2026-07-15** · AI-harness compliance pass · Aligned CLAUDE.md, rules, and skills with official Claude Code best practices: removed duplicate `@` rule imports from CLAUDE.md (rules auto-load), path-scoped coding-style/testing/docs rules via `paths` frontmatter, deduplicated commit etiquette into commits.md, added `disable-model-invocation` to cut-release, dynamic git-context injection to implement-status, `$ARGUMENTS` to add-catalog-component. **Next: M0-T1.**

- **2026-07-15** · Repo bootstrap · Monorepo scaffolded (pnpm + Biome + Changesets + TS), all docs written (SPEC v2, CRITIQUE, ARCHITECTURE, ROADMAP, ADR-0001..0007, M0-M3 specs), AI harness (.claude: rules, skills, settings), package skeleton + example app + Fumadocs site, CI + release workflows, OSS files. Premises verified: npm names free; web_core 0.10.4 deps are pure JS. **Next: M0-T1.**
