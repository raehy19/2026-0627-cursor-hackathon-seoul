/**
 * Local heuristic "LLM" — no network, no OpenRouter.
 * Uses parsed messages + DerivedStats to produce PRD-shaped analysis JSON offline.
 */
import type {
  CfMode,
  Counterfactual,
  DerivedStats,
  GroupSimMode,
  GroupSimResult,
  Msg,
  Overview,
  ParseResult,
  PersonaCard,
  RiskyMoment,
  SegmentAnalysis,
  Session,
} from "@/lib/types";

const DISMISSIVE = /^(ㅇㅇ|ㅇ|ㄴ)$/i;

/** Realistic cold / avoidant phrasing — not one-char trolling. */
const COLD_PATTERNS: { re: RegExp; why: string; severity: number; better: string }[] = [
  {
    re: /지금은 좀 (집중|쉬고|피곤|버거)|오늘은 좀 쉬고|같은 얘기 또|그렇게까지는 아닌/,
    why: "대화를 미루거나 상대 감정을 축소하는 표현이에요.",
    severity: 78,
    better: "지금 마음이 복잡한 건 맞아. 오늘은 힘들지만 내일 제대로 듣고 싶어.",
  },
  {
    re: /알겠어\. 생각해볼게/,
    why: "진지한 제안에 바로 거리를 두는 답이에요.",
    severity: 72,
    better: "쉬자는 말이 걱정돼. 헤어지자는 뜻은 아니지?",
  },
  {
    re: /깜빡|요즘 일이 많|프로젝트 마감/,
    why: "중요한 날을 챙기지 못한 순간이에요.",
    severity: 70,
    better: "생일인데 연락이 늦었어. 미안하고, 내일 만나서 제대로 축하할게.",
  },
  {
    re: /^(미안)\.?$/,
    why: "형식적인 사과만 하고 감정을 따라가지 않았어요.",
    severity: 65,
    better: "미안해. 네가 서운했을 것 같아. 어떤 점이 제일 속상했어?",
  },
];

const PARTNER_STRESS_PATTERNS: { re: RegExp; why: string; severity: number }[] = [
  {
    re: /너 나 안 좋아|그게 다야|확답 주면|한마디는/,
    why: "불안을 확인받으려 압박하는 표현이에요. 대화를 더 날카롭게 만들 수 있어요.",
    severity: 55,
  },
  {
    re: /그렇게 가까이|또 하자는|연락 없네/,
    why: "오해를 추궁하는 쪽으로 흐름이 기울었어요. 설명을 요구하기 전에 감정부터 확인하는 게 도움이 됩니다.",
    severity: 52,
  },
];

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function otherParticipant(parse: ParseResult, me: string): string {
  return parse.participants.find((p) => p !== me) ?? "상대";
}

function truncate(s: string, max = 80): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

function replyLatencySec(messages: Msg[], idx: number): number | null {
  const m = messages[idx];
  if (m.isSystem) return null;
  for (let j = idx - 1; j >= 0; j--) {
    const prev = messages[j];
    if (prev.isSystem || prev.sender === m.sender) continue;
    return Math.max(0, Math.round((m.ts - prev.ts) / 1000));
  }
  return null;
}

function contextSnippet(msgs: Msg[], idx: number, radius = 2): string {
  return msgs
    .slice(Math.max(0, idx - radius), Math.min(msgs.length, idx + radius + 1))
    .filter((m) => !m.isSystem && !m.isMedia && m.text.length > 0)
    .map((m) => `${m.sender}: ${truncate(m.text, 36)}`)
    .join(" → ");
}

function findMsgIndex(msgs: Msg[], quote: string): number {
  const q = quote.replace(/…$/, "").trim();
  let idx = msgs.findIndex((m) => m.text.includes(q) || q.includes(m.text.slice(0, 24)));
  if (idx >= 0) return idx;
  idx = msgs.findIndex((m) => truncate(m.text, 40) === quote);
  return idx;
}

