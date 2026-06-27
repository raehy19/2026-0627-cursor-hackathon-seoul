"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { extractPersonas } from "@/lib/llm/client";
import type {
  GroupSimResult,
  Msg,
  PersonaCard as PersonaCardData,
  StoredAnalysis,
} from "@/lib/types";
import { PersonaCard } from "@/components/PersonaCard";
import { GroupSimulator } from "@/components/GroupSimulator";
import { formatDate, formatInt } from "@/components/format";
import {
  Button,
  Notice,
  SectionTitle,
  Spinner,
  Stat,
} from "@/components/ui";
import { ProgressBar } from "@/components/ProgressBar";

export function GroupDashboard({
  data,
  onChange,
}: {
  data: StoredAnalysis;
  onChange: (next: StoredAnalysis) => void;
}) {
  const [runState, setRunState] = useState<
    "idle" | "running" | "done" | "error"
  >(data.personas && data.personas.length > 0 ? "done" : "idle");
  const [progress, setProgress] = useState<{
    done: number;
    total: number;
    label?: string;
  }>({ done: 0, total: 0 });

  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortRef.current?.abort(), []);

  // one card per participant: local stats always, enriched by LLM when present.
  const mergedPersonas = useMemo<PersonaCardData[]>(() => {
    return data.stats.perPerson.map((ps) => {
      const llm = data.personas?.find((x) => x.name === ps.name);
      return {
        name: ps.name,
        voice: llm?.voice ?? "",
        signature_phrases: llm?.signature_phrases ?? [],
        reaction_style: llm?.reaction_style ?? "",
        engages_with: llm?.engages_with ?? [],
        ignores: llm?.ignores ?? [],
        stats: {
          avg_len: ps.avgLen,
          laugh_rate: ps.laughRate,
          median_reply_sec: ps.medianReplySec,
          active_hours: ps.activeHours,
        },
        talks_most_to: llm?.talks_most_to ?? "",
      };
    });
  }, [data.stats.perPerson, data.personas]);

  const contextMsgs = useMemo<Msg[]>(() => {
    const real = data.parseResult.messages.filter((m) => !m.isSystem);
    return real.slice(-12);
  }, [data.parseResult.messages]);

  const hasLlmPersonas = (data.personas?.length ?? 0) > 0;

  async function runPersonas() {
    const ac = new AbortController();
    abortRef.current = ac;
    setRunState("running");
    setProgress({ done: 0, total: data.stats.perPerson.length, label: "준비 중…" });
    try {
      const personas = await extractPersonas(data.parseResult, data.stats, {
        signal: ac.signal,
        onProgress: (done, total, label) => setProgress({ done, total, label }),
      });
      onChange({ ...data, personas });
      setRunState("done");
    } catch {
      setRunState("error");
    }
  }

  function handleSimResult(r: GroupSimResult) {
    onChange({ ...data, groupSims: [...(data.groupSims ?? []), r] });
  }

  const lastSim = data.groupSims?.[data.groupSims.length - 1] ?? null;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6">
      {/* run control */}
      {!hasLlmPersonas && (
        <div className="card p-5">
          {runState !== "running" && runState !== "error" && (
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-semibold text-foreground">
                  페르소나 분석
                </p>
                <p className="text-sm text-muted">
                  멤버 한 명 한 명의 말투·드립·반응 스타일을 AI가 정리해요. 그러면
                  단톡방 반응을 시뮬레이션할 수 있어요.
                </p>
              </div>
              <Button onClick={runPersonas}>🎭 페르소나 분석</Button>
            </div>
          )}
          {runState === "running" && (
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm text-foreground">
                <Spinner /> 멤버들의 말투를 학습하는 중…
              </div>
              <ProgressBar
                done={progress.done}
                total={progress.total}
                label={
                  progress.label
                    ? `페르소나 ${progress.done}/${progress.total} — ${progress.label}`
                    : undefined
                }
              />
            </div>
          )}
          {runState === "error" && (
            <div className="space-y-3">
              <Notice tone="warn" title="AI 분석 대기 중">
                LLM 키가 설정되면 페르소나 분석이 활성화됩니다. 그 전에도 아래의 로컬
                통계 기반 페르소나 카드는 확인할 수 있어요.
              </Notice>
              <Button variant="ghost" onClick={runPersonas}>
                다시 시도
              </Button>
            </div>
          )}
        </div>
      )}

      {/* group stats */}
      <section className="card p-5">
        <SectionTitle hint="로컬에서 계산한 단톡방 요약">단톡방 요약</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="멤버" value={`${data.stats.perPerson.length}명`} />
          <Stat label="전체 메시지" value={formatInt(data.stats.totalMessages)} />
          <Stat
            label="기간"
            value={formatDate(data.stats.dateRange.start)}
            sub={`~ ${formatDate(data.stats.dateRange.end)}`}
          />
          <Stat label="대화 구간" value={formatInt(data.stats.sessions.length)} />
        </div>
      </section>

      {/* persona grid */}
      <section>
        <SectionTitle
          hint={
            hasLlmPersonas
              ? "AI가 정리한 멤버별 페르소나"
              : "로컬 통계 기반 카드 (AI 분석 시 말투·드립까지 채워져요)"
          }
        >
          페르소나 카드
        </SectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {mergedPersonas.map((p) => (
            <PersonaCard key={p.name} persona={p} isMe={p.name === data.me} />
          ))}
        </div>
      </section>

      {/* simulator */}
      <section className="card p-5">
        <SectionTitle hint="단톡방에 메시지를 던지면 누가 어떻게 반응할지 예측해요">
          단톡방 시뮬레이터
        </SectionTitle>
        <GroupSimulator
          personas={mergedPersonas}
          contextMsgs={contextMsgs}
          me={data.me}
          lastResult={lastSim}
          onResult={handleSimResult}
        />
      </section>
    </div>
  );
}
