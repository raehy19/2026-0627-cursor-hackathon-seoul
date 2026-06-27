# Shared Agent Workflow

Canonical workflow for AI assistants in this repository.

## Read path

1. `AGENTS.md`
2. [SESSION_START.md](SESSION_START.md)
3. This file
4. [INDEX.md](INDEX.md) — load task docs only as needed
5. [SECRETS_POLICY.md](SECRETS_POLICY.md) before touching keys or `.env`
6. [LOCAL_BROWSER_PROFILES_AND_PORTS.md](LOCAL_BROWSER_PROFILES_AND_PORTS.md) for browser work

## Core rules

- No false claims — only report checks you actually ran.
- Keep diffs small; match existing code style.
- Update docs when behavior or repo layout changes.
- Conflicts → `docs/operations/approval-queue.md`, do not guess.
- Agent docs in English; product PRD may be Korean.

## Workflow

### Planning

- Read PRD + `current-state.md` before large changes.
- Prefer the smallest approach that meets the PRD.

### Coding

- App code lives in `web/`.
- Never commit files under `data/chat-exports/`.
- Update `current-state.md` when session work materially changes status.

### Testing

- After code changes: `cd web && npm run build` (and `npm run validate` if parser/stats touched).
- State blockers explicitly if a check cannot run.

### Completion

- Summarize changes, what was verified, what remains.
- Refresh `SESSION_START.md` if phase or focus changed.

## Context engineering

- Use `INDEX.md` for progressive disclosure — do not read all of `docs/` upfront.
- Preserve decisions in `current-state.md`, not only in chat.
