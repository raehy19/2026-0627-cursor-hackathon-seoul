# Status Report Policy

Use formal status reports sparingly.

## What Goes Where
- `docs/operations/current-state.md`: the living session-recovery log
- `docs/status/`: milestone reports, handoff reports, release-readiness reports, or explicitly requested status outputs

## When To Create A Formal Status Report
- The user explicitly asks for one
- A milestone or phase is complete
- Work is being handed off
- A release, QA pass, or audit summary needs a standalone artifact

## Naming
- Use `YYYY_MMDD_HHMM_status.md` for generic status reports
- Use `YYYY_MMDD_HHMM_<topic>.md` when the report is about a specific milestone or handoff

## Minimum Contents
- Scope of work
- What changed
- What was verified
- Open risks or blockers
- Recommended next actions

## Archive Rule
- Keep only the latest active formal report in `docs/status/` when that fits the project workflow.
- Move older reports to `docs/status/archive/`.
