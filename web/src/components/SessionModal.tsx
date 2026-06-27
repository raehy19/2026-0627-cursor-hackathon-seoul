"use client";

import { useMemo } from "react";
import type {
  ParseResult,
  SegmentAnalysis,
  Session,
} from "@/lib/types";
import { KakaoThread, msgsToRows } from "@/components/KakaoThread";
import { formatDate, formatInt } from "@/components/format";
import { Button, Chip, Modal, Notice } from "@/components/ui";

const PULLING: Record<SegmentAnalysis["who_is_pulling_away"], string> = {
  me: "내가 멀어지는 중",
  them: "상대가 멀어지는 중",
  neither: "둘 다 비슷",
};

export function SessionModal({
  open,
  onClose,
  session,
  segment,
  parse,
  me,
  onOpenCounterfactual,
}: {
  open: boolean;
  onClose: () => void;
  session: Session;
  segment?: SegmentAnalysis;
  parse: ParseResult;
  me: string;
  onOpenCounterfactual: () => void;
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
          <p className="text-sm leading-relaxed text-foreground">{segment.summary}</p>
        )}

        {/* messages */}
        <div>
          <p className="mb-2 text-sm font-semibold text-foreground">실제 대화</p>
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

        {segment && segment.risky_moments.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-semibold text-danger">위험했던 순간</p>
            <ul className="space-y-2">
              {segment.risky_moments.map((r, i) => (
                <li
                  key={i}
                  className="rounded-xl border border-danger/25 bg-danger/5 p-3 text-sm"
                >
                  <p className="text-foreground">“{r.quote}”</p>
                  <p className="mt-1 text-muted">{r.why}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {segment && segment.my_mistakes.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-semibold text-foreground">내 실수와 더 나은 표현</p>
            <ul className="space-y-2">
              {segment.my_mistakes.map((m, i) => (
                <li key={i} className="rounded-xl border border-border bg-surface-2/60 p-3 text-sm">
                  <p className="text-muted">
                    <span className="text-foreground">“{m.quote}”</span>
                  </p>
                  <p className="mt-1 text-danger/90">⚠️ {m.issue}</p>
                  <p className="mt-1 text-ok">✅ “{m.better_version}”</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!segment && (
          <Notice tone="info" title="이 구간은 아직 AI 분석 전이에요">
            로컬 통계로 추려낸 구간입니다. AI 관계 분석을 실행하면 위험했던 순간과
            “이렇게 말했더라면”까지 볼 수 있어요.
          </Notice>
        )}

        {segment && (
          <div className="flex justify-end">
            <Button onClick={onOpenCounterfactual}>✨ 여기서 이렇게 말했더라면</Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
