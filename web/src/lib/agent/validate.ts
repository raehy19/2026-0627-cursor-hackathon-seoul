import type {
  AgentAnalysisBundle,
  AgentAnalysisOutput,
  AgentValidationResult,
} from "./types";
import type { Overview, PersonaCard, SegmentAnalysis } from "@/lib/types";

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function asString(v: unknown, field: string, errors: string[]): string | undefined {
  if (typeof v !== "string" || !v.trim()) {
    errors.push(`${field}: 문자열이 필요합니다`);
    return undefined;
  }
  return v;
}

function asNumber(v: unknown, field: string, errors: string[]): number | undefined {
  if (typeof v !== "number" || Number.isNaN(v)) {
    errors.push(`${field}: 숫자가 필요합니다`);
    return undefined;
  }
  return v;
}

function validateSegment(raw: unknown, errors: string[], idx: number): SegmentAnalysis | null {
  if (!isObj(raw)) {
    errors.push(`segments[${idx}]: 객체가 아닙니다`);
    return null;
  }
  const segment_id = asString(raw.segment_id, `segments[${idx}].segment_id`, errors) ?? "";
  const time_range = asString(raw.time_range, `segments[${idx}].time_range`, errors) ?? "";
  const summary = asString(raw.summary, `segments[${idx}].summary`, errors) ?? "";
  const tension_score = asNumber(raw.tension_score, `segments[${idx}].tension_score`, errors) ?? 0;
  const who = raw.who_is_pulling_away;
  if (who !== "me" && who !== "them" && who !== "neither") {
    errors.push(`segments[${idx}].who_is_pulling_away: me|them|neither`);
  }
  const toneRaw = isObj(raw.tone) ? raw.tone : {};
  return {
    segment_id,
    time_range,
    summary,
    tension_score: Math.min(100, Math.max(0, tension_score)),
    who_is_pulling_away: (who as SegmentAnalysis["who_is_pulling_away"]) ?? "neither",
    risky_moments: Array.isArray(raw.risky_moments)
      ? raw.risky_moments.filter(isObj).map((r) => ({
          quote: String(r.quote ?? ""),
          why: String(r.why ?? ""),
          severity: typeof r.severity === "number" ? r.severity : 0,
        }))
      : [],
    my_mistakes: Array.isArray(raw.my_mistakes)
      ? raw.my_mistakes.filter(isObj).map((m) => ({
          quote: String(m.quote ?? ""),
          issue: String(m.issue ?? ""),
          better_version: String(m.better_version ?? ""),
        }))
      : [],
    tone: {
      me: String(toneRaw.me ?? ""),
      them: String(toneRaw.them ?? ""),
    },
  };
}

function validateOverview(raw: unknown, errors: string[]): Overview | undefined {
  if (!isObj(raw)) {
    errors.push("overview: 객체가 필요합니다");
    return undefined;
  }
  return {
    relationship_arc: String(raw.relationship_arc ?? ""),
    breakup_reasons: Array.isArray(raw.breakup_reasons)
      ? raw.breakup_reasons.filter(isObj).map((b) => ({
          reason: String(b.reason ?? ""),
          evidence: Array.isArray(b.evidence) ? b.evidence.map(String) : [],
        }))
      : [],
    turning_points: Array.isArray(raw.turning_points)
      ? raw.turning_points.filter(isObj).map((t) => ({
          when: String(t.when ?? ""),
          what: String(t.what ?? ""),
        }))
      : [],
    your_patterns: Array.isArray(raw.your_patterns) ? raw.your_patterns.map(String) : [],
    their_patterns: Array.isArray(raw.their_patterns) ? raw.their_patterns.map(String) : [],
  };
}

function validatePersona(raw: unknown, errors: string[], idx: number): PersonaCard | null {
  if (!isObj(raw)) {
    errors.push(`personas[${idx}]: 객체가 아닙니다`);
    return null;
  }
  const name = asString(raw.name, `personas[${idx}].name`, errors);
  if (!name) return null;
  const statsRaw = isObj(raw.stats) ? raw.stats : {};
  return {
    name,
    voice: String(raw.voice ?? ""),
    signature_phrases: Array.isArray(raw.signature_phrases)
      ? raw.signature_phrases.map(String)
      : [],
    reaction_style: String(raw.reaction_style ?? ""),
    engages_with: Array.isArray(raw.engages_with) ? raw.engages_with.map(String) : [],
    ignores: Array.isArray(raw.ignores) ? raw.ignores.map(String) : [],
    stats: {
      avg_len: typeof statsRaw.avg_len === "number" ? statsRaw.avg_len : 0,
      laugh_rate: typeof statsRaw.laugh_rate === "number" ? statsRaw.laugh_rate : 0,
      median_reply_sec:
        typeof statsRaw.median_reply_sec === "number" ? statsRaw.median_reply_sec : 0,
      active_hours: Array.isArray(statsRaw.active_hours)
        ? statsRaw.active_hours.filter((h): h is number => typeof h === "number")
        : [],
    },
    talks_most_to: String(raw.talks_most_to ?? ""),
  };
}

export function validateAgentOutput(
  raw: unknown,
  bundle: AgentAnalysisBundle,
): AgentValidationResult {
  const errors: string[] = [];
  if (!isObj(raw)) return { ok: false, errors: ["루트 JSON 객체가 필요합니다"] };

  const segmentsRaw = raw.segments;
  const overviewRaw = raw.overview;
  const personasRaw = raw.personas;

  if (bundle.outputContract === "one_on_one") {
    if (!Array.isArray(segmentsRaw) || segmentsRaw.length === 0) {
      errors.push("segments: 1개 이상의 구간 분석이 필요합니다");
    }
    const segments = Array.isArray(segmentsRaw)
      ? segmentsRaw
          .map((s, i) => validateSegment(s, errors, i))
          .filter((s): s is SegmentAnalysis => s !== null)
      : [];

    const overview = validateOverview(overviewRaw, errors);
    if (!overview?.relationship_arc?.trim()) {
      errors.push("overview.relationship_arc: 관계 서사가 필요합니다");
    }

    const expectedIds = new Set(bundle.sessions.map((s) => s.segment_id));
    for (const seg of segments) {
      if (!expectedIds.has(seg.segment_id)) {
        errors.push(`segment_id "${seg.segment_id}"가 번들 세션과 일치하지 않습니다`);
      }
    }
    if (segments.length < 1) {
      errors.push("segments: 최소 1개 구간 분석이 필요합니다");
    }

    if (errors.length > 0) return { ok: false, errors };

    return {
      ok: true,
      data: {
        version: 1,
        segments,
        overview: overview!,
      },
    };
  }

  if (!Array.isArray(personasRaw) || personasRaw.length === 0) {
    errors.push("personas: 1개 이상의 페르소나 카드가 필요합니다");
  }
  const personas = Array.isArray(personasRaw)
    ? personasRaw
        .map((p, i) => validatePersona(p, errors, i))
        .filter((p): p is PersonaCard => p !== null)
    : [];

  const expectedNames = new Set(bundle.participants);
  for (const p of personas) {
    if (!expectedNames.has(p.name)) {
      errors.push(`persona "${p.name}"가 참가자 목록에 없습니다`);
    }
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: { version: 1, personas },
  };
}

export function parseAgentOutputJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  const body = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(body);
}
