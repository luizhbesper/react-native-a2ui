# Commits, branches & releases

- Conventional Commits, English, imperative: `feat(catalog): add Slider two-way binding`.
- Scopes: `engine`, `renderer`, `catalog`, `theme`, `transports`, `llm`, `example`, `docs`, `ci`, `repo`.
- One logical change per commit; PRs are squash-merged. No co-author trailers.
- Branch flow: `feature/*` → PR → `dev` → PR → `main` (ADR-0007). Never commit directly to `main`.
- Every user-facing change ships with a changeset (`pnpm changeset`) written for users, changelog-quality, and updates the matching docs page in the same PR. Pre-1.0: breaking changes bump minor.
- Releases happen only through the Changesets CI flow — never run `npm publish`, `pnpm publish`, or `changeset publish` locally.
