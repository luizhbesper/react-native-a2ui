# ADR-0007 — Branching model and release flow

- Status: **Accepted** · Date: 2026-07-15

## Context

Requirement: OSS best practices with `main`/`dev`/`feature` branches, `main` publishing npm versions, root CHANGELOG per release, simple CI.

## Decision

- Branches: `feature/*` → PR → `dev` (integration; CI: lint, typecheck, both test suites, conformance, build) → PR → `main` (release branch).
- Every user-facing change lands with a Changesets entry (enforced by review; the changeset bot comments on PRs missing one).
- On `main`, the Changesets GitHub Action opens/updates a "Version Packages" PR (bumps versions, writes CHANGELOG.md at root and per package). Merging it publishes to npm via **Trusted Publishing (OIDC)** with provenance — no NPM_TOKEN secret.
- Conventional Commits (English) for messages; squash-merge PRs.

## Consequences

- (+) Human-readable changelogs from changesets; zero-secret publishing; `main` always == released state.
- (−) Two-step PR flow (dev → main) adds a hop; accepted for release discipline. Direct hotfix to `main` allowed with backport to `dev`.
