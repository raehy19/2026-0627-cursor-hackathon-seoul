"use client";

import { useMemo, useState } from "react";
import { mockAnalyzeSegment } from "@/lib/llm/mockEngine";
import type {
  PersonStats,
  SegmentAnalysis,
  Session,
  StoredAnalysis,
} from "@/lib/types";
import { AnalysisRunPanel } from "@/components/AnalysisRunPanel";
import { Timeline } from "@/components/Timeline";
import { SessionModal } from "@/components/SessionModal";
import { CounterfactualModal } from "@/components/CounterfactualModal";
import {
  cx,
  formatDate,
  formatInt,
  humanizeSec,
  pct,
} from "@/components/format";
import {
  Chip,
  SectionTitle,
  Stat,
} from "@/components/ui";
import {
  RelationshipGauge,
  computeRelationshipScore,
} from "@/components/RelationshipGauge";
import { RiskyQuoteCard } from "@/components/RiskyQuoteCard";

function PersonCompare({
  me,
  people,
}: {
  me: string;
  people: PersonStats[];
}) {
  if (people.length === 0) return null;
  const rows: { label: string; get: (p: PersonStats) => string }[] = [
    { label: "메시지 수", get: (p) => formatInt(p.msgCount) },
    { label: "평균 길이", get: (p) => `${formatInt(p.avgLen)}자` },
    { label: "응답 속도(중앙)", get: (p) => humanizeSec(p.medianReplySec) },
    { label: "ㅋㅎ 비율", get: (p) => pct(p.laughRate) },
    { label: "질문 비율", get: (p) => pct(p.questionRate) },
    { label: "먼저 말 건 횟수", get: (p) => formatInt(p.initiationCount) },
  ];
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-2/60 text-left text-xs text-muted">
            <th className="px-3 py-2 font-medium">지표</th>
            {people.map((p) => (
              <th key={p.name} className="px-3 py-2 font-medium">
                <span className={cx(p.name === me && "text-accent")}>
                  {p.name}
                  {p.name === me && " (나)"}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-t border-border">
              <td className="px-3 py-2 text-muted">{r.label}</td>
              {people.map((p) => (
                <td key={p.name} className="px-3 py-2 tabular-nums text-foreground">
                  {r.get(p)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Dashboard1on1({
  data,
  onChange,
}: {
  data: StoredAnalysis;
  onChange: (next: StoredAnalysis) => void;
}) {
  const [selected, setSelected] = useState<Session | null>(null);
  const [cfSegment, setCfSegment] = useState<SegmentAnalysis | null>(null);
  const [cfAltLine, setCfAltLine] = useState<string | undefined>();

  const segBySession = useMemo(() => {
    const map: Record<string, SegmentAnalysis> = {};
    const sessions = data.stats.sessions;
    for (const seg of data.segments ?? []) {
      let s = sessions.find((x) => x.id === seg.segment_id);
      if (!s) {
        const startDate = seg.time_range.split("~")[0]?.trim() ?? "";
        s = sessions.find(
          (x) =>
            formatDate(x.startTs) === startDate || x.label.startsWith(startDate),
        );
      }
      if (s) map[s.id] = seg;
    }
    return map;
  }, [data.segments, data.stats.sessions]);

  const tensionBySession = useMemo(() => {
    const t: Record<string, number> = {};
    for (const [sid, seg] of Object.entries(segBySession))
      t[sid] = seg.tension_score;
    return t;
  }, [segBySession]);

  const relationshipScore = useMemo(
    () => computeRelationshipScore(data.segments, data.stats.sessions),
    [data.segments, data.stats.sessions],
  );

  const overview = data.overview;
  const selectedSegment = useMemo(() => {
    if (!selected) return undefined;
    const mapped = segBySession[selected.id];
    if (mapped) return mapped;
    if (data.overview) {
      return mockAnalyzeSegment(data.parseResult, selected, data.me);
    }
    return undefined;
  }, [selected, segBySession, data.overview, data.parseResult, data.me]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <AnalysisRunPanel
        data={data}
        onChange={onChange}
        kind="one_on_one"
        ready={!!data.overview}
      />

      <RelationshipGauge score={relationshipScore} />

      {data.segments && data.segments.length > 0 && (
        <RiskyQuoteCard segments={data.segments} />
      )}

      {/* overview (LLM) */}
      {overview && (
        <section className="card p-5">
          <SectionTitle hint="6개월 대화에서 짚어낸 관계의 흐름">관계 리포트</SectionTitle>
          {overview.relationship_arc && (
            <p className="mb-5 text-base leading-relaxed text-foreground">
              {overview.relationship_arc}
            </p>
          )}

          {overview.breakup_reasons.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-sm font-semibold text-accent-2">
                어긋난 이유
              </p>
              <div className="space-y-3">
                {overview.breakup_reasons.map((b, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-border bg-surface-2/50 p-3"
                  >
                    <p className="text-sm font-medium text-foreground">
                      {b.reason}
                    </p>
                    {b.evidence.length > 0 && (
                      <div className="mt-2 flex flex-col gap-1.5">
                        {b.evidence.map((q, j) => (
                          <span
                            key={j}
                            className="rounded-lg border-l-2 border-accent-2/50 bg-surface px-2.5 py-1 text-xs italic text-muted"
                          >
                            “{q}”
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {overview.turning_points.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-sm font-semibold text-warn">전환점</p>
              <ul className="space-y-1.5">
                {overview.turning_points.map((tp, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <Chip tone="warn">{tp.when}</Chip>
                    <span className="text-foreground">{tp.what}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {overview.your_patterns.length > 0 && (
              <div className="rounded-xl border border-border bg-surface-2/50 p-3">
                <p className="mb-1.5 text-sm font-semibold text-accent">나의 패턴</p>
                <ul className="list-disc space-y-1 pl-4 text-sm text-muted">
                  {overview.your_patterns.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
            {overview.their_patterns.length > 0 && (
              <div className="rounded-xl border border-border bg-surface-2/50 p-3">
                <p className="mb-1.5 text-sm font-semibold text-accent-2">
                  상대의 패턴
                </p>
                <ul className="list-disc space-y-1 pl-4 text-sm text-muted">
                  {overview.their_patterns.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* timeline */}
      <section className="card p-5">
        <SectionTitle hint="빨간 점을 누르면 그 구간의 실제 대화를 볼 수 있어요">
          타임라인
        </SectionTitle>
        <Timeline
          stats={data.stats}
          tensionBySession={tensionBySession}
          onSelectSession={setSelected}
        />
      </section>

      {/* local stats */}
      <section className="card p-5">
        <SectionTitle hint="LLM 없이 로컬에서 계산한 통계">대화 통계</SectionTitle>
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="전체 메시지" value={formatInt(data.stats.totalMessages)} />
          <Stat
            label="기간"
            value={`${formatDate(data.stats.dateRange.start)}`}
            sub={`~ ${formatDate(data.stats.dateRange.end)}`}
          />
          <Stat label="대화 구간" value={formatInt(data.stats.sessions.length)} />
          <Stat label="질문 무시율" value={pct(data.stats.questionIgnoreRate)} />
        </div>
        <PersonCompare me={data.me} people={data.stats.perPerson} />
      </section>

      {/* modals */}
      {selected && (
        <SessionModal
          open={!!selected}
          onClose={() => setSelected(null)}
          session={selected}
          segment={selectedSegment}
          parse={data.parseResult}
          me={data.me}
          analysisReady={!!data.overview}
          onOpenCounterfactual={(alt) => {
            if (selectedSegment) {
              setCfAltLine(alt);
              setCfSegment(selectedSegment);
            }
          }}
        />
      )}

      {cfSegment && (
        <CounterfactualModal
          open={!!cfSegment}
          onClose={() => {
            setCfSegment(null);
            setCfAltLine(undefined);
          }}
          initialAlternativeLine={cfAltLine}
          parse={data.parseResult}
          stats={data.stats}
          me={data.me}
          segment={cfSegment}
          initial={data.counterfactuals}
          onSaved={(cf) => {
            const others = (data.counterfactuals ?? []).filter(
              (c) => !(c.segment_id === cf.segment_id && c.mode === cf.mode),
            );
            onChange({ ...data, counterfactuals: [...others, cf] });
          }}
        />
      )}
    </div>
  );
}
