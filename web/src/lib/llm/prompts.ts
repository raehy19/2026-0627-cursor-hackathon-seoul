import type { LlmMessage } from "@/lib/llm/config";
import type {
  CfMode,
  GroupSimMode,
  PersonStats,
  PersonaCard,
  SegmentAnalysis,
} from "@/lib/types";

// Shared tone guidance, inserted into every relevant system prompt.
const TONE_GUIDE =
  "통찰과 성장 관점으로 분석한다. 일방적 자기비난을 증폭하지 말 것. 패턴을 짚되 단정하지 말고, 모든 주장에 실제 대사 인용을 붙여라. JSON만 출력. 마크다운/백틱/설명 금지.";

const GROUP_TONE =
  "친근한 과장 개그 선까지만. 특정인 비하·인신공격·실명 딥페이크 금지.";

const JSON_ONLY = "출력은 위 스키마의 유효한 JSON 객체 하나뿐. 마크다운/백틱/설명/주석 금지.";

// ---------------------------------------------------------------------------
// 1:1 — MAP: per-session segment analysis
// ---------------------------------------------------------------------------

export function buildSegmentPrompt(input: {
  me: string;
  them: string;
  segmentId: string;
  timeRange: string;
  lines: string;
}): LlmMessage[] {
  const { me, them, segmentId, timeRange, lines } = input;
  const system = [
    `너는 한국어 대화 관계 분석가다. 두 사람("${me}"=나, "${them}"=상대)의 카카오톡 대화 한 구간을 분석한다.`,
    TONE_GUIDE,
    "각 메시지에는 (답장지연 …) 메타데이터가 붙을 수 있다. 답장 속도/대화 밀도 변화를 단서로 활용하라.",
    "다음 JSON 스키마로만 답하라:",
    `{
  "segment_id": "${segmentId}",
  "time_range": "${timeRange}",
  "summary": "이 구간 핵심 2-3문장(한국어)",
  "tension_score": 0,
  "who_is_pulling_away": "me" | "them" | "neither",
  "risky_moments": [{ "quote": "실제 대사 그대로", "why": "왜 위험/신호인지", "severity": 0 }],
  "my_mistakes": [{ "quote": "나의 실제 대사", "issue": "문제점", "better_version": "더 나은 표현" }],
  "tone": { "me": "나의 톤 한 줄", "them": "상대 톤 한 줄" }
}`,
    "tension_score, severity는 0~100 정수. who_is_pulling_away는 누가 멀어지는지. quote는 발췌문에 실제 존재하는 대사만. 해당 없으면 빈 배열([]).",
    JSON_ONLY,
  ].join("\n");

  const user = `구간: ${timeRange}\n나=${me}, 상대=${them}\n\n[대화]\n${lines}`;
  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

// ---------------------------------------------------------------------------
// 1:1 — REDUCE: overview across all segments + stats summary
// ---------------------------------------------------------------------------

export function buildOverviewPrompt(input: {
  me: string;
  them: string;
  segments: SegmentAnalysis[];
  statsSummary: string;
}): LlmMessage[] {
  const { me, them, segments, statsSummary } = input;
  const system = [
    `너는 한국어 관계 분석가다. 여러 구간 분석 결과와 통계 요약을 종합해 관계 전체 흐름을 정리한다. 나="${me}", 상대="${them}".`,
    TONE_GUIDE,
    "다음 JSON 스키마로만 답하라:",
    `{
  "relationship_arc": "시작→변화→끝 흐름 서술(한국어)",
  "breakup_reasons": [{ "reason": "원인", "evidence": ["근거가 된 실제 대사 인용 또는 구간 시점"] }],
  "turning_points": [{ "when": "YYYY-MM-DD 또는 구간 라벨", "what": "그때 무슨 일이 있었나" }],
  "your_patterns": ["나의 반복 패턴"],
  "their_patterns": ["상대의 반복 패턴"]
}`,
    "모든 reason/pattern은 segment 결과의 인용이나 통계로 뒷받침하라. 통계 수치를 지어내지 말 것.",
    JSON_ONLY,
  ].join("\n");

  const compactSegments = JSON.stringify(
    segments.map((s) => ({
      time_range: s.time_range,
      summary: s.summary,
      tension_score: s.tension_score,
      who_is_pulling_away: s.who_is_pulling_away,
      risky_moments: s.risky_moments,
      my_mistakes: s.my_mistakes,
      tone: s.tone,
    })),
  );

  const user = `통계 요약(JSON):\n${statsSummary}\n\n구간 분석 결과(JSON 배열):\n${compactSegments}`;
  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

// ---------------------------------------------------------------------------
// 1:1 — Counterfactual ("what if I had said it differently")
// ---------------------------------------------------------------------------

const CF_MODE_GUIDE: Record<CfMode, string> = {
  realistic: "현실적인 가정. 상대 성향을 고려해 실제로 일어났을 법한 전개.",
  best_case: "가장 잘 풀렸을 경우. 다만 과장된 해피엔딩 금지, 개연성 유지.",
  disaster: "최악으로 흘러갔을 경우. 과장 개그 톤 허용하되 인신공격은 금지.",
};

export function buildCounterfactualPrompt(input: {
  me: string;
  them: string;
  mode: CfMode;
  segmentId: string;
  segmentSummary: string;
  riskyMoments: SegmentAnalysis["risky_moments"];
  contextLines: string;
  lines: string;
}): LlmMessage[] {
  const { me, them, mode, segmentId, segmentSummary, riskyMoments, contextLines, lines } = input;
  const system = [
    `너는 한국어 대화 시뮬레이터다. 나="${me}", 상대="${them}". 결정적 순간에 내가 다르게 말했다면 어땠을지 시뮬레이션한다.`,
    `시나리오 모드: ${mode} — ${CF_MODE_GUIDE[mode]}`,
    TONE_GUIDE,
    "다음 JSON 스키마로만 답하라:",
    `{
  "segment_id": "${segmentId}",
  "mode": "${mode}",
  "original_line": "내가 실제로 했던 결정적 대사(발췌문에 존재)",
  "suggested_line": "그 순간 내가 다르게 했을 대사",
  "rationale": "왜 이 대사가 더 나은지",
  "simulated_timeline": [{ "sender": "나 또는 상대 이름", "text": "대사", "delay_hint": "즉답|1시간 후|다음날 등" }],
  "outcome_delta": "원래 결과 대비 무엇이 달라졌나"
}`,
    `simulated_timeline은 suggested_line 이후의 전개를 5~10턴으로. sender는 "${me}" 또는 "${them}"만.`,
    JSON_ONLY,
  ].join("\n");

  const user = [
    `구간 요약: ${segmentSummary}`,
    `위험 순간: ${JSON.stringify(riskyMoments)}`,
    contextLines ? `\n[직전 맥락]\n${contextLines}` : "",
    `\n[해당 구간 대화]\n${lines}`,
  ]
    .filter(Boolean)
    .join("\n");

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

// ---------------------------------------------------------------------------
// Group — Persona extraction (one call per participant)
// ---------------------------------------------------------------------------

export function buildPersonaPrompt(input: {
  name: string;
  participants: string[];
  personStats?: PersonStats;
  sampleLines: string;
}): LlmMessage[] {
  const { name, participants, personStats, sampleLines } = input;
  const others = participants.filter((p) => p !== name);
  const statsHint = personStats
    ? JSON.stringify({
        avg_len: Math.round(personStats.avgLen),
        laugh_rate: Number(personStats.laughRate.toFixed(2)),
        median_reply_sec: Math.round(personStats.medianReplySec),
        active_hours: personStats.activeHours,
        question_rate: Number(personStats.questionRate.toFixed(2)),
      })
    : "{}";

  const system = [
    `너는 채팅 페르소나 추출기다. 단톡방 참여자 "${name}"의 말투·성격 카드를 만든다.`,
    GROUP_TONE,
    "통찰은 실제 메시지 샘플에 근거하라. 숫자 통계는 시스템이 채우니 지어내지 말 것.",
    "다음 JSON 스키마로만 답하라:",
    `{
  "name": "${name}",
  "voice": "말투/문체 특징 한두 줄",
  "signature_phrases": ["자주 쓰는 표현/말버릇"],
  "reaction_style": "반응 스타일(예: 드립으로 받음, 진지하게 받음)",
  "engages_with": ["적극 반응하는 사람 이름"],
  "ignores": ["잘 반응 안 하는 주제/사람"],
  "stats": { "avg_len": 0, "laugh_rate": 0, "median_reply_sec": 0, "active_hours": [] },
  "talks_most_to": "가장 많이 대화하는 사람 이름"
}`,
    `engages_with / talks_most_to 의 이름은 다음 중에서: ${JSON.stringify(others)}.`,
    "stats 필드는 0/[]로 둬도 된다(시스템이 덮어씀). talks_most_to는 반드시 한 명 지정.",
    JSON_ONLY,
  ].join("\n");

  const user = `대상: ${name}\n참고용 로컬 통계(JSON): ${statsHint}\n\n[${name}의 메시지 샘플]\n${sampleLines}`;
  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

// ---------------------------------------------------------------------------
// Group — Simulate the thread after a hypothetical trigger
// ---------------------------------------------------------------------------

const GROUP_MODE_GUIDE: Record<GroupSimMode, string> = {
  realistic: "평소 단톡방처럼 현실적으로. 무시당하거나 떡밥이 묻히는 것도 자연스럽게.",
  chaos: "난장판 모드. 드립 폭주, 삼천포, 떡밥 물고 늘어지기. 과장 개그 OK.",
  wholesome: "훈훈 모드. 서로 챙기고 응원하는 따뜻한 분위기.",
};

export function buildGroupSimPrompt(input: {
  responders: PersonaCard[];
  me: string;
  trigger: string;
  mode: GroupSimMode;
  hour?: number;
  contextLines: string;
}): LlmMessage[] {
  const { responders, me, trigger, mode, hour, contextLines } = input;
  const hourLine =
    typeof hour === "number"
      ? `현재 시각은 ${hour}시. 각 페르소나의 active_hours를 보고 이 시간에 깨어있을 법한 사람만 주로 반응하게 하라(자는 사람은 who_stayed_silent로).`
      : "";

  const system = [
    `너는 단톡방 시뮬레이터다. "${me}"가 아래 트리거 메시지를 단톡방에 던졌을 때 이어질 대화를 생성한다.`,
    `시뮬레이션 모드: ${mode} — ${GROUP_MODE_GUIDE[mode]}`,
    GROUP_TONE,
    hourLine,
    "각 페르소나 카드의 voice/signature_phrases/reaction_style을 살려 캐릭터를 유지하라. 무시·떡밥 묻힘·삼천포·우르르 몰리기 같은 단톡 역학을 표현하라.",
    `중요: "${me}"는 글쓴이이므로 thread의 speaker로 등장시키지 마라. speaker는 페르소나 이름만 사용.`,
    "다음 JSON 스키마로만 답하라:",
    `{
  "trigger": ${JSON.stringify(trigger)},
  "thread": [{ "speaker": "페르소나 이름", "text": "대사", "delay_hint": "즉답|5분 후|1시간 뒤 등", "in_character_note": "이 반응이 캐릭터와 맞는 이유 한 줄" }],
  "outcome": "떡밥 물림 | 조용히 묻힘 | 싸움 남 | 삼천포 중 하나(또는 유사 표현)",
  "who_stayed_silent": ["끝까지 반응 안 한 사람"]
}`,
    JSON_ONLY,
  ].join("\n");

  const personaCards = JSON.stringify(
    responders.map((p) => ({
      name: p.name,
      voice: p.voice,
      signature_phrases: p.signature_phrases,
      reaction_style: p.reaction_style,
      engages_with: p.engages_with,
      ignores: p.ignores,
      active_hours: p.stats?.active_hours ?? [],
      talks_most_to: p.talks_most_to,
    })),
  );

  const user = [
    `글쓴이(나): ${me}`,
    `참여 가능한 페르소나(JSON): ${personaCards}`,
    contextLines ? `\n[최근 실제 대화 스타일 앵커]\n${contextLines}` : "",
    `\n[${me}가 던진 트리거]\n${trigger}`,
  ]
    .filter(Boolean)
    .join("\n");

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}
