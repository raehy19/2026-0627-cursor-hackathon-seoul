"use client";

import { useMemo, useRef, useState } from "react";
import {
  extractPersonas,
  LlmUnavailableError,
  runOneOnOneAnalysis,
} from "@/lib/llm/client";
import { USE_MOCK_LLM } from "@/lib/llm/config";
import { buildAgentBundle, downloadAgentBundle } from "@/lib/agent/bundle";
import { applyAgentOutput } from "@/lib/agent/importResult";
import { buildAgentCommands, copyText } from "@/lib/agent/prompt";
import { parseAgentOutputJson, validateAgentOutput } from "@/lib/agent/validate";
import type { StoredAnalysis } from "@/lib/types";
import { Button, Modal, Notice, Spinner } from "@/components/ui";
import { ProgressBar } from "@/components/ProgressBar";
import { SegmentRevealList } from "@/components/SegmentRevealList";

type RunState = "idle" | "running" | "done" | "error";
type AgentTab = "cursor" | "claude" | "codex" | "generic";
type LastRun = "openrouter" | "agent" | null;

export type AnalysisRunPanelProps = {
  data: StoredAnalysis;
  onChange: (next: StoredAnalysis) => void;
  kind: "one_on_one" | "group";
  /** Hide panel when analysis already present (overview or personas). */
  ready: boolean;
  onRunComplete?: () => void;
};

