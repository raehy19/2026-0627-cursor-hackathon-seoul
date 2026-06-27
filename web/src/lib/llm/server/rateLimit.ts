import { LLM_RATE_LIMIT, readRateLimitEnv } from "@/lib/llm/openrouterShared";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number };

/**
 * Fixed-window counter per IP + bucket name. Good enough for hackathon/demo;
 * not global across all Vercel instances.
 */
export function checkRateLimit(ip: string, bucket: "server" | "user"): RateLimitResult {
  const cfg = readRateLimitEnv();
  const max =
    bucket === "user" ? cfg.userKeyMaxPerWindow : cfg.serverKeyMaxPerWindow;
  const key = `${bucket}:${ip}`;
  const now = Date.now();

  let b = buckets.get(key);
  if (!b || now >= b.resetAt) {
    b = { count: 0, resetAt: now + LLM_RATE_LIMIT.windowMs };
    buckets.set(key, b);
  }

  if (b.count >= max) {
    const retryAfterSec = Math.max(1, Math.ceil((b.resetAt - now) / 1000));
    return { ok: false, retryAfterSec };
  }

  b.count += 1;
  return { ok: true };
}

/** Test helper — not used in prod routes. */
export function resetRateLimitsForTests(): void {
  buckets.clear();
}
