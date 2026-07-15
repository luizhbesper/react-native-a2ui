# Commits & changesets

- Conventional Commits, English, imperative: `feat(catalog): add Slider two-way binding`, `fix(engine): process remaining batch after invalid message`.
- Scopes: `engine`, `renderer`, `catalog`, `theme`, `transports`, `llm`, `example`, `docs`, `ci`, `repo`.
- One logical change per commit; squash-merge PRs so branch history stays clean.
- No co-author trailers.
- Every user-facing change ships with a changeset (`pnpm changeset`): patch = fixes, minor = features, major = breaking (pre-1.0: breaking = minor, per Changesets convention). The changeset text is changelog-quality — written for users, not for reviewers.
- Never commit directly to `main`. Flow: `feature/*` → `dev` → `main` (ADR-0007).
