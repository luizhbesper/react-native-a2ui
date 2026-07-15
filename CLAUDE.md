# react-native-a2ui

Canonical React Native renderer for Google's A2UI protocol, built on the official `@a2ui/web_core` engine. Implementation is AI-driven: one milestone task per session, defined in `docs/specs/M<n>.md`.

IMPORTANT: everything in this repository is written in English — code, comments, docs, commits, changesets.

## Commands

```bash
pnpm lint             # biome check .
pnpm typecheck        # all packages
pnpm test             # all packages (vitest for *.test.ts, jest for *.test.tsx)
pnpm build            # all packages
pnpm changeset        # add a changeset (required for user-facing changes)
pnpm --filter react-native-a2ui test        # library only
pnpm --filter example start                 # example app (Expo)
pnpm --filter website dev                   # docs site
```

## Session protocol

- Start every implementation session with `/implement-status`.
- One session = one task from the current `docs/specs/M<n>.md`. Don't start a task mid-way through another.
- TDD: write the failing test first. The task spec lists exactly which tests — implement those, then stop.
- Before ending: `pnpm lint`, `pnpm typecheck`, `pnpm test` all green; update `docs/STATUS.md` (state table + one session-log line); add a changeset if the change is user-facing.

## Architecture constraints

- Only `packages/react-native-a2ui/src/engine/a2ui/` may import `@a2ui/web_core` (ADR-0005). Renderer, catalog, and transports depend on the `ProtocolEngine` interface only.
- No styling or UI dependencies in the main package (ADR-0002). Adapter catalogs live in their own packages.
- Catalog component props are derived from the vendored schemas in `packages/react-native-a2ui/conformance/fixtures/` with a source comment — never hand-written.
- Never eval or dynamically execute anything from the wire. Unknown component → render nothing + dev warning.
- `conformance/fixtures/` is vendored upstream content: edit only when re-vendoring, and update the provenance README in the same commit.
- Decisions live in `docs/adr/`. Reversing one requires a superseding ADR, never a silent edit.
- No secrets in the repo; the example app reads API keys from env or a dev-only screen.

## Key docs

- `docs/STATUS.md` — live tracker, single source of truth for "where are we"
- `docs/specs/` — session-sized task specs per milestone
- `docs/SPEC.md`, `docs/ARCHITECTURE.md` — scope and dependency rules
