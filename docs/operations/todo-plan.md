# Prioritized TODO Plan

Living plan for the "What if…?" build. Canonical spec: [prd-what-if.md](../project/prd-what-if.md).
Drift rule: if the plan changes, update the PRD/this doc **first**, commit, then code.

## Status legend

- [x] done · [~] in progress · [ ] not started

## P0 — demo-critical build (traced to PRD)

- [x] Scaffold `web/` (Next.js 16, Tailwind v4) + deps — PRD §10
- [x] Shared contracts `web/src/lib/types.ts` — PRD §4.5, §7, §5B, §8
- [x] Validate 3 real samples (BOM, U+202F, record-count, participants) — PRD §4
- [x] Parser: CSV + android/ios/pc txt, detect, N-person, system/media — PRD §4
- [x] Local stats engine: latency/density/sessions/risk score — PRD §5
- [x] `/api/llm` proxy + free-model fallback + defensive JSON — PRD §3, §6
- [x] 1:1 pipeline: MAP→REDUCE + counterfactual — PRD §6, §7
- [x] Group pipeline: persona extraction + group sim — PRD §5B
- [x] UI: upload, me-select, dashboard, timeline, kakao bubbles, modals, history — PRD §9
- [x] IndexedDB save/restore — PRD §8
- [x] Integrate + `next build` green + `npm run validate` on 3 real files
- [ ] Live LLM smoke test (needs `OPENROUTER_API_KEY` in `web/.env.local`)
- [ ] Cache one full demo analysis in IndexedDB for 발표 (run once with key, or pre-seed script)

## P1 — if time remains (PRD §2 P1)

- [ ] Vercel deploy (root dir `web`, env `OPENROUTER_API_KEY`)
- [ ] Shareable result card (image download)
- [ ] "safe vs chaos" branching sim polish
- [ ] E2E scenarios doc update in `docs/qa/e2e-scenarios.md`

## User action required

- [ ] Put a real key in `web/.env.local` → `OPENROUTER_API_KEY=` (LLM off until set; local stats/timeline still work)

## Drift-control discipline

- Commit per logical module; Conventional Commits.
- Code conforms to PRD; plan change → doc first, commit, then code.
- Keep `current-state.md` updated at checkpoints.
