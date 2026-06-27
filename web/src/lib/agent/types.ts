import type {
  ChatMode,
  Overview,
  PersonaCard,
  SegmentAnalysis,
  Session,
} from "@/lib/types";

/** Versioned payload exported for Cursor / Claude Code / Codex. */
export type AgentAnalysisBundle = {
  version: 1;
  analysisId: string;
  title: string;
  mode: ChatMode;
  me: string;
  participants: string[];
  them: string;
  statsSummary: {
    totalMessages: number;
    dateRange: { start: string; end: string };
    questionIgnoreRate: number;
    perPerson: { name: string; msgCount: number; medianReplySec: number }[];
    topSessions: { segment_id: string; time_range: string; risk_score: number }[];
  };
  /** Sessions to analyze (MAP). Agent must return one SegmentAnalysis per item (1:1). */
  sessions: AgentSessionPayload[];
  /** Group mode: per-member samples for persona extraction. */
  personaTargets?: AgentPersonaTarget[];
  toneGuide: string;
  outputContract: "one_on_one" | "group_personas";
};

export type AgentPersonaTarget = {
  name: string;
  msg_count: number;
  stats: {
    avg_len: number;
    laugh_rate: number;
    median_reply_sec: number;
    active_hours: number[];
  };
  sample_lines: string;
};

export type AgentSessionPayload = {
  segment_id: string;
  time_range: string;
  risk_score: number;
  msg_count: number;
  /** Formatted chat lines with reply-delay hints. */
  lines: string;
};

/** JSON the agent writes — importable in the app. */
export type AgentAnalysisOutput = {
  version: 1;
  segments?: SegmentAnalysis[];
  overview?: Overview;
  personas?: PersonaCard[];
};

export type AgentValidationResult =
  | { ok: true; data: AgentAnalysisOutput }
  | { ok: false; errors: string[] };

export function pickSessionsForAgent(
  sessions: Session[],
  max = 8,
): Session[] {
  return [...sessions].sort((a, b) => b.riskScore - a.riskScore).slice(0, max);
}
