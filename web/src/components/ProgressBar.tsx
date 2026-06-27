"use client";

import { cx } from "@/components/format";

export function ProgressBar({
  done,
  total,
  label,
  className,
}: {
  done: number;
  total: number;
  label?: string;
  className?: string;
}) {
  const safeTotal = total > 0 ? total : 1;
  const ratio = Math.max(0, Math.min(1, done / safeTotal));
  const pctText = Math.round(ratio * 100);

  return (
    <div className={cx("w-full", className)}>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="truncate text-muted">{label ?? "분석 중…"}</span>
        <span className="shrink-0 tabular-nums text-muted">
          {total > 0 ? `${done}/${total}` : `${pctText}%`}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2 transition-[width] duration-300 ease-out"
          style={{ width: `${pctText}%` }}
        />
      </div>
    </div>
  );
}
