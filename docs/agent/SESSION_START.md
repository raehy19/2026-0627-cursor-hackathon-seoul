# Session Start

The single page an assistant should read first. Keep this document under ~150 lines.
This page summarizes the **current** operating state. Do not put policies here —
policies belong in `AGENTS.md` and `WORKFLOW.md`.

Last refreshed:
- 2026-06-14 (UTC+09:00)

## What this repository is

Documentation-first project starter. No application code exists yet. The goal is
to lock product direction and operating discipline before implementation begins.

## Read order on session start

1. This file.
2. `AGENTS.md` — canonical rules.
3. `docs/agent/WORKFLOW.md` — operating loop.
4. `docs/agent/INDEX.md` — situational lookup.
5. Only the task-specific doc you actually need.

If a doc here disagrees with `AGENTS.md`, `AGENTS.md` wins.

## Current phase

Phase 0 — documentation starter baseline. No app code. No architecture lock-in.

## Active focus

- The harness is now standardized on `AGENTS.md` as the canonical entry, and
  `CLAUDE.md` imports it natively (`@AGENTS.md`) so the rules actually load.
- 2026-06-14 alignment pass landed: spec → tasks bridge (`/spec-tasks`), explicit
  Definition of Done, context-engineering + resume rules, enforced secret-file
  deny in `.claude/settings.json`, and `.mcp.json.example`.
- Verification automation (lefthook, markdownlint, lychee, gitleaks) is configured
  but not necessarily installed locally yet. CI runs them on every PR.
- Specs, learnings, and approval-queue exit rules are in place but mostly empty.

## What is safe to do without approval

- Update operating docs in `docs/operations/` and `docs/agent/`.
- Refresh this file when situation changes.
- Add new learnings under `docs/learnings/` for repo-wide micro-conventions.
- Scaffold a spec under `docs/specs/` from the templates.
- Replace placeholders such as `<project-name>` and `<YYYY-MM-DD>` with real values.

## What requires approval before execution

- Choosing the product problem statement, primary user, MVP scope, or platform.
- Initializing a tech stack, framework, or deployment target.
- Adding or removing top-level directories outside the documented document map.
- Any change captured under "Approval Rules" in `AGENTS.md`.

## Critical unknowns

- Product problem statement
- Primary user
- Core user flows
- MVP scope (in / out)
- Tech stack
- Platform scope
- License decision

## Pointers for the most common follow-ups

- Approval queue: `docs/operations/approval-queue.md`
- Active priorities: `docs/operations/todo-plan.md`
- Live recovery log: `docs/operations/current-state.md`
- Product brief draft: `docs/project/product-brief.md`
- Spec scaffolding: `docs/specs/README.md`
- Lightweight conventions: `docs/learnings/README.md`
- Secrets and MCP token policy: `docs/agent/SECRETS_POLICY.md`
- Browser/localhost lanes: `docs/agent/LOCAL_BROWSER_PROFILES_AND_PORTS.md`
- Applying this harness to a different existing repo: `docs/agent/APPLY_HARNESS.md`

## How to refresh this file

This file is meant to stay short and current. Refresh it when any of these change:

- Active focus or current phase
- What is safe vs. requires approval
- The set of critical unknowns
- The most relevant follow-up pointers

Use the `/session-start` command to refresh from current operating docs, or edit
this file directly. Always update the `Last refreshed` line on top.
