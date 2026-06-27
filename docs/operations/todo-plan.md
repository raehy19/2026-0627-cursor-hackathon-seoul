# Prioritized TODO Plan

## P0. Needed now
- Lock the product problem statement into one sentence
- Define the primary target user
- Define MVP in-scope and out-of-scope items
- Select three core user flows
- Decide Git initialization and the default branch strategy
- Decide the repository license or confirm private/unlicensed status

## P1. Needed right after product definition
- Update the product brief with real content
- Expand the core E2E scenarios
- Scaffold the first three feature specs under `docs/specs/`
- Draft the initial architecture notes
- Identify the first ADR candidates (especially platform and bootstrap choice)
- Create an implementation-readiness checklist

## P2. Needed before implementation starts
- Decide the tech stack and deployment target
- Switch `release-please-config.json` `release-type` from `simple` to the chosen language
- Define quality gates (test, lint, type, e2e)
- Draft the testing strategy
- Define the minimum operations and observability baseline
- Verify `lefthook` + `gitleaks` + `lychee` + `markdownlint` are installed for every contributor

## P3. Later quality improvements
- Decide whether to split out a dedicated risk register
- Review possible automation for doc-maintenance flows (auto `/checkpoint`, auto `SESSION_START` refresh)
- Trim or extend starter defaults for the actual stack
- Add `commitlint` (npm) once a Node toolchain exists, replacing the regex `commit-msg` hook

## Done in the 2026-06-14 harness pass
- Claude Code `@import` fix in `CLAUDE.md` (canonical rules now load into context)
- Spec → tasks bridge: `tasks-template.md` + `/spec-tasks` command
- Explicit Definition of Done in `AGENTS.md`
- Context-engineering + external-memory/resume rules in `WORKFLOW.md`
- Enforced secret-file deny in `.claude/settings.json` + `.mcp.json.example`
- Browser/ports lane registry upgrade

## Done in the harness pass (2026-05-03)
- AGENTS.md canonicalization + thin pointers
- Verification automation (lefthook / markdownlint / lychee / gitleaks / Actions)
- SESSION_START snapshot
- Slash commands
- Specs directory + templates
- Approval-queue lifecycle
- Conventional Commits + release-please
- Quick-start (`degit`) guidance
- Learnings directory
- Secrets policy + MCP matrix

## Current Notes
- Most P0 items still depend on user input or approval.
- Until then, safe work means maintaining the operating docs and clarifying scope.
- Replace generic placeholders with project-specific facts as soon as they are known.
