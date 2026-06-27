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
| `OPENROUTER_API_KEY` | 서버 프록시용 (선택) |
| `NEXT_PUBLIC_MOCK_LLM=true` | OpenRouter 없이 mock 분석 (바로 분석받기 등) |

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

실제 대화 파일은 **repo 루트가 아니라** [`data/chat-exports/`](../data/chat-exports/) 에 둡니다. 이 폴더는 gitignore됩니다.

## 분석 경로 (업로드 후 대시보드)

| 버튼 | 설명 |
|------|------|
| **OpenRouter로 분석받기** | `/api/llm` MAP-REDUCE. mock env여도 이 버튼만 실제 API 호출 |
| **코딩 에이전트로 분석받기** | 번들 다운로드 · 명령 복사 · JSON import |

에이전트 가이드: [`public/agent/ANALYSIS.md`](public/agent/ANALYSIS.md)

구현:

- `src/components/AnalysisRunPanel.tsx` — UI
- `src/lib/agent/` — 번들 · 검증 · import
- `src/lib/llm/client.ts` — `source: "openrouter" | "mock" | "auto"`

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
- Environment: `OPENROUTER_API_KEY`
