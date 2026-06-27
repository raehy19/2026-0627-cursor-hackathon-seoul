// Shared LLM config + constants. Imported by BOTH the server proxy
// (api/llm/route.ts) and the browser orchestration (client.ts/json.ts),
// so this file must contain only plain constants/types — no runtime deps.

/** Minimal OpenAI-compatible chat message shape used across the LLM layer. */
export type LlmRole = "system" | "user" | "assistant";
export type LlmMessage = { role: LlmRole; content: string };

/** OpenRouter OpenAI-compatible default base URL. */
export const DEFAULT_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

/** Path of the in-app server proxy the browser calls. */
export const LLM_PROXY_PATH = "/api/llm";

/** Title sent to OpenRouter via the X-Title header. */
export const APP_TITLE = "What if…?";

/**
 * Free-tier model fallback list, tried in order on model-not-available errors.
 * Free models are volatile, so we keep several. `OPENROUTER_MODEL` (server env)
 * and an optional client-supplied `model` are tried ahead of these.
 */
export const DEFAULT_FREE_MODELS: readonly string[] = [
  "deepseek/deepseek-chat-v3-0324:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemini-2.0-flash-exp:free",
  "qwen/qwen-2.5-72b-instruct:free",
];

/** Browser-side concurrency cap for MAP-style fan-out (PRD: 3). */
export const LLM_CONCURRENCY = 3;

/** Soft per-MAP-chunk token budget; chars are derived from this. */
export const MAP_TOKEN_BUDGET = 2500;
/** Rough chars-per-token for mixed KO/EN text (heuristic only). */
export const CHARS_PER_TOKEN = 2.4;
/** Char budget for a MAP chunk's message block (head+tail kept, middle elided). */
export const MAP_CHAR_BUDGET = Math.floor(MAP_TOKEN_BUDGET * CHARS_PER_TOKEN);

/** Default sampling defaults applied by the proxy when client omits them. */
export const DEFAULT_TEMPERATURE = 0.7;
export const DEFAULT_MAX_TOKENS = 1024;

/** Upstream request timeout (ms) so a hung free model can't block forever. */
export const REQUEST_TIMEOUT_MS = 60_000;

/** Backoff policy for transient upstream failures (429 / 5xx). */
export const RETRY = {
  tries: 3,
  baseMs: 800,
} as const;
