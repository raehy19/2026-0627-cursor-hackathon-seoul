"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { runCounterfactual } from "@/lib/llm/client";
import { USE_MOCK_LLM } from "@/lib/llm/config";
import type {
  CfMode,
  Counterfactual,
  DerivedStats,
  ParseResult,
  SegmentAnalysis,
} from "@/lib/types";
import { cfTurnsToRows, KakaoThread } from "@/components/KakaoThread";
import { cx } from "@/components/format";
import { Button, Modal, Notice, Spinner } from "@/components/ui";

const MODES: { id: CfMode; label: string }[] = [
  { id: "realistic", label: "현실적" },
  { id: "best_case", label: "해피엔딩" },
  { id: "disaster", label: "더 망함" },
];

function cacheKey(mode: CfMode, alt: string): string {
  return `${mode}::${alt.trim()}`;
}

function defaultOriginal(segment: SegmentAnalysis): string {
  return (
    segment.my_mistakes[0]?.quote ??
    segment.risky_moments[0]?.quote ??
    "그때 한 말"
  );
}

function defaultAlternative(
  segment: SegmentAnalysis,
  initialAlt?: string,
): string {
  if (initialAlt?.trim()) return initialAlt.trim();
  return (
    segment.my_mistakes[0]?.better_version ??
    "지금 내 마음을 차분히 말해볼게. 네 입장도 듣고 싶어."
  );
}

export function CounterfactualModal({
  open,
  onClose,
  parse,
  stats,
  me,
  segment,
  initial,
  initialAlternativeLine,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  parse: ParseResult;
  stats: DerivedStats;
  me: string;
  segment: SegmentAnalysis;
  initial?: Counterfactual[];
  initialAlternativeLine?: string;
  onSaved: (cf: Counterfactual) => void;
}) {
  const originalLine = useMemo(() => defaultOriginal(segment), [segment]);
  const [draftLine, setDraftLine] = useState(() =>
    defaultAlternative(segment, initialAlternativeLine),
  );
  const [appliedLine, setAppliedLine] = useState(() =>
    defaultAlternative(segment, initialAlternativeLine),
  );
  const [mode, setMode] = useState<CfMode>("realistic");
  const [cache, setCache] = useState<Record<string, Counterfactual>>(() => {
    const seed: Record<string, Counterfactual> = {};
    for (const cf of initial ?? []) {
      if (cf.segment_id === segment.segment_id) {
        seed[cacheKey(cf.mode, cf.suggested_line)] = cf;
      }
    }
    return seed;
  });
  const [errored, setErrored] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const inflight = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    const alt = defaultAlternative(segment, initialAlternativeLine);
    setDraftLine(alt);
    setAppliedLine(alt);
    setMode("realistic");
    const seed: Record<string, Counterfactual> = {};
    for (const cf of initial ?? []) {
      if (cf.segment_id === segment.segment_id) {
        seed[cacheKey(cf.mode, cf.suggested_line)] = cf;
      }
    }
    setCache(seed);
    setErrored({});
  }, [open, segment.segment_id, initialAlternativeLine, initial]);

  const activeKey = cacheKey(mode, appliedLine);
  const current = cache[activeKey];
  const hasError = errored[activeKey];

  useEffect(() => {
    if (!open) return;
    if (current || hasError || inflight.current.has(activeKey)) return;

    inflight.current.add(activeKey);
    setLoading(true);
    let cancelled = false;

    runCounterfactual(parse, stats, me, segment, mode, {
      alternativeLine: appliedLine,
    })
      .then((cf) => {
        if (cancelled) return;
        setCache((c) => ({ ...c, [activeKey]: cf }));
        onSaved(cf);
      })
      .catch(() => {
        if (!cancelled) setErrored((e) => ({ ...e, [activeKey]: true }));
      })
      .finally(() => {
        inflight.current.delete(activeKey);
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, activeKey, current, hasError, parse, stats, me, segment, mode, appliedLine, onSaved]);

  const them = parse.participants.find((p) => p !== me) ?? "상대";
  const dirty = draftLine.trim() !== appliedLine.trim();

  function runWithDraft() {
    setAppliedLine(draftLine.trim());
    setErrored((e) => {
      const next = { ...e };
      delete next[cacheKey(mode, draftLine.trim())];
      return next;
    });
  }

  function retry() {
    setErrored((e) => {
      const next = { ...e };
      delete next[activeKey];
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
      <div className="mb-5 space-y-4 rounded-2xl border border-border bg-surface-2/40 p-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">
            원래 내가 한 말
          </p>
          <div className="kakao-bg rounded-xl">
            <div className="kchat">
              <div className="krow krow--me">
                <span className="kname">{me}</span>
                <div className="kbubble kbubble--me kbubble--danger">{originalLine}</div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label
            htmlFor="cf-alt-line"
            className="mb-2 block text-xs font-semibold uppercase tracking-widest text-accent"
          >
            대신 이렇게 말했다면
          </label>
          <textarea
            id="cf-alt-line"
            rows={3}
            value={draftLine}
            onChange={(e) => setDraftLine(e.target.value)}
            className="w-full resize-y rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none ring-accent/30 focus:ring-2"
            placeholder="다르게 보내고 싶었던 메시지를 직접 적어보세요"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={runWithDraft} disabled={!draftLine.trim()}>
              {dirty ? "이 대사로 시뮬레이션" : "다시 시뮬레이션"}
            </Button>
            {USE_MOCK_LLM && (
              <span className="text-xs text-muted">오프라인 분석</span>
            )}
          </div>
        </div>
      </div>

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

      {(loading || (!current && !hasError)) && (
        <div className="flex items-center gap-2 py-10 text-sm text-muted">
          <Spinner /> 평행우주를 계산하는 중…
        </div>
      )}

      {hasError && !loading && (
        <div className="space-y-3">
          <Notice tone="warn" title="시뮬레이션 실패">
            {USE_MOCK_LLM
              ? "로컬 엔진 오류가 났어요. 다시 시도해 주세요."
              : "LLM 키가 설정되면 “그때 다른 말을 했다면” 시뮬레이션이 활성화됩니다."}
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

      {!loading && !hasError && current && (
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
