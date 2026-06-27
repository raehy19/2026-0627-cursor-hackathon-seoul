# E2E Scenario Checklist — What if…?

Baseline user journeys. Canonical spec: [prd-what-if.md](../project/prd-what-if.md).

Sample files live in **`data/chat-exports/`** (gitignored). See [data/chat-exports/README.md](../../data/chat-exports/README.md).

## Scenario 1 — 1:1 money shot

**Entry:** 랜딩 → `data/chat-exports/KakaoTalkChats (1).txt` 업로드 → "나" = 정래현

**Success path:**

1. 파싱: 참가자 2명, one_on_one
2. 로컬 통계: 타임라인 · 세션 위험 마커
3. **OpenRouter로 분석받기** 또는 **코딩 에이전트로 분석받기** (번들 → 명령 → JSON import)
4. 관계 리포트 · 위험 인용 카드
5. 위험 마커 → 구간 카톡 → "여기서 이렇게 말했더라면" → 반사실 모달

**Failure / recovery:**

- OpenRouter 키 없음 → 에이전트 경로 또는 mock(`NEXT_PUBLIC_MOCK_LLM=true`)
- 429 → 백오프 / 재시도 안내

**Privacy:** Network에 원문 파일 업로드 없음; `/api/llm`에 청크만 POST

## Scenario 2 — 그룹 페르소나 + 시뮬

**Entry:** `data/chat-exports/KakaoTalk_Chat_*.csv` 또는 `KakaoTalkChats.txt` 업로드

**Success path:**

1. group 모드, 5명
2. OpenRouter 또는 에이전트로 페르소나 분석
3. 시뮬: "야 우리 주말에 한라산 ㄱ?" → realistic/chaos/wholesome

## Scenario 3 — 바로 분석받기 (발표)

**Entry:** 랜딩 → 「바로 분석받기」

**Success path:** `public/sample/analysis.json` 로드 → 대시보드 즉시 표시

## Scenario 4 — 재방문 (IndexedDB)

**Entry:** 기록 → 항목 클릭 → 복원 · 삭제

## Automated checks

```bash
cd web && npm run validate
cd web && npm run build
```
