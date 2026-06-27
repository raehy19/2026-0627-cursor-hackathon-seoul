import type { StoredAnalysis } from "@/lib/types";
import { formatDate } from "@/components/format";
import {
  clampLinesToBudget,
  formatLines,
  stratifiedSample,
} from "@/lib/llm/formatLines";
import { MAP_CHAR_BUDGET } from "@/lib/llm/config";
import type { AgentPersonaTarget } from "./types";
import type { AgentAnalysisBundle, AgentSessionPayload } from "./types";
import { pickSessionsForAgent } from "./types";

const TONE_GUIDE =
  "통찰과 성장 관점. 일방적 자기비난 증폭 금지. 패턴은 짚되 단정적 이별 프레이밍 금지. risky_moments·evidence에는 실제 대사 인용.";

function otherParticipant(data: StoredAnalysis): string {
  return data.parseResult.participants.find((p) => p !== data.me) ?? "상대";
}

function sessionPayload(
  data: StoredAnalysis,
  session: StoredAnalysis["stats"]["sessions"][number],
): AgentSessionPayload {
  const msgs = data.parseResult.messages.slice(session.startIdx, session.endIdx + 1);
  const lines = clampLinesToBudget(formatLines(msgs, data.me), MAP_CHAR_BUDGET);
  return {
    segment_id: session.id,
    time_range: session.label,
    risk_score: Math.round(session.riskScore),
    msg_count: session.msgCount,
    lines,
  };
}

function personaTargets(data: StoredAnalysis): AgentPersonaTarget[] {
  return data.stats.perPerson.map((ps) => {
    const sample = stratifiedSample(data.parseResult.messages, ps.name, 250);
    const sample_lines = clampLinesToBudget(formatLines(sample, ""), 5000);
    return {
      name: ps.name,
      msg_count: ps.msgCount,
      stats: {
        avg_len: Math.round(ps.avgLen),
        laugh_rate: Math.round(ps.laughRate * 100) / 100,
        median_reply_sec: Math.round(ps.medianReplySec),
        active_hours: ps.activeHours,
      },
      sample_lines,
    };
  });
}

export function buildAgentBundle(data: StoredAnalysis, maxSessions = 8): AgentAnalysisBundle {
  const chosen = pickSessionsForAgent(data.stats.sessions, maxSessions);
  const them = otherParticipant(data);
  const isGroup = data.mode === "group";

  return {
    version: 1,
    analysisId: data.id,
    title: data.title,
    mode: data.mode,
    me: data.me,
    participants: data.parseResult.participants,
    them,
    statsSummary: {
      totalMessages: data.stats.totalMessages,
      dateRange: {
        start: formatDate(data.stats.dateRange.start),
        end: formatDate(data.stats.dateRange.end),
      },
      questionIgnoreRate: Math.round(data.stats.questionIgnoreRate * 1000) / 1000,
      perPerson: data.stats.perPerson.map((p) => ({
        name: p.name,
        msgCount: p.msgCount,
        medianReplySec: p.medianReplySec,
      })),
      topSessions: chosen.map((s) => ({
        segment_id: s.id,
        time_range: s.label,
        risk_score: Math.round(s.riskScore),
      })),
    },
    sessions: isGroup ? [] : chosen.map((s) => sessionPayload(data, s)),
    personaTargets: isGroup ? personaTargets(data) : undefined,
    toneGuide: TONE_GUIDE,
    outputContract: isGroup ? "group_personas" : "one_on_one",
  };
}

export function bundleFilename(data: StoredAnalysis): string {
  return `what-if-agent-bundle-${data.id.slice(0, 8)}.json`;
}

export function downloadAgentBundle(data: StoredAnalysis): void {
  const bundle = buildAgentBundle(data);
  const blob = new Blob([JSON.stringify(bundle, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = bundleFilename(data);
  a.click();
  URL.revokeObjectURL(url);
}
