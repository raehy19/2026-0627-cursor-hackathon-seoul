# Core Workflow

This document is the human-readable operating loop. Assistant-specific entry and tool policy live in [../agent/WORKFLOW.md](../agent/WORKFLOW.md).

## Default Operating Loop
1. Read the rules and current-state docs.
2. Check the TODO plan and approval queue.
3. Separate safe work from approval-required work.
4. Execute safe work first.
5. Update the relevant documentation immediately.
6. Refresh the current-state doc before ending the session.
7. Create a formal status report only when the task is a milestone, handoff, or explicit reporting request.

## Documentation-First Read Order
1. `README.md`
2. `docs/README.md`
3. `docs/operations/current-state.md`
4. `docs/operations/todo-plan.md`
5. `docs/operations/approval-queue.md`
6. Relevant plan, product, and architecture docs

## Checkpoint Status Format
Use this structure at meaningful checkpoints.

### A. What I reviewed
- Docs, rules, files, or flows inspected

### B. Safe work completed
- Work executed directly
- Documentation updated alongside it

### C. Findings
- Ambiguities
- TODO gaps
- Risks
- Documentation drift

### D. Pending approval
- Title
- Why it matters
- Options
- Recommended option
- Risks
- Affected areas

### E. Next safe actions
- Work that can continue without approval

## Prohibited Behavior
- Do not push implementation ahead of documentation.
- Do not silently lock in major decisions.
- Do not leave important project state only in chat.
- Do not claim validation, browser checks, or tests were completed unless they were actually run.
