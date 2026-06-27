"use client";

import { useMemo } from "react";
import type {
  ParseResult,
  SegmentAnalysis,
  Session,
} from "@/lib/types";
import { findMsgIndex } from "@/lib/llm/mockEngine";
import { KakaoThread, msgsToRows } from "@/components/KakaoThread";
import { formatDate, formatInt } from "@/components/format";
import { Button, Chip, Modal, Notice } from "@/components/ui";

const PULLING: Record<SegmentAnalysis["who_is_pulling_away"], string> = {
  me: "내가 멀어지는 중",
  them: "상대가 멀어지는 중",
  neither: "둘 다 비슷",
};

function MomentContext({
  parse,
  session,
  quote,
  me,
}: {
  parse: ParseResult;
  session: Session;
  quote: string;
  me: string;
}) {
  const excerpt = useMemo(() => {
    const msgs = parse.messages.slice(session.startIdx, session.endIdx + 1);
    const idx = findMsgIndex(msgs, quote);
    if (idx < 0) return null;
    const start = Math.max(0, idx - 3);
    const end = Math.min(msgs.length, idx + 4);
    const slice = msgs.slice(start, end);
    const dangerQuotes = [quote];
    return msgsToRows(slice, me, {
      dangerQuotes,
      showNames: true,
      keyPrefix: `${session.id}-ctx-${quote.slice(0, 8)}`,
    });
  }, [parse, session, quote, me]);

  if (!excerpt?.length) return null;

  return (
    <div className="mt-3 rounded-xl border border-border/80 bg-surface p-2">
      <p className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wide text-muted">
        당시 대화 흐름
      </p>
      <KakaoThread rows={excerpt} maxRows={12} />
    </div>
  );
}

export function SessionModal({
  open,
  onClose,
  session,
  segment,
  parse,
  me,
  onOpenCounterfactual,
  analysisReady = false,
}: {
  open: boolean;
  onClose: () => void;
  session: Session;
  segment?: SegmentAnalysis;
  parse: ParseResult;
  me: string;
  onOpenCounterfactual: (alternativeLine?: string) => void;
  analysisReady?: boolean;
}) {
  const rows = useMemo(() => {
    const slice = parse.messages.slice(session.startIdx, session.endIdx + 1);
    const dangerQuotes = segment?.risky_moments.map((r) => r.quote) ?? [];
    return msgsToRows(slice, me, { dangerQuotes, showNames: true, keyPrefix: session.id });
  }, [parse, session, segment, me]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={
        <span>
          {formatDate(session.startTs)}
          {formatDate(session.endTs) !== formatDate(session.startTs) &&
            ` ~ ${formatDate(session.endTs)}`}{" "}
          <span className="text-muted">· 메시지 {formatInt(session.msgCount)}개</span>
        </span>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone="danger">위험도 {Math.round(session.riskScore)}</Chip>
          {segment && <Chip tone="warn">긴장도 {Math.round(segment.tension_score)}</Chip>}
          {segment && <Chip tone="accent">{PULLING[segment.who_is_pulling_away]}</Chip>}
        </div>

        {segment?.summary && (
          <div className="rounded-xl border border-border bg-surface-2/50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">이 구간 요약</p>
            <p className="mt-2 text-sm leading-relaxed text-foreground">{segment.summary}</p>
          </div>
        )}

        {segment && segment.risky_moments.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-semibold text-danger">위험했던 순간</p>
            <ul className="space-y-3">
              {segment.risky_moments.map((r, i) => (
                <li
                  key={i}
                  className="rounded-xl border border-danger/25 bg-danger/5 p-4 text-sm"
                >
                  <p className="font-medium text-foreground">&ldquo;{r.quote}&rdquo;</p>
                  <p className="mt-2 leading-relaxed text-muted">{r.why}</p>
                  <MomentContext
                    parse={parse}
                    session={session}
                    quote={r.quote}
                    me={me}
                  />
                </li>
              ))}
            </ul>
          </div>
        )}

        {segment && segment.my_mistakes.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-semibold text-foreground">
              이때 이렇게 말했어야 했을 수도
            </p>
            <ul className="space-y-3">
              {segment.my_mistakes.map((m, i) => (
                <li key={i} className="rounded-xl border border-ok/30 bg-ok/5 p-4 text-sm">
                  <p className="text-muted">
                    내가 한 말: <span className="text-danger">&ldquo;{m.quote}&rdquo;</span>
                  </p>
                  <p className="mt-2 text-foreground">{m.issue}</p>
                  <p className="mt-2 text-ok">
                    대신 이렇게: &ldquo;{m.better_version}&rdquo;
                  </p>
                  <MomentContext
                    parse={parse}
                    session={session}
                    quote={m.quote}
                    me={me}
                  />
                  <button
                    type="button"
                    onClick={() => onOpenCounterfactual(m.better_version)}
                    className="mt-3 text-sm font-medium text-accent underline-offset-2 hover:underline"
                  >
                    이 대사로 평행우주 보기
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <p className="mb-2 text-sm font-semibold text-foreground">전체 대화 기록</p>
          <KakaoThread rows={rows} maxRows={300} />
        </div>

        {segment && (segment.tone.me || segment.tone.them) && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface-2/60 p-3 text-sm">
              <p className="text-xs text-muted">나의 톤</p>
              <p className="text-foreground">{segment.tone.me || "—"}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface-2/60 p-3 text-sm">
              <p className="text-xs text-muted">상대의 톤</p>
              <p className="text-foreground">{segment.tone.them || "—"}</p>
            </div>
          </div>
        )}

        {!segment && !analysisReady && (
          <Notice tone="info" title="이 구간은 아직 분석 대기 중">
            관계 분석을 실행하면 위험 순간·대안 대사·평행우주까지 볼 수 있어요.
          </Notice>
        )}

        {segment && (
          <div className="flex justify-end">
            <Button onClick={() => onOpenCounterfactual()}>
              다른 대사로 평행우주 열기
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
