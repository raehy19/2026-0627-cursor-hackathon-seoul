# Shared Agent Workflow

Canonical workflow for AI assistants in this repository.

## Scope
- This repository starts as a single-project docs-first template.
- Do not introduce extra workflow layers, plugin frameworks, or agent scaffolding unless the user explicitly asks.
- If the repository later grows into a multi-repo or monorepo setup, update [../DOCUMENTATION_SYSTEM.md](../DOCUMENTATION_SYSTEM.md) before spreading ownership rules across folders.

## Read Path
1. Open the assistant entry file at the repo root (`AGENTS.md` is canonical).
2. Read [SESSION_START.md](SESSION_START.md) for the current operating snapshot.
3. Read this file.
4. Read [INDEX.md](INDEX.md).
5. Load only the repo/task doc you need.
6. Read [../DOCUMENTATION_SYSTEM.md](../DOCUMENTATION_SYSTEM.md) before changing document ownership, archive policy, or versioning behavior.
7. For browser or localhost work, read [LOCAL_BROWSER_PROFILES_AND_PORTS.md](LOCAL_BROWSER_PROFILES_AND_PORTS.md).
8. Before touching tokens, keys, or `.env` values, read [SECRETS_POLICY.md](SECRETS_POLICY.md).

## Core Rules
- No false claims. Only report a command, test, browser check, or QA step as passed if you actually ran it.
- Keep diffs small. Change the minimum set of files needed for the task.
- Do not assume assistant-specific files were auto-loaded by another tool.
- Versioned docs are immutable. Copy to a new version instead of editing in place.
- New non-standard docs should use `YYYY_MMDD_HHMM_description.md` unless the repo has a stronger local convention.
- Agent instruction files and workflow docs stay in English. Product-planning docs may stay in Korean.
- Keep the number of active skills and workflow layers minimal.

## Workflow

### Planning
- Inspect the current docs and files before proposing changes.
- Prefer the smallest workable approach over process-heavy rewrites.
- Ask the user only when a decision has real product, architecture, workflow, or irreversible trade-offs.
- If docs conflict, record the conflict in `docs/operations/approval-queue.md`.

### Coding
- Update docs when code, workflow, assumptions, or status actually changed.
- Do not create app code while the repo is still in documentation-first phase unless the user explicitly asks to move into implementation.
- If the repo adopts versioned contract docs later, keep the newest snapshot, archive the previous one, and update references that point to the latest version.

### Testing
- Run checks only for the surface you touched.
- If no meaningful code exists yet, do not invent or imply validation results.
- If an environment prerequisite blocks a check, state the exact command and blocker.
- Do not claim browser, smoke, or QA verification unless you actually performed it.

### Browser Tooling
- Prefer `chrome-devtools` MCP tooling first for browser inspection, UI debugging, screenshots, console/network checks, and manual flow validation.
- Do not start with Playwright unless the user explicitly asks for it, deterministic regression coverage is required, or MCP browser tools cannot complete the task reliably.
- If the project needs assigned localhost ports, profiles, or lanes, document them in [LOCAL_BROWSER_PROFILES_AND_PORTS.md](LOCAL_BROWSER_PROFILES_AND_PORTS.md) before depending on them.

### Completion
- Default output: summarize what changed, what you verified, and what remains.
- Done means the relevant checks were run or the blocker was stated clearly, and any invalidated docs were updated.
- Update `docs/operations/current-state.md` at the end of a real work session.
- Refresh `docs/agent/SESSION_START.md` if the active situation, current phase, or critical unknowns changed.
- Create a formal status report in `docs/status/` only when the user asks for one or the work is a milestone or handoff.

## Context Engineering

Treat the context window as a curated, finite resource — not a place to dump everything.

- **Smallest high-signal set.** Before reading or pasting something into context, ask whether it is the smallest set of tokens that actually informs the next action. Skip low-signal noise: full file dumps, UUID lists, redundant tool output.
- **Progressive disclosure.** `INDEX.md` and `SESSION_START.md` exist so you can load only the one doc a task needs. Do not read the whole `docs/` tree up front.
- **Just-in-time loading.** Keep references (paths, links, queries) in the operating docs; open the body only when the task reaches it.
- **Context rot.** Recall degrades as the window fills. Prune or summarize aggressively rather than carrying stale detail forward.
- **Delegate noisy exploration.** Wide searches or large-output scans can run in a sub-agent that returns a short distilled summary, keeping the main thread clean.

## External Memory And Resume

The operating docs are this repo's durable memory. Use them so any session can resume cold.

- Write decisions, open questions, blockers, and "where I stopped" into `docs/operations/current-state.md` as you go — not only at the end.
- After any context reset or compaction, re-read `SESSION_START.md` + `current-state.md` before acting, and run one cheap sanity check before trusting prior state.
- When compacting a long session, preserve **recall first** (decisions, open bugs, dependencies, next step), then precision. Drop detail you can cheaply re-derive.

## Optional Tooling (opt-in)

Add machinery only when a concrete, repeated need appears. Do not pre-build it.

- **Skill** (`.claude/skills/<name>/SKILL.md`): a repeated multi-step procedure that does not apply every session. Cheaper than bloating an entry file; loads just-in-time.
- **Sub-agent** (`.claude/agents/`): isolate noisy exploration in its own context window; have it return a short summary.
- **Hook** (`.claude/settings.json`): a deterministic guardrail (e.g. block edits to generated files). The starter ships a minimal `permissions.deny` for secret files — see [SECRETS_POLICY.md](SECRETS_POLICY.md).
