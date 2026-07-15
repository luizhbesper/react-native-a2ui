# react-native-a2ui

The canonical React Native renderer for Google's A2UI protocol, built on the official `@a2ui/web_core` engine. This repo is AI-first: implementation happens in Claude Code sessions driven by the specs below.

**Everything in this repository is written in English** — code, comments, docs, commits, changesets, issues. No exceptions.

## Read before implementing

1. Run `/implement-status` (or read `docs/STATUS.md`) — where we are, what's next.
2. `docs/specs/M<current>.md` — the task you're implementing, with its test-first checklist.
3. `docs/SPEC.md` (architecture scope) and `docs/ARCHITECTURE.md` (dependency rules) when touching structure.
4. Decisions live in `docs/adr/` — don't relitigate them in code; propose a new ADR if one must change.

## Session protocol

- One session = one task from the milestone spec. Don't start a task mid-way through another.
- TDD: write the failing test first, then the minimum code that passes. Tests are listed per task in the spec.
- Before ending: all checks green, `docs/STATUS.md` updated (current state + session log entry), changeset added if the change is user-facing.

## Commands

```bash
pnpm install          # workspace install
pnpm lint             # biome check .
pnpm lint:fix         # biome check --write .
pnpm typecheck        # all packages
pnpm test             # all packages (vitest + jest)
pnpm build            # all packages
pnpm changeset        # add a changeset (required for user-facing changes)
pnpm --filter react-native-a2ui test        # library only
pnpm --filter example start                 # example app (Expo)
pnpm --filter website dev                   # docs site
```

## Hard rules

- @.claude/rules/coding-style.md
- @.claude/rules/testing.md
- @.claude/rules/docs.md
- @.claude/rules/commits.md

## Boundaries — never do

- Never import `@a2ui/web_core` outside `packages/react-native-a2ui/src/engine/a2ui/` (ADR-0005).
- Never add a styling/UI dependency to the main package (ADR-0002). Adapters live in their own packages.
- Never hand-write catalog component props — derive them from the vendored schemas in `conformance/fixtures/` with a source comment.
- Never `eval` or dynamically execute anything from the wire.
- Never edit `conformance/fixtures/` contents except when re-vendoring upstream (update the provenance README in the same commit).
- Never publish manually (`npm publish` / `pnpm publish`) — releases go through the Changesets CI flow only (ADR-0007).
- Never commit secrets/API keys; the example app reads keys from env or a dev-only screen.

## Branching

`feature/*` → PR → `dev` → PR → `main` (releases via Changesets Version PR). Conventional Commits, squash-merge. See ADR-0007.
