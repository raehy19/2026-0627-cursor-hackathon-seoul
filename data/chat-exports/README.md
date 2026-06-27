# Local chat exports (never commit)

Place **real** KakaoTalk export files here. Everything under this folder is
**gitignored** except this README.

## Validation golden files (`npm run validate`)

| File | Role |
|------|------|
| `KakaoTalk_Chat_*.csv` | macOS CSV, group chat |
| `KakaoTalkChats.txt` | Android EN, large group |
| `KakaoTalkChats (1).txt` | Android EN, 1:1 |

## Local-only demo pipeline (never commit)

| Path | Role |
|------|------|
| `scripts/generate-live-sample.ts` | Build `KakaoTalkChats-live-sample.txt` from your export |
| `scripts/seed-sample.ts` | Write `sample-analysis.json` (private pre-analysis) |
| `KakaoTalkChats-live-sample.txt` | Derived demo export |
| `sample-analysis.json` | Full StoredAnalysis for local 「바로 분석받기」 testing |

Run from `web/`:

```bash
npm run generate-sample   # → data/chat-exports/KakaoTalkChats-live-sample.txt
npm run seed-sample       # → data/chat-exports/sample-analysis.json
```

The public app ships a **small fictional** `web/public/sample/analysis.json` only.
Do not copy real chats or real names into git.
