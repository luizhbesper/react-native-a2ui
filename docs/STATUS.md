# STATUS — live implementation tracker

> **The single source of truth for "where are we".** Every implementation session MUST update this file before ending. Read by `/implement-status`. Keep entries terse; newest first in the log.

## Current state

| Field | Value |
|---|---|
| Milestone | **M0 — Engine spike + adapter** (1/5 tasks done) |
| Current task | none — next up: `M0-T2` (vendor schemas + example streams) |
| Blockers | none |
| web_core | `@a2ui/web_core@0.10.4` pinned; use the `/v0_9` subpath (bare import = v0_8) |
| Conformance suite | not yet created |
| Last npm release | none |
| CI | workflows committed, first run pending on GitHub push |

## Next 3 tasks (from [specs/M0.md](./specs/M0.md))

1. **M0-T2** — Vendor official schemas + example streams into `conformance/fixtures/`.
2. **M0-T3** — `ProtocolEngine` interface + `A2uiEngine` adapter skeleton (TDD).
3. **M0-T4** — Conformance harness replaying official streams.

## Decisions pending

- Exact `ProtocolEngine` interface shape (finalized during M0-T3 against real web_core APIs).
- ~~Whether web_core ships `required`/`email`~~ — **resolved (M0-T1): yes.** `BASIC_FUNCTIONS` registers `required` and `email` (plus `regex`, `length`, `numeric`); no need to register them ourselves.

## Session log

<!-- Newest first. Format: date · session focus · what shipped · what's next -->

- **2026-07-15** · M0-T1 web_core Hermes spike · **GO.** Added `@a2ui/web_core@0.10.4` to the library; ran its v0.9 engine on the iPhone 17 Pro simulator (Hermes) via a throwaway example screen — Metro bundled 1089 modules clean, no red-box. Verified end-to-end: `createSurface`/`updateComponents`/`updateDataModel` build the tree, reactive `dataModel.subscribe` fires (Preact signals work on Hermes), `getClientCapabilities()` (zod-to-json-schema) works, `Intl.NumberFormat` present. **No polyfills needed.** API notes: v0.9 lives under the `@a2ui/web_core/v0_9` subpath (bare import = v0_8); message `version` const is `"v0.9"`; catalog matched by exact `id` (`.../v0_9/catalogs/basic/catalog.json`); build the catalog with `new Catalog(id, BASIC_COMPONENTS, BASIC_FUNCTIONS)`; component envelope is `{id, component: <type>, ...props}`. Quirks to watch (off the core path, opt-in client functions only): `formatNumber`/`formatCurrency`/`pluralize` need `Intl` (default-on in RN 0.86), `openUrl` calls `new URL()` (RN's partial polyfill). Spike screen removed; web_core dep stays for M0-T3. **Next: M0-T2.**

- **2026-07-15** · AI-harness compliance pass · Aligned CLAUDE.md, rules, and skills with official Claude Code best practices: removed duplicate `@` rule imports from CLAUDE.md (rules auto-load), path-scoped coding-style/testing/docs rules via `paths` frontmatter, deduplicated commit etiquette into commits.md, added `disable-model-invocation` to cut-release, dynamic git-context injection to implement-status, `$ARGUMENTS` to add-catalog-component. **Next: M0-T1.**

- **2026-07-15** · Repo bootstrap · Monorepo scaffolded (pnpm + Biome + Changesets + TS), all docs written (SPEC v2, CRITIQUE, ARCHITECTURE, ROADMAP, ADR-0001..0007, M0-M3 specs), AI harness (.claude: rules, skills, settings), package skeleton + example app + Fumadocs site, CI + release workflows, OSS files. Premises verified: npm names free; web_core 0.10.4 deps are pure JS. **Next: M0-T1.**
