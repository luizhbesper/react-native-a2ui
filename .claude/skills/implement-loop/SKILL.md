---
name: implement-loop
description: Drive a whole milestone hands-off — spawn one fresh-context implementer agent per task, in order, committing each, until the milestone is done or something blocks. Use when the user says "run the implement loop", "continue the milestone", "keep implementing", or wants the status→implement→gate→commit cycle automated without re-clearing context by hand.
allowed-tools: Agent, Read, Bash
---

# implement-loop

You are the **orchestrator**, not the implementer. Your context stays lean: you only pick the next task, spawn a fresh agent to do it, and record its one-line result. Every task is implemented in a **zeroed sub-agent context** — that is how "clear context between tasks" is achieved automatically.

## Current git state

!`git log --oneline -5`

!`git status --short`

## The loop

1. Read `docs/STATUS.md` → current milestone + next task id. If the milestone's tasks are all done → **stop**, report the milestone complete.
2. Spawn **one** implementer `Agent` (`general-purpose`) for that single task, using the prompt below. Run it in the background so the user sees progress and can interrupt.
3. When it returns its status, record one log line (`<task> · <done|blocked> · <summary>`).
4. Decide:
   - `done` → go to step 1 for the next task.
   - `blocked` / gate could not be made green / the agent flagged a decision needing the user / the task needs a device or human demo (e.g. an example-app task with "no formal tests") → **stop** and surface it to the user; do not guess past it.
5. **Never** run two implementers at once — tasks share `docs/STATUS.md` and the git working tree, so they must be strictly sequential.

## Implementer agent prompt (fill in `<TASK>` and `<M<n>.md path>`)

> Fresh session on the `react-native-a2ui` repo. Follow the session protocol in `CLAUDE.md` exactly.
> Implement **only** task `<TASK>` from `docs/specs/<M<n>.md>` (read `docs/STATUS.md` first to confirm it is next). Do not start any other task.
> - TDD: write the failing test(s) the spec names first, watch them fail, then implement.
> - Make `pnpm lint`, `pnpm typecheck`, and `pnpm test` all green. If you can't, stop.
> - Update `docs/STATUS.md` (state table + one session-log line, newest first).
> - Add a changeset (`pnpm changeset`) if the change is user-facing.
> - Commit to `dev` following `.claude/rules/commits.md` (Conventional Commits, correct scope, no co-author). One logical change.
> - If you hit a design decision you cannot safely default (an API shape, a spec ambiguity), **stop and report it** — do not guess.
> Return exactly: task id · `done` or `blocked` · one-line summary · any decision the user must make.

## Notes

- The task spec in `docs/specs/M<n>.md` **is** the plan — no interactive plan-mode approval step; the agent plans internally within the spec's constraints.
- Standing authorization: the user opted into auto-commit + auto-advance when launching this loop. Committing per green task is expected, not a per-task confirmation.
- Keep the user's terminal readable: one line per finished task, then the next spawn.
