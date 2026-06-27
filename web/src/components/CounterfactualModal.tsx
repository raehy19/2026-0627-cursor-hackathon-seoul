"use client";

import { useEffect, useRef, useState } from "react";
import { runCounterfactual } from "@/lib/llm/client";
import type {
  CfMode,
  Counterfactual,
  DerivedStats,
  ParseResult,
  SegmentAnalysis,
} from "@/lib/types";
import { cfTurnsToRows, KakaoThread } from "@/components/KakaoThread";
import { cx } from "@/components/format";
import { Modal, Notice, Spinner } from "@/components/ui";

const MODES: { id: CfMode; label: string; emoji: string }[] = [
  { id: "realistic", label: "현실적", emoji: "🙂" },
  { id: "best_case", label: "해피엔딩", emoji: "💖" },
  { id: "disaster", label: "더 망함", emoji: "🔥" },
];

type CacheMap = Partial<Record<CfMode, Counterfactual>>;

export function CounterfactualModal({
  open,
  onClose,
  parse,
  stats,
  me,
  segment,
  initial,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  parse: ParseResult;
  stats: DerivedStats;
  me: string;
  segment: SegmentAnalysis;
  initial?: Counterfactual[];
  onSaved: (cf: Counterfactual) => void;
}) {
  const [mode, setMode] = useState<CfMode>("realistic");
  const [cache, setCache] = useState<CacheMap>(() => {
    const seed: CacheMap = {};
    for (const cf of initial ?? []) {
      if (cf.segment_id === segment.segment_id) seed[cf.mode] = cf;
    }
    return seed;
  });
  const [errored, setErrored] = useState<Partial<Record<CfMode, boolean>>>({});
  const inflight = useRef<Set<CfMode>>(new Set());

  useEffect(() => {
    if (!open) return;
    const m = mode;
    if (cache[m] || errored[m] || inflight.current.has(m)) return;
    inflight.current.add(m);
    let cancelled = false;
    runCounterfactual(parse, stats, me, segment, m)
      .then((cf) => {
        if (cancelled) return;
        setCache((c) => ({ ...c, [m]: cf }));
        onSaved(cf);
      })
      .catch(() => {
        if (!cancelled) setErrored((e) => ({ ...e, [m]: true }));
      })
      .finally(() => {
        inflight.current.delete(m);
      });
    return () => {
      cancelled = true;
    };
  }, [open, mode, segment, parse, stats, me, cache, errored, onSaved]);

  const current = cache[mode];
  const loading = open && !current && !errored[mode];

  function retry() {
    setErrored((e) => {
      const next = { ...e };
      delete next[mode];
      return next;
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={
        <span>
          여기서 이렇게 말했더라면{" "}
          <span className="text-muted">· {segment.time_range}</span>
        </span>
      }
    >
      {/* tabs */}
      <div className="mb-4 inline-flex rounded-xl border border-border bg-surface-2 p-1">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={cx(
              "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
              mode === m.id
                ? "bg-accent text-white"
                : "text-muted hover:text-foreground",
            )}
          >
            {m.emoji} {m.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-10 text-sm text-muted">
          <Spinner /> 평행우주를 계산하는 중…
        </div>
      )}

      {errored[mode] && !loading && (
        <div className="space-y-3">
          <Notice tone="warn" title="AI 시뮬레이션 대기 중">
            LLM 키가 설정되면 “그때 다른 말을 했다면” 시뮬레이션이 활성화됩니다. 그
            전까지는 실제 대화와 로컬 분석을 확인할 수 있어요.
          </Notice>
          <button
            onClick={retry}
            className="text-sm text-accent transition-colors hover:text-foreground"
          >
            다시 시도
          </button>
        </div>
      )}

      {!loading && !errored[mode] && current && (
        <div className="space-y-5">
          {/* line swap */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-danger/30 bg-danger/5 p-3">
              <p className="mb-1 text-xs font-semibold text-danger">실제로 한 말</p>
              <p className="text-sm text-foreground">“{current.original_line}”</p>
            </div>
            <div className="rounded-xl border border-ok/30 bg-ok/5 p-3">
              <p className="mb-1 text-xs font-semibold text-ok">이렇게 말했더라면</p>
              <p className="text-sm text-foreground">“{current.suggested_line}”</p>
            </div>
          </div>

          {current.rationale && (
            <div className="rounded-xl border border-border bg-surface-2/60 p-3 text-sm text-muted">
              💬 {current.rationale}
            </div>
          )}

          {current.simulated_timeline.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-foreground">
                이어졌을 대화
              </p>
              <KakaoThread rows={cfTurnsToRows(current.simulated_timeline, me)} />
            </div>
          )}

          {current.outcome_delta && (
            <div className="rounded-2xl bg-gradient-to-r from-accent/20 to-accent-2/20 p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-muted">예상 결말</p>
              <p className="mt-1 text-base font-semibold text-foreground">
                {current.outcome_delta}
              </p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