export function AnalysisRunPanel({
  data,
  onChange,
  kind,
  ready,
  onRunComplete,
}: AnalysisRunPanelProps) {
  const [runState, setRunState] = useState<RunState>(ready ? "done" : "idle");
  const [progress, setProgress] = useState({ done: 0, total: 0, label: "" });
  const [lastRun, setLastRun] = useState<LastRun>(null);
  const [agentOpen, setAgentOpen] = useState(false);
  const [agentTab, setAgentTab] = useState<AgentTab>("cursor");
  const [importText, setImportText] = useState("");
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [openRouterError, setOpenRouterError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  const commands = useMemo(() => buildAgentCommands(data), [data]);
  const bundle = useMemo(() => buildAgentBundle(data), [data]);

  if (ready && runState === "done") return null;

  async function runOpenRouter() {
    const ac = new AbortController();
    abortRef.current = ac;
    setLastRun("openrouter");
    setRunState("running");
    setOpenRouterError(null);
    setProgress({ done: 0, total: 0, label: "분석 준비 중…" });

    const base = dataRef.current;
    if (kind === "one_on_one") {
      onChange({ ...base, segments: [], overview: undefined });
    } else {
      onChange({ ...base, personas: undefined });
    }

    try {
      if (kind === "one_on_one") {
        const { segments, overview } = await runOneOnOneAnalysis(
          base.parseResult,
          base.stats,
          base.me,
          {
            source: "openrouter",
            signal: ac.signal,
            onProgress: (done, total, label) =>
              setProgress({ done, total, label: label ?? "" }),
            onSegment: (seg) => {
              const cur = dataRef.current;
              const next = { ...cur, segments: [...(cur.segments ?? []), seg] };
              dataRef.current = next;
              onChange(next);
            },
          },
        );
        const final = { ...dataRef.current, segments, overview };
        dataRef.current = final;
        onChange(final);
      } else {
        const personas = await extractPersonas(base.parseResult, base.stats, {
          source: "openrouter",
          signal: ac.signal,
          onProgress: (done, total, label) =>
            setProgress({ done, total, label: label ?? "" }),
        });
        onChange({ ...base, personas });
      }
      setRunState("done");
      onRunComplete?.();
    } catch (e) {
      setRunState("error");
      if (e instanceof LlmUnavailableError) {
        setOpenRouterError(
          "OpenRouter API 키가 없거나 프록시를 사용할 수 없습니다. 서버에 OPENROUTER_API_KEY를 설정하거나, 코딩 에이전트 경로를 사용하세요.",
        );
      } else {
        setOpenRouterError("OpenRouter 분석에 실패했습니다. 네트워크·한도를 확인하세요.");
      }
    }
  }

  function handleImportApply() {
    setImportErrors([]);
    try {
      const raw = parseAgentOutputJson(importText);
      const result = validateAgentOutput(raw, bundle);
      if (!result.ok) {
        setImportErrors(result.errors);
        return;
      }
      const merged = applyAgentOutput(dataRef.current, result.data);
      dataRef.current = merged;
      onChange(merged);
      setLastRun("agent");
      setRunState("done");
      setAgentOpen(false);
      onRunComplete?.();
    } catch {
      setImportErrors(["JSON 파싱에 실패했습니다. 마크다운 펜스 없이 순수 JSON인지 확인하세요."]);
    }
  }

  async function handleCopyCommand() {
    const text = commands[agentTab];
    const ok = await copyText(text);
    setCopied(ok);
    if (ok) setTimeout(() => setCopied(false), 2000);
  }

  function handleImportFile(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImportText(String(reader.result ?? ""));
      setImportErrors([]);
    };
    reader.readAsText(file);
  }

  const title =
    kind === "one_on_one" ? "관계 분석 돌리기" : "페르소나 분석";
  const subtitle =
    kind === "one_on_one"
      ? "어긋난 구간·위험한 한마디·관계 흐름을 분석합니다."
      : "멤버별 말투·드립·반응 스타일을 정리합니다.";

  const openRouterLabel =
    kind === "one_on_one" ? "OpenRouter로 분석받기" : "OpenRouter로 페르소나 추출";

  return (
    <>
      <div className="card p-5">
        {runState === "idle" && (
          <div className="space-y-4">
            <div>
              <p className="text-base font-semibold text-foreground">{title}</p>
              <p className="text-sm text-muted">{subtitle}</p>
              {USE_MOCK_LLM && (
                <p className="mt-1 text-xs text-muted">
                  오프라인 모드가 켜져 있어도 OpenRouter 버튼은 서버 API를 사용합니다.
                  API 키가 없으면 코딩 에이전트 경로를 이용하세요.
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button onClick={runOpenRouter}>{openRouterLabel}</Button>
              <Button variant="ghost" onClick={() => setAgentOpen(true)}>
                코딩 에이전트로 분석받기
              </Button>
            </div>
          </div>
        )}

        {runState === "running" && (
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-foreground">
              <Spinner />
              {kind === "one_on_one" ? "구간을 하나씩 읽는 중…" : "멤버 말투를 학습하는 중…"}
            </div>
            <ProgressBar
              done={progress.done}
              total={progress.total}
              label={
                progress.label
                  ? `${progress.done}/${progress.total} — ${progress.label}`
                  : "분석 중…"
              }
            />
          </div>
        )}

        {runState === "error" && (
          <div className="space-y-3">
            <Notice tone="warn" title="분석 실패">
              {lastRun === "openrouter"
                ? openRouterError ??
                  "OpenRouter 분석에 실패했습니다. API 키·네트워크를 확인하거나 코딩 에이전트 경로를 사용하세요."
                : "결과를 가져오지 못했습니다. JSON 형식을 확인하세요."}
            </Notice>
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" onClick={() => setRunState("idle")}>
                다시 선택
              </Button>
              <Button variant="ghost" onClick={() => setAgentOpen(true)}>
                코딩 에이전트로 분석받기
              </Button>
            </div>
          </div>
        )}
      </div>

      {runState === "running" &&
        kind === "one_on_one" &&
        (data.segments?.length ?? 0) > 0 && (
          <SegmentRevealList segments={data.segments ?? []} />
        )}

      <Modal
        open={agentOpen}
        onClose={() => setAgentOpen(false)}
        title="코딩 에이전트로 분석받기"
      >
        <div className="space-y-5 text-sm">
          <Notice tone="info" title="외부 API 없이 분석">
            Cursor, Claude Code, Codex 등 구독 에이전트가 OpenRouter 역할을 대신합니다.
            번들 JSON + 가이드 문서를 읽고, 앱 시각화 스키마에 맞는 JSON을 만들어 가져오세요.
          </Notice>

          <section>
            <p className="mb-2 font-semibold text-foreground">1. 입력 번들 다운로드</p>
            <p className="mb-2 text-muted">
              파싱된 대화·통계·분석 대상 구간이 담긴 JSON입니다.
            </p>
            <Button variant="ghost" size="sm" onClick={() => downloadAgentBundle(data)}>
              번들 JSON 다운로드
            </Button>
          </section>

          <section>
            <p className="mb-2 font-semibold text-foreground">2. 에이전트에 붙여넣을 명령</p>
            <div className="mb-2 flex flex-wrap gap-1">
              {(
                [
                  ["cursor", "Cursor"],
                  ["claude", "Claude Code"],
                  ["codex", "Codex"],
                  ["generic", "범용"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setAgentTab(id)}
                  className={`rounded-lg px-2.5 py-1 text-xs ${
                    agentTab === id
                      ? "bg-accent text-white"
                      : "bg-surface-2 text-muted hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <pre className="max-h-40 overflow-auto rounded-xl border border-border bg-surface-2/80 p-3 text-xs text-foreground whitespace-pre-wrap">
              {commands[agentTab]}
            </pre>
            <div className="mt-2 flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={handleCopyCommand}>
                {copied ? "복사됨 ✓" : "명령 복사"}
              </Button>
              <span className="text-xs text-muted">
                가이드:{" "}
                <code className="rounded bg-surface-2 px-1">web/public/agent/ANALYSIS.md</code>
              </span>
            </div>
          </section>

          <section>
            <p className="mb-2 font-semibold text-foreground">3. 결과 가져오기</p>
            <input
              type="file"
              accept="application/json,.json"
              className="mb-2 block w-full text-xs text-muted file:mr-2 file:rounded-lg file:border-0 file:bg-surface-2 file:px-3 file:py-1.5 file:text-xs file:text-foreground"
              onChange={(e) => handleImportFile(e.target.files?.[0] ?? null)}
            />
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder='{"version":1,"segments":[...],"overview":{...}}'
              rows={6}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted"
            />
            {importErrors.length > 0 && (
              <ul className="mt-2 list-disc space-y-0.5 pl-4 text-xs text-danger">
                {importErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}
            <div className="mt-3 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setAgentOpen(false)}>
                취소
              </Button>
              <Button size="sm" onClick={handleImportApply} disabled={!importText.trim()}>
                결과 적용
              </Button>
            </div>
          </section>
        </div>
      </Modal>
    </>
  );
}
