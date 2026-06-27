"use client";

import {
  useEffect,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { cx } from "@/components/format";

/* ------------------------------------------------------------------ Button */

type ButtonVariant = "primary" | "ghost" | "danger" | "subtle";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
};

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-white hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100",
  ghost:
    "border border-border bg-surface text-foreground hover:bg-surface-2 disabled:opacity-40",
  danger:
    "border border-danger/40 bg-transparent text-danger hover:bg-danger/10 disabled:opacity-40",
  subtle: "bg-surface-2 text-foreground hover:brightness-125 disabled:opacity-40",
};

const SIZE = {
  sm: "h-8 px-3 text-xs rounded-lg",
  md: "h-10 px-4 text-sm rounded-xl",
  lg: "h-12 px-6 text-base rounded-2xl",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cx(
        "inline-flex items-center justify-center gap-2 font-medium transition-all active:scale-[0.98] disabled:cursor-not-allowed",
        VARIANT[variant],
        SIZE[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------- Chip */

export function Chip({
  children,
  tone = "default",
  className,
}: {
  children: ReactNode;
  tone?: "default" | "accent" | "accent2" | "danger" | "warn" | "ok";
  className?: string;
}) {
  const tones: Record<string, string> = {
    default: "bg-surface-2 text-muted border-border",
    accent: "bg-accent/15 text-accent border-accent/30",
    accent2: "bg-accent-2/15 text-accent-2 border-accent-2/30",
    danger: "bg-danger/15 text-danger border-danger/30",
    warn: "bg-warn/15 text-warn border-warn/30",
    ok: "bg-ok/15 text-ok border-ok/30",
  };
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ Notice */

export function Notice({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: "info" | "warn" | "error" | "ok";
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const tones: Record<string, string> = {
    info: "border-accent/30 bg-accent/10 text-foreground",
    warn: "border-warn/30 bg-warn/10 text-foreground",
    error: "border-danger/40 bg-danger/10 text-foreground",
    ok: "border-ok/30 bg-ok/10 text-foreground",
  };
  const icon: Record<string, string> = {
    info: "💡",
    warn: "⚠️",
    error: "🚫",
    ok: "✅",
  };
  return (
    <div
      className={cx(
        "flex gap-3 rounded-xl border px-4 py-3 text-sm",
        tones[tone],
        className,
      )}
    >
      <span aria-hidden className="shrink-0 leading-5">
        {icon[tone]}
      </span>
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="text-muted [&>*]:mt-0.5">{children}</div>}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- Spinner */

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        "inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent",
        className,
      )}
      aria-hidden
    />
  );
}

/* -------------------------------------------------------------------- Stat */

export function Stat({
  label,
  value,
  sub,
  className,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("rounded-xl border border-border bg-surface-2/60 p-3", className)}>
      <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  );
}

/* ------------------------------------------------------------- SectionTitle */

export function SectionTitle({
  children,
  hint,
  right,
}: {
  children: ReactNode;
  hint?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{children}</h2>
        {hint && <p className="text-xs text-muted">{hint}</p>}
      </div>
      {right}
    </div>
  );
}

/* ------------------------------------------------------------------- Modal */

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  wide?: boolean;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:p-8"
      onClick={onClose}
    >
      <div
        className={cx(
          "card my-auto w-full overflow-hidden shadow-2xl",
          wide ? "max-w-4xl" : "max-w-2xl",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
            <div className="min-w-0 text-base font-semibold text-foreground">
              {title}
            </div>
            <button
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
              aria-label="닫기"
            >
              ✕
            </button>
          </div>
        )}
        <div className="max-h-[72vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="border-t border-border px-5 py-3">{footer}</div>
        )}
      </div>
    </div>
  );
}
