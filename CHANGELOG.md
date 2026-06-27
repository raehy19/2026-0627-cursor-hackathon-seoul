# Changelog

All notable changes to this project should be documented in this file.

This file follows [Keep a Changelog](https://keepachangelog.com/) and uses
[Conventional Commits](https://www.conventionalcommits.org/). Once
`release-please` runs against `main`, future entries below `[Unreleased]` will
be generated automatically.

## [Unreleased]

### Added
- Conflict-aware playbook for adopting this harness in an existing repo: `docs/agent/APPLY_HARNESS.md` (audit → plan → apply → verify, four phases). Now covers the full operating discipline — six core principles, documentation governance, agent workflow/index, operating docs, taxonomy folders, templates, verification, slash commands, commits/release, secrets, and browser/local-lane policy — plus a doc-taxonomy cheat sheet for routing new information to the correct home.
- README sections: "에이전트와 첫 작업" (first-prompt examples), "다른 기존 프로젝트에 이 하네스 적용하기" (cross-repo application), and "운영 슬래시 명령" (slash command catalog).
- Cross-references to `APPLY_HARNESS.md` from `AGENTS.md`, `docs/agent/INDEX.md`, `docs/agent/SESSION_START.md`, and `docs/README.md`.
- Canonicalized `AGENTS.md` as the single entry document; trimmed `CLAUDE.md` and `.cursor/rules/00-entry.mdc` to thin pointers.
- One-page session snapshot at `docs/agent/SESSION_START.md`, referenced first by all entry files.
- Local + CI verification: `lefthook.yml`, `.markdownlint.json`, `lychee.toml`, `.gitleaks.toml`, `.github/workflows/docs-check.yml`.
- Conventional Commits enforcement via `lefthook` `commit-msg` hook and `.gitmessage` template.
- `release-please` workflow + `release-please-config.json` + `.release-please-manifest.json`.
- Claude slash commands under `.claude/commands/`: `session-start`, `checkpoint`, `approval-add`, `approval-resolve`, `promote-to-adr`, `learning-add`, `spec-new`. Cross-tool semantics documented in `AGENTS.md`.
- Feature spec layer: `docs/specs/`, plus `docs/templates/spec-ears-template.md` and `docs/templates/spec-gherkin-template.md`.
- Approval-queue lifecycle (open → resolved → routed) with `## Resolved (archive)` section and `/promote-to-adr` routing rule.
- Lightweight conventions store at `docs/learnings/` with `docs/templates/learning-template.md`.
- Secrets and MCP permission policy at `docs/agent/SECRETS_POLICY.md`.
- `degit` / `gh repo create --template` quick-start in `README.md`.

### Changed
- `WORKFLOW.md`, `INDEX.md`, `CONTRIBUTING.md`, `DOCUMENTATION_SYSTEM.md`, `docs/README.md`, and `docs/operations/bootstrap-checklist.md` updated to reflect the canonical entry, session snapshot, specs, learnings, secrets policy, and verification automation.
- `docs/operations/current-state.md` and `docs/operations/todo-plan.md` refreshed.
- `.gitignore` extended with lefthook/lychee/markdownlint cache patterns.

### Fixed
- None yet.

### Removed
- Duplicated rule content from `CLAUDE.md` and `.cursor/rules/00-entry.mdc`.
