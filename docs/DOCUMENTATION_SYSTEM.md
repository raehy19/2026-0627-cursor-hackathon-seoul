# Documentation Governance

This document defines how repository documents are owned, versioned, and archived.

## Principle: Single Source Of Truth
- Each operating fact should have one canonical home.
- Do not create parallel copies of the same rule, status, or contract document.
- If a document exists only to repeat another document, replace it with a link or a short pointer.

## Document Categories

| Category | Default location | Notes |
|----------|------------------|-------|
| Assistant workflow and control docs | `docs/agent/` and root assistant entry files | English only |
| Session recovery and operating state | `docs/operations/` | Living docs |
| Product definition and planning | `docs/project/` and `docs/plans/` | Korean allowed |
| Architecture and ADRs | `docs/architecture/` | Add only after scope is clear |
| Formal status or handoff reports | `docs/status/` | Archive older reports |
| Reusable doc formats | `docs/templates/` | English control language |

## Ownership Rules
- `AGENTS.md`, `CLAUDE.md`, and `.cursor/rules/*.mdc` are entry files, not the full source of truth. Keep them thin and point them at shared docs.
- `docs/agent/WORKFLOW.md` is the shared assistant workflow source of truth.
- `docs/operations/current-state.md` is the source of truth for session recovery.
- `docs/status/` is for standalone reporting artifacts, not day-to-day recovery notes.
- If the repository later adds app, API, infra, or DB subdomains, define their ownership here before scattering docs into new folders.

## Versioned Documents
- Evergreen docs keep stable paths and are edited in place.
- Versioned contract docs are immutable once published.
- If the project introduces versioned contract docs later, use this pattern:
  - Keep the newest active snapshot in the canonical folder
  - Move older snapshots to an `archive/` subfolder
  - Update references that point to the latest snapshot
- Typical candidates for versioned docs:
  - DB schema snapshots
  - API contract snapshots
  - Release or migration runbooks that must match a specific state

## Naming Rules
- Standard evergreen docs use stable names such as `README.md`, `current-state.md`, or `product-brief.md`.
- New non-standard docs should use `YYYY_MMDD_HHMM_description.md`.
- ADRs use `YYYY-MM-DD-topic.md`.

## Archive Rules
- Do not archive active operating docs such as `current-state.md`, `todo-plan.md`, or `approval-queue.md`.
- Archive completed or superseded formal reports under `docs/status/archive/`.
- Archive superseded versioned snapshots under the relevant `archive/` folder.
- Do not archive a document unless a current replacement or a deliberate end-state exists.

## Conflict Rules
- If two docs disagree, do not guess.
- Record the conflict in `docs/operations/approval-queue.md`.
- Until resolved, use the more conservative interpretation.

## Decision Flow

The repo separates three layers of decisions to keep each one healthy.

| Layer | Where it lives | Lifetime | When to use |
|-------|----------------|----------|-------------|
| Open question | `docs/operations/approval-queue.md` | Until resolved | A decision is needed but not yet made |
| Lightweight convention | `docs/learnings/` | Evergreen | Repo-wide micro-rule that does not need formal review |
| Durable architectural decision | `docs/architecture/adr/` | Immutable, supersede with new ADR | Architecture, schema, contract, auth, irreversible scope choices |

Routing rules when an approval item is resolved:

1. If the decision is architectural, structural, or hard to reverse, run
   `/promote-to-adr <id>`. This creates an ADR and moves the resolved item
   into `## Resolved (archive)` of the queue with a back-reference.
2. If the decision is a lightweight convention, run `/learning-add` and move
   the resolved queue item into `## Resolved (archive)` with a link to the
   learning entry.
3. Never leave a resolved item in the active list. The active list represents
   only **open** decisions.

## Expansion Rule
- When the project grows beyond this starter shape, update this document first, then add new folders, status types, or versioned-document families.
