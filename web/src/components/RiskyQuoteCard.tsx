"use client";

import type { SegmentAnalysis } from "@/lib/types";

export function pickTopRiskyQuote(
  segments: SegmentAnalysis[] | undefined,
): { quote: string; why: string; when: string } | null {
  if (!segments?.length) return null;
  let best: { quote: string; why: string; when: string; severity: number } | null = null;
  for (const seg of segments) {
    for (const r of seg.risky_moments ?? []) {
      const sev = r.severity ?? 0;
      if (!best || sev > best.severity) {
        best = { quote: r.quote, why: r.why, when: seg.time_range, severity: sev };
      }
    }
  }
  if (!best) return null;
  return { quote: best.quote, why: best.why, when: best.when };
}

export function RiskyQuoteCard({
  segments,
  className,
}: {
  segments: SegmentAnalysis[] | undefined;
  className?: string;
}) {
  const top = pickTopRiskyQuote(segments);
  if (!top) return null;

  return (
    <div
      className={`animate-fade-up rounded-2xl border border-accent-2/40 bg-gradient-to-br from-accent-2/10 to-surface p-5 ${className ?? ""}`}
    >
      <p className="text-xs font-medium uppercase tracking-widest text-accent-2">
        가장 아팠을 수 있는 한 줄
      </p>
      <p className="mt-3 text-lg font-semibold leading-snug text-foreground">
        &ldquo;{top.quote}&rdquo;
      </p>
      {top.why && <p className="mt-2 text-sm text-muted">{top.why}</p>}
      <p className="mt-3 text-xs text-muted">{top.when}</p>
    </div>
  );
}
