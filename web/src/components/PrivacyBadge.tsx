"use client";

import { cx } from "@/components/format";

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0V10.5M4.5 10.5h15v9.75a1.5 1.5 0 01-1.5 1.5h-12a1.5 1.5 0 01-1.5-1.5V10.5z"
      />
    </svg>
  );
}

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
        <LockIcon className="size-3.5" />
        브라우저에만 저장
      </span>
    );
  }

  return (
    <div
      className={cx(
        "flex items-start gap-3 rounded-2xl border border-ok/25 bg-ok/8 px-4 py-3 backdrop-blur-sm",
        className,
      )}
    >
      <LockIcon className="mt-0.5 size-5 shrink-0 text-ok" />
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
