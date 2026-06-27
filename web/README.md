# What if…? — 웹 앱

카톡 대화 내보내기 → 로컬 통계 + LLM/에이전트 분석 → 타임라인 · 리포트 · 반사실 · 단톡 시뮬.

정본 PRD: [docs/project/prd-what-if.md](../docs/project/prd-what-if.md)

## 빠른 시작

```bash
cd web
cp .env.example .env.local
npm install
npm run dev                  # 기본 :3000, 발표 시 -p 3001
```

`.env.local` 옵션:

| 변수 | 설명 |
|------|------|
| `OPENROUTER_API_KEY` | Vercel 서버 env — 공유 무료 분석 (선택) |
| `NEXT_PUBLIC_MOCK_LLM` | Production: `false` 권장 |
| `LLM_RATE_LIMIT_SERVER_PER_MIN` | IP당 분당 한도 (기본 24) |

서버 키가 없거나 실패하면 앱에서 **내 OpenRouter 키**를 입력·검증(`GET/POST /api/llm/health`) 후 localStorage에 저장해 분석합니다.

## 분석 경로 (업로드 후 대시보드)

| 버튼 | 설명 |
|------|------|
| **OpenRouter로 분석받기** | 서버 공유 키 또는 내 OpenRouter 키 |
| **코딩 에이전트로 분석받기** | 번들 · 명령 · JSON import |

## 스크립트

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run validate` | `data/chat-exports/` 골든 샘플 3종 파서·통계 검증 |
| `npm run generate-sample` | 합성 live-sample txt 생성 |
| `npm run seed-sample` | `public/sample/analysis.json` 사전분석 생성 |
| `npm run sample:all` | 위 두 명령 연속 실행 |

## 로컬 카톡 export

실제 대화 파일은 [`data/chat-exports/`](../data/chat-exports/) 에 둡니다 (gitignore).

에이전트 가이드: [`public/agent/ANALYSIS.md`](public/agent/ANALYSIS.md)

## 아키텍처

```text
src/lib/parser/     카톡 CSV/txt 파싱
src/lib/stats/        로컬 통계·세션·위험 점수
src/lib/llm/          OpenRouter 프록시 orchestration + mockEngine
src/lib/agent/        코딩 에이전트 번들 export/import
src/lib/store.ts      IndexedDB (idb-keyval)
src/app/api/llm/      OpenRouter 서버 프록시 (원문 저장 없음)
```

## 배포 (Vercel)

- Root Directory: `web`
- Environment: `OPENROUTER_API_KEY` (선택), `NEXT_PUBLIC_MOCK_LLM=false`
- Health: `GET /api/llm/health`
