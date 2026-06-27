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
          원문 파일은 서버에 올라가지 않아요. AI 분석 시에는 OpenRouter로 보낼 구간
          텍스트만 프록시를 거쳐 일시 전송됩니다. 내 OpenRouter 키를 쓰면 그 할당량으로
          분석할 수 있어요.
        </p>
      </div>
    </div>
  );
}
