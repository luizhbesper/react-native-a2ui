---
name: cut-release
description: Prepare and ship an npm release via the Changesets flow. Use when the user says "release", "publish", "cut a version", "lançar versão".
---

# cut-release

Releases are CI-driven (ADR-0007). This skill prepares; CI publishes. NEVER run `npm publish`/`pnpm publish`/`changeset publish` locally.

## Steps

1. **Preflight** on `dev`: `pnpm lint && pnpm typecheck && pnpm test && pnpm build` — all green, conformance included.
2. **Changesets present?** `ls .changeset/*.md` (besides README). If a user-facing change lacks one, add it now with changelog-quality text.
3. **Merge `dev` → `main`** via PR (never direct push). CI must be green on the PR.
4. On `main`, the Changesets action opens/updates the **"Version Packages" PR** — review it: version bumps correct (pre-1.0: breaking = minor), root `CHANGELOG.md` entry reads well for users.
5. **Merge the Version PR.** CI publishes to npm via Trusted Publishing (OIDC) with provenance.
6. **Verify:** `npm view react-native-a2ui version` shows the new version; provenance badge on the npm page; GitHub release/tag created.
7. **Close out:** update `docs/STATUS.md` (Last npm release field + session log), announce if the release is notable.
