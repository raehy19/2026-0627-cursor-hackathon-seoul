# Prioritized TODO Plan

Living plan. Canonical spec: [prd-what-if.md](../project/prd-what-if.md).

## Status legend

- [x] done · [~] in progress · [ ] not started

## P0 — demo-critical

- [x] Full app in `web/` — parser · stats · LLM · UI · IndexedDB · build · validate
- [x] Dual analysis path — OpenRouter + coding-agent bundle/import
- [x] Live sample — `public/sample/analysis.json` + 「바로 분석받기」
- [x] Private exports — `data/chat-exports/` + gitignore
- [ ] Git commit + push all pending work
- [ ] Live LLM smoke test (`OPENROUTER_API_KEY`)

## P1.5 — UX polish

- [x] 관계 온도계 · 타임라인 밴드 · 반사실 split · segment reveal · Three.js hero

## P1 — if time

- [ ] Vercel deploy (root dir `web`)
- [ ] Shareable result card

## User action

- [ ] `web/.env.local` → `OPENROUTER_API_KEY=` (optional)
- [ ] Place golden samples in `data/chat-exports/` for `npm run validate`
