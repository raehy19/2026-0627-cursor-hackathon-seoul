import type {
  DensityPoint,
  DerivedStats,
  LatencyTrendPoint,
  Msg,
  ParseResult,
  PersonStats,
  Session,
} from "@/lib/types";
import {
  hasEmoji,
  hasLaugh,
  isEmoticonMedia,
  isQuestion,
  median,
  minMaxNormalize,
  weekStartYmd,
  ymd,
} from "./util";

/**
 * Compute all local statistics (NO LLM). See PRD §5.
 *
 * Works on the non-system messages of a ParseResult: per-person profiles, reply
 * latency (per person + weekly trend), conversation density, double-texting,
 * initiation, question-ignore rate and a per-session local risk score used to
 * prioritize which sessions are worth sending to the LLM later.
 *
 * @param me   optional "my" identifier; lightly biases length-asymmetry framing.
 * @param opts.sessionGapMs gap that splits sessions (default 3h).
 */
export function computeDerivedStats(
  parse: ParseResult,
  me?: string,
  opts?: { sessionGapMs?: number },
): DerivedStats {
  const sessionGapMs = opts?.sessionGapMs ?? 3 * 60 * 60 * 1000;
  const REPLY_CAP_MS = 24 * 60 * 60 * 1000;

  // Analysis view: chronological non-system messages keeping their original idx.
  const a: AMsg[] = [];
  for (let i = 0; i < parse.messages.length; i++) {
    const m = parse.messages[i];
    if (m.isSystem) continue;
    a.push(toAMsg(m, i));
  }

  if (a.length === 0) return emptyStats();

  const acc = new Map<string, PersonAcc>();
  const ensure = (name: string): PersonAcc => {
    let p = acc.get(name);
    if (!p) {
      p = blankAcc(name);
      acc.set(name, p);
    }
    return p;
  };

  // --- per-person volume / text features + daily density -------------------
  const densityMap = new Map<string, number>();
  for (const m of a) {
    const p = ensure(m.sender);
    p.msgCount++;
    p.hours[new Date(m.ts).getHours()]++;
    if (hasEmoji(m.text) || (m.isMedia && isEmoticonMedia(m.text))) p.emojiMsgs++;
    if (!m.isMedia && !m.isUrl) {
      p.textCount++;
      p.charCount += m.text.length;
      if (hasLaugh(m.text)) p.laughMsgs++;
      if (m.isQuestion) p.questionMsgs++;
    }
    const day = ymd(m.ts);
    densityMap.set(day, (densityMap.get(day) ?? 0) + 1);
  }

  // --- reply latency (cross-person) : per person + weekly overall ----------
  const replyByPerson = new Map<string, number[]>();
  const weeklySec = new Map<string, number[]>();
  for (let i = 1; i < a.length; i++) {
    if (a[i].sender === a[i - 1].sender) continue;
    const latMs = a[i].ts - a[i - 1].ts;
    if (latMs <= 0 || latMs > REPLY_CAP_MS) continue;
    const sec = latMs / 1000;
    pushTo(replyByPerson, a[i].sender, sec);
    pushTo(weeklySec, weekStartYmd(a[i].ts), sec);
  }
  const baselineSec = new Map<string, number>();
  for (const [name, secs] of replyByPerson) baselineSec.set(name, median(secs));

  // --- initiation : first message after a gap > sessionGap -----------------
  for (let i = 0; i < a.length; i++) {
    if (i === 0 || a[i].ts - a[i - 1].ts > sessionGapMs) ensure(a[i].sender).initiations++;
  }

  // --- session ranges over the analysis view ------------------------------
  const ranges: Range[] = [];
  let start = 0;
  for (let i = 1; i < a.length; i++) {
    if (a[i].ts - a[i - 1].ts > sessionGapMs) {
      ranges.push({ s: start, e: i - 1 });
      start = i;
    }
  }
  ranges.push({ s: start, e: a.length - 1 });

  // --- double-texting + question-ignore + per-session risk signals --------
  const doubleTextingByPerson: Record<string, number> = {};
  let totalQ = 0;
  let ignoredQ = 0;
  const sig = ranges.map(() => blankSignals());

  ranges.forEach((r, k) => {
    const s = sig[k];

    // double-texting runs (broken by sender change; ranges already gap-bounded)
    let runSender: string | null = null;
    let runLen = 0;
    const flush = (): void => {
      if (runSender !== null && runLen >= 2) {
        doubleTextingByPerson[runSender] = (doubleTextingByPerson[runSender] ?? 0) + 1;
        s.doubleText += runLen - 1;
      }
    };
    for (let i = r.s; i <= r.e; i++) {
      if (a[i].sender === runSender) runLen++;
      else {
        flush();
        runSender = a[i].sender;
        runLen = 1;
      }
    }
    flush();

    // latency spike (max reply / personal baseline) + length per sender
    const charBySender = new Map<string, number>();
    for (let i = r.s; i <= r.e; i++) {
      charBySender.set(a[i].sender, (charBySender.get(a[i].sender) ?? 0) + a[i].text.length);
      if (i > r.s && a[i].sender !== a[i - 1].sender) {
        const latMs = a[i].ts - a[i - 1].ts;
        if (latMs > 0 && latMs <= REPLY_CAP_MS) {
          const base = Math.max(baselineSec.get(a[i].sender) ?? 0, 60);
          const spike = latMs / 1000 / base;
          if (spike > s.latencySpike) s.latencySpike = spike;
        }
      }
    }
    s.lengthAsym = lengthAsymmetry(charBySender, me);

    // ignored questions (suffix scan, O(n) per session)
    const suffix = new Map<string, number>();
    let suffixTotal = 0;
    for (let i = r.e; i >= r.s; i--) {
      if (a[i].isQuestion) {
        totalQ++;
        const others = suffixTotal - (suffix.get(a[i].sender) ?? 0);
        if (others <= 0) {
          ignoredQ++;
          s.ignoredQuestions++;
        }
      }
      suffix.set(a[i].sender, (suffix.get(a[i].sender) ?? 0) + 1);
      suffixTotal++;
    }
  });

  // density drop vs trailing average of the previous up to 3 sessions
  ranges.forEach((r, k) => {
    const count = r.e - r.s + 1;
    const prev = ranges.slice(Math.max(0, k - 3), k);
    if (prev.length > 0) {
      const trailingAvg =
        prev.reduce((sum, p) => sum + (p.e - p.s + 1), 0) / prev.length;
      sig[k].densityDrop = Math.max(0, (trailingAvg - count) / (trailingAvg + 1));
    }
  });

  const sessions = scoreSessions(a, ranges, sig);

  // --- assemble perPerson in first-seen (participants) order --------------
  const order = parse.participants.length
    ? parse.participants
    : [...acc.keys()];
  const perPerson: PersonStats[] = [];
  for (const name of order) {
    const p = acc.get(name);
    if (!p) continue;
    perPerson.push(toPersonStats(p, replyByPerson.get(name) ?? []));
  }
  // include any sender not present in participants (defensive)
  for (const [name, p] of acc) {
    if (order.includes(name)) continue;
    perPerson.push(toPersonStats(p, replyByPerson.get(name) ?? []));
  }

  const density: DensityPoint[] = [...densityMap.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((x, y) => (x.date < y.date ? -1 : x.date > y.date ? 1 : 0));

  const latencyTrend: LatencyTrendPoint[] = [...weeklySec.entries()]
    .map(([weekStart, secs]) => ({ weekStart, medianSec: Math.round(median(secs)) }))
    .sort((x, y) => (x.weekStart < y.weekStart ? -1 : x.weekStart > y.weekStart ? 1 : 0));

  let minTs = a[0].ts;
  let maxTs = a[0].ts;
  for (const m of a) {
    if (m.ts < minTs) minTs = m.ts;
    if (m.ts > maxTs) maxTs = m.ts;
  }

  return {
    totalMessages: a.length,
    dateRange: { start: minTs, end: maxTs },
    perPerson,
    density,
    latencyTrend,
    sessions,
    doubleTextingByPerson,
    questionIgnoreRate: totalQ > 0 ? ignoredQ / totalQ : 0,
  };
}

// ---------------------------------------------------------------------------
// internal types & helpers
// ---------------------------------------------------------------------------

type AMsg = {
  ts: number;
  sender: string;
  text: string;
  idx: number;
  isMedia: boolean;
  isUrl: boolean;
  isQuestion: boolean;
};

function toAMsg(m: Msg, idx: number): AMsg {
  return {
    ts: m.ts,
    sender: m.sender,
    text: m.text,
    idx,
    isMedia: m.isMedia === true,
    isUrl: m.isUrl === true,
    isQuestion: !m.isMedia && !m.isUrl && isQuestion(m.text),
  };
}

type PersonAcc = {
  name: string;
  msgCount: number;
  textCount: number;
  charCount: number;
  laughMsgs: number;
  emojiMsgs: number;
  questionMsgs: number;
  initiations: number;
  hours: number[];
};

function blankAcc(name: string): PersonAcc {
  return {
    name,
    msgCount: 0,
    textCount: 0,
    charCount: 0,
    laughMsgs: 0,
    emojiMsgs: 0,
    questionMsgs: 0,
    initiations: 0,
    hours: new Array<number>(24).fill(0),
  };
}

function toPersonStats(p: PersonAcc, replySecs: number[]): PersonStats {
  const topHours = p.hours
    .map((count, hour) => ({ hour, count }))
    .filter((h) => h.count > 0)
    .sort((x, y) => y.count - x.count)
    .slice(0, 5)
    .map((h) => h.hour);
  return {
    name: p.name,
    msgCount: p.msgCount,
    charCount: p.charCount,
    avgLen: p.textCount > 0 ? p.charCount / p.textCount : 0,
    laughRate: p.msgCount > 0 ? p.laughMsgs / p.msgCount : 0,
    emojiRate: p.msgCount > 0 ? p.emojiMsgs / p.msgCount : 0,
    questionRate: p.msgCount > 0 ? p.questionMsgs / p.msgCount : 0,
    medianReplySec: Math.round(median(replySecs)),
    initiationCount: p.initiations,
    activeHours: topHours,
  };
}

function pushTo(map: Map<string, number[]>, key: string, value: number): void {
  const arr = map.get(key);
  if (arr) arr.push(value);
  else map.set(key, [value]);
}

type Range = { s: number; e: number };

type Signals = {
  latencySpike: number;
  doubleText: number;
  densityDrop: number;
  ignoredQuestions: number;
  lengthAsym: number;
};

function blankSignals(): Signals {
  return { latencySpike: 0, doubleText: 0, densityDrop: 0, ignoredQuestions: 0, lengthAsym: 0 };
}

/** 0..1 char-volume imbalance between the two principals (me-vs-them when known). */
function lengthAsymmetry(charBySender: Map<string, number>, me?: string): number {
  if (charBySender.size < 2) return 0;
  let mine = 0;
  let theirs = 0;
  if (me && charBySender.has(me)) {
    mine = charBySender.get(me) ?? 0;
    for (const [name, chars] of charBySender) if (name !== me) theirs += chars;
  } else {
    const sorted = [...charBySender.values()].sort((x, y) => y - x);
    mine = sorted[0];
    theirs = sorted[1];
  }
  const total = mine + theirs;
  return total > 0 ? Math.abs(mine - theirs) / total : 0;
}

const RISK_WEIGHTS = {
  latencySpike: 0.3,
  doubleText: 0.2,
  ignoredQuestions: 0.2,
  densityDrop: 0.15,
  lengthAsym: 0.15,
};

function scoreSessions(a: AMsg[], ranges: Range[], sig: Signals[]): Session[] {
  const nLatency = minMaxNormalize(sig.map((s) => s.latencySpike));
  const nDouble = minMaxNormalize(sig.map((s) => s.doubleText));
  const nIgnored = minMaxNormalize(sig.map((s) => s.ignoredQuestions));
  const nDensity = minMaxNormalize(sig.map((s) => s.densityDrop));
  const nLength = minMaxNormalize(sig.map((s) => s.lengthAsym));

  const composite = ranges.map(
    (_, k) =>
      RISK_WEIGHTS.latencySpike * nLatency[k] +
      RISK_WEIGHTS.doubleText * nDouble[k] +
      RISK_WEIGHTS.ignoredQuestions * nIgnored[k] +
      RISK_WEIGHTS.densityDrop * nDensity[k] +
      RISK_WEIGHTS.lengthAsym * nLength[k],
  );
  const scaled = minMaxNormalize(composite);
  const allEqual = scaled.every((v) => v === 0);

  return ranges.map((r, k) => {
    const startTs = a[r.s].ts;
    const endTs = a[r.e].ts;
    const score = allEqual ? Math.round(composite[k] * 100) : Math.round(scaled[k] * 100);
    return {
      id: `s${k + 1}`,
      startTs,
      endTs,
      startIdx: a[r.s].idx,
      endIdx: a[r.e].idx,
      msgCount: r.e - r.s + 1,
      riskScore: score,
      label: `${ymd(startTs)} ~ ${ymd(endTs)}`,
    };
  });
}

function emptyStats(): DerivedStats {
  return {
    totalMessages: 0,
    dateRange: { start: 0, end: 0 },
    perPerson: [],
    density: [],
    latencyTrend: [],
    sessions: [],
    doubleTextingByPerson: {},
    questionIgnoreRate: 0,
  };
}
