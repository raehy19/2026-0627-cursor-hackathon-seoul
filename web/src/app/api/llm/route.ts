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

// OpenRouter calls need a real Node fetch + env access.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProxyBody = {
  messages: LlmMessage[];
  temperature?: number;
  max_tokens?: number;
  model?: string;
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffDelay(attempt: number): number {
  // Exponential with jitter: base * 2^attempt + [0, base/2).
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
  | { kind: "next_model"; detail: string } // model unavailable / unusable
  | { kind: "transient"; detail: string } // 429 / 5xx -> backoff & retry
  | { kind: "fatal"; status: number; detail: string }; // auth/etc -> surface now

function classifyHttp(status: number, bodyText: string): UpstreamOutcome {
  if (status === 401) {
    return { kind: "fatal", status, detail: "invalid OPENROUTER_API_KEY (401)" };
  }
  if (status === 402 || status === 404) {
    return { kind: "next_model", detail: `model unavailable (${status})` };
  }
  if (status === 400 || status === 403) {
    // Often model/endpoint-specific on free tier — skip to the next model.
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

export async function POST(req: Request): Promise<Response> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    // Let the UI degrade gracefully (still show local stats).
    return json({ error: "OPENROUTER_API_KEY not set" }, 503);
  }

  let body: ProxyBody;
  try {
    body = (await req.json()) as ProxyBody;
  } catch {
    return json({ error: "invalid JSON body" }, 400);
  }
  if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
    return json({ error: "`messages` array is required" }, 400);
  }

  const base = (process.env.OPENROUTER_BASE_URL?.trim() || DEFAULT_OPENROUTER_BASE_URL).replace(
    /\/+$/,
    "",
  );
  const url = `${base}/chat/completions`;

  // Model priority: server override -> client request -> free fallbacks (deduped).
  const envModel = process.env.OPENROUTER_MODEL?.trim();
  const reqModel = body.model?.trim();
  const modelList = [...new Set([envModel, reqModel, ...DEFAULT_FREE_MODELS].filter(Boolean))] as string[];

  const referer =
    req.headers.get("origin") || req.headers.get("referer") || "http://localhost:3000";

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
        // Network error / timeout — treat as transient.
        lastDetail = `network error (${(err as Error)?.name ?? "Error"})`;
        if (attempt < RETRY.tries - 1) {
          await sleep(backoffDelay(attempt));
          continue;
        }
        break; // exhausted this model -> next model
      }

      if (res.ok) {
        let data: unknown;
        try {
          data = await res.json();
        } catch {
          lastDetail = "upstream returned non-JSON body";
          break; // try next model
        }
        // Some providers send 200 with an error payload.
        const errField = (data as { error?: { message?: string } | string })?.error;
        if (errField) {
          lastDetail =
            typeof errField === "string" ? errField : (errField.message ?? "upstream error payload");
          break; // next model
        }
        const content = extractContent(data);
        if (!content.trim()) {
          lastDetail = "empty completion content";
          break; // next model
        }
        return json({ content, model });
      }

      const bodyText = await res.text().catch(() => "");
      const outcome = classifyHttp(res.status, bodyText);
      if (outcome.kind === "fatal") {
        return json({ error: outcome.detail, model }, outcome.status);
      }
      if (outcome.kind === "next_model") {
        lastDetail = outcome.detail;
        break; // stop retrying this model, move to next
      }
      // transient
      lastDetail = outcome.detail;
      if (attempt < RETRY.tries - 1) {
        await sleep(backoffDelay(attempt));
        continue;
      }
      // out of retries on this model -> fall through to next model
    }
  }

  return json({ error: "all models failed", detail: lastDetail, tried: modelList }, 502);
}
