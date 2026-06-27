# E2E Scenario Checklist — What if…?

Baseline user journeys for the hackathon demo. Canonical spec: [prd-what-if.md](../project/prd-what-if.md).

## Scenario 1 — 1:1 money shot (전 연인)

**Entry:** 랜딩 → `KakaoTalkChats (1).txt` 업로드 → "나" = 정래현 선택

**Success path:**

1. 파싱 완료: 참가자 2명, one_on_one 모드
2. 로컬 통계: 타임라인(밀도/답장지연), 세션 위험 마커 표시
3. "관계 분석 시작" → MAP 진행률 → 헤어진 이유 카드(근거 인용)
4. 위험 마커 클릭 → 구간 카톡 버블 → "여기서 이렇게 말했더라면"
5. 반사실 모달: 현실/해피/망함 탭 → 대체 타임라인 카톡 버블

**Failure / recovery:**

- LLM 키 없음 → 로컬 통계·타임라인·구간 탐색은 동작, AI 분석 안내 배너
- 429 → 백오프 후 재시도 또는 "잠시 후 다시" 메시지

**Privacy check:** Network 탭에 원문 파일 업로드 없음; `/api/llm`에 청크만 POST

## Scenario 2 — 그룹 페르소나 + 시뮬 (공돌이들)

**Entry:** CSV 또는 `KakaoTalkChats.txt` 업로드 → "나" 선택

**Success path:**

1. group 모드, 참가자 5명
2. "페르소나 분석" → 멤버별 카드(voice, signature, stats)
3. 시뮬 입력: "야 우리 주말에 한라산 ㄱ?" → realistic/chaos/wholesome → 카톡 스레드 + outcome

## Scenario 3 — 재방문 (IndexedDB)

**Entry:** 이전 분석 완료 후 "기록" → 항목 클릭

**Success path:** 파싱·통계·(있으면) LLM 결과 그대로 복원, 재업로드 없음

**Delete:** 기록 삭제 후 목록에서 제거

## Automated checks (CI/local)

```bash
cd web && npm run validate   # parser + stats on 3 golden files
cd web && npm run build      # production build
```

Golden sample files live at repo root (gitignored); see [web/README.md](../../web/README.md).
