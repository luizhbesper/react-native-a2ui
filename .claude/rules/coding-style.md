---
paths:
  - "packages/**/*.{ts,tsx}"
  - "apps/**/*.{ts,tsx}"
---

# Coding style

- TypeScript strict; no `any`. Use `unknown` + narrowing at trust boundaries — the wire is a trust boundary.
- Functions and plain objects over classes. A class needs a reason (the stateful engine adapter qualifies; a utils grab-bag does not).
- No speculative abstractions: no interface with a single implementation (sole sanctioned exception: `ProtocolEngine`, ADR-0005), no config for values that never change.
- Reuse before writing: check existing helpers and types in the package before adding new ones.
- Follow the import-direction table in `docs/ARCHITECTURE.md`; violations fail review.
- Every rendered catalog component is wrapped by the shared ErrorBoundary and must tolerate `null`/missing bound values without throwing.
- Every exported symbol gets a one-sentence JSDoc; document non-obvious params only.
- Comments state constraints the code can't express (protocol rules, schema provenance, deliberate ceilings) — never narrate what the next line does.
- Never disable a Biome rule inline without a comment stating why.
