/**
 * Builds a tiny fictional StoredAnalysis for public /sample/analysis.json.
 * No real names or exports. Safe to commit.
 * Run: cd web && npm run seed-public-demo
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { StoredAnalysis } from "../src/lib/types";

const ME = "민준";
const THEM = "수아";
const t0 = new Date("2024-12-01T18:00:00+09:00").getTime();

const messages = [
  { ts: t0, sender: THEM, text: "오늘 영화 재밌었어 ㅋㅋ", isSystem: false },
  { ts: t0 + 600_000, sender: ME, text: "나도. 집 잘 들어가", isSystem: false },
  { ts: t0 + 900_000, sender: THEM, text: "응 너도!", isSystem: false },
  { ts: t0 + 86_400_000, sender: THEM, text: "주말에 시간 돼?", isSystem: false },
  { ts: t0 + 86_400_000 + 7200_000, sender: ME, text: "토요일 오후쯤?", isSystem: false },
  { ts: t0 + 172_800_000, sender: THEM, text: "요즘 좀 바빠서 연락 늦었어 미안", isSystem: false },
  { ts: t0 + 172_800_000 + 3600_000, sender: ME, text: "괜찮아. 바쁘면 바쁘다고 말해줘", isSystem: false },
  { ts: t0 + 259_200_000, sender: THEM, text: "…", isSystem: false },
  { ts: t0 + 259_200_000 + 18_000_000, sender: ME, text: "무슨 일 있어?", isSystem: false },
  { ts: t0 + 345_600_000, sender: THEM, text: "그냥 생각 정리 중", isSystem: false },
];

const record: StoredAnalysis = {
  id: "what-if-demo-public",
  createdAt: Date.now(),
  title: "데모 대화 (2024.12~2025.01)",
  mode: "one_on_one",
  me: ME,
  parseResult: {
    format: "android",
    title: "수아",
    participants: [THEM, ME],
    messages,
    mode: "one_on_one",
  },
  stats: {
    totalMessages: messages.length,
    dateRange: { start: t0, end: t0 + 345_600_000 },
    perPerson: [
      {
        name: ME,
        msgCount: 3,
        charCount: 40,
        avgLen: 13,
        laughRate: 0,
        emojiRate: 0,
        questionRate: 0.33,
        medianReplySec: 3600,
        initiationCount: 2,
        activeHours: [18, 19],
      },
      {
        name: THEM,
        msgCount: 5,
        charCount: 55,
        avgLen: 11,
        laughRate: 0.2,
        emojiRate: 0,
        questionRate: 0.2,
        medianReplySec: 7200,
        initiationCount: 3,
        activeHours: [18, 20],
      },
    ],
    density: [
      { date: "2024-12-01", count: 3 },
      { date: "2024-12-02", count: 2 },
      { date: "2024-12-03", count: 2 },
      { date: "2024-12-04", count: 1 },
      { date: "2024-12-05", count: 2 },
    ],
    latencyTrend: [{ weekStart: "2024-12-01", medianSec: 5400 }],
    sessions: [
      {
        id: "s1",
        startTs: t0,
        endTs: t0 + 900_000,
        startIdx: 0,
        endIdx: 2,
        msgCount: 3,
        riskScore: 35,
        label: "2024-12-01 ~ 2024-12-01",
      },
      {
        id: "s2",
        startTs: t0 + 259_200_000,
        endTs: t0 + 345_600_000,
        startIdx: 7,
        endIdx: 9,
        msgCount: 3,
        riskScore: 72,
        label: "2024-12-04 ~ 2024-12-05",
      },
    ],
    doubleTextingByPerson: { [ME]: 0, [THEM]: 1 },
    questionIgnoreRate: 0,
  },
  segments: [
    {
      segment_id: "s2",
      time_range: "2024-12-04 ~ 2024-12-05",
      summary: "연락 간격이 벌어지며 거리감이 드러난 구간",
      tension_score: 68,
      who_is_pulling_away: "them",
      risky_moments: [
        { quote: "…", why: "단답과 침묵으로 대화가 끊김", severity: 55 },
      ],
      my_mistakes: [
        {
          quote: "무슨 일 있어?",
          issue: "상대의 속도를 존중하지 않고 재촉",
          better_version: "바쁘면 나중에 편할 때 얘기하자. 기다릴게.",
        },
      ],
      tone: { me: "불안·확인 욕구", them: "회피·정리 중" },
    },
  ],
  overview: {
    relationship_arc:
      "처음엔 가벼운 만남이 이어졌지만, 한쪽의 속도 차이와 연락 빈도 변화가 쌓이며 거리감이 커진 흐름입니다.",
    breakup_reasons: [
      {
        reason: "연락 리듬 불일치",
        evidence: ["요즘 좀 바빠서 연락 늦었어 미안", "…"],
      },
    ],
    turning_points: [{ when: "2024-12-04", what: "단답과 침묵이 반복되기 시작" }],
    your_patterns: ["확인 질문이 잦아짐"],
    their_patterns: ["바쁨을 이유로 답장 간격 확대"],
  },
};

const out = resolve(process.cwd(), "public/sample/analysis.json");
mkdirSync(resolve(process.cwd(), "public/sample"), { recursive: true });
writeFileSync(out, JSON.stringify(record));
console.log(`Wrote ${out} (fictional demo, safe to commit)`);
