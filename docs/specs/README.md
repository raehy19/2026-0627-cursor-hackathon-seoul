# Specs

Feature-level specifications written before code.

## Why this directory exists

The product brief defines *what we are building and for whom*. Architecture and
ADRs define *how the system is shaped*. Specs sit between them: they define
*what a specific feature must do*, in a form precise enough to drive
implementation and tests.

A spec answers, for one feature:

- Goal and user value
- Trigger / preconditions
- Expected behavior, success path
- Failure paths and recovery
- Acceptance criteria (testable)
- Out of scope

## When to write a spec

- Before starting implementation of any non-trivial feature
- When the desired behavior is not obvious from the product brief alone
- When multiple agents or contributors need a shared definition of "done"

## Style choice

Two formats are supported. Pick one per feature.

- **EARS** (`docs/templates/spec-ears-template.md`):
  Concise, structured "The system shall …" statements. Best for rule-heavy
  features (validation, authorization, calculation, integration policy).
- **Gherkin** (`docs/templates/spec-gherkin-template.md`):
  `Given / When / Then` scenarios. Best for user flows, UX behavior, and
  features that map cleanly to E2E tests.

Use `/spec-new <title> --style=ears` or `--style=gherkin` to scaffold.

## File naming

`YYYY-MM-DD-<slug>.md`, where the slug is kebab-case.

Specs are evergreen by default. If a spec describes a versioned contract that
must match a released state, follow the versioned-doc rules in
[../DOCUMENTATION_SYSTEM.md](../DOCUMENTATION_SYSTEM.md).

## Lifecycle

1. **Draft** — author fills the template; missing fields stay as `<fill>`.
2. **Ready** — all required fields filled, acceptance criteria testable.
3. **Tasked** — broken into an ordered task list via `/spec-tasks`. Each task
   traces back to a requirement ID; the file lives at
   `docs/specs/YYYY-MM-DD-<slug>.tasks.md` (see
   [../templates/tasks-template.md](../templates/tasks-template.md)).
4. **Implementing** — code and tests reference the spec and its tasks.
5. **Shipped** — feature merged. Move historical specs to `archive/` only when
   superseded by a newer spec.

## Active specs

<!-- Add one bullet per active spec. Remove when archived. -->

- *none yet*

## Relationship to other docs

- Diverges from product brief? Update the brief or open an approval queue item.
- Architectural impact? Open an ADR alongside the spec.
- E2E coverage? Link the spec from `docs/qa/e2e-scenarios.md`.
