# Agent Context Index

Read only the document relevant to your current task. Do not read all docs at once.

## Situational Lookup

| What are you doing? | Read this |
|---------------------|-----------|
| Starting any task | [SESSION_START.md](SESSION_START.md) → [WORKFLOW.md](WORKFLOW.md) |
| Deciding what docs govern the repo | [../DOCUMENTATION_SYSTEM.md](../DOCUMENTATION_SYSTEM.md) |
| Recovering the latest session state | [../operations/current-state.md](../operations/current-state.md) |
| Checking active priorities | [../operations/todo-plan.md](../operations/todo-plan.md) |
| Handling a blocked decision or conflict | [../operations/approval-queue.md](../operations/approval-queue.md) |
| Defining product scope | [../project/product-brief.md](../project/product-brief.md) |
| Writing a feature spec before code | [../specs/README.md](../specs/README.md) |
| Breaking a Ready spec into tasks | [../templates/tasks-template.md](../templates/tasks-template.md) → `/spec-tasks` |
| Keeping the context window lean | [WORKFLOW.md](WORKFLOW.md) → "Context Engineering" |
| Reviewing architecture direction | [../architecture/README.md](../architecture/README.md) |
| Capturing a lightweight convention | [../learnings/README.md](../learnings/README.md) |
| Writing or updating a formal status report | [status_report.md](status_report.md) |
| Working on browser or localhost policy | [LOCAL_BROWSER_PROFILES_AND_PORTS.md](LOCAL_BROWSER_PROFILES_AND_PORTS.md) |
| Touching tokens, keys, or `.env` values | [SECRETS_POLICY.md](SECRETS_POLICY.md) |
| Applying this harness to a different existing repo | [APPLY_HARNESS.md](APPLY_HARNESS.md) |
| Updating reusable doc formats | [../templates/README.md](../templates/README.md) |
| Reviewing E2E validation viewpoints | [../qa/e2e-scenarios.md](../qa/e2e-scenarios.md) |

## Tool Entry Files

`AGENTS.md` is the canonical entry. Other tool-specific entry files are thin
pointers that must not duplicate rules:

- Codex / generic AI: `AGENTS.md` (canonical)
- Claude Code: `CLAUDE.md` → `AGENTS.md`
- Cursor: `.cursor/rules/00-entry.mdc` → `AGENTS.md`

Do not assume any of these were auto-loaded by another tool. If you support a
different assistant (Aider, Continue, Windsurf, Zed, Cline, etc.), add a one-line
pointer file in the format that tool expects and keep `AGENTS.md` as the source.
