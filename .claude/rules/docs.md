# Documentation

- Everything in English.
- Every exported symbol of the library gets JSDoc: one sentence of purpose + params that aren't obvious. No JSDoc essays.
- User-facing changes update the matching docs page in `website/content/docs/` in the same PR (once the site exists; before that, the README section).
- Architecture-level decisions get an ADR in `docs/adr/` (short MADR: context, decision, consequences). Reversing a decision = new ADR superseding the old, never a silent edit.
- `docs/STATUS.md` is updated at the end of every implementation session — current state table + one session-log line. This is non-negotiable; `/implement-status` depends on it.
- README stays scannable: install + quickstart above the fold; deep content belongs on the docs site.