function pickFallbackRisky(msgs: Msg[], me: string): RiskyMoment {
  const mine = msgs.filter((m) => m.sender === me && !m.isSystem && m.text.length > 1);
  const cold = mine.find((m) => COLD_PATTERNS.some((p) => p.re.test(m.text.trim())));
  if (cold) {
    const idx = msgs.indexOf(cold);
    return {
      quote: truncate(cold.text),
      why: `이 구간에서 가장 차가운 반응이에요. ${contextSnippet(msgs, idx)}`,
      severity: 85,
    };
  }
  const emotionalThem = [...msgs]
    .filter((m) => m.sender !== me && !m.isSystem && m.text.length > 6)
    .find((m) => /쉬|서운|화|멀어|설명|생일|보고/.test(m.text));
  if (emotionalThem) {
    const idx = msgs.indexOf(emotionalThem);
    return {
      quote: truncate(emotionalThem.text),
      why: `상대가 감정을 드러낸 순간이에요. ${contextSnippet(msgs, idx)}`,
      severity: 75,
    };
  }
  const any = mine[mine.length - 1] ?? msgs.find((m) => !m.isSystem);
  return {
    quote: any ? truncate(any.text) : "…",
    why: "답장 간격·톤 변화가 눈에 띄는 구간이에요.",
    severity: 55,
  };
}

function findRiskyInSession(
  msgs: Msg[],
  me: string,
  them: string,
): { risky: RiskyMoment[]; mistakes: SegmentAnalysis["my_mistakes"] } {
  const risky: RiskyMoment[] = [];
  const mistakes: SegmentAnalysis["my_mistakes"] = [];
  const seen = new Set<string>();

  for (let i = 0; i < msgs.length; i++) {
    const m = msgs[i];
    if (m.isSystem || m.isMedia) continue;

    if (m.sender === me) {
      for (const pat of COLD_PATTERNS) {
        if (!pat.re.test(m.text.trim())) continue;
        const q = truncate(m.text);
        if (seen.has(q)) continue;
        seen.add(q);
        const prevThem = msgs
          .slice(Math.max(0, i - 4), i)
          .reverse()
          .find((x) => x.sender === them && !x.isSystem);
        const ctx = contextSnippet(msgs, i);
        risky.push({
          quote: q,
          why: prevThem
            ? `${pat.why} 직전에 ${them}: "${truncate(prevThem.text, 48)}" → ${ctx}`
            : `${pat.why} ${ctx}`,
          severity: pat.severity,
        });
        mistakes.push({
          quote: q,
          issue: pat.why,
          better_version: pat.better,
        });
      }

      if (DISMISSIVE.test(m.text.trim()) && m.text.length <= 2) {
        const prevThem = msgs
          .slice(Math.max(0, i - 3), i)
          .reverse()
          .find((x) => x.sender === them && !x.isSystem && x.text.length > 8);
        if (!prevThem) continue;
        const q = truncate(m.text);
        if (seen.has(q)) continue;
        seen.add(q);
        risky.push({
          quote: q,
          why: `감정적인 말 뒤 지나치게 짧게 끊었어요. ${contextSnippet(msgs, i)}`,
          severity: 68,
        });
        mistakes.push({
          quote: q,
          issue: "상대가 길게 말한 뒤 너무 짧게 답했어요.",
          better_version: "읽었어. 지금은 바쁜데 이따 제대로 답할게.",
        });
      }
    } else if (m.sender === them) {
      for (const pat of PARTNER_STRESS_PATTERNS) {
        if (!pat.re.test(m.text)) continue;
        const q = truncate(m.text);
        if (seen.has(q)) continue;
        seen.add(q);
        risky.push({
          quote: q,
          why: `${pat.why} ${contextSnippet(msgs, i)}`,
          severity: pat.severity,
        });
      }
      if (/쉬|헤어|그만|멀어|서운|화나|속상|정리|시간 갖/.test(m.text)) {
        const q = truncate(m.text);
        if (!seen.has(q)) {
          seen.add(q);
          risky.push({
            quote: q,
            why: `관계의 전환점이 될 수 있는 말이에요. ${contextSnippet(msgs, i)}`,
            severity: 90,
          });
        }
      }
      const lat = replyLatencySec(msgs, i);
      if (lat !== null && lat > 3600 * 8 && m.text.length > 15) {
        const q = truncate(m.text);
        if (!seen.has(q)) {
          seen.add(q);
          risky.push({
            quote: q,
            why: `오랜 침묵 뒤 이어진 메시지예요. ${contextSnippet(msgs, i)}`,
            severity: 70,
          });
        }
      }
    }
  }

  risky.sort((a, b) => b.severity - a.severity);
  return {
    risky: risky.slice(0, 5),
    mistakes: mistakes.slice(0, 4),
  };
}

