import type { AgentAnalysisOutput } from "./types";
import type { PersonaCard, StoredAnalysis } from "@/lib/types";

function personaStatsBlock(
  ps: StoredAnalysis["stats"]["perPerson"][number] | undefined,
): PersonaCard["stats"] {
  return {
    avg_len: Math.round(ps?.avgLen ?? 0),
    laugh_rate: Math.round((ps?.laughRate ?? 0) * 100) / 100,
    median_reply_sec: Math.round(ps?.medianReplySec ?? 0),
    active_hours: ps?.activeHours ?? [],
  };
}

/** Merge validated agent JSON into StoredAnalysis for IndexedDB. */
export function applyAgentOutput(
  data: StoredAnalysis,
  output: AgentAnalysisOutput,
): StoredAnalysis {
  if (output.segments && output.overview) {
    return {
      ...data,
      segments: output.segments,
      overview: output.overview,
    };
  }

  if (output.personas) {
    const personas: PersonaCard[] = output.personas.map((p) => {
      const ps = data.stats.perPerson.find((x) => x.name === p.name);
      return {
        ...p,
        stats: personaStatsBlock(ps),
      };
    });
    return { ...data, personas };
  }

  return data;
}
