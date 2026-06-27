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

const MODES: { id: CfMode; label: string; accent: string }[] = [
  { id: "realistic", label: "현실적", accent: "border-muted" },
  { id: "best_case", label: "해피엔딩", accent: "border-ok" },
  { id: "disaster", label: "더 망함", accent: "border-danger" },
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
  const them = parse.participants.find((p) => p !== me) ?? "상대";

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
      <div className="mb-4 inline-flex rounded-xl border border-border bg-surface-2 p-1">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={cx(
              "rounded-lg border-b-2 px-4 py-1.5 text-sm font-medium transition-colors",
              mode === m.id
                ? "border-accent bg-accent text-white"
                : "border-transparent text-muted hover:text-foreground",
            )}
          >
            {m.label}
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
            LLM 키가 설정되면 “그때 다른 말을 했다면” 시뮬레이션이 활성화됩니다.
          </Notice>
          <button
            type="button"
            onClick={retry}
            className="text-sm text-accent transition-colors hover:text-foreground"
          >
            다시 시도
          </button>
        </div>
      )}

      {!loading && !errored[mode] && current && (
        <div className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-danger/30 bg-danger/5 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-danger">
                원래 우주
              </p>
              <div className="kakao-bg rounded-xl">
                <div className="kchat">
                  <div className="krow krow--me">
                    <span className="kname">{me}</span>
                    <div className="kbubble kbubble--me kbubble--danger">
                      {current.original_line}
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted">실제로 했던 선택</p>
            </div>

            <div className="rounded-2xl border border-ok/30 bg-ok/5 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-ok">
                평행우주
              </p>
              <div className="kakao-bg rounded-xl">
                <div className="kchat">
                  <div className="krow krow--me">
                    <span className="kname">{me}</span>
                    <div className="kbubble kbubble--me">{current.suggested_line}</div>
                  </div>
                </div>
              </div>
              {current.rationale && (
                <p className="mt-3 text-sm text-muted">{current.rationale}</p>
              )}
            </div>
          </div>

          {current.simulated_timeline.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-foreground">
                이어졌을 대화 · {them}과의 스레드
              </p>
              <KakaoThread rows={cfTurnsToRows(current.simulated_timeline, me)} />
            </div>
          )}

          {current.outcome_delta && (
            <div className="rounded-2xl border border-accent/30 bg-gradient-to-r from-accent/15 to-accent-2/15 p-5 text-center">
              <p className="text-xs font-medium uppercase tracking-widest text-muted">
                예상 결말
              </p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                {current.outcome_delta}
              </p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
