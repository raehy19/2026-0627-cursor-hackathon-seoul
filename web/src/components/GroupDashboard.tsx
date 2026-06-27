"use client";

import { useMemo } from "react";
import type {
  GroupSimResult,
  Msg,
  PersonaCard as PersonaCardData,
  StoredAnalysis,
} from "@/lib/types";
import { AnalysisRunPanel } from "@/components/AnalysisRunPanel";
import { PersonaCard } from "@/components/PersonaCard";
import { GroupSimulator } from "@/components/GroupSimulator";
import { formatDate, formatInt } from "@/components/format";
import { SectionTitle, Stat } from "@/components/ui";

export function GroupDashboard({
  data,
  onChange,
}: {
  data: StoredAnalysis;
  onChange: (next: StoredAnalysis) => void;
}) {
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

  function handleSimResult(r: GroupSimResult) {
    onChange({ ...data, groupSims: [...(data.groupSims ?? []), r] });
  }

  const lastSim = data.groupSims?.[data.groupSims.length - 1] ?? null;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6">
      <AnalysisRunPanel
        data={data}
        onChange={onChange}
        kind="group"
        ready={hasLlmPersonas}
      />

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

      <section>
        <SectionTitle
          hint={
            hasLlmPersonas
              ? "AI가 정리한 멤버별 페르소나"
              : "로컬 통계 기반 카드 (분석 후 말투·드립까지 채워져요)"
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
