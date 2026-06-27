/** Header the browser sends when using a bring-your-own OpenRouter key. */
export const USER_OPENROUTER_KEY_HEADER = "x-openrouter-key";

/** Per-IP sliding window limits (best-effort on serverless; per instance). */
export const LLM_RATE_LIMIT = {
  windowMs: 60_000,
  /** Shared server key — protect deployer's quota. */
  serverKeyMaxPerWindow: 24,
  /** User-supplied key — lighter cap to prevent open-relay abuse. */
  userKeyMaxPerWindow: 40,
} as const;

export type RateLimitConfig = {
  windowMs: number;
  serverKeyMaxPerWindow: number;
  userKeyMaxPerWindow: number;
};

export function readRateLimitEnv(): RateLimitConfig {
  const server = Number(process.env.LLM_RATE_LIMIT_SERVER_PER_MIN);
  const user = Number(process.env.LLM_RATE_LIMIT_USER_PER_MIN);
  return {
    windowMs: LLM_RATE_LIMIT.windowMs,
    serverKeyMaxPerWindow:
      Number.isFinite(server) && server > 0 ? server : LLM_RATE_LIMIT.serverKeyMaxPerWindow,
    userKeyMaxPerWindow:
      Number.isFinite(user) && user > 0 ? user : LLM_RATE_LIMIT.userKeyMaxPerWindow,
  };
}

/** Loose OpenRouter / sk-or key shape check (never log the value). */
export function looksLikeOpenRouterKey(key: string): boolean {
  const k = key.trim();
  if (k.length < 20 || k.length > 200) return false;
  return /^sk-or-[a-zA-Z0-9_-]+$/.test(k) || /^sk-[a-zA-Z0-9_-]+$/.test(k);
}
