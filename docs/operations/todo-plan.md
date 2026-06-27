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
- [x] Module commits (`feat(web|parser|stats|llm|ui)`)
- [ ] Live LLM smoke test (needs `OPENROUTER_API_KEY` in `web/.env.local`)
- [ ] Cache one full demo analysis in IndexedDB for 발표 (run once with key)

## P1.5 — 발표 임팩트 UX polish (PRD §9.1, do doc-first then code)

Ordered by ROI:

1. [ ] **관계 온도계** — tension/risk 집계 게이지 + 한 줄 요약 (`Dashboard1on1`)
2. [ ] **타임라인 밀도 급락 밴드** — density drop ReferenceArea (`Timeline.tsx`)
3. [ ] **반사실 split view** — 원본 vs 평행우주 2열 + outcome 배너 (`CounterfactualModal`)
4. [ ] **분석 reveal** — MAP stagger + top risky quote 카드
5. [ ] **랜딩 카피/톤** — hero 후킹 (윤리 가드레일 유지)

## P1 — if time remains (PRD §2 P1)

- [ ] Vercel deploy (root dir `web`, env `OPENROUTER_API_KEY`)
- [ ] Shareable result card (image download)
- [ ] "safe vs chaos" branching sim polish

## LLM budget (PRD §12)

| Action | API calls | ~tokens |
|--------|-----------|---------|
| 1:1 full analysis | 9 | 4~5.5만 |
| Counterfactual ×1 tab | 1 | ~0.5만 |
| Group personas (5) + sim ×2 | 7 | 2.5~3.5만 |

Free tier: ~200 calls/day, ~20/min. **Demo day: pre-cache 1 analysis in IndexedDB.** Live audience >10 → use cache or `maxSegments=5`.

## User action required

- [ ] Put a real key in `web/.env.local` → `OPENROUTER_API_KEY=`

## Drift-control discipline

- Commit per logical module; Conventional Commits.
- Code conforms to PRD; plan change → doc first, commit, then code.
- Keep `current-state.md` updated at checkpoints.
