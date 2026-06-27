"use client";

import { useEffect, useState } from "react";
import { deleteAnalysis, listAnalyses } from "@/lib/store";
import type { AnalysisIndexEntry } from "@/lib/types";
import { formatDateTime, modeLabel } from "@/components/format";
import { Button, Chip, Spinner } from "@/components/ui";

export function History({
  onLoad,
  onBack,
}: {
  onLoad: (id: string) => void;
  onBack: () => void;
}) {
  const [entries, setEntries] = useState<AnalysisIndexEntry[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function refresh() {
    const list = await listAnalyses();
    setEntries(list);
  }

  useEffect(() => {
    let ignore = false;
    (async () => {
      const list = await listAnalyses();
      if (!ignore) setEntries(list);
    })();
    return () => {
      ignore = true;
    };
  }, []);

  async function handleDelete(id: string) {
    setBusy(id);
    try {
      await deleteAnalysis(id);
      await refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-10">
      <button
        onClick={onBack}
        className="mb-4 text-sm text-muted transition-colors hover:text-foreground"
      >
        ← 홈으로
      </button>

      <h1 className="mb-1 text-2xl font-bold text-foreground">저장된 분석</h1>
      <p className="mb-6 text-sm text-muted">
        모든 기록은 이 브라우저(IndexedDB)에만 저장되어 있어요.
      </p>

      {entries === null && (
        <div className="flex items-center gap-2 text-sm text-muted">
          <Spinner /> 불러오는 중…
        </div>
      )}

      {entries !== null && entries.length === 0 && (
        <div className="card flex flex-col items-center gap-3 p-10 text-center">
          <span className="text-3xl">🗂️</span>
          <p className="text-sm text-muted">아직 저장된 분석이 없어요.</p>
          <Button onClick={onBack}>첫 분석 시작하기</Button>
        </div>
      )}

      {entries && entries.length > 0 && (
        <ul className="space-y-2">
          {entries.map((e) => (
            <li
              key={e.id}
              className="card flex items-center gap-3 p-4 transition-colors hover:bg-surface-2"
            >
              <button
                onClick={() => onLoad(e.id)}
                className="min-w-0 flex-1 text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="truncate font-semibold text-foreground">
                    {e.title}
                  </span>
                  <Chip tone={e.mode === "one_on_one" ? "accent" : "accent2"}>
                    {modeLabel(e.mode)}
                  </Chip>
                </div>
                <p className="mt-0.5 text-xs text-muted">
                  {formatDateTime(e.createdAt)} · 나: {e.me}
                </p>
              </button>
              <Button
                variant="danger"
                size="sm"
                disabled={busy === e.id}
                onClick={() => handleDelete(e.id)}
              >
                {busy === e.id ? <Spinner /> : "삭제"}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