function sceneSummary(msgs: Msg[], me: string, them: string, risky: RiskyMoment[]): string {
  if (risky.length === 0) return "대화량은 있지만 뚜렷한 충돌 신호는 적은 구간이에요.";
  const top = risky[0];
  if (/쉬|헤어|정리|시간 갖/.test(top.quote)) {
    return `${them}이 관계를 재정의하려 한 순간이에요. "${top.quote}" 직후 내 반응이 결말을 좌우했을 수 있습니다.`;
  }
  if (/집중|쉬고|또 하자|그렇게까지|깜빡/.test(top.quote)) {
    return `감정이 올라온 자리에서 대화를 끊거나 밀어낸 표현이 보여요. 상대는 "${risky.find((r) => r.quote !== top.quote)?.quote ?? "…"}"라고 이미 신호를 보냈습니다.`;
  }
  return `답장 톤·리듬에서 긴장이 느껴지는 구간이에요. 핵심: "${top.quote}" — ${top.why.split("→")[0]?.trim() ?? top.why}`;
}

export function mockAnalyzeSegment(
  parse: ParseResult,
  session: Session,
  me: string,
): SegmentAnalysis {
  const them = otherParticipant(parse, me);
  const msgs = parse.messages.slice(session.startIdx, session.endIdx + 1);
  const conflict = sessionConflictBoost(parse, session, me);
  const peaceful = sessionPeacefulBoost(parse, session);

  if (peaceful >= 22 && conflict < 22) {
    return analyzePeacefulSegment(parse, session, me, them, msgs);
  }

  let { risky, mistakes } = findRiskyInSession(msgs, me, them);

  if (risky.length === 0) {
    risky = [pickFallbackRisky(msgs, me)];
  }

  const myCount = msgs.filter((m) => m.sender === me && !m.isSystem).length;
  const theirCount = msgs.filter((m) => m.sender === them && !m.isSystem).length;
  let pulling: SegmentAnalysis["who_is_pulling_away"] = "neither";
  if (myCount > theirCount * 1.35) pulling = "them";
  if (theirCount > myCount * 1.35) pulling = "me";

  const tension = Math.round(
    Math.min(100, session.riskScore * 0.7 + (risky[0]?.severity ?? 50) * 0.35 + risky.length * 4),
  );

  return {
    segment_id: session.id,
    time_range: session.label,
    summary: sceneSummary(msgs, me, them, risky),
    tension_score: tension,
    who_is_pulling_away: pulling,
    risky_moments: risky,
    my_mistakes: mistakes.length
      ? mistakes
      : [
          {
            quote: risky[0].quote,
            issue: "감정을 받아주기보다 짧게 넘긴 순간이에요.",
            better_version: "지금 네 기분이 어떤지 먼저 듣고 싶어.",
          },
        ],
    tone: {
      me: pulling === "me" ? "단답·회피" : risky[0]?.severity >= 80 ? "차갑고 방어적" : "무덤덤",
      them: pulling === "them" ? "조심스럽게 거리 둠" : "감정 표현이 많음",
    },
  };
}

