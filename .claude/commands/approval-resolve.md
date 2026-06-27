---
description: Mark an approval item resolved and route it to ADR or archive
argument-hint: "<approval id> <decision summary>"
---

You are resolving an open approval item.

Steps:

1. Parse `$ARGUMENTS` as `<id> <decision summary>`. If `<id>` is missing, ask.
2. Open `docs/operations/approval-queue.md` and locate `## <id>. ...`.
3. Update that section in place:
   - Set `Status: resolved`
   - Add `Resolved: <today YYYY-MM-DD>`
   - Add `Decision: <decision summary>`
4. Decide the routing based on impact:
   - **High-impact** (architecture, schema, contract, auth, irreversible) →
     run `/promote-to-adr <id>` next.
   - **Low-impact** (operating preference, lightweight convention) →
     append a one-liner to `docs/learnings/` and move the resolved item to
     the `## Resolved (archive)` section at the bottom of the queue.
5. If the queue does not yet have a `## Resolved (archive)` section, create one.
6. Print the diff to the user and recommend the next command.

Do not auto-create the ADR yourself; only suggest `/promote-to-adr`.
