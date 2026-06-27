# Learnings

Lightweight, repo-wide conventions and "things we agreed on" that do not deserve
a full ADR but are worth keeping in one place.

## What belongs here

- "We always do X in this repo" rules
- Naming, structure, or workflow micro-decisions
- Lessons learned from a small incident or surprise
- Patterns that proved correct after we tried alternatives

## What does NOT belong here

- Architecture, schema, contract, auth, or scope decisions → use an ADR.
- Open questions → use the approval queue.
- Per-feature behavior → use a spec under `docs/specs/`.
- Session state, status, or todos → use `docs/operations/`.

## How to add a learning

- One-liners: append a bullet under the right section below.
- Anything longer than a sentence: copy `../templates/learning-template.md`
  to `docs/learnings/YYYY-MM-DD-<slug>.md` and link it from the right section.
- Use `/learning-add "<rule>"` to do this automatically.

## Conventions

### Documentation
- The canonical agent entry is `AGENTS.md`. Other entry files are 1–3 line pointers. — 2026-05-03
- Agent-facing docs are English; product-facing docs may be Korean. — 2026-05-03
- Versioned contract docs are immutable; copy to a new file instead of editing. — 2026-05-03

### Process
- Resolved approval items must be promoted to ADR or routed to a learning before being archived. — 2026-05-03
- Specs come before implementation for any non-trivial feature. — 2026-05-03

### Tooling
- Conventional Commits are enforced by `lefthook` `commit-msg` hook. — 2026-05-03
- `gitleaks` runs on every commit; placeholder tokens in operations docs block commits. — 2026-05-03

## Long-form learnings

<!-- Link individual files added via /learning-add or manually. -->

_None yet._