export function mockBuildOverview(
  parse: ParseResult,
  stats: DerivedStats,
  segments: SegmentAnalysis[],
  me: string,
): Overview {
  const them = otherParticipant(parse, me);
  const lt = stats.latencyTrend;
  const dens = stats.density;
  const allRisky = segments.flatMap((s) => s.risky_moments);
  allRisky.sort((a, b) => b.severity - a.severity);
  const topQuotes = allRisky.slice(0, 4);

  let arc = `6개월간의 대화를 보면, 초반에는 약속과 데이트가 자연스럽게 이어졌지만 `;
  if (lt.length >= 2 && lt[lt.length - 1].medianSec > lt[0].medianSec * 1.2) {
    arc += `시간이 지날수록 ${them}의 답장을 기다리는 간격이 길어졌어요. `;
  } else {
    arc += "중반 이후 답장 리듬이 눈에 띄게 느려졌어요. ";
  }
  if (dens.length >= 4) {
    const early = dens.slice(0, Math.floor(dens.length / 3)).reduce((a, d) => a + d.count, 0);
    const late = dens.slice(-Math.floor(dens.length / 3)).reduce((a, d) => a + d.count, 0);
    arc += late < early * 0.7 ? "대화 빈도도 후반으로 갈수록 줄었습니다. " : "";
  }
  const topMistake = segments
    .flatMap((s) => s.my_mistakes.map((m) => ({ ...m, sev: s.tension_score })))
    .sort((a, b) => b.sev - a.sev)[0];
  const hookQuote = topMistake?.quote ?? topQuotes[0]?.quote ?? "…";
  arc += `특히 "${hookQuote}" 같은 순간에서, 말의 온도 차이가 쌓인 패턴이 보여요. `;
  arc += `${them}도 불안할 때는 확인 질문을 했고, 나는 바쁨·피로를 이유로 대화를 미루는 쪽으로 기울었습니다.`;

  const reasons: Overview["breakup_reasons"] = [
    {
      reason: "감정 대화를 회피하거나 단답으로 끊음",
      evidence: topQuotes
        .filter((r) => /^(바빠|알겠어|ㅇ|됐고|굳이)/.test(r.quote) || r.severity >= 85)
        .slice(0, 3)
        .map((r) => r.quote),
    },
    {
      reason: "상대의 불안·질투 신호를 충분히 안심시키지 못함",
      evidence: allRisky
        .filter((r) => /친구|설명|오해|멀어|쉬/.test(r.quote))
        .slice(0, 2)
        .map((r) => r.quote),
    },
  ].filter((r) => r.evidence.length > 0);

  const topSessions = [...stats.sessions]
    .map((s) => ({ s, rank: s.riskScore + sessionConflictBoost(parse, s, me) }))
    .sort((a, b) => b.rank - a.rank)
    .slice(0, 5)
    .map((x) => x.s);
  const sceneLabels: Record<string, string> = {
    "02-14": "발렌타인데이 — '굳이 그렇게까지' 발언",
    "02-20": "상대 생일 — 깜빡·형식적 사과",
    "03-02": "질투 논쟁 — '그냥 친구야' / '뭐 설명해'",
    "05-02": "휴식 제안에 '알겠어'로 수용",
    "05-18": "이별 정리 — '필요하면' 만남",
  };

  return {
    relationship_arc: arc,
    breakup_reasons: reasons,
    turning_points: topSessions.map((s) => {
      const dateKey = s.label.split("~")[0]?.trim().slice(5) ?? "";
      const matched = Object.entries(sceneLabels).find(([k]) => dateKey.includes(k));
      const seg = segments.find((x) => x.segment_id === s.id);
      return {
        when: s.label.split("~")[0]?.trim() ?? s.label,
        what:
          matched?.[1] ??
          seg?.risky_moments[0]?.quote ??
          `긴장 ${Math.round(seg?.tension_score ?? s.riskScore)} — "${truncate(seg?.summary ?? "대화 리듬 변화", 60)}"`,
      };
    }),
    your_patterns: [
      "감정이 올라온 순간 짧게 끊거나 ('됐고', '나중에') 넘기는 경향",
      "상대의 긴 메시지 뒤 'ㅇ', '응', '알겠어'로 마무리하는 빈도가 높음",
      `질문 무시율 약 ${Math.round(stats.questionIgnoreRate * 100)}% — export 한계 포함 추정`,
      stats.doubleTextingByPerson[me] > 30
        ? "불안할 때 연속 메시지를 보내다가, 답장 오면 다시 단답으로 돌아감"
        : "답장 길이 편차는 크지만 후반부일수록 짧아짐",
    ],
    their_patterns: [
      `${them}은 갈등 전 감정을 먼저 말로 표현 ('서운해', '멀어진 것 같아')`,
      `중앙 응답 시간 ${Math.round(stats.perPerson.find((p) => p.name === them)?.medianReplySec ?? 0)}초 — 후반으로 갈수록 내 답장을 기다림`,
      "이별·휴식을 '제안' 형태로 먼저 꺼내는 패턴 (즉시 헤어짐 선언은 드묾)",
    ],
  };
}

