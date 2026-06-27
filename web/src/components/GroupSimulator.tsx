"use client";

import { useState } from "react";
import { runGroupSim } from "@/lib/llm/client";
import type {
  GroupSimMode,
  GroupSimResult,
  Msg,
  PersonaCard as PersonaCardData,
} from "@/lib/types";
import { KakaoThread, simTurnsToRows } from "@/components/KakaoThread";
import { cx, formatHour } from "@/components/format";
import { Button, Chip, Notice, Spinner } from "@/components/ui";

const TONES: { id: string; text: string }[] = [
  { id: "도발", text: "솔직히 우리 중에 제일 게으른 사람 한 명만 말해봐 ㅋㅋ" },
  { id: "진지", text: "요즘 다들 어떻게 지내? 한번 날 잡고 모이자" },
  { id: "드립", text: "오늘 점심 뭐 먹지… 벌써 3시간째 고민 중" },
  { id: "정보공유", text: "이번 주말 날씨 미쳤다는데 어디 갈 사람?" },
  { id: "TMI", text: "나 어제 새벽 4시까지 유튜브 보다가 현타 옴…" },
];

const MODES: { id: GroupSimMode; label: string }[] = [
  { id: "realistic", label: "현실적" },
  { id: "chaos", label: "카오스" },
  { id: "wholesome", label: "화목" },
];

const OUTCOME_TONE: Record<string, "ok" | "warn" | "danger" | "accent"> = {
  떡밥물림: "ok",
  조용히묻힘: "warn",
  싸움남: "danger",
  삼천포: "accent",
};

function outcomeTone(outcome: string): "ok" | "warn" | "danger" | "accent" {
  return OUTCOME_TONE[outcome.replace(/\s+/g, "")] ?? "accent";
}

export function GroupSimulator({
  personas,
  contextMsgs,
  me,
  lastResult,
  onResult,
}: {
  personas: PersonaCardData[];
  contextMsgs: Msg[];
  me: string;
  lastResult?: GroupSimResult | null;
  onResult: (r: GroupSimResult) => void;
}) {
  const [trigger, setTrigger] = useState("야 우리 주말에 한라산 ㄱ?");
  const [mode, setMode] = useState<GroupSimMode>("realistic");
  const [useHour, setUseHour] = useState(false);
  const [hour, setHour] = useState(21);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<"llm" | null>(null);
  const [result, setResult] = useState<GroupSimResult | null>(
    lastResult ?? null,
  );

  const canSubmit = personas.length > 0 && trigger.trim().length > 0 && !loading;

  async function simulate() {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const r = await runGroupSim(personas, contextMsgs, trigger.trim(), {
        mode,
        hour: useHour ? hour : undefined,
        me,
      });
      setResult(r);
      onResult(r);
    } catch {
      setError("llm");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* input */}
      <div className="kakao-bg rounded-2xl p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={trigger}
            onChange={(e) => setTrigger(e.target.value)}
            rows={2}
            placeholder="단톡방에 이런 말을 던지면…"
            className="min-h-[44px] flex-1 resize-none rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm text-[#1a1a1a] outline-none placeholder:text-[#7b8a99]"
          />
          <Button onClick={simulate} disabled={!canSubmit} className="shrink-0">
            {loading ? <Spinner /> : "전송"}
          </Button>
        </div>
      </div>

      {/* tone quick-fill */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted">분위기:</span>
        {TONES.map((t) => (
          <button
            key={t.id}
            onClick={() => setTrigger(t.text)}
            className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted transition-colors hover:border-accent/50 hover:text-foreground"
          >
            {t.id}
          </button>
        ))}
      </div>

      {/* controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-border bg-surface-2 p-1">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={cx(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                mode === m.id
                  ? "bg-accent text-white"
                  : "text-muted hover:text-foreground",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={useHour}
            onChange={(e) => setUseHour(e.target.checked)}
            className="accent-accent"
          />
          시간대 지정
          {useHour && (
            <span className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={23}
                value={hour}
                onChange={(e) => setHour(Number(e.target.value))}
                className="accent-accent"
              />
              <span className="w-16 tabular-nums text-foreground">
                {formatHour(hour)}
              </span>
            </span>
          )}
        </label>
      </div>

      {personas.length === 0 && (
        <Notice tone="info">
          먼저 “페르소나 분석”을 실행하면 멤버들의 말투로 시뮬레이션할 수 있어요.
        </Notice>
      )}

      {error === "llm" && (
        <Notice tone="warn" title="AI 시뮬레이션 대기 중">
          LLM 키가 설정되면 단톡방 반응 시뮬레이션이 활성화됩니다.
        </Notice>
      )}

      {/* result */}
      {result && !loading && (
        <div className="space-y-3">
          <KakaoThread rows={simTurnsToRows(result.thread, me)} />

          <div className="flex flex-wrap items-center gap-2">
            <Chip tone={outcomeTone(result.outcome)}>결말 · {result.outcome}</Chip>
            {result.who_stayed_silent.length > 0 && (
              <span className="text-xs text-muted">
                조용히 있던 사람:{" "}
                {result.who_stayed_silent.map((n) => (
                  <Chip key={n} className="ml-1">
                    {n}
                  </Chip>
                ))}
              </span>
            )}
          </div>

          <div className="text-right">
            <Button variant="ghost" size="sm" onClick={simulate} disabled={loading}>
              다시 시뮬레이션
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
