"use client";

import { useCallback, useEffect, useState } from "react";
import {
  canRunOpenRouter,
  fetchServerLlmHealth,
  serverHealthLabel,
  validateUserOpenRouterKey,
  type LlmServerHealth,
} from "@/lib/llm/health";
import {
  getUserOpenRouterKey,
  maskOpenRouterKey,
  setUserOpenRouterKey,
} from "@/lib/llm/userKey";
import { Button, Notice } from "@/components/ui";
import { cx } from "@/components/format";

type Props = {
  compact?: boolean;
  className?: string;
  onKeyChange?: () => void;
};

export function OpenRouterKeySetup({ compact = false, className, onKeyChange }: Props) {
  const [serverHealth, setServerHealth] = useState<LlmServerHealth | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState<string | null>(null);
  const [testOk, setTestOk] = useState<boolean | null>(null);

  const refreshHealth = useCallback(async () => {
    setLoadingHealth(true);
    try {
      const h = await fetchServerLlmHealth();
      setServerHealth(h);
    } catch {
      setServerHealth({
        serverKey: "error",
        message: "network",
        userKeySupported: true,
        rateLimitServerPerMin: 24,
        rateLimitUserPerMin: 40,
      });
    } finally {
      setLoadingHealth(false);
    }
  }, []);

  useEffect(() => {
    setSavedKey(getUserOpenRouterKey());
    refreshHealth();
  }, [refreshHealth]);

  async function handleSave() {
    const trimmed = draft.trim();
    if (!trimmed) {
      setUserOpenRouterKey(null);
      setSavedKey(null);
      setDraft("");
      setTestMsg(null);
      setTestOk(null);
      onKeyChange?.();
      return;
    }
    setTesting(true);
    setTestMsg(null);
    try {
      const result = await validateUserOpenRouterKey(trimmed);
      if (!result.ok) {
        setTestOk(false);
        setTestMsg(result.message ?? "키 검증에 실패했습니다.");
        return;
      }
      setUserOpenRouterKey(trimmed);
      setSavedKey(trimmed);
      setDraft("");
      setTestOk(true);
      setTestMsg("키가 저장되었습니다. 이 기기에만 보관돼요.");
      onKeyChange?.();
    } finally {
      setTesting(false);
    }
  }

  function handleClear() {
    setUserOpenRouterKey(null);
    setSavedKey(null);
    setDraft("");
    setTestMsg(null);
    setTestOk(null);
    onKeyChange?.();
  }

  const serverOk = serverHealth?.serverKey === "ok";
  const ready = canRunOpenRouter(serverHealth, savedKey);

  if (compact && serverOk && savedKey) {
    return (
      <p className={cx("text-xs text-ok", className)}>
        OpenRouter · 서버 연결 OK · 내 키 {maskOpenRouterKey(savedKey)}
      </p>
    );
  }

  if (compact && serverOk && !savedKey) {
    return (
      <p className={cx("text-xs text-muted", className)}>OpenRouter · 서버 무료 분석 사용 가능</p>
    );
  }

  return (
    <div
      className={cx(
        compact
          ? "rounded-xl border border-border bg-surface-2/40 px-3 py-2.5 text-xs"
          : "rounded-xl border border-border bg-surface-2/50 p-4 text-sm",
        className,
      )}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-foreground">OpenRouter 연결</p>
        <Button variant="ghost" size="sm" onClick={refreshHealth} disabled={loadingHealth}>
          {loadingHealth ? "확인 중…" : "상태 새로고침"}
        </Button>
      </div>

      {!loadingHealth && serverHealth && (
        <Notice
          tone={serverOk ? "ok" : "warn"}
          title={serverHealthLabel(serverHealth.serverKey)}
          className="mb-3"
        >
          {serverHealth.message && <span className="text-xs">{serverHealth.message}</span>}
          {!serverOk && (
            <span className="mt-1 block text-xs">
              아래에{" "}
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline"
              >
                openrouter.ai/keys
              </a>
              에서 발급한 무료 키를 넣으면 바로 분석할 수 있어요. 키는 이 브라우저에만 저장됩니다.
            </span>
          )}
        </Notice>
      )}

      {savedKey && (
        <p className="mb-2 text-xs text-muted">
          저장된 내 키: <span className="font-mono text-foreground">{maskOpenRouterKey(savedKey)}</span>
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="password"
          autoComplete="off"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setTestMsg(null);
            setTestOk(null);
          }}
          placeholder="sk-or-… (OpenRouter API key)"
          className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted"
        />
        <div className="flex shrink-0 gap-2">
          <Button size="sm" onClick={handleSave} disabled={testing || !draft.trim()}>
            {testing ? "검증 중…" : "저장 · 검증"}
          </Button>
          {(savedKey || draft) && (
            <Button variant="ghost" size="sm" onClick={handleClear}>
              지우기
            </Button>
          )}
        </div>
      </div>

      {testMsg && (
        <p className={`mt-2 text-xs ${testOk ? "text-ok" : "text-danger"}`}>{testMsg}</p>
      )}

      {!ready && !loadingHealth && (
        <p className="mt-2 text-xs text-warn">
          OpenRouter 분석을 하려면 서버 키가 정상이거나, 위에 내 키를 저장해야 합니다.
        </p>
      )}
    </div>
  );
}
