"use client";

import { useRef, useState, type DragEvent } from "react";
import { cx } from "@/components/format";
import { Button, Chip } from "@/components/ui";
import { PrivacyBadge } from "@/components/PrivacyBadge";
import { LandingHeroBackground } from "@/components/hero/LandingHeroBackground";

const ACCEPT = [".txt", ".csv"];

function hasValidExt(name: string): boolean {
  const lower = name.toLowerCase();
  return ACCEPT.some((ext) => lower.endsWith(ext));
}

export function Upload({
  onFile,
  hasHistory,
  historyCount,
  onOpenHistory,
}: {
  onFile: (file: File) => void;
  hasHistory: boolean;
  historyCount: number;
  onOpenHistory: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  function handleFiles(files: FileList | null) {
    setError(null);
    const file = files?.[0];
    if (!file) return;
    if (!hasValidExt(file.name)) {
      setError("카톡 내보내기 파일(.txt 또는 .csv)만 올릴 수 있어요.");
      return;
    }
    onFile(file);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="relative min-h-[100dvh]">
      <LandingHeroBackground />

      <div className="relative mx-auto w-full max-w-2xl px-5 pb-16 pt-[min(28vh,220px)] sm:pt-[min(32vh,260px)]">
        <div className="text-center">
          <span className="inline-flex items-center rounded-full border border-border/80 bg-surface/80 px-3 py-1 text-xs tracking-wide text-muted backdrop-blur-sm">
            평행우주 · 카톡 회고
          </span>
          <h1 className="mt-5 bg-gradient-to-r from-accent via-accent-2 to-accent bg-clip-text text-6xl font-black tracking-tight text-transparent sm:text-7xl">
            What if…?
          </h1>
          <p className="mt-4 text-balance text-lg text-foreground/95">
            그때 이렇게 말했더라면, 우리 사이는 달라졌을까?
          </p>
          <p className="mt-2 text-sm text-muted">
            카톡 대화를 넣으면 어디서 어긋났는지 찾아내고,
            <br className="hidden sm:block" />
            다른 선택이었을 평행우주를 카톡 그대로 보여줍니다.
          </p>
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cx(
            "mt-10 flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-12 text-center backdrop-blur-sm transition-all",
            dragging
              ? "scale-[1.01] border-accent bg-accent/15 shadow-[0_0_40px_rgba(124,92,255,0.25)]"
              : "border-border/80 bg-surface/70 hover:border-accent/50 hover:bg-surface/90",
          )}
        >
          <div
            className={cx(
              "mb-4 flex size-14 items-center justify-center rounded-2xl border transition-colors",
              dragging ? "border-accent bg-accent/20" : "border-border bg-surface-2",
            )}
            aria-hidden
          >
            <svg
              className="size-7 text-accent"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <p className="text-base font-semibold text-foreground">
            여기로 카톡 파일을 끌어다 놓으세요
          </p>
          <p className="mt-1 text-sm text-muted">또는 클릭해서 파일 선택</p>
          <div className="mt-4 flex items-center gap-2">
            <Chip>.txt</Chip>
            <Chip>.csv</Chip>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".txt,.csv,text/plain,text/csv"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {error && (
          <p className="mt-3 text-center text-sm text-danger">{error}</p>
        )}

        <PrivacyBadge className="mt-6" />

        <div className="mt-4">
          <button
            type="button"
            onClick={() => setHelpOpen((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl border border-border/80 bg-surface/80 px-4 py-3 text-left text-sm font-medium text-foreground backdrop-blur-sm transition-colors hover:bg-surface"
          >
            <span>카톡 대화 내보내는 방법</span>
            <span className="text-muted">{helpOpen ? "▲" : "▼"}</span>
          </button>
          {helpOpen && (
            <div className="mt-2 space-y-4 rounded-xl border border-border bg-surface/95 px-4 py-4 text-sm text-muted backdrop-blur-sm">
              <div>
                <p className="font-semibold text-foreground">iPhone (iOS)</p>
                <p>
                  채팅방 → 우측 상단 메뉴 → 설정 → 대화 내용 내보내기 →{" "}
                  <code className="text-accent">.txt</code>
                </p>
              </div>
              <div>
                <p className="font-semibold text-foreground">Android</p>
                <p>
                  채팅방 → 메뉴 → 대화 설정 → 대화 내용 내보내기 → 텍스트만 →{" "}
                  <code className="text-accent">.txt</code>
                </p>
              </div>
              <div>
                <p className="font-semibold text-foreground">PC / Mac</p>
                <p>
                  채팅방 → 대화 내용 → 내보내기 →{" "}
                  <code className="text-accent">.txt</code> /{" "}
                  <code className="text-accent">.csv</code>
                </p>
              </div>
            </div>
          )}
        </div>

        {hasHistory && (
          <div className="mt-6 text-center">
            <Button variant="ghost" onClick={onOpenHistory}>
              저장된 분석 {historyCount}개 보기
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
