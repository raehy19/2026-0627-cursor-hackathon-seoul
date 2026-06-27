"use client";

import { useRef, useState, type DragEvent } from "react";
import { cx } from "@/components/format";
import { Button, Chip } from "@/components/ui";
import { PrivacyBadge } from "@/components/PrivacyBadge";

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
    <div className="mx-auto w-full max-w-2xl px-5 py-10 sm:py-16">
      {/* hero */}
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted">
          카톡 평행우주 시뮬레이터
        </span>
        <h1 className="mt-5 bg-gradient-to-r from-accent via-accent-2 to-accent bg-clip-text text-6xl font-black tracking-tight text-transparent sm:text-7xl">
          What if…?
        </h1>
        <p className="mt-4 text-balance text-lg text-foreground/90">
          그때 이렇게 말했더라면, 우리 사이는 달라졌을까?
        </p>
        <p className="mt-2 text-sm text-muted">
          카톡 대화를 넣으면 어디서 어긋났는지 찾아내고,
          <br className="hidden sm:block" />
          “그때 다른 말을 했다면”의 평행우주를 시뮬레이션합니다.
        </p>
      </div>

      {/* dropzone */}
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
          "mt-8 flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-12 text-center transition-all",
          dragging
            ? "border-accent bg-accent/10 scale-[1.01]"
            : "border-border bg-surface hover:border-accent/50 hover:bg-surface-2",
        )}
      >
        <div className="text-4xl" aria-hidden>
          {dragging ? "📥" : "💬"}
        </div>
        <p className="mt-3 text-base font-semibold text-foreground">
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

      {/* help */}
      <div className="mt-4">
        <button
          onClick={() => setHelpOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
        >
          <span>📤 카톡 대화 내보내는 방법</span>
          <span className="text-muted">{helpOpen ? "▲" : "▼"}</span>
        </button>
        {helpOpen && (
          <div className="mt-2 space-y-4 rounded-xl border border-border bg-surface px-4 py-4 text-sm text-muted">
            <div>
              <p className="font-semibold text-foreground">📱 아이폰 (iOS)</p>
              <p>
                채팅방 → 우측 상단 메뉴 → 설정(톱니) → 대화 내용 내보내기 → 이메일/파일로
                저장 → <code className="text-accent">.txt</code>
              </p>
            </div>
            <div>
              <p className="font-semibold text-foreground">🤖 안드로이드</p>
              <p>
                채팅방 → 메뉴(≡) → 대화 설정 → 대화 내용 내보내기 → 텍스트 메시지만 →{" "}
                <code className="text-accent">.txt</code>
              </p>
            </div>
            <div>
              <p className="font-semibold text-foreground">💻 PC / Mac</p>
              <p>
                채팅방 우측 상단 → 대화 내용 → 내보내기 →{" "}
                <code className="text-accent">.txt</code> / <code className="text-accent">.csv</code>
              </p>
            </div>
            <p className="text-xs text-muted/80">
              파일은 업로드되지 않고, 당신의 브라우저 안에서만 분석됩니다.
            </p>
          </div>
        )}
      </div>

      {/* history entry */}
      {hasHistory && (
        <div className="mt-6 text-center">
          <Button variant="ghost" onClick={onOpenHistory}>
            🗂️ 저장된 분석 {historyCount}개 보기
          </Button>
        </div>
      )}
    </div>
  );
}
