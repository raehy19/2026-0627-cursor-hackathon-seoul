# Current State / Session Recovery

Last updated: 2026-06-27

## Phase

Phase 1 — **What if…?** app in `web/`. Hackathon build; PRD is canonical. **Production live.**

## Product summary

Upload KakaoTalk export → parse + local stats → analyze via **OpenRouter** or **coding-agent JSON import** → 1:1 report/timeline/counterfactual or group personas/sim. All user data stays in IndexedDB; server is LLM proxy only.

## Production

- **URL:** [https://whatif.raehyeon.com/](https://whatif.raehyeon.com/)
- Vercel root: `web`
- Env: `NEXT_PUBLIC_SITE_URL=https://whatif.raehyeon.com`, `NEXT_PUBLIC_MOCK_LLM=false` (recommended)

## Latest (2026-06-27)

- **Production deploy** — whatif.raehyeon.com
- **Brand assets** — logo, favicon, OG image, site metadata
- **Dual analysis UI:** OpenRouter + agent bundle/copy/import
- **Build:** `npm run build` green

## Next

- [ ] OpenRouter smoke test with real key on production
- [ ] Shareable result card (P1)
- [ ] Demo video / slide URL for hackathon submission

## Validation

```bash
cd web && npm run validate   # needs files in data/chat-exports/
cd web && npm run build
```

## Links

- [Production](https://whatif.raehyeon.com/)
- [Notion one-pager](../project/notion-one-pager.md)
- [PRD](../project/prd-what-if.md)
- [TODO](todo-plan.md)
- [E2E](../qa/e2e-scenarios.md)
- [web README](../../web/README.md)
