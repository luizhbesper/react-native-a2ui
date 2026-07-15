# ADR-0004 — Tooling stack (2026)

- Status: **Accepted** · Date: 2026-07-15

## Context

Model repo, AI-driven implementation, small monorepo (1 installable package at MVP). Choices researched against the July-2026 ecosystem.

## Decision

| Concern | Choice | Rationale |
|---|---|---|
| Package manager | pnpm workspaces (`node-linker=hoisted`) | ecosystem default; hoisted avoids Metro symlink issues |
| Orchestration | none (plain pnpm `-r`) | <5 packages; Turborepo only when build times hurt |
| Build (RN pkg) | react-native-builder-bob | the RN-library standard (module + typescript targets) |
| Lint + format | Biome v2, single `biome.json` | one binary, recommended preset, no plugin zoo |
| Tests | Vitest (`*.test.ts`, pure TS) + Jest `react-native` preset + RNTL (`*.test.tsx`, components) | RN component testing still requires Jest; file-extension convention splits runners cleanly |
| Release | Changesets → Version PR → npm Trusted Publishing (OIDC, provenance) | no NPM_TOKEN; root CHANGELOG.md per release |
| Docs | Fumadocs on Vercel + llms.txt/llms-full.txt | SEO + AI-readable docs native (ADR-0006) |

## Consequences

- (+) Fast, modern, minimal config; every command is one `pnpm` script (AI-friendly).
- (−) Two test runners — accepted as the boring-correct 2026 reality; unify via vitest-native only if it matures.
- (−) TypeScript 7 (native) at root — if builder-bob or a tool chokes on it, pin `typescript@~5.9` in the affected package (note for M0).
