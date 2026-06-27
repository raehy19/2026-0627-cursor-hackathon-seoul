# What if…? — 코딩 에이전트 분석 가이드

Cursor CLI, Claude Code, Codex 등 **구독에 포함된 코딩 에이전트**로 OpenRouter 없이 분석을 받을 때 사용합니다.

## 입력

1. 앱에서 **「입력 번들 다운로드」** → `what-if-agent-bundle-*.json`
2. 이 파일(`ANALYSIS.md`)과 번들을 함께 에이전트에 제공

## 공통 톤 (PRD §7)

- 통찰과 **성장** 관점
- 일방적 자기비난·「그래서 네가 차였어」식 단정 금지
- 패턴은 짚되, 근거(**실제 대사 인용**)를 반드시 붙일 것

---

## 1:1 모드 (`outputContract: "one_on_one"`)

### MAP — 구간별 (`bundle.sessions[]`)

각 세션의 `lines`를 읽고 **한 세션당 SegmentAnalysis 1개**를 만듭니다.

- `segment_id`, `time_range`는 **번들 값을 그대로** 사용
- `who_is_pulling_away`: `"me" | "them" | "neither"`
- `tension_score`: 0–100
- `risky_moments[]`: `{ quote, why, severity }` — quote는 원문에서 발췌
- `my_mistakes[]`: `{ quote, issue, better_version }` — `me`의 말만
- `tone`: `{ me, them }` — 짧은 감정 톤 설명

```json
{
  "segment_id": "string",
  "time_range": "YYYY-MM-DD ~ YYYY-MM-DD",
  "summary": "한 줄 요약",
  "tension_score": 0,
  "who_is_pulling_away": "me",
  "risky_moments": [{ "quote": "…", "why": "…", "severity": 70 }],
  "my_mistakes": [{ "quote": "…", "issue": "…", "better_version": "…" }],
  "tone": { "me": "…", "them": "…" }
}
```

### REDUCE — 전체 종합

모든 `segments` + `bundle.statsSummary`를 종합해 `overview` 1개:

```json
{
  "relationship_arc": "3~4문장 서사",
  "breakup_reasons": [{ "reason": "…", "evidence": ["대사1", "대사2"] }],
  "turning_points": [{ "when": "시점", "what": "무슨 일" }],
  "your_patterns": ["나의 반복 패턴"],
  "their_patterns": ["상대의 반복 패턴"]
}
```

### 최종 출력 (1:1)

**JSON만** 출력. 마크다운·코드펜스·설명 문단 금지.

```json
{
  "version": 1,
  "segments": [ /* sessions.length개, segment_id 일치 */ ],
  "overview": { /* REDUCE */ }
}
```

파일명 예: `what-if-agent-output.json`

---

## 단톡방 모드 (`outputContract: "group_personas"`)

`bundle.personaTargets[]` 각 멤버의 `sample_lines`를 읽고 페르소나 카드 작성.

- `stats` 숫자는 **번들의 personaTargets[].stats 그대로** (LLM이 바꾸지 않음)
- `signature_phrases`: 실제 자주 쓰는 표현 3~5개
- `engages_with` / `ignores`: 다른 멤버 이름

```json
{
  "version": 1,
  "personas": [
    {
      "name": "멤버이름",
      "voice": "말투 한 줄",
      "signature_phrases": ["…"],
      "reaction_style": "…",
      "engages_with": ["…"],
      "ignores": ["…"],
      "stats": { "avg_len": 0, "laugh_rate": 0, "median_reply_sec": 0, "active_hours": [] },
      "talks_most_to": "…"
    }
  ]
}
```

---

## 앱에 반영

1. 출력 JSON 저장
2. 앱 **「코딩 에이전트로 분석받기」→ 결과 가져오기**에서 파일 선택 또는 붙여넣기
3. 검증 통과 시 타임라인·리포트·페르소나 UI에 즉시 반영

## 반사실(What if…)

구간 분석이 들어온 **이후** 앱 UI에서 마커 클릭 → 반사실은 별도 LLM/mock 호출 (이 번들 출력만으로는 충분하지 않음).
