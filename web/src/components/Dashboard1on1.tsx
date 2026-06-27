"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { runOneOnOneAnalysis } from "@/lib/llm/client";
import type {
  PersonStats,
  SegmentAnalysis,
  Session,
  StoredAnalysis,
} from "@/lib/types";
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
  Button,
  Chip,
  Notice,
  SectionTitle,
  Spinner,
  Stat,
} from "@/components/ui";
import { ProgressBar } from "@/components/ProgressBar";
import {
  RelationshipGauge,
  computeRelationshipScore,
} from "@/components/RelationshipGauge";
import { RiskyQuoteCard } from "@/components/RiskyQuoteCard";
import { SegmentRevealList } from "@/components/SegmentRevealList";

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
  const [runState, setRunState] = useState<
    "idle" | "running" | "done" | "error"
  >(data.overview ? "done" : "idle");
  const [progress, setProgress] = useState<{
    done: number;
    total: number;
    label?: string;
  }>({ done: 0, total: 0 });

  const [selected, setSelected] = useState<Session | null>(null);
  const [cfSegment, setCfSegment] = useState<SegmentAnalysis | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const dataRef = useRef(data);
  dataRef.current = data;
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

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

  async function runAnalysis() {
    const ac = new AbortController();
    abortRef.current = ac;
    setRunState("running");
    setProgress({ done: 0, total: 0, label: "분석 준비 중…" });
    onChange({ ...dataRef.current, segments: [], overview: undefined });
    try {
      const { segments, overview } = await runOneOnOneAnalysis(
        dataRef.current.parseResult,
        dataRef.current.stats,
        dataRef.current.me,
        {
          signal: ac.signal,
          onProgress: (done, total, label) => setProgress({ done, total, label }),
          onSegment: (seg) => {
            const base = dataRef.current;
            const next = {
              ...base,
              segments: [...(base.segments ?? []), seg],
            };
            dataRef.current = next;
            onChange(next);
          },
        },
      );
      const final = { ...dataRef.current, segments, overview };
      dataRef.current = final;
      onChange(final);
      setRunState("done");
    } catch {
      setRunState("error");
    }
  }

  const overview = data.overview;
  const selectedSegment = selected ? segBySession[selected.id] : undefined;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6">
      {/* run control */}
      {runState !== "done" && (
        <div className="card p-5">
          {runState === "idle" && (
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-semibold text-foreground">
                  AI 관계 분석
                </p>
                <p className="text-sm text-muted">
                  위험했던 구간을 짚어 어디서 어긋났는지, 무엇을 바꿀 수 있었는지
                  찾아드려요.
                </p>
              </div>
              <Button onClick={runAnalysis}>관계 분석 시작</Button>
            </div>
          )}
          {runState === "running" && (
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm text-foreground">
                <Spinner /> 구간을 하나씩 읽는 중…
              </div>
              <ProgressBar
                done={progress.done}
                total={progress.total}
                label={
                  progress.label
                    ? `구간 분석 ${progress.done}/${progress.total} — ${progress.label}`
                    : "분석 중…"
                }
              />
            </div>
          )}
          {runState === "error" && (
            <div className="space-y-3">
              <Notice tone="warn" title="AI 분석 대기 중">
                LLM 키가 설정되면 AI 관계 분석이 활성화됩니다. 그 전에도 아래
                타임라인과 실제 대화, 로컬 통계는 모두 사용할 수 있어요.
              </Notice>
              <Button variant="ghost" onClick={runAnalysis}>
                다시 시도
              </Button>
            </div>
          )}
        </div>
      )}

      {/* streamed segments while running */}
      {runState === "running" && (data.segments?.length ?? 0) > 0 && (
        <SegmentRevealList segments={data.segments ?? []} />
      )}
      {runState === "running" && (data.segments?.length ?? 0) === 0 && (
        <p className="text-center text-xs text-muted">
          분석 결과가 준비되는 대로 여기에 나타납니다…
        </p>
      )}

      <RelationshipGauge score={relationshipScore} />

      {data.segments && data.segments.length > 0 && (
        <RiskyQuoteCard segments={data.segments} />
      )}

      {/* overview (LLM) */}
      {overview && (
        <section className="card p-5">
          <SectionTitle hint="AI가 정리한 관계의 흐름">관계 리포트</SectionTitle>
          {overview.relationship_arc && (
            <p className="mb-4 text-sm leading-relaxed text-foreground">
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
          onOpenCounterfactual={() => {
            if (selectedSegment) setCfSegment(selectedSegment);
          }}
        />
      )}

      {cfSegment && (
        <CounterfactualModal
          open={!!cfSegment}
          onClose={() => setCfSegment(null)}
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
