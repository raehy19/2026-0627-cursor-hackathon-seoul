export type ServerKeyHealth = "ok" | "missing" | "invalid" | "error";

export type LlmServerHealth = {
  serverKey: ServerKeyHealth;
  message?: string;
  userKeySupported: boolean;
  rateLimitServerPerMin: number;
  rateLimitUserPerMin: number;
};

export type UserKeyHealth = {
  ok: boolean;
  status?: ServerKeyHealth;
  message?: string;
};

const HEALTH_PATH = "/api/llm/health";

export async function fetchServerLlmHealth(signal?: AbortSignal): Promise<LlmServerHealth> {
  const res = await fetch(HEALTH_PATH, { cache: "no-store", signal });
  if (!res.ok) {
    return {
      serverKey: "error",
      message: `health check ${res.status}`,
      userKeySupported: true,
      rateLimitServerPerMin: 24,
      rateLimitUserPerMin: 40,
    };
  }
  return (await res.json()) as LlmServerHealth;
}

export async function validateUserOpenRouterKey(
  apiKey: string,
  signal?: AbortSignal,
): Promise<UserKeyHealth> {
  const res = await fetch(HEALTH_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey: apiKey.trim() }),
    signal,
  });
  const data = (await res.json()) as UserKeyHealth & { message?: string };
  return {
    ok: !!data.ok,
    status: data.status,
    message: data.message,
  };
}

/** True when shared server key works or user saved a key locally. */
export function canRunOpenRouter(
  server: LlmServerHealth | null,
  userKey: string | null,
): boolean {
  if (userKey?.trim()) return true;
  return server?.serverKey === "ok";
}

export function serverHealthLabel(status: ServerKeyHealth): string {
  switch (status) {
    case "ok":
      return "서버 OpenRouter 연결 정상";
    case "missing":
      return "서버 키 없음 — 내 키로 분석 가능";
    case "invalid":
      return "서버 키 오류 — 내 OpenRouter 키를 사용하세요";
    default:
      return "서버 연결 확인 실패 — 내 키로 시도하세요";
  }
}
