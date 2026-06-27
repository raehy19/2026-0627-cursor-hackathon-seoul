# Prioritized TODO Plan

Living plan for the "What if…?" build. Canonical spec: [prd-what-if.md](../project/prd-what-if.md).
Drift rule: if the plan changes, update the PRD/this doc **first**, commit, then code.

## Status legend

- [x] done · [~] in progress · [ ] not started

## P0 — demo-critical build (traced to PRD)

- [x] Scaffold `web/` (Next.js 16, Tailwind v4) + deps (papaparse, idb-keyval, recharts) — PRD §10
- [x] Shared contracts `web/src/lib/types.ts` (all schemas) — PRD §4.5, §7, §5B, §8
- [x] Validate 3 real samples (BOM, U+202F, record-count, participants) — PRD §4, §11
- [~] Parser: CSV + android/ios/pc txt, detect, N-person, system/media — PRD §4 (Agent A)
- [~] Local stats engine: latency/density/sessions/risk score — PRD §5 (Agent A)
- [~] `/api/llm` proxy + free-model fallback + defensive JSON — PRD §3, §6 (Agent B)
- [~] 1:1 pipeline: MAP→REDUCE + counterfactual — PRD §6, §7 (Agent B)
- [~] Group pipeline: persona extraction + group sim — PRD §5B (Agent B)
- [~] UI: upload, me-select, dashboard, timeline, kakao bubbles, modals, history — PRD §9 (Agent C)
- [~] IndexedDB save/restore — PRD §8 (Agent C)
- [ ] Integrate + `next build` green + E2E test against the 3 real files
- [ ] Cache one demo analysis in IndexedDB — PRD §6, §10 step 5

## P1 — if time remains (PRD §2 P1)

- [ ] Timeline polish (emotion/density lines + clickable markers)
- [ ] Shareable result card (image download)
- [ ] "safe vs chaos" branching sim variants
- [ ] Vercel deploy (root dir `web`, `OPENROUTER_API_KEY` env)

## User action required

- [ ] Put a real key in `web/.env.local` → `OPENROUTER_API_KEY=` (LLM features off until then;
      local stats/timeline/kakao browsing still work without it)

## Drift-control discipline (this session)

- Commit per logical task; keep messages Conventional Commits.
- Code must conform to the PRD; on any plan change, edit the doc first and commit before code.
- Keep `current-state.md` updated at each checkpoint.

## Done (harness, pre-implementation)

- AGENTS.md canonical entry + thin pointers; verification automation (lefthook/markdownlint/lychee/gitleaks/Actions).
- SESSION_START snapshot, slash commands, specs dir + templates, approval-queue lifecycle, Conventional Commits + release-please, learnings dir, secrets policy.
