# Coding style

- TypeScript strict; no `any` (use `unknown` + narrowing at trust boundaries — the wire is a trust boundary).
- Functions and plain objects over classes; a class needs a reason (stateful engine adapter qualifies; a utils grab-bag does not).
- No speculative abstractions: no interface with one implementation (the sole sanctioned exception is `ProtocolEngine`, ADR-0005), no config for values that never change.
- Reuse before writing: check existing helpers/types in the package before adding new ones.
- Respect the dependency rules table in `docs/ARCHITECTURE.md` — import direction violations fail review.
- Every rendered catalog component is wrapped by the shared ErrorBoundary; components must tolerate `null`/missing bound values without throwing.
- Comments state constraints the code can't (protocol rules, schema provenance, deliberate ceilings) — never narrate what the next line does.
- Biome is the single formatter/linter; never disable a rule inline without a comment stating why.