export function mockCounterfactual(
  parse: ParseResult,
  segment: SegmentAnalysis,
  me: string,
  mode: CfMode,
  alternativeLine?: string,
): Counterfactual {
  const them = otherParticipant(parse, me);
  const mistake = segment.my_mistakes[0];
  const risky = segment.risky_moments[0];
  const original = mistake?.quote ?? risky?.quote ?? "그때 한 말";
  const suggested =
    alternativeLine?.trim() ||
    mistake?.better_version ||
    "지금 네 기분부터 듣고 싶어. 어떤 게 제일 속상했어?";

  const isBreakup = /쉬|헤어|정리/.test(original + (risky?.quote ?? ""));

  const templates: Record<CfMode, Counterfactual["simulated_timeline"]> = {
    realistic: isBreakup
      ? [
          { sender: them, text: "…그래도 이렇게 끝내고 싶진 않아.", delay_hint: "10분 후" },
          { sender: me, text: "나도 그래. 쉬자는 말, 무슨 뜻이었어?", delay_hint: "즉답" },
          { sender: them, text: "잠깐 숨 고르자는 거였어.", delay_hint: "5분 후" },
        ]
      : [
          { sender: them, text: "…알겠어. 그 말은 좀 마음에 남네.", delay_hint: "20분 후" },
          { sender: me, text: "더 듣고 싶어. 지금 기분은?", delay_hint: "즉답" },
        ],
    best_case: [
      { sender: them, text: "그 말 듣고 좀 안심됐어.", delay_hint: "5분 후" },
      { sender: me, text: "앞으론 신호 놓치지 않을게.", delay_hint: "즉답" },
      { sender: them, text: "주말에 만나서 얘기 더 하자.", delay_hint: "1시간 후" },
    ],
    disaster: [
      { sender: them, text: "…역시 대화가 안 통해.", delay_hint: "즉답" },
      { sender: me, text: "아니 그게 아니라", delay_hint: "즉답" },
      { sender: them, text: "오늘은 그만 할게.", delay_hint: "다음날" },
    ],
  };

  const outcome: Record<CfMode, string> = {
    realistic: isBreakup
      ? "즉각 이별로 몰리진 않지만, '쉬자'의 의미를 확인하는 대화로 이어질 여지가 생겨요."
      : "갈등은 완전히 풀리진 않지만, 대화가 끊기지 않고 이어질 여지가 생겨요.",
    best_case: "서로의 의도를 확인하는 쪽으로 흐름이 부드럽게 돌아갈 수 있어요.",
    disaster: "감정이 더 격해져 당분간 연락 간격이 벌어질 수 있어요.",
  };

  return {
    segment_id: segment.segment_id,
    mode,
    original_line: original,
    suggested_line: suggested,
    rationale: mistake?.issue ?? risky?.why.split("→")[0]?.trim() ?? "감정을 받아주는 한 문장이 관계 유지에 유리해요.",
    simulated_timeline: templates[mode],
    outcome_delta: outcome[mode],
  };
}

export function mockPersona(
  name: string,
  stats: DerivedStats,
  messages: Msg[],
): PersonaCard {
  const ps = stats.perPerson.find((p) => p.name === name);
  const sample = messages.filter((m) => m.sender === name && !m.isSystem && m.text.length > 2).slice(-40);
  const phrases = sample
    .map((m) => truncate(m.text, 24))
    .filter((t, i, arr) => arr.indexOf(t) === i)
    .slice(0, 4);

  const laughHeavy = (ps?.laughRate ?? 0) > 0.08;
  return {
    name,
    voice: laughHeavy ? "가볍고 ㅋㅎ가 잦은 반응형" : "짧고 담백한 편",
    signature_phrases: phrases.length ? phrases : ["ㅇㅇ", "그래"],
    reaction_style: laughHeavy ? "드립·리액션 위주" : "짧게 받아치기",
    engages_with: ["일상", "약속"],
    ignores: ["긴 설교", "갑작스런 진지함"],
    stats: {
      avg_len: Math.round(ps?.avgLen ?? 0),
      laugh_rate: Math.round((ps?.laughRate ?? 0) * 100) / 100,
      median_reply_sec: Math.round(ps?.medianReplySec ?? 0),
      active_hours: ps?.activeHours ?? [],
    },
    talks_most_to: stats.perPerson[0]?.name ?? name,
  };
}

