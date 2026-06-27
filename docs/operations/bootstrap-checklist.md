# Project Bootstrap Checklist

Use this checklist right after copying the starter into a new project folder.

## Repository basics
- Rename the repository references to the real project name.
- If this folder was copied from the starter, remove any inherited `.git` directory first.
- Initialize Git for the new project with `git init -b main` if needed.
- Decide the default branch name.
- Review `.gitignore` and remove irrelevant entries if needed.
- Decide whether the project needs a license.

## Product definition
- Fill in the product brief with the actual problem statement.
- Define the primary target user.
- Define the MVP in-scope and out-of-scope boundary.
- Decide the first platform scope.
- Identify the first three critical user flows.

## Operating docs
- Replace placeholders such as `<project-name>` and `<YYYY-MM-DD>`.
- Confirm that `AGENTS.md` is the canonical entry and `CLAUDE.md` / `.cursor/rules/00-entry.mdc` are 1–3 line pointers.
- Refresh `docs/agent/SESSION_START.md` with the actual current situation.
- Review `docs/agent/WORKFLOW.md` and `docs/agent/INDEX.md`.
- Review `docs/DOCUMENTATION_SYSTEM.md` and trim or extend the governance rules for the actual project.
- Update `docs/operations/current-state.md`.
- Review `docs/operations/approval-queue.md` and its lifecycle/archive section.
- Review `docs/operations/todo-plan.md`.
- Expand `docs/qa/e2e-scenarios.md` with real scenarios.
- Read `docs/agent/SECRETS_POLICY.md` and confirm `.env.example` matches the real shape.
- Decide whether the project needs browser or localhost lane policy. If yes, update `docs/agent/LOCAL_BROWSER_PROFILES_AND_PORTS.md`.

## Verification automation
- Install hooks once contributors join: `brew install lefthook gitleaks lychee && npm i -g markdownlint-cli && lefthook install`.
- Configure commit template: `git config commit.template .gitmessage`.
- Confirm `.github/workflows/docs-check.yml` and `.github/workflows/release-please.yml` are enabled in the new repo.
- Switch `release-please-config.json` `release-type` from `simple` to the chosen language once a tech stack is locked in.

## Ready for planning
- Confirm that the product brief is no longer mostly placeholders.
- Confirm that open decisions are captured in the approval queue.
- Confirm that the next safe task is visible from the TODO plan.
- Only then move into architecture and implementation planning.
