---
name: implement-status
description: Load implementation resume-context — the last thing implemented, current milestone/task, and the exact next step. Use at the start of every implementation session, or when the user asks "where are we", "what's next", or "status da implementação".
allowed-tools: Read, Grep, Glob
---

# implement-status

Report resume-context for implementation. This skill is read-only: never edit files, never start the task.

## Current git state

!`git log --oneline -10`

!`git status --short`

## Steps

1. Read `docs/STATUS.md` — current state table, next tasks, blockers, session log.
2. Compare with the git state above: flag drift (uncommitted work, commits missing from the session log). When they disagree, trust git and say so.
3. Read the current task's section in `docs/specs/M<n>.md` — goal, files, test-first checklist, exit criteria.

## Output format

```
## Implementation status

**Last implemented:** <one line, from session log + git log>
**Milestone:** M<n> — <name> (<done>/<total> tasks done)
**Current task:** <task id + one-line goal, or "none — next up: <task id>">
**Blockers:** <list or "none">
**Drift:** <STATUS.md vs git discrepancies, or "none">

**Next step:** <exact next action, with its test-first checklist from the spec>
```

Keep it under 25 lines.
