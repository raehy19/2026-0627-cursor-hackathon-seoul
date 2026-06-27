# Prioritized TODO Plan

Living plan for the "What if…?" build. Canonical spec: [prd-what-if.md](../project/prd-what-if.md).
Drift rule: if the plan changes, update the PRD/this doc **first**, commit, then code.

## Status legend

- [x] done · [~] in progress · [ ] not started

## P0 — demo-critical build

- [x] Full app in `web/` — parser · stats · LLM · UI · IndexedDB · build · validate
- [ ] Live LLM smoke test (`OPENROUTER_API_KEY`)
- [ ] Cache one full demo analysis in IndexedDB for 발표

## P1.5 — 발표 임팩트 UX polish (PRD §9.1)

1. [x] **관계 온도계** — `RelationshipGauge.tsx`
2. [x] **타임라인 밀도 급락 밴드** — `Timeline.tsx` ReferenceArea
3. [x] **반사실 split view** — `CounterfactualModal.tsx` 원래/평행 2열
4. [x] **분석 reveal** — `SegmentRevealList` + streaming `onSegment`
5. [x] **랜딩** — Three.js hero (`hero/HeroScene.tsx`) · UI 이모지 제거

## P1 — if time remains

- [ ] Vercel deploy (root dir `web`)
- [ ] Shareable result card (image download)
- [ ] "safe vs chaos" branching sim polish

## LLM budget (PRD §12)

See PRD §12. Demo day: pre-cache 1 analysis; live audience >10 → use cache.

## User action required

- [ ] `web/.env.local` → `OPENROUTER_API_KEY=`
