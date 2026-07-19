---
paths:
  - "docs/**/*.md"
  - "website/**"
  - "README.md"
---

# Documentation

- ADRs use short MADR format (context, decision, consequences) in `docs/adr/`, numbered sequentially. A reversed decision gets a new superseding ADR.
- `docs/STATUS.md` entries are terse: state table updated in place, one session-log line, newest first.
- README stays scannable: install + quickstart above the fold; deep content belongs on the docs site (`website/content/docs/`).
- Docs pages state facts and steps — no marketing prose inside `website/content/docs/`.