export function mockGroupSim(
  personas: PersonaCard[],
  trigger: string,
  me: string,
  mode: GroupSimMode,
): GroupSimResult {
  const responders = personas.filter((p) => p.name !== me).slice(0, 4);
  const thread = responders.slice(0, 3).map((p, i) => ({
    speaker: p.name,
    text:
      mode === "chaos"
        ? `${trigger.slice(0, 12)}…? ㅋㅋㅋ 미쳤네`
        : mode === "wholesome"
          ? "오 좋지 ㅎㅎ"
          : p.reaction_style.includes("짧") ? "ㅇㅇ" : "언제?",
    delay_hint: i === 0 ? "즉답" : `${(i + 1) * 3}분 후`,
    in_character_note: `${p.voice} 톤 유지`,
  }));

  return {
    trigger,
    thread,
    outcome: mode === "chaos" ? "떡밥 물림" : mode === "wholesome" ? "조용히 묻힘" : "떡밥 물림",
    who_stayed_silent: responders.slice(3).map((p) => p.name),
  };
}

function sessionConflictBoost(parse: ParseResult, session: Session, me: string): number {
  const msgs = parse.messages.slice(session.startIdx, session.endIdx + 1);
  let boost = 0;
  for (const m of msgs) {
    if (m.sender === me && COLD_PATTERNS.some((p) => p.re.test(m.text.trim()))) boost += 25;
    if (/쉬|헤어|설명|서운|화|멀어|정리|시간 갖|안 좋아/.test(m.text)) boost += 18;
  }
  return boost;
}

function sessionPeacefulBoost(parse: ParseResult, session: Session): number {
  const msgs = parse.messages.slice(session.startIdx, session.endIdx + 1);
  let boost = 0;
  for (const m of msgs) {
    if (m.isSystem) continue;
    if (/행복|재밌|고마|좋았|설레|100일|메리|보고|사랑|최고|즐거|데이트|여행|예쁘|일몰/.test(m.text)) boost += 16;
    if (/♥|ㅋㅋㅋ/.test(m.text) && m.text.length > 8) boost += 6;
  }
  return boost;
}

/** Pick distinct calendar days — avoids duplicate analysis for same date. */
export function chooseAnalysisSessions(
  parse: ParseResult,
  stats: DerivedStats,
  me: string,
  max: number,
): Session[] {
  const ranked = stats.sessions
    .filter((s) => s.msgCount >= 3)
    .map((session) => {
      const conflict = sessionConflictBoost(parse, session, me);
      const peaceful = sessionPeacefulBoost(parse, session);
      const day = session.label.split("~")[0]?.trim() ?? session.id;
      return {
        session,
        day,
        conflict,
        peaceful,
        rank: session.riskScore + conflict + peaceful * 0.65,
      };
    });

  const picked: Session[] = [];
  const seenIds = new Set<string>();
  const seenDays = new Set<string>();

  const add = (s: Session, day: string, force = false) => {
    if (seenIds.has(s.id) || picked.length >= max) return;
    if (!force && seenDays.has(day)) return;
    seenIds.add(s.id);
    seenDays.add(day);
    picked.push(s);
  };

  for (const x of ranked.filter((r) => r.conflict > 0).sort((a, b) => b.rank - a.rank)) {
    add(x.session, x.day);
  }
  for (const x of ranked
    .filter((r) => r.peaceful >= 14 && r.conflict < 15)
    .sort((a, b) => b.peaceful - a.peaceful)) {
    add(x.session, x.day);
  }
  for (const x of ranked.sort((a, b) => b.rank - a.rank)) {
    add(x.session, x.day, picked.length < 3);
  }
  return picked;
}

