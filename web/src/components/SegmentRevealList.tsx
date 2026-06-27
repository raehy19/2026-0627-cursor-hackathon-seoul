"use client";

import type { SegmentAnalysis } from "@/lib/types";
import { Chip } from "@/components/ui";

export function SegmentRevealList({
  segments,
}: {
  segments: SegmentAnalysis[];
}) {
  if (segments.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-widest text-muted">
        발견된 구간
      </p>
      <ul className="space-y-2">
        {segments.map((seg, i) => (
          <li
            key={seg.segment_id}
            className="animate-fade-up rounded-xl border border-border bg-surface-2/50 px-4 py-3"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex flex-wrap items-center gap-2">
              <Chip tone="warn">{seg.time_range}</Chip>
              {seg.tension_score > 0 && (
                <span className="text-xs tabular-nums text-muted">
                  긴장 {seg.tension_score}
                </span>
              )}
            </div>
            {seg.summary && (
              <p className="mt-2 text-sm text-foreground">{seg.summary}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
