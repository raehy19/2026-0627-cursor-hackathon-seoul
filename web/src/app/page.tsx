"use client";

import { useCallback, useEffect, useState } from "react";
import { parseKakaoExport } from "@/lib/parser";
import { computeDerivedStats } from "@/lib/stats";
import { listAnalyses, loadAnalysis, saveAnalysis } from "@/lib/store";
import type { ParseResult, StoredAnalysis } from "@/lib/types";
import { Upload } from "@/components/Upload";
import { MeSelect } from "@/components/MeSelect";
import { Dashboard1on1 } from "@/components/Dashboard1on1";
import { GroupDashboard } from "@/components/GroupDashboard";
import { History } from "@/components/History";
import { Button, Chip, Notice, Spinner } from "@/components/ui";
import { PrivacyBadge } from "@/components/PrivacyBadge";
import { formatMonthYear, modeLabel } from "@/components/format";

type Screen = "landing" | "parsing" | "me" | "dashboard" | "history";

function makeTitle(parse: ParseResult, start: number, end: number): string {
  const range = end ? ` (${formatMonthYear(start)}~${formatMonthYear(end)})` : "";
  return `${parse.title}${range}`;
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [parse, setParse] = useState<ParseResult | null>(null);
  const [current, setCurrent] = useState<StoredAnalysis | null>(null);
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [meError, setMeError] = useState<string | null>(null);
  const [historyCount, setHistoryCount] = useState(0);

  const refreshHistory = useCallback(async () => {
    try {
      const list = await listAnalyses();
      setHistoryCount(list.length);
    } catch {
      /* idb unavailable — ignore */
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const list = await listAnalyses();
        if (!ignore) setHistoryCount(list.length);
      } catch {
        /* idb unavailable — ignore */
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const persist = useCallback(
    (next: StoredAnalysis) => {
      setCurrent(next);
      saveAnalysis(next)
        .then(() => refreshHistory())
        .catch(() => {
          /* persistence is best-effort */
        });
    },
    [refreshHistory],
  );

  async function handleFile(file: File) {
    setParseError(null);
    setFileName(file.name);
    setScreen("parsing");
    try {
      const result = await parseKakaoExport(file);
      if (!result.participants || result.participants.length === 0) {
        throw new Error("참여자를 찾지 못했어요.");
      }
      setParse(result);
      setScreen("me");
    } catch (e) {
      setParseError(
        e instanceof Error
          ? `파일을 분석하지 못했어요: ${e.message}`
          : "파일을 분석하지 못했어요.",
      );
    }
  }

  function handleMe(me: string) {
    if (!parse) return;
    setMeError(null);
    try {
      const stats = computeDerivedStats(parse, me);
      const analysis: StoredAnalysis = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        title: makeTitle(parse, stats.dateRange.start, stats.dateRange.end),
        mode: parse.mode,
        me,
        parseResult: parse,
        stats,
      };
      persist(analysis);
      setScreen("dashboard");
    } catch (e) {
      setMeError(
        e instanceof Error
          ? `통계를 계산하지 못했어요: ${e.message}`
          : "통계를 계산하지 못했어요.",
      );
    }
  }

  async function handleLoad(id: string) {
    const a = await loadAnalysis(id);
    if (a) {
      setCurrent(a);
      setParse(a.parseResult);
      setScreen("dashboard");
    }
  }

  function goHome() {
    setScreen("landing");
    setParse(null);
    setCurrent(null);
    setParseError(null);
    setMeError(null);
  }

  return (
    <div className="min-h-full">
      {screen !== "landing" && (
        <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <button
              onClick={goHome}
              className="bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-lg font-black text-transparent"
            >
              What if…?
            </button>
            <div className="flex items-center gap-2">
              {current && screen === "dashboard" && (
                <span className="hidden items-center gap-2 sm:flex">
                  <span className="max-w-[200px] truncate text-sm text-muted">
                    {current.title}
                  </span>
                  <Chip tone={current.mode === "one_on_one" ? "accent" : "accent2"}>
                    {modeLabel(current.mode)}
                  </Chip>
                </span>
              )}
              <PrivacyBadge compact />
              {screen !== "history" && (
                <Button variant="ghost" size="sm" onClick={() => setScreen("history")}>
                  🗂️ 기록
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={goHome}>
                새 분석
              </Button>
            </div>
          </div>
        </header>
      )}

      {screen === "landing" && (
        <Upload
          onFile={handleFile}
          hasHistory={historyCount > 0}
          historyCount={historyCount}
          onOpenHistory={() => setScreen("history")}
        />
      )}

      {screen === "parsing" && (
        <div className="mx-auto w-full max-w-md px-5 py-24 text-center">
          {!parseError ? (
            <>
              <div className="mx-auto mb-4 flex size-12 items-center justify-center">
                <Spinner className="size-8 text-accent" />
              </div>
              <p className="text-base font-semibold text-foreground">
                대화를 읽는 중…
              </p>
              <p className="mt-1 truncate text-sm text-muted">{fileName}</p>
              <p className="mt-6 text-xs text-muted">
                파일은 서버로 전송되지 않고 이 브라우저 안에서만 처리됩니다.
              </p>
            </>
          ) : (
            <div className="space-y-4 text-left">
              <Notice tone="error" title="파싱 실패">
                {parseError}
              </Notice>
              <div className="text-center">
                <Button onClick={goHome}>← 다시 올리기</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {screen === "me" && parse && (
        <div>
          <MeSelect parse={parse} onConfirm={handleMe} onBack={goHome} />
          {meError && (
            <div className="mx-auto max-w-2xl px-5 pb-10">
              <Notice tone="error" title="통계 계산 실패">
                {meError}
              </Notice>
            </div>
          )}
        </div>
      )}

      {screen === "dashboard" && current && (
        current.mode === "one_on_one" ? (
          <Dashboard1on1 data={current} onChange={persist} />
        ) : (
          <GroupDashboard data={current} onChange={persist} />
        )
      )}

      {screen === "history" && (
        <History onLoad={handleLoad} onBack={goHome} />
      )}
    </div>
  );
}
