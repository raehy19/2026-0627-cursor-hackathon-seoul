import type {
  Counterfactual,
  CfMode,
  DerivedStats,
  GroupSimMode,
  GroupSimResult,
  Msg,
  Overview,
  ParseResult,
  PersonaCard,
  PersonStats,
  SegmentAnalysis,
  Session,
} from "@/lib/types";
import { LLM_CONCURRENCY, MAP_CHAR_BUDGET } from "@/lib/llm/config";
import { callLLMJson, LlmError, LlmUnavailableError } from "@/lib/llm/json";
import {
  buildCounterfactualPrompt,
  buildGroupSimPrompt,
  buildOverviewPrompt,
  buildPersonaPrompt,
  buildSegmentPrompt,
} from "@/lib/llm/prompts";

export type ProgressCb = (done: number, total: number, label?: string) => void;
export type SegmentCb = (segment: SegmentAnalysis) => void;

// Re-exported so the UI can `catch` proxy/availability failures from one place.
export { LlmUnavailableError, LlmError };

/**
 * Browser-side LLM orchestration. Calls the /api/llm proxy with a map-reduce
 * pattern so it survives huge chats and free-tier rate limits.
 * See PRD §6 (map-reduce), §7 (1:1 prompts/schemas), §5B (group).
 */

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function fmtDateTime(ts: number): string {
  const d = new Date(ts);
  return `${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function humanizeDelay(sec: number): string {
  if (sec < 60) return `${sec}초`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}분`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}시간`;
  return `${Math.round(hr / 24)}일`;
}

function renderText(m: Msg): string {
  if (m.isMedia) {
    const t = m.text?.trim();
    return t ? `«${t}»` : "«미디어»";
  }
  if (m.isUrl) return "«링크»";
  return m.text ?? "";
}

/**
 * Format messages as lines:
 *   "[MM-DD HH:MM] sender(나): text  (답장지연 Ns)"
 * Latency is annotated only when the sender differs from the previous rendered
 * message (i.e. an actual reply). System messages are skipped from the text.
 * Pass `me=""` to disable the (나) marker (e.g. single-person persona samples).
 */
function formatLines(msgs: Msg[], me: string): string[] {
  const lines: string[] = [];
  let prev: Msg | null = null;
  for (const m of msgs) {
    if (m.isSystem) continue;
    const who = me && m.sender === me ? `${m.sender}(나)` : m.sender;
    let line = `[${fmtDateTime(m.ts)}] ${who}: ${renderText(m)}`;
    if (prev && prev.sender !== m.sender) {
      const delaySec = Math.max(0, Math.round((m.ts - prev.ts) / 1000));
      line += `  (답장지연 ${humanizeDelay(delaySec)})`;
    }
    lines.push(line);
    prev = m;
  }
  return lines;
}

/** Keep head + tail within a char budget, eliding the middle. */
function clampLinesToBudget(lines: string[], maxChars: number): string {
  const joined = lines.join("\n");
  if (joined.length <= maxChars) return joined;

  const head: string[] = [];
  const tail: string[] = [];
  let used = 0;
  let i = 0;
  let j = lines.length - 1;
  let takeHead = true;
  const reserve = 32; // for the elision marker
  const budget = Math.max(0, maxChars - reserve);

  while (i <= j) {
    const line = takeHead ? lines[i] : lines[j];
    if (used + line.length + 1 > budget) break;
    used += line.length + 1;
    if (takeHead) {
      head.push(line);
      i++;
    } else {
      tail.unshift(line);
      j--;
    }
    takeHead = !takeHead;
  }
  const omitted = j - i + 1;
  const marker = omitted > 0 ? `\n... (중략 ${omitted}개 메시지) ...\n` : "\n";
  return head.join("\n") + marker + tail.join("\n");
}

/** Run `fn` over items with a fixed concurrency cap; preserves input order. */
async function mapPool<I, O>(
  items: I[],
  limit: number,
  fn: (item: I, index: number) => Promise<O>,
): Promise<O[]> {
  const results: O[] = new Array(items.length);
  let next = 0;
  async function worker(): Promise<void> {
    for (;;) {
      const idx = next++;
      if (idx >= items.length) return;
      results[idx] = await fn(items[idx], idx);
    }
  }
  const poolSize = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: poolSize }, () => worker()));
  return results;
}

function otherParticipant(parse: ParseResult, me: string): string {
  return parse.participants.find((p) => p !== me) ?? "상대";
}

function avg(nums: number[]): number {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Compact stats digest fed to the REDUCE step (no LLM-computed numbers). */
function buildStatsSummary(stats: DerivedStats, me: string, them: string): string {
  const lt = stats.latencyTrend;
  let latencyTrend = "데이터 부족";
  if (lt.length >= 2) {
    const first = lt[0].medianSec;
    const last = lt[lt.length - 1].medianSec;
    const diff = last - first;
    const thresh = Math.max(1, first * 0.15);
    latencyTrend = diff > thresh ? "느려짐(증가)" : diff < -thresh ? "빨라짐(감소)" : "비슷";
  }

  const dens = stats.density;
  let densityTrend = "데이터 부족";
  if (dens.length >= 6) {
    const third = Math.floor(dens.length / 3);
    const early = avg(dens.slice(0, third).map((d) => d.count));
    const late = avg(dens.slice(dens.length - third).map((d) => d.count));
    densityTrend = late < early * 0.7 ? "후반 급감" : late > early * 1.3 ? "후반 증가" : "비슷";
  }

  const perPerson = stats.perPerson.map((p) => ({
    name: p.name,
    median_reply_sec: Math.round(p.medianReplySec),
    avg_len: Math.round(p.avgLen),
    double_texting: stats.doubleTextingByPerson[p.name] ?? 0,
  }));

  return JSON.stringify({
    me,
    them,
    latency_trend: latencyTrend,
    density_trend: densityTrend,
    question_ignore_rate: round2(stats.questionIgnoreRate),
    per_person: perPerson,
  });
}

/** Recent-weighted sample of one person's messages, capped at `cap`. */
function stratifiedSample(messages: Msg[], name: string, cap: number): Msg[] {
  const mine = messages.filter((m) => m.sender === name && !m.isSystem);
  if (mine.length <= cap) return mine;
  const recentCount = Math.floor(cap * 0.6);
  const olderCount = cap - recentCount;
  const recent = mine.slice(mine.length - recentCount);
  const olderPool = mine.slice(0, mine.length - recentCount);
  const step = olderPool.length / Math.max(1, olderCount);
  const older: Msg[] = [];
  for (let k = 0; k < olderCount; k++) {
    const m = olderPool[Math.floor(k * step)];
    if (m) older.push(m);
  }
  return [...older, ...recent];
}

function personaStatsBlock(ps?: PersonStats): PersonaCard["stats"] {
  return {
    avg_len: Math.round(ps?.avgLen ?? 0),
    laugh_rate: round2(ps?.laughRate ?? 0),
    median_reply_sec: Math.round(ps?.medianReplySec ?? 0),
    active_hours: ps?.activeHours ?? [],
  };
}

// ---------------------------------------------------------------------------
// Public API (frozen signatures)
// ---------------------------------------------------------------------------

/** 1:1 MAP (top-N risky sessions) -> REDUCE. */
export async function runOneOnOneAnalysis(
  parse: ParseResult,
  stats: DerivedStats,
  me: string,
  opts?: {
    maxSegments?: number;
    onProgress?: ProgressCb;
    onSegment?: SegmentCb;
    signal?: AbortSignal;
  },
): Promise<{ segments: SegmentAnalysis[]; overview: Overview }> {
  const maxSegments = opts?.maxSegments ?? 8;
  const onProgress = opts?.onProgress;
  const onSegment = opts?.onSegment;
  const signal = opts?.signal;
  const them = otherParticipant(parse, me);

  const chosen: Session[] = [...stats.sessions]
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, maxSegments);

  const total = chosen.length + 1; // +1 for the REDUCE step
  let done = 0;
  onProgress?.(done, total, "구간 분석 시작");

  const segments = await mapPool(chosen, LLM_CONCURRENCY, async (session) => {
    const msgs = parse.messages.slice(session.startIdx, session.endIdx + 1);
    const block = clampLinesToBudget(formatLines(msgs, me), MAP_CHAR_BUDGET);
    const messages = buildSegmentPrompt({
      me,
      them,
      segmentId: session.id,
      timeRange: session.label,
      lines: block,
    });
    const raw = await callLLMJson<SegmentAnalysis>(messages, {
      temperature: 0.4,
      max_tokens: 1200,
      signal,
    });
    // Authoritative identity fields come from local stats, not the LLM.
    const seg: SegmentAnalysis = {
      ...raw,
      segment_id: session.id,
      time_range: session.label,
      risky_moments: raw.risky_moments ?? [],
      my_mistakes: raw.my_mistakes ?? [],
      tone: raw.tone ?? { me: "", them: "" },
    };
    done++;
    onSegment?.(seg);
    onProgress?.(done, total, session.label);
    return seg;
  });

  const statsSummary = buildStatsSummary(stats, me, them);
  const overview = await callLLMJson<Overview>(
    buildOverviewPrompt({ me, them, segments, statsSummary }),
    { temperature: 0.4, max_tokens: 1600, signal },
  );
  done++;
  onProgress?.(done, total, "종합 분석 완료");

  return { segments, overview };
}

/** "What if I had said it differently" for one moment. */
export async function runCounterfactual(
  parse: ParseResult,
  stats: DerivedStats,
  me: string,
  segment: SegmentAnalysis,
  mode: CfMode,
): Promise<Counterfactual> {
  const them = otherParticipant(parse, me);
  const session = stats.sessions.find((s) => s.id === segment.segment_id);

  let lines = "";
  let contextLines = "";
  if (session) {
    const msgs = parse.messages.slice(session.startIdx, session.endIdx + 1);
    lines = clampLinesToBudget(formatLines(msgs, me), MAP_CHAR_BUDGET);
    const ctxStart = Math.max(0, session.startIdx - 10);
    const ctx = parse.messages.slice(ctxStart, session.startIdx);
    contextLines = clampLinesToBudget(formatLines(ctx, me), 1000);
  }

  const messages = buildCounterfactualPrompt({
    me,
    them,
    mode,
    segmentId: segment.segment_id,
    segmentSummary: segment.summary,
    riskyMoments: segment.risky_moments ?? [],
    contextLines,
    lines,
  });

  const temperature = mode === "disaster" ? 0.95 : mode === "best_case" ? 0.8 : 0.7;
  const raw = await callLLMJson<Counterfactual>(messages, { temperature, max_tokens: 1300 });

  return {
    ...raw,
    segment_id: segment.segment_id,
    mode,
    simulated_timeline: raw.simulated_timeline ?? [],
  };
}

/** Group: one persona card per participant. */
export async function extractPersonas(
  parse: ParseResult,
  stats: DerivedStats,
  opts?: { onProgress?: ProgressCb; signal?: AbortSignal },
): Promise<PersonaCard[]> {
  const onProgress = opts?.onProgress;
  const signal = opts?.signal;
  const participants = parse.participants;
  const total = participants.length;
  let done = 0;
  onProgress?.(done, total, "페르소나 추출 시작");

  return mapPool(participants, LLM_CONCURRENCY, async (name) => {
    const personStats = stats.perPerson.find((p) => p.name === name);
    const sample = stratifiedSample(parse.messages, name, 250);
    const sampleLines = clampLinesToBudget(formatLines(sample, ""), 5000);
    const messages = buildPersonaPrompt({ name, participants, personStats, sampleLines });
    const raw = await callLLMJson<PersonaCard>(messages, {
      temperature: 0.5,
      max_tokens: 900,
      signal,
    });
    const card: PersonaCard = {
      ...raw,
      name,
      signature_phrases: raw.signature_phrases ?? [],
      engages_with: raw.engages_with ?? [],
      ignores: raw.ignores ?? [],
      // Numbers come from local stats, never from the LLM.
      stats: personaStatsBlock(personStats),
    };
    done++;
    onProgress?.(done, total, name);
    return card;
  });
}

/** Group: simulate the thread that follows a hypothetical message. */
export async function runGroupSim(
  personas: PersonaCard[],
  contextMsgs: Msg[],
  trigger: string,
  opts: { mode: GroupSimMode; hour?: number; me: string },
): Promise<GroupSimResult> {
  const { mode, hour, me } = opts;
  const responders = personas.filter((p) => p.name !== me);
  const contextLines = clampLinesToBudget(formatLines(contextMsgs, me), 2500);

  const messages = buildGroupSimPrompt({ responders, me, trigger, mode, hour, contextLines });
  const temperature = mode === "chaos" ? 1.0 : mode === "wholesome" ? 0.7 : 0.85;
  const raw = await callLLMJson<GroupSimResult>(messages, { temperature, max_tokens: 1800 });

  // Defensive: the poster must never appear as a responder in the thread.
  const thread = (raw.thread ?? []).filter((t) => t.speaker !== me);
  return {
    ...raw,
    trigger,
    thread,
    who_stayed_silent: raw.who_stayed_silent ?? [],
  };
}
