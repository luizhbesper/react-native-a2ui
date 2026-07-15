---
name: implement-status
description: Load implementation context — the last thing implemented, current milestone/task, and what to do next. Run this at the START of every implementation session, or whenever the user asks "where are we", "what's next", "status da implementação".
---

# implement-status

Give the agent (and the user) resume-context for implementation. Do the following, then output the summary — do not start implementing anything.

## Steps

1. Read `docs/STATUS.md` — current state table, next tasks, blockers, session log.
2. Run `git log --oneline -10` and `git status --short` — what actually landed vs. what STATUS.md claims; flag any drift (uncommitted work, sessions that didn't update STATUS.md).
3. Read the current milestone spec (`docs/specs/M<n>.md`) section for the current task — its goal, files, test-first checklist, and exit criteria.
4. If STATUS.md and git history disagree, trust git and say so.

## Output format

```
## Implementation status

**Last implemented:** <one line — what shipped most recently, from session log + git log>
**Milestone:** M<n> — <name> (<done>/<total> tasks done)
**Current task:** <task id + one-line goal, or "none — next up: <task id>">
**Blockers:** <list or "none">
**Drift:** <STATUS.md vs git discrepancies, or "none">

**Next step:** <the exact next action, with its test-first checklist from the spec>
```

Keep it under 25 lines. This skill is read-only — never edit files, never start the task.
