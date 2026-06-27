# What if…? — 웹 앱

카톡 대화 내보내기를 분석해 **어디서 어긋났는지** 찾고 **"그때 이렇게 말했더라면"** 평행우주를 시뮬레이션합니다.

정본 PRD: [docs/project/prd-what-if.md](../docs/project/prd-what-if.md)

## 빠른 시작

```bash
cd web
cp .env.example .env.local   # OPENROUTER_API_KEY 입력 (LLM 기능; 없으면 로컬 통계만)
npm install
npm run dev                  # http://localhost:3000
```

## 스크립트

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run validate` | 루트 골든 샘플 3종으로 파서·통계 검증 |

골든 샘플은 **repo 루트**에 두세요 (gitignore 처리됨):

- `KakaoTalk_Chat_*.csv` — macOS CSV, 그룹
- `KakaoTalkChats.txt` — Android EN, 대형 그룹
- `KakaoTalkChats (1).txt` — Android EN, 1:1

## 아키텍처 요약

- **클라이언트**: 파싱(papaparse + txt) · 로컬 통계 · IndexedDB(idb-keyval) · UI
- **서버**: `/api/llm` — OpenRouter 프록시만 (원문 저장 없음)

## 배포 (Vercel)

- Root Directory: `web`
- Environment: `OPENROUTER_API_KEY`
