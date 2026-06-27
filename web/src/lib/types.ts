// Shared contracts for the whole app. Agents implement against THESE types.
// Do not change a type without updating every consumer.

export type ChatFormat = "csv" | "android" | "ios" | "pc";
export type ChatMode = "one_on_one" | "group";

/** A single parsed chat message. */
export type Msg = {
  ts: number; // epoch ms
  sender: string;
  text: string;
  isSystem: boolean; // join/leave/deleted/date-divider etc -> excluded from LLM text
  isMedia?: boolean; // Photo / N photos / Video / Emoticon(s) / Voice Note / 사진 / 이모티콘 ...
  isUrl?: boolean; // message body is (mostly) a shared URL
};

export type ParseResult = {
  format: ChatFormat;
  title: string; // room or peer name parsed from header, fallback "대화"
  participants: string[]; // distinct non-system senders, in first-seen order
  messages: Msg[];
  mode: ChatMode; // participants.length === 2 ? "one_on_one" : "group"
  warnings?: string[]; // non-fatal parse notes (dropped rows, fallbacks)
};

// ---------------------------------------------------------------------------
// Local statistics engine (NO LLM). See PRD §5.
// ---------------------------------------------------------------------------

export type PersonStats = {
  name: string;
  msgCount: number;
  charCount: number;
  avgLen: number;
  laughRate: number; // share of msgs containing ㅋ/ㅎ/lol
  emojiRate: number;
  questionRate: number; // share ending with ?
  medianReplySec: number; // median reply latency when replying to someone else
  initiationCount: number; // # of times this person sends first after a long gap
  activeHours: number[]; // top active hours (0-23), most-active first
};

export type DensityPoint = { date: string; count: number }; // daily message count, date = YYYY-MM-DD
export type LatencyTrendPoint = { weekStart: string; medianSec: number }; // weekly median reply latency

export type Session = {
  id: string;
  startTs: number;
  endTs: number;
  startIdx: number; // inclusive index into ParseResult.messages
  endIdx: number; // inclusive
  msgCount: number;
  riskScore: number; // local heuristic 0..100, higher = more worth LLM attention
  label: string; // human label, e.g. "2024-01-03 ~ 2024-01-03"
};

export type DerivedStats = {
  totalMessages: number;
  dateRange: { start: number; end: number };
  perPerson: PersonStats[];
  density: DensityPoint[];
  latencyTrend: LatencyTrendPoint[]; // overall (both/all people) weekly trend
  sessions: Session[];
  doubleTextingByPerson: Record<string, number>;
  questionIgnoreRate: number; // share of "?" messages with no reply before next gap
};

// ---------------------------------------------------------------------------
// LLM 1:1 schemas. See PRD §7 (verbatim shapes).
// ---------------------------------------------------------------------------

export type RiskyMoment = { quote: string; why: string; severity: number };
export type MyMistake = { quote: string; issue: string; better_version: string };

export type SegmentAnalysis = {
  segment_id: string;
  time_range: string; // "YYYY-MM-DD ~ YYYY-MM-DD"
  summary: string;
  tension_score: number; // 0..100
  who_is_pulling_away: "me" | "them" | "neither";
  risky_moments: RiskyMoment[];
  my_mistakes: MyMistake[];
  tone: { me: string; them: string };
};

export type Overview = {
  relationship_arc: string;
  breakup_reasons: { reason: string; evidence: string[] }[];
  turning_points: { when: string; what: string }[];
  your_patterns: string[];
  their_patterns: string[];
};

export type CfMode = "realistic" | "best_case" | "disaster";
export type CounterfactualTurn = { sender: string; text: string; delay_hint: string };

export type Counterfactual = {
  segment_id: string;
  mode: CfMode;
  original_line: string;
  suggested_line: string;
  rationale: string;
  simulated_timeline: CounterfactualTurn[];
  outcome_delta: string;
};

// ---------------------------------------------------------------------------
// LLM group schemas. See PRD §5B.
// ---------------------------------------------------------------------------

export type PersonaCard = {
  name: string;
  voice: string;
  signature_phrases: string[];
  reaction_style: string;
  engages_with: string[];
  ignores: string[];
  stats: {
    avg_len: number;
    laugh_rate: number;
    median_reply_sec: number;
    active_hours: number[];
  };
  talks_most_to: string;
};

export type GroupSimMode = "realistic" | "chaos" | "wholesome";
export type GroupSimTurn = {
  speaker: string;
  text: string;
  delay_hint: string; // "즉답" | "5분 후" | "1시간 뒤" ...
  in_character_note: string;
};

export type GroupSimResult = {
  trigger: string;
  thread: GroupSimTurn[];
  outcome: string; // "떡밥 물림" | "조용히 묻힘" | "싸움 남" | "삼천포"
  who_stayed_silent: string[];
};

// ---------------------------------------------------------------------------
// IndexedDB storage. See PRD §8.
// ---------------------------------------------------------------------------

export type StoredAnalysis = {
  id: string;
  createdAt: number;
  title: string; // e.g. "전 여친 (2023.05~2024.01)"
  mode: ChatMode;
  me: string;
  parseResult: ParseResult; // raw structured chat, local only
  stats: DerivedStats;
  // 1:1 results
  segments?: SegmentAnalysis[];
  overview?: Overview;
  counterfactuals?: Counterfactual[];
  // group results
  personas?: PersonaCard[];
  groupSims?: GroupSimResult[];
};

export type AnalysisIndexEntry = {
  id: string;
  title: string;
  createdAt: number;
  mode: ChatMode;
  me: string;
};
