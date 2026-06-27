---
description: Append a new approval-queue item with an auto-numbered ID
argument-hint: "<short title for the decision>"
---

You are adding a new approval item.

Steps:

1. Read `docs/operations/approval-queue.md`.
2. Determine the next numeric ID by scanning existing `## N. ...` headings.
3. Read `docs/templates/approval-item-template.md` for required fields.
4. Append a new section using this skeleton:

   ```text
   ## <next-id>. <title from $ARGUMENTS>

   - Status: open
   - Opened: <today YYYY-MM-DD>
   - Why it matters: <fill>
   - Options:
     - <option A>
     - <option B>
   - Recommended option: <fill>
   - Risks: <fill>
   - Affected areas: <fill>
   ```

5. If `$ARGUMENTS` is empty, ask the user for a title before appending.
6. Print the new section back to the user. Do not invent the recommendation —
   if it is not obvious, leave `<fill>` placeholders and tell the user.

Do not edit any other doc in this command.
