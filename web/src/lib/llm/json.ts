import { LLM_PROXY_PATH, type LlmMessage } from "@/lib/llm/config";
import { openRouterKeyHeaders } from "@/lib/llm/userKey";

/**
 * Thrown when the proxy responds 503 (no OPENROUTER_API_KEY and no user key).
 */
export class LlmUnavailableError extends Error {
  constructor(
    message = "LLM 사용 불가: 서버 OpenRouter 키가 없습니다. 아래에서 내 OpenRouter 키를 입력하거나 코딩 에이전트 경로를 사용하세요.",
  ) {
    super(message);
    this.name = "LlmUnavailableError";
  }
}

/** Per-IP rate limit on shared server key. */
export class LlmRateLimitError extends Error {
  retryAfterSec?: number;
  constructor(message: string, retryAfterSec?: number) {
    super(message);
    this.name = "LlmRateLimitError";
    this.retryAfterSec = retryAfterSec;
  }
}

/** Any other proxy/upstream failure surfaced to the browser. */
export class LlmError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "LlmError";
    this.status = status;
  }
}

export type LlmCallOpts = {
  temperature?: number;
  max_tokens?: number;
  model?: string;
  signal?: AbortSignal;
};

// --- JSON extraction ---------------------------------------------------------

/** Pull a fenced ```json block out, else strip stray fence markers. */
function stripFences(input: string): string {
  const fenced = input.match(/```(?:json|jsonc|js)?\s*([\s\S]*?)```/i);
  if (fenced && fenced[1].trim()) return fenced[1].trim();
  return input.replace(/```(?:json|jsonc|js)?/gi, "").trim();
}

/** Slice from the first opening bracket to the last matching closing bracket. */
function sliceToBrackets(input: string): string {
  const firstObj = input.indexOf("{");
  const firstArr = input.indexOf("[");
  if (firstObj === -1 && firstArr === -1) return input;

  let start: number;
  let closeCh: string;
  if (firstArr === -1 || (firstObj !== -1 && firstObj < firstArr)) {
    start = firstObj;
    closeCh = "}";
  } else {
    start = firstArr;
    closeCh = "]";
  }
  const end = input.lastIndexOf(closeCh);
  if (start !== -1 && end !== -1 && end > start) return input.slice(start, end + 1);
  return input;
}

/** Best-effort cleanup: smart quotes -> straight, drop trailing commas. */
function cleanupJson(input: string): string {
  let out = input;
  out = out.replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"'); // “ ” „ etc.
  out = out.replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'"); // ‘ ’ ‚ etc.
  out = out.replace(/,\s*([}\]])/g, "$1"); // trailing commas
  return out;
}

/**
 * Parse JSON out of a possibly-messy LLM response. Free models frequently wrap
 * JSON in prose/backticks and emit trailing commas or smart quotes.
 */
export function extractJson<T>(raw: string): T {
  if (raw == null) throw new Error("extractJson: 빈 응답");
  const stripped = stripFences(String(raw).trim());
  const sliced = sliceToBrackets(stripped).trim();
  if (!sliced) throw new Error("extractJson: JSON 후보를 찾지 못함");

  try {
    return JSON.parse(sliced) as T;
  } catch {
    try {
      return JSON.parse(cleanupJson(sliced)) as T;
    } catch (err) {
      const head = sliced.slice(0, 160).replace(/\s+/g, " ");
      throw new Error(`extractJson: JSON 파싱 실패 (${(err as Error).message}). 시작부분: ${head}`);
    }
  }
}

// --- Proxy calls -------------------------------------------------------------

/** POST messages to the proxy; returns the chosen model's text content. */
export async function callLLMRaw(
  messages: LlmMessage[],
  opts: LlmCallOpts = {},
): Promise<{ content: string; model: string }> {
  let res: Response;
  try {
    res = await fetch(LLM_PROXY_PATH, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...openRouterKeyHeaders(),
      },
      body: JSON.stringify({
        messages,
        temperature: opts.temperature,
        max_tokens: opts.max_tokens,
        model: opts.model,
      }),
      signal: opts.signal,
    });
  } catch (err) {
    throw new LlmError(`프록시 요청 실패: ${(err as Error)?.message ?? "network error"}`);
  }

  if (res.status === 503) throw new LlmUnavailableError();

  if (res.status === 429) {
    let retryAfterSec: number | undefined;
    try {
      const body = (await res.json()) as { retryAfterSec?: number; detail?: string };
      retryAfterSec = body.retryAfterSec;
      throw new LlmRateLimitError(
        body.detail ?? "요청이 너무 많습니다. 잠시 후 다시 시도하거나 내 OpenRouter 키를 사용하세요.",
        retryAfterSec,
      );
    } catch (e) {
      if (e instanceof LlmRateLimitError) throw e;
      throw new LlmRateLimitError("요청 한도에 걸렸습니다. 잠시 후 다시 시도하세요.");
    }
  }

  if (!res.ok) {
    let detail = "";
    try {
      const body = (await res.json()) as { error?: string; detail?: string };
      detail = body?.error ?? body?.detail ?? "";
      if (res.status === 401) {
        throw new LlmError("OpenRouter API 키가 거부되었습니다. 키를 확인해 주세요.", 401);
      }
    } catch (e) {
      if (e instanceof LlmError) throw e;
      /* ignore parse error */
    }
    throw new LlmError(`LLM 프록시 오류 ${res.status}${detail ? `: ${detail}` : ""}`, res.status);
  }

  const data = (await res.json()) as { content?: string; model?: string };
  return { content: data.content ?? "", model: data.model ?? "" };
}

/**
 * Call the proxy and parse a typed JSON result. On parse failure, retries ONCE
 * with a stricter "JSON only" reminder appended (and temperature forced low).
 */
export async function callLLMJson<T>(messages: LlmMessage[], opts: LlmCallOpts = {}): Promise<T> {
  const first = await callLLMRaw(messages, opts);
  try {
    return extractJson<T>(first.content);
  } catch {
    const retryMessages: LlmMessage[] = [
      ...messages,
      {
        role: "system",
        content: "Return ONLY valid minified JSON. No markdown, no backticks, no prose.",
      },
    ];
    const second = await callLLMRaw(retryMessages, { ...opts, temperature: 0 });
    return extractJson<T>(second.content);
  }
}
