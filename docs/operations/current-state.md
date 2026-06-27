# Current State / Session Recovery

Last updated:
- 2026-06-14

## Current Phase
- Phase 0. Documentation starter baseline + harness hardening pass
- 2026-06-14: alignment pass against 2026 agent conventions + real-project patterns

## Repository Status
- Created from the documentation starter
- Git-initialized on `main`
- No application code exists yet
- Product requirements are still undefined
- Operating-document baseline is in place
- Verification automation (lefthook + markdownlint + lychee + gitleaks + GitHub Actions) configured but not yet installed locally
- `AGENTS.md` is now the canonical entry; `CLAUDE.md` and `.cursor/rules/00-entry.mdc` are thin pointers

## Completed in the 2026-06-14 pass
- Fixed the Claude Code import gap: `CLAUDE.md` now uses native `@AGENTS.md` + `@docs/agent/SESSION_START.md` imports so canonical rules actually load into context (a Markdown link does not auto-load)
- Added the spec → tasks bridge: `docs/templates/tasks-template.md` + `/spec-tasks` command, tracing each task to an EARS/Gherkin requirement ID; updated specs lifecycle to a `Tasked` stage
- Added an explicit `## Definition of Done` to `AGENTS.md` (no-false-claims + doc-sync made concrete)
- Added a `Context Engineering`, `External Memory And Resume`, and opt-in tooling section to `WORKFLOW.md`
- Turned the secrets policy into a guardrail: minimal `.claude/settings.json` `permissions.deny` for `.env*`/keys/PEM + `ask` on force-push
- Added `.mcp.json.example` (Supabase + chrome-devtools) with env-var token expansion, documented in `SECRETS_POLICY.md`
- Upgraded `LOCAL_BROWSER_PROFILES_AND_PORTS.md` with a lane registry, suggested port ranges, and a collision checklist
- Propagated all of the above into `APPLY_HARNESS.md`, `INDEX.md`, `README.md`, and the templates index

## Completed in the 2026-05-03 pass
- Standardized on `AGENTS.md` as the canonical entry, slimmed other entry files to pointers
- Added local + CI verification: `lefthook.yml`, `.markdownlint.json`, `lychee.toml`, `.gitleaks.toml`, `.github/workflows/docs-check.yml`
- Added `docs/agent/SESSION_START.md` as the one-page session snapshot
- Added Claude slash commands under `.claude/commands/` (`session-start`, `checkpoint`, `approval-add`, `approval-resolve`, `promote-to-adr`, `learning-add`, `spec-new`)
- Added `docs/specs/` with EARS and Gherkin templates
- Added approval-queue lifecycle (open → resolved → routed) with archive section
- Added Conventional Commits enforcement (`commit-msg` hook + `.gitmessage`) and `release-please` workflow + config
- Added `degit` / `gh repo create --template` quick-start to `README.md`
- Added `docs/learnings/` with category structure and template
- Added `docs/agent/SECRETS_POLICY.md` and an MCP permission matrix
- Added `docs/agent/APPLY_HARNESS.md`: conflict-aware playbook for applying this harness to an existing repo (audit → plan → apply → verify), expanded to cover the full operating discipline (core principles, governance, agent workflow/index, operating docs, taxonomy folders, templates, verification, commands, commits/release, secrets, browser/lane policy) and a doc-taxonomy cheat sheet
- Extended `README.md` with first-prompt examples, cross-repo application instructions, and a slash command catalog
- Updated `WORKFLOW.md`, `INDEX.md`, `CONTRIBUTING.md`, `DOCUMENTATION_SYSTEM.md`, `docs/README.md` to reflect the new layout

## Confirmed Operating Principles
- Documentation comes before implementation
- Unclear items go to the approval queue and are routed (ADR or learning) on resolve
- Session-recovery state lives in repository docs
- Technical decisions stay open until product scope is defined
- Formal status reports are optional and belong in `docs/status/`

## Critical Unknowns
- Problem to solve
- Target users
- Core user flows
- MVP scope
- Tech stack
- Platform scope
- License decision

## Read These First Next Time
- [AGENTS.md](../../AGENTS.md)
- [docs/agent/SESSION_START.md](../agent/SESSION_START.md)
- [docs/operations/todo-plan.md](todo-plan.md)
- [docs/operations/approval-queue.md](approval-queue.md)
- [docs/project/product-brief.md](../project/product-brief.md)

## Next Safe Actions
- Reflect the product idea into the product brief
- Resolve approval-queue items 1–5 with the user, then route via `/promote-to-adr` or `/learning-add`
- Turn the E2E checklist into concrete user journeys
- Decide whether and how to bootstrap the repository
- For the first feature, scaffold a spec via `/spec-new`
- If copied into a new project, remove inherited Git metadata and re-initialize the repo

## Notes
- This file should be updated at the end of each real work session.
- Replace placeholders as soon as the product direction becomes clearer.
- This file is the living recovery log. Use `docs/status/` only for milestone, handoff, or explicitly requested status reporting.
