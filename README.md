# What if…? — 카톡 평행우주 시뮬레이터

카톡 대화 내보내기를 분석해 **어디서 어긋났는지** 찾고 **"그때 이렇게 말했더라면"**을 시뮬레이션합니다.

## 빠른 시작

```bash
cd web
cp .env.example .env.local    # OPENROUTER_API_KEY (선택)
npm install
npm run dev                   # http://localhost:3000
```

로컬 검증용 카톡 export는 **`data/chat-exports/`** 에 두세요 (gitignore). 자세한 내용은 [`data/chat-exports/README.md`](data/chat-exports/README.md).

```bash
cd web && npm run validate    # data/chat-exports/ 골든 샘플 3종
cd web && npm run build
```

## 저장소 구조

```text
web/                    Next.js 앱 (파서 · 통계 · LLM · UI · IndexedDB)
  public/sample/        발표용 사전분석 JSON (원문 대화 없음)
  public/agent/         코딩 에이전트 분석 가이드
  src/lib/agent/        에이전트 번들 export · JSON import
data/chat-exports/      로컬 전용 카톡 export (실제 대화, 커밋 금지)
docs/project/           정본 PRD
docs/operations/        current-state · todo · approval-queue
docs/qa/                E2E 시나리오
docs/agent/             Cursor/에이전트 운영 문서
AGENTS.md               AI 어시스턴트 진입 규칙
```

## 문서

| 문서 | 용도 |
|------|------|
| [docs/project/prd-what-if.md](docs/project/prd-what-if.md) | 정본 제품 요구사항 |
| [web/README.md](web/README.md) | 앱 개발·분석 경로·스크립트 |
| [docs/operations/current-state.md](docs/operations/current-state.md) | 최신 구현 상태 |
| [docs/qa/e2e-scenarios.md](docs/qa/e2e-scenarios.md) | 데모/E2E 체크리스트 |
| [AGENTS.md](AGENTS.md) | Cursor 등 AI 어시스턴트 규칙 |

## 분석 경로 (업로드 후)

1. **OpenRouter로 분석받기** — 서버 `/api/llm` 프록시 (API 키 필요)
2. **코딩 에이전트로 분석받기** — 번들 JSON + 명령 복사 → Cursor/Claude Code/Codex → 결과 import

가이드: [web/public/agent/ANALYSIS.md](web/public/agent/ANALYSIS.md)

## 프라이버시

- 원문 카톡은 브라우저(IndexedDB)에만 저장
- `data/chat-exports/` 는 git에 올라가지 않음
- LLM 호출 시 필요한 청크만 서버 프록시를 통해 전송

## AI 어시스턴트 (Cursor)

세션 시작 시 `AGENTS.md` → `docs/agent/SESSION_START.md` 순으로 읽으면 됩니다.
