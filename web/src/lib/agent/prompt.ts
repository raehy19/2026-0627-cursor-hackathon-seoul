import { buildAgentBundle, bundleFilename } from "./bundle";
import type { AgentAnalysisBundle } from "./types";
import type { StoredAnalysis } from "@/lib/types";

export type AgentCommandSet = {
  cursor: string;
  claude: string;
  codex: string;
  generic: string;
};

const INSTRUCTIONS_PATH = "web/public/agent/ANALYSIS.md";

function taskLine(bundle: AgentAnalysisBundle): string {
  if (bundle.outputContract === "one_on_one") {
    return [
      `1:1 관계 분석. "나"=${bundle.me}, 상대=${bundle.them}.`,
      `bundle.sessions[] 각 항목마다 MAP 구간 분석 → segments[] (segment_id는 번들과 동일).`,
      `모든 segments + statsSummary로 REDUCE → overview.`,
      `출력: {"version":1,"segments":[...],"overview":{...}} JSON만. 마크다운/설명 금지.`,
    ].join("\n");
  }
  return [
    `단톡방 페르소나 추출. participants=${bundle.participants.join(", ")}.`,
    `personaTargets[] 각 멤버의 sample_lines를 읽고 말투·드립·반응 스타일 정리.`,
    `출력: {"version":1,"personas":[...]} JSON만. stats 숫자는 번들 값 그대로.`,
  ].join("\n");
}

export function buildAgentCommands(data: StoredAnalysis): AgentCommandSet {
  const bundle = buildAgentBundle(data);
  const bundleFile = bundleFilename(data);
  const task = taskLine(bundle);

  const shared = [
    "What if…? 카톡 분석 — 코딩 에이전트용 작업",
    "",
    `먼저 ${bundleFile} (앱에서 다운로드)과 ${INSTRUCTIONS_PATH}를 읽으세요.`,
    "",
    task,
    "",
    `톤: 통찰·성장 관점. 일방적 자기비난·단정적 이별 프레이밍 금지. 근거 대사 인용.`,
    `결과를 what-if-agent-output.json 으로 저장하거나, 앱 「결과 가져오기」에 붙여넣기.`,
  ].join("\n");

  return {
    cursor: `@${INSTRUCTIONS_PATH}\n@${bundleFile}\n\n${shared}`,
    claude: `Read ${INSTRUCTIONS_PATH} and ${bundleFile} in this repo.\n\n${shared}`,
    codex: `# Open ${INSTRUCTIONS_PATH} and ${bundleFile}\n\n${shared}`,
    generic: shared,
  };
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
