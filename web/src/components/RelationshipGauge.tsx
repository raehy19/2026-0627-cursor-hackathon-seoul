"use client";

import type { SegmentAnalysis, Session } from "@/lib/types";
import { cx } from "@/components/format";

function scoreLabel(score: number): { text: string; tone: "ok" | "warn" | "danger" } {
  if (score >= 70) return { text: "긴장이 높았던 관계", tone: "danger" };
  if (score >= 45) return { text: "오르락내리락했던 관계", tone: "warn" };
  return { text: "비교적 안정적이었던 관계", tone: "ok" };
}

function barColor(score: number): string {
  if (score >= 70) return "from-danger via-accent-2 to-danger";
  if (score >= 45) return "from-warn via-accent-2 to-warn";
  return "from-ok via-accent to-ok";
}

export function computeRelationshipScore(
  segments: SegmentAnalysis[] | undefined,
  sessions: Session[],
): number {
  if (segments && segments.length > 0) {
    const sum = segments.reduce((a, s) => a + (s.tension_score ?? 0), 0);
    return Math.round(sum / segments.length);
  }
  const top = [...sessions].sort((a, b) => b.riskScore - a.riskScore).slice(0, 8);
  if (top.length === 0) return 0;
  return Math.round(top.reduce((a, s) => a + s.riskScore, 0) / top.length);
}

export function RelationshipGauge({
  score,
  className,
}: {
  score: number;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, score));
  const { text, tone } = scoreLabel(clamped);

  return (
    <div className={cx("rounded-2xl border border-border bg-surface-2/40 p-5", className)}>
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted">
            관계 온도
          </p>
          <p
            className={cx(
              "mt-1 text-sm font-medium",
              tone === "danger" && "text-danger",
              tone === "warn" && "text-warn",
              tone === "ok" && "text-ok",
            )}
          >
            {text}
          </p>
        </div>
        <p className="text-4xl font-black tabular-nums text-foreground">{clamped}</p>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-surface">
        <div
          className={cx("h-full rounded-full bg-gradient-to-r transition-all duration-700", barColor(clamped))}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-muted">
        분석된 구간의 긴장도·로컬 위험 점수를 종합한 지표입니다. 높을수록 갈등·거리감 신호가
        많았을 수 있어요.
      </p>
    </div>
  );
}
