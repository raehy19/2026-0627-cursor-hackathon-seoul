# Current State / Session Recovery

Last updated: 2026-06-27

## Phase

Phase 1 — **What if…?** app in `web/`. Hackathon build; PRD is canonical.

## Product summary

Upload KakaoTalk export → parse + local stats → analyze via **OpenRouter** or **coding-agent JSON import** → 1:1 report/timeline/counterfactual or group personas/sim. All user data stays in IndexedDB; server is LLM proxy only.

## Latest (2026-06-27)

- **Dual analysis UI:** `AnalysisRunPanel` — OpenRouter + agent bundle/copy/import
- **Agent pipeline:** `web/src/lib/agent/*`, `web/public/agent/ANALYSIS.md`
- **Data hygiene:** real exports moved to `data/chat-exports/` (gitignored); only README tracked
- **Docs trimmed:** starter harness bloat removed; root + web README rewritten
- **Build:** `npm run build` green (prior session)
- **Not committed yet:** agent analysis work + doc cleanup still local

## Repo layout

```text
web/                 app
data/chat-exports/   private Kakao exports (gitignored)
docs/project/        PRD
docs/operations/     state · todo · approval
docs/qa/             E2E
docs/agent/          agent ops (SESSION_START, WORKFLOW, …)
```

## Next

- [ ] Git commit + push pending changes
- [ ] OpenRouter smoke test with real key
- [ ] Vercel deploy (root dir `web`)

## Validation

```bash
cd web && npm run validate   # needs files in data/chat-exports/
cd web && npm run build
```

## Links

- [PRD](../project/prd-what-if.md)
- [TODO](todo-plan.md)
- [E2E](../qa/e2e-scenarios.md)
- [web README](../../web/README.md)
