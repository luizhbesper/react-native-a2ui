# Contributing

Thanks for your interest! This repo is **AI-first**: most implementation happens in [Claude Code](https://claude.com/claude-code) sessions driven by the specs in [`docs/specs/`](./docs/specs/) — but human PRs are just as welcome and follow the same rules.

## Ground rules

- Everything in English (code, comments, docs, commits).
- Read [`CLAUDE.md`](./CLAUDE.md) — it applies to humans too: session protocol, hard rules, boundaries.
- TDD: failing test first. Test conventions in [`.claude/rules/testing.md`](./.claude/rules/testing.md).
- Conventional Commits; every user-facing change needs a changeset (`pnpm changeset`).

## Setup

```bash
pnpm install
pnpm test        # vitest + jest, all packages
pnpm lint        # biome
pnpm typecheck
```

## Workflow

1. Branch from `dev`: `feature/<short-name>`.
2. Implement (tests first), keep the conformance suite green.
3. `pnpm lint && pnpm typecheck && pnpm test` — all green locally.
4. Add a changeset if user-facing. Open a PR to `dev` (squash-merged).
5. Releases: `dev` → `main` PR; the Changesets action versions and publishes (see [ADR-0007](./docs/adr/ADR-0007-branching-and-release.md)). Never publish manually.

## Repo setup notes (maintainers)

- **Branch protection:** `main` and `dev` require PR + green CI; no force pushes.
- **npm Trusted Publishing:** configure the GitHub repo as a trusted publisher for `react-native-a2ui` on npmjs.com (Settings → Publishing access). No NPM_TOKEN secret needed.
- **Vercel:** import the repo, root directory `website/`, framework Next.js. Set the deployment as the repo's Website link.
- **GitHub SEO:** topics (`react-native`, `a2ui`, `expo`, `generative-ui`, `agent`, `ai`, `llm`, `a2a`, `typescript`, `ios`, `android`), social preview image, About = package description + docs URL.
