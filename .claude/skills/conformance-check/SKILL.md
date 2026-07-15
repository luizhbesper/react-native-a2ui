---
name: conformance-check
description: Run the A2UI conformance suite against the vendored official example streams and report compliance. Use before releases, after engine/adapter changes, when bumping @a2ui/web_core, or when the user asks "are we spec-compliant".
---

# conformance-check

The conformance suite replays every official example stream from `google/A2UI` and asserts the resulting component tree + data model. Green = our compliance badge.

## Steps

1. Run: `pnpm --filter react-native-a2ui test -- conformance` (the suite lives in `packages/react-native-a2ui/conformance/`).
2. On failure: identify whether the break is (a) our adapter, (b) an upstream web_core change, or (c) stale fixtures. Never weaken assertions to pass.
   - (a) → fix the adapter, TDD.
   - (b) → check web_core release notes; pin or adapt; consider upstream issue.
   - (c) → re-vendor fixtures from upstream `specification/` and update the provenance README (source commit hash) in the same commit.
3. When bumping `@a2ui/web_core`: run the suite before and after; diff behavior, record notable changes in `docs/STATUS.md`.
4. Report: fixtures passed/total, spec version covered, web_core version. If green and this validates a release or a version bump, note it in `docs/STATUS.md`.
