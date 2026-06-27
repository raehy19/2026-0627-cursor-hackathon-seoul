# Tasks: <feature-title>

Derived from: `docs/specs/YYYY-MM-DD-<slug>.md` (spec status must be **Ready**).

This file is the bridge from a spec to code. Each task is atomic, ordered, and
traces back to a spec requirement (EARS `R-<n>` or a named Gherkin scenario).
A task is not "done" until its **Done when** line is objectively true.

## Task list

| # | Task | Traces to | Done when |
|---|------|-----------|-----------|
| 1 | <small, single-purpose step> | R-1 | <observable check / test name> |
| 2 | <next step> | R-2 | <observable check> |
| 3 | <next step> | Scenario: <name> | <observable check> |

## Sequencing notes
- <Hard ordering constraints, shared setup, or groups that can run in parallel.>

## Coverage check
- Every requirement in the spec maps to at least one task above.
- Every task maps back to at least one requirement (no orphan work).

## Out of scope for this batch
- <Work intentionally deferred. Link a follow-up spec or task set.>
