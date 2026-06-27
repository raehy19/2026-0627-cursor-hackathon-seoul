import { looksLikeOpenRouterKey, readRateLimitEnv } from "@/lib/llm/openrouterShared";
import {
  checkOpenRouterKeyHealth,
  jsonResponse,
} from "@/lib/llm/server/openrouter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET — server-deployed OpenRouter key health (no secret exposed). */
export async function GET(): Promise<Response> {
  const serverKey = process.env.OPENROUTER_API_KEY?.trim();
  const limits = readRateLimitEnv();

  if (!serverKey) {
    return jsonResponse({
      serverKey: "missing",
      message: "Server key not configured. You can use your own OpenRouter key in the app.",
      userKeySupported: true,
      rateLimitServerPerMin: limits.serverKeyMaxPerWindow,
      rateLimitUserPerMin: limits.userKeyMaxPerWindow,
    });
  }

  const health = await checkOpenRouterKeyHealth(serverKey);
  return jsonResponse({
    serverKey: health.status,
    message: health.message,
    userKeySupported: true,
    rateLimitServerPerMin: limits.serverKeyMaxPerWindow,
    rateLimitUserPerMin: limits.userKeyMaxPerWindow,
  });
}

/** POST — validate a user-supplied key (body.apiKey). Never stored server-side. */
export async function POST(req: Request): Promise<Response> {
  let key = req.headers.get("x-openrouter-key")?.trim();
  if (!key) {
    try {
      const body = (await req.json()) as { apiKey?: string };
      key = body?.apiKey?.trim();
    } catch {
      return jsonResponse({ ok: false, message: "invalid JSON" }, 400);
    }
  }

  if (!key) {
    return jsonResponse({ ok: false, message: "apiKey required" }, 400);
  }
  if (!looksLikeOpenRouterKey(key)) {
    return jsonResponse({ ok: false, message: "invalid key format" }, 400);
  }

  const health = await checkOpenRouterKeyHealth(key);
  return jsonResponse({
    ok: health.status === "ok",
    status: health.status,
    message: health.message,
  });
}
