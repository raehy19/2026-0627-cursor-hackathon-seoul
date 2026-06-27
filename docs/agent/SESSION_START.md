# Session Start

Single-page snapshot for AI assistants. Policies live in `AGENTS.md` and `WORKFLOW.md`.

Last refreshed: 2026-06-27

## What this repository is

Hackathon project **What if…?** — KakaoTalk export analyzer in `web/`.
Upload → local stats → analysis (OpenRouter **or** coding-agent JSON import) → timeline, report, counterfactual, group sim.

## Read order

1. This file
2. `AGENTS.md`
3. `docs/agent/WORKFLOW.md`
4. `docs/agent/INDEX.md` (situational lookup only)
5. Task-specific doc (usually PRD or `current-state.md`)

## Current phase

**Phase 1 — implementation.** App in `web/` is the product. Docs track state, not pre-code planning.

## Active focus

- Dual analysis path: OpenRouter button + coding-agent bundle/import (`AnalysisRunPanel`)
- Live demo: `public/sample/analysis.json` + 「바로 분석받기」
- Private chat exports in `data/chat-exports/` (gitignored)
- Next: commit pending work · optional Vercel deploy · OpenRouter smoke test

## Safe without approval

- Bug fixes and UX polish aligned with PRD
- Updating `current-state.md`, `todo-plan.md`, README
- Local dev on port 3001 when 3000 is busy

## Requires approval

- PRD scope changes, schema breaks, auth, destructive refactors
- Committing anything under `data/chat-exports/`

## Pointers

| Need | Doc |
|------|-----|
| Product spec | `docs/project/prd-what-if.md` |
| Build status | `docs/operations/current-state.md` |
| Priorities | `docs/operations/todo-plan.md` |
| E2E demo | `docs/qa/e2e-scenarios.md` |
| App dev | `web/README.md` |
| Agent analysis | `web/public/agent/ANALYSIS.md` |
| Secrets | `docs/agent/SECRETS_POLICY.md` |
| Browser ports | `docs/agent/LOCAL_BROWSER_PROFILES_AND_PORTS.md` |
