---
description: Write a Section A–E checkpoint and refresh current-state
argument-hint: "[optional summary line]"
---

You are creating a session checkpoint.

Steps:

1. Read `docs/templates/session-checkpoint-template.md` for the format.
2. Append a new dated checkpoint to the bottom of `docs/operations/current-state.md`
   using sections A–E:
   - A. What I reviewed
   - B. Safe work completed
   - C. Findings
   - D. Pending approval
   - E. Next safe actions
3. Update `Last updated` at the top of `docs/operations/current-state.md` to
   today's date.
4. If any item under D is new, also append a corresponding entry to
   `docs/operations/approval-queue.md` using the next available numeric ID.
5. If active focus or critical unknowns changed, also refresh
   `docs/agent/SESSION_START.md`.
6. Print the new checkpoint diff to the user.

Do not run tests, builds, or external tools as part of this command.
