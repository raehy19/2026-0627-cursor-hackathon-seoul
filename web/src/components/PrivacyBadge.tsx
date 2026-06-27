"use client";

import { cx } from "@/components/format";

export function PrivacyBadge({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  if (compact) {
    return (
      <span
        className={cx(
          "inline-flex items-center gap-1.5 rounded-full border border-ok/30 bg-ok/10 px-3 py-1 text-xs font-medium text-ok",
          className,
        )}
      >
        🔒 브라우저에만 저장
      </span>
    );
  }

  return (
    <div
      className={cx(
        "flex items-start gap-3 rounded-2xl border border-ok/25 bg-ok/8 px-4 py-3",
        className,
      )}
    >
      <span className="text-xl leading-6" aria-hidden>
        🔒
      </span>
      <div className="text-sm">
        <p className="font-semibold text-ok">대화는 당신 브라우저에만 저장됩니다.</p>
        <p className="text-muted">
          서버로 원문을 보내지 않습니다. 모든 분석 기록은 이 기기의 브라우저(IndexedDB)에만
          남아요.
        </p>
      </div>
    </div>
  );
}
