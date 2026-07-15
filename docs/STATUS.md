# STATUS — live implementation tracker

> **The single source of truth for "where are we".** Every implementation session MUST update this file before ending. Read by `/implement-status`. Keep entries terse; newest first in the log.

## Current state

| Field | Value |
|---|---|
| Milestone | **M0 — Engine spike + adapter** (not started) |
| Current task | none — next up: `M0-T1` (web_core Hermes/Metro spike) |
| Blockers | none |
| Conformance suite | not yet created |
| Last npm release | none |
| CI | workflows committed, first run pending on GitHub push |

## Next 3 tasks (from [specs/M0.md](./specs/M0.md))

1. **M0-T1** — Spike: web_core under Hermes/Metro (go/no-go for ADR-0001).
2. **M0-T2** — Vendor official schemas + example streams into `conformance/fixtures/`.
3. **M0-T3** — `ProtocolEngine` interface + `A2uiEngine` adapter skeleton (TDD).

## Decisions pending

- Exact `ProtocolEngine` interface shape (finalized during M0-T3 against real web_core APIs).
- Whether web_core's client-function registry covers `required`/`email` out of the box or we register them (check in M0-T1).

## Session log

<!-- Newest first. Format: date · session focus · what shipped · what's next -->

- **2026-07-15** · AI-harness compliance pass · Aligned CLAUDE.md, rules, and skills with official Claude Code best practices: removed duplicate `@` rule imports from CLAUDE.md (rules auto-load), path-scoped coding-style/testing/docs rules via `paths` frontmatter, deduplicated commit etiquette into commits.md, added `disable-model-invocation` to cut-release, dynamic git-context injection to implement-status, `$ARGUMENTS` to add-catalog-component. **Next: M0-T1.**

- **2026-07-15** · Repo bootstrap · Monorepo scaffolded (pnpm + Biome + Changesets + TS), all docs written (SPEC v2, CRITIQUE, ARCHITECTURE, ROADMAP, ADR-0001..0007, M0-M3 specs), AI harness (.claude: rules, skills, settings), package skeleton + example app + Fumadocs site, CI + release workflows, OSS files. Premises verified: npm names free; web_core 0.10.4 deps are pure JS. **Next: M0-T1.**
