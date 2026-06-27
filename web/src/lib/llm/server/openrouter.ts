import {
  APP_TITLE,
  DEFAULT_FREE_MODELS,
  DEFAULT_MAX_TOKENS,
  DEFAULT_OPENROUTER_BASE_URL,
  DEFAULT_TEMPERATURE,
  REQUEST_TIMEOUT_MS,
  RETRY,
  type LlmMessage,
} from "@/lib/llm/config";
import {
  looksLikeOpenRouterKey,
  USER_OPENROUTER_KEY_HEADER,
} from "@/lib/llm/openrouterShared";

export type KeySource = "server" | "user";

export type ResolvedKey =
  | { ok: true; apiKey: string; source: KeySource }
  | { ok: false; status: number; error: string };

export function resolveApiKey(req: Request): ResolvedKey {
  const userHeader = req.headers.get(USER_OPENROUTER_KEY_HEADER)?.trim();
  if (userHeader) {
    if (!looksLikeOpenRouterKey(userHeader)) {
      return { ok: false, status: 400, error: "invalid user OpenRouter key format" };
    }
    return { ok: true, apiKey: userHeader, source: "user" };
  }

  const serverKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!serverKey) {
    return {
      ok: false,
      status: 503,
      error: "OPENROUTER_API_KEY not set — add your key in the app or set server env",
    };
  }
  return { ok: true, apiKey: serverKey, source: "server" };
}

export type KeyHealthStatus = "ok" | "missing" | "invalid" | "error";

export type KeyHealthResult = {
  status: KeyHealthStatus;
  message?: string;
};

export async function checkOpenRouterKeyHealth(apiKey: string): Promise<KeyHealthResult> {
  const base = (process.env.OPENROUTER_BASE_URL?.trim() || DEFAULT_OPENROUTER_BASE_URL).replace(
    /\/+$/,
    "",
  );
  const url = `${base}/models`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://what-if.local",
        "X-Title": APP_TITLE,
      },
      signal: AbortSignal.timeout(12_000),
    });

    if (res.status === 401 || res.status === 403) {
      return { status: "invalid", message: "API key rejected (401/403)" };
    }
    if (!res.ok) {
      return { status: "error", message: `upstream ${res.status}` };
    }
    return { status: "ok" };
  } catch (err) {
    return {
      status: "error",
      message: (err as Error)?.name === "TimeoutError" ? "timeout" : "network error",
    };
  }
}

export type ChatProxyBody = {
  messages: LlmMessage[];
  temperature?: number;
  max_tokens?: number;
  model?: string;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffDelay(attempt: number): number {
  const base = RETRY.baseMs;
  return base * 2 ** attempt + Math.floor(Math.random() * (base / 2));
}

function extractContent(data: unknown): string {
  const choice = (data as { choices?: Array<{ message?: { content?: unknown } }> })
    ?.choices?.[0];
  const content = choice?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) =>
        typeof part === "string" ? part : ((part as { text?: string })?.text ?? ""),
      )
      .join("");
  }
  return "";
}

type UpstreamOutcome =
  | { kind: "next_model"; detail: string }
  | { kind: "transient"; detail: string }
  | { kind: "fatal"; status: number; detail: string };

function classifyHttp(status: number, bodyText: string): UpstreamOutcome {
  if (status === 401) {
    return { kind: "fatal", status, detail: "invalid OpenRouter API key (401)" };
  }
  if (status === 402 || status === 404) {
    return { kind: "next_model", detail: `model unavailable (${status})` };
  }
  if (status === 400 || status === 403) {
    if (/model|endpoint|not\s*found|unavailable|unsupported|moderat/i.test(bodyText)) {
      return { kind: "next_model", detail: `model rejected (${status})` };
    }
    return { kind: "fatal", status, detail: `bad request (${status})` };
  }
  if (status === 429 || status >= 500) {
    return { kind: "transient", detail: `upstream ${status}` };
  }
  return { kind: "fatal", status, detail: `upstream ${status}` };
}

export type ChatCompletionResult =
  | { ok: true; content: string; model: string }
  | { ok: false; status: number; error: string; detail?: string; tried?: string[] };

export async function callOpenRouterChat(
  apiKey: string,
  body: ChatProxyBody,
  referer: string,
): Promise<ChatCompletionResult> {
  const base = (process.env.OPENROUTER_BASE_URL?.trim() || DEFAULT_OPENROUTER_BASE_URL).replace(
    /\/+$/,
    "",
  );
  const url = `${base}/chat/completions`;

  const envModel = process.env.OPENROUTER_MODEL?.trim();
  const reqModel = body.model?.trim();
  const modelList = [...new Set([envModel, reqModel, ...DEFAULT_FREE_MODELS].filter(Boolean))] as string[];

  const payloadBase = {
    messages: body.messages,
    temperature: typeof body.temperature === "number" ? body.temperature : DEFAULT_TEMPERATURE,
    max_tokens: typeof body.max_tokens === "number" ? body.max_tokens : DEFAULT_MAX_TOKENS,
  };

  let lastDetail = "no models attempted";

  for (const model of modelList) {
    for (let attempt = 0; attempt < RETRY.tries; attempt++) {
      let res: Response;
      try {
        res = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": referer,
            "X-Title": APP_TITLE,
          },
          body: JSON.stringify({ model, ...payloadBase }),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
      } catch (err) {
        lastDetail = `network error (${(err as Error)?.name ?? "Error"})`;
        if (attempt < RETRY.tries - 1) {
          await sleep(backoffDelay(attempt));
          continue;
        }
        break;
      }

      if (res.ok) {
        let data: unknown;
        try {
          data = await res.json();
        } catch {
          lastDetail = "upstream returned non-JSON body";
          break;
        }
        const errField = (data as { error?: { message?: string } | string })?.error;
        if (errField) {
          lastDetail =
            typeof errField === "string" ? errField : (errField.message ?? "upstream error payload");
          break;
        }
        const content = extractContent(data);
        if (!content.trim()) {
          lastDetail = "empty completion content";
          break;
        }
        return { ok: true, content, model };
      }

      const bodyText = await res.text().catch(() => "");
      const outcome = classifyHttp(res.status, bodyText);
      if (outcome.kind === "fatal") {
        return { ok: false, status: outcome.status, error: outcome.detail };
      }
      if (outcome.kind === "next_model") {
        lastDetail = outcome.detail;
        break;
      }
      lastDetail = outcome.detail;
      if (attempt < RETRY.tries - 1) {
        await sleep(backoffDelay(attempt));
        continue;
      }
    }
  }

  return {
    ok: false,
    status: 502,
    error: "all models failed",
    detail: lastDetail,
    tried: modelList,
  };
}

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}
