---
description: Append a lightweight repo-wide convention or learning
argument-hint: "<short rule, one sentence>"
---

You are adding a learning.

Steps:

1. If `$ARGUMENTS` is empty, ask the user for the rule.
2. Open `docs/learnings/README.md`.
3. Append a new bullet under the most relevant section using this format:
   `- <rule>. — <date YYYY-MM-DD>` plus an optional `(Why: <reason>)` clause.
4. If the rule is more than one sentence or has a real rationale, instead create
   a dedicated file at `docs/learnings/YYYY-MM-DD-<slug>.md` from
   `docs/templates/learning-template.md` and link it from the README.
5. Print the diff. Do not promote the learning to an ADR — that is what the
   approval queue and `/promote-to-adr` are for.
