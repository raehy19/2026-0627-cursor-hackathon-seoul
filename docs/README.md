# Documentation Operating Map

This directory is the operational baseline of the project. Start new sessions here.

## Language Split
- `agent/`, `operations/`, `architecture/`, `qa/`, and assistant entry files are agent-facing and should stay in English.
- `templates/` is also agent-facing and should stay in English.
- `project/` and most product-planning content may stay in Korean.
- If one document mixes both concerns, keep the structure and control language in English.

## Read Order
1. [Session Start (one-page)](agent/SESSION_START.md)
2. [Canonical Entry — AGENTS.md](../AGENTS.md)
3. [Shared Agent Workflow](agent/WORKFLOW.md)
4. [Agent Context Index](agent/INDEX.md)
5. [Documentation Governance](DOCUMENTATION_SYSTEM.md)
6. [Current State / Session Recovery](operations/current-state.md)
7. [Prioritized TODO Plan](operations/todo-plan.md)
8. [Pending Approval Queue](operations/approval-queue.md)
9. [Core Workflow](operations/workflow.md)
10. [Project Bootstrap Checklist](operations/bootstrap-checklist.md)
11. [Documentation Foundation Plan](plans/documentation-foundation-plan.md)
12. [Product Brief Draft](project/product-brief.md)
13. [E2E Scenario Checklist](qa/e2e-scenarios.md)
14. [Specs Directory](specs/README.md)
15. [Architecture Guide](architecture/README.md)
16. [Learnings](learnings/README.md)
17. [Secrets and MCP Policy](agent/SECRETS_POLICY.md)
18. [Apply Harness to an Existing Repo](agent/APPLY_HARNESS.md)
19. [Status Report Policy](agent/status_report.md)
20. [Document Templates](templates/README.md)

## Directory Purpose
- `agent/`: shared assistant workflow, session snapshot, read index, browser policy, status-report guidance, secrets policy
- `project/`: problem definition, target users, requirements, scope
- `specs/`: per-feature behavior specs (EARS or Gherkin) before code
- `plans/`: dated plans and design documents
- `architecture/`: system structure and ADRs
- `operations/`: session recovery, TODOs, approvals, workflow
- `qa/`: E2E scenarios, risk, validation viewpoints
- `learnings/`: lightweight repo-wide conventions (lighter than ADRs)
- `status/`: formal handoff or milestone reports, with archive for older reports
- `templates/`: reusable document templates

## Required Operating Docs
- `operations/current-state.md`
- `operations/todo-plan.md`
- `operations/approval-queue.md`
- `qa/e2e-scenarios.md`

## Formal Reporting
- `operations/current-state.md` is the living session-recovery log.
- `status/` is for milestone, handoff, or explicitly requested status reports.
- Archive older formal reports under `status/archive/`.

## Conflict Handling
- Do not resolve documentation conflicts by guesswork.
- Record the conflict in `operations/approval-queue.md`.
- Until resolved, apply the most conservative interpretation.

## New Session Checklist
- Read the current-state doc.
- Check TODO priorities.
- Review pending approval items.
- Select the next safe task.
- Update the relevant docs immediately after changes.
