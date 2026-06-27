---
description: Promote a resolved approval item into a new ADR
argument-hint: "<approval id>"
---

You are creating a new ADR from a resolved approval-queue item.

Steps:

1. Parse `$ARGUMENTS` as `<id>`. If missing, ask the user.
2. Read `## <id>` from `docs/operations/approval-queue.md`. The item must have
   `Status: resolved` and a `Decision:` line. If not, stop and tell the user.
3. Read `docs/templates/adr-template.md`.
4. Create a new file at `docs/architecture/adr/YYYY-MM-DD-<slug>.md` where:
   - `YYYY-MM-DD` is today
   - `<slug>` is a kebab-case version of the approval title
5. Fill in the ADR using fields from the approval item:
   - Background: from "Why it matters"
   - Options considered: from "Options"
   - Decision: from "Decision"
   - Why this option: from "Recommended option" reasoning
   - Consequences / Risks / Rollback: best effort, mark `<fill>` if unknown
6. Append a one-line back-reference to the resolved approval item:
   `Promoted to docs/architecture/adr/<file>.md on <today>`.
7. Print the ADR path and diff.

Do not edit other docs in this command.