function analyzePeacefulSegment(
  parse: ParseResult,
  session: Session,
  me: string,
  them: string,
  msgs: Msg[],
): SegmentAnalysis {
  const happy =
    [...msgs]
      .filter((m) => m.sender === them && !m.isSystem && m.text.length > 4)
      .find((m) => /행복|좋|고마|재밌|100일|메리|설레|최고|일몰|예쁘/.test(m.text)) ??
    [...msgs].filter((m) => m.sender === them && !m.isSystem).pop();

  const myReply = [...msgs]
    .filter((m) => m.sender === me && !m.isSystem)
    .slice(-1)[0];
  const happyQuote = happy ? truncate(happy.text) : "좋은 하루였어";
  const myQuote = myReply ? truncate(myReply.text) : "ㅇ";

  return {
    segment_id: session.id,
    time_range: session.label,
    summary: `따뜻했던 구간이에요. ${them}이 "${happyQuote}"라고 했지만, 내 답장은 "${myQuote}"처럼 짧게 끝난 편이에요. 이 시기의 온도를 이후까지 유지하는 게 관건이었습니다.`,
    tension_score: Math.max(12, 35 - sessionPeacefulBoost(parse, session) / 3),
    who_is_pulling_away: "neither",
    risky_moments: [
      {
        quote: happyQuote,
        why: `좋은 분위기였던 순간이에요. ${happy ? contextSnippet(msgs, msgs.indexOf(happy)) : ""}`,
        severity: 38,
      },
    ],
    my_mistakes: [
      {
        quote: myQuote,
        issue: "좋은 순간에도 답이 짧아 상대가 아쉬움을 느꼈을 수 있어요.",
        better_version: "나도 즐거웠어. 다음에 또 보자.",
      },
    ],
    tone: { me: "무덤덤하지만 크게 싸우진 않음", them: "따뜻하고 적극적" },
  };
}

export async function mockRunOneOnOneAnalysis(
  parse: ParseResult,
  stats: DerivedStats,
  me: string,
  opts?: {
    maxSegments?: number;
    onProgress?: (done: number, total: number, label?: string) => void;
    onSegment?: (seg: SegmentAnalysis) => void;
    signal?: AbortSignal;
  },
): Promise<{ segments: SegmentAnalysis[]; overview: Overview }> {
  const max = opts?.maxSegments ?? 8;
  const chosen = chooseAnalysisSessions(parse, stats, me, max);
  const total = chosen.length + 1;
  let done = 0;
  opts?.onProgress?.(done, total, "로컬 분석 시작");

  const segments: SegmentAnalysis[] = [];
  const usedQuotes = new Set<string>();
  for (const session of chosen) {
    if (opts?.signal?.aborted) throw new DOMException("Aborted", "AbortError");
    await sleep(120);
    let seg = mockAnalyzeSegment(parse, session, me);
    const topQ = seg.risky_moments[0]?.quote;
    if (topQ && usedQuotes.has(topQ)) {
      const alt = seg.risky_moments.find((r) => !usedQuotes.has(r.quote));
      if (alt) {
        seg = {
          ...seg,
          risky_moments: [alt, ...seg.risky_moments.filter((r) => r.quote !== alt.quote)],
          summary: seg.summary.replace(topQ, alt.quote),
        };
      }
    }
    if (seg.risky_moments[0]?.quote) usedQuotes.add(seg.risky_moments[0].quote);
    segments.push(seg);
    opts?.onSegment?.(seg);
    done++;
    opts?.onProgress?.(done, total, session.label);
  }

  await sleep(80);
  const overview = mockBuildOverview(parse, stats, segments, me);
  done++;
  opts?.onProgress?.(done, total, "종합 완료");

  return { segments, overview };
}

export async function mockExtractPersonas(
  parse: ParseResult,
  stats: DerivedStats,
  opts?: {
    onProgress?: (done: number, total: number, label?: string) => void;
    signal?: AbortSignal;
  },
): Promise<PersonaCard[]> {
  const names = parse.participants;
  const total = names.length;
  let done = 0;
  const out: PersonaCard[] = [];
  for (const name of names) {
    if (opts?.signal?.aborted) throw new DOMException("Aborted", "AbortError");
    await sleep(80);
    out.push(mockPersona(name, stats, parse.messages));
    done++;
    opts?.onProgress?.(done, total, name);
  }
  return out;
}

/** Export for UI: excerpt around a quote in session messages */
export { findMsgIndex, contextSnippet, truncate as truncateQuote };
