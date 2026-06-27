import { checkRateLimit, clientIp } from "@/lib/llm/server/rateLimit";
import {
  callOpenRouterChat,
  jsonResponse,
  resolveApiKey,
  type ChatProxyBody,
} from "@/lib/llm/server/openrouter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  const resolved = resolveApiKey(req);
  if (!resolved.ok) {
    return jsonResponse({ error: resolved.error }, resolved.status);
  }

  const ip = clientIp(req);
  const rl = checkRateLimit(ip, resolved.source === "user" ? "user" : "server");
  if (!rl.ok) {
    return jsonResponse(
      {
        error: "rate_limited",
        retryAfterSec: rl.retryAfterSec,
        detail: "Too many requests from this IP. Try again shortly or use your own OpenRouter key.",
      },
      429,
    );
  }

  let body: ChatProxyBody;
  try {
    body = (await req.json()) as ChatProxyBody;
  } catch {
    return jsonResponse({ error: "invalid JSON body" }, 400);
  }
  if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
    return jsonResponse({ error: "`messages` array is required" }, 400);
  }

  const referer =
    req.headers.get("origin") || req.headers.get("referer") || "http://localhost:3000";

  const result = await callOpenRouterChat(resolved.apiKey, body as ChatProxyBody, referer);
  if (!result.ok) {
    return jsonResponse(
      { error: result.error, detail: result.detail, tried: result.tried, keySource: resolved.source },
      result.status,
    );
  }

  return jsonResponse({
    content: result.content,
    model: result.model,
    keySource: resolved.source,
  });
}
