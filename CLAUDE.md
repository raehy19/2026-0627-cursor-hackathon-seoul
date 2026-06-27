# Claude Code Entry

This file is a thin pointer. The canonical entry document is [AGENTS.md](AGENTS.md).

Claude Code loads this file automatically. The two lines below use Claude Code's
native `@import` syntax so the canonical rules and the current session snapshot
are actually pulled into context at session start. A plain Markdown link is **not**
auto-loaded — only `@path` imports are.

@AGENTS.md
@docs/agent/SESSION_START.md

Read next, on demand (not auto-imported — open only when the task needs them):

1. [docs/agent/WORKFLOW.md](docs/agent/WORKFLOW.md)
2. [docs/agent/INDEX.md](docs/agent/INDEX.md)

Do not duplicate rules into this file. Update `AGENTS.md` instead.
