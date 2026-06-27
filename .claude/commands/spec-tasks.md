---
description: Break a Ready spec into ordered tasks, tracing each to a requirement ID
argument-hint: "<spec file or slug>"
---

You are turning a spec into an ordered, traceable task list.

Steps:

1. Resolve the spec from `$ARGUMENTS` (a path or a slug under `docs/specs/`).
   If it is missing or ambiguous, ask the user which spec.
2. Confirm the spec status is **Ready**. If it is still **Draft**, stop and tell
   the user which required fields or acceptance criteria are unfilled.
3. Read `docs/templates/tasks-template.md` for the format.
4. Create `docs/specs/YYYY-MM-DD-<slug>.tasks.md` next to the spec.
5. For each requirement (EARS `R-<n>`) or Gherkin scenario, emit one or more
   atomic tasks. Every task must cite the requirement ID it satisfies and a
   testable **Done when** line.
6. Fill the coverage check: every requirement maps to at least one task and
   every task maps back to at least one requirement.
7. Add a one-line pointer under the spec's entry in `docs/specs/README.md`.
8. Print the new file path and diff.

Do not start implementing the feature. This command only produces the task plan.
