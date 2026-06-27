"use client";

import type { SegmentAnalysis } from "@/lib/types";

const PLACEHOLDER = /^\(대표 인용 없음\)$/;

export function pickTopRiskyQuote(
  segments: SegmentAnalysis[] | undefined,
): { quote: string; why: string; when: string } | null {
  if (!segments?.length) return null;

  let best: { quote: string; why: string; when: string; severity: number } | null = null;

  for (const seg of segments) {
    for (const r of seg.risky_moments ?? []) {
      if (PLACEHOLDER.test(r.quote)) continue;
      const sev = r.severity ?? 0;
      if (!best || sev > best.severity) {
        best = { quote: r.quote, why: r.why, when: seg.time_range, severity: sev };
      }
    }
    for (const m of seg.my_mistakes ?? []) {
      if (!best || best.severity < 80) {
        best = {
          quote: m.quote,
          why: m.issue,
          when: seg.time_range,
          severity: 80,
        };
      }
    }
  }

  if (best) return { quote: best.quote, why: best.why, when: best.when };

  const seg = segments[0];
  const fallback = seg?.summary?.slice(0, 80) ?? "관계 전환 구간";
  return {
    quote: seg?.risky_moments?.[0]?.quote ?? seg?.my_mistakes?.[0]?.quote ?? fallback,
    why: seg?.risky_moments?.[0]?.why ?? "분석된 구간 중 긴장도가 가장 높았던 순간이에요.",
    when: seg?.time_range ?? "",
  };
}

export function RiskyQuoteCard({
  segments,
  className,
}: {
  segments: SegmentAnalysis[] | undefined;
  className?: string;
}) {
  const top = pickTopRiskyQuote(segments);
  if (!top?.quote) return null;

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
      {top.why && <p className="mt-2 text-sm leading-relaxed text-muted">{top.why}</p>}
      <p className="mt-3 text-xs text-muted">{top.when}</p>
    </div>
  );
}
