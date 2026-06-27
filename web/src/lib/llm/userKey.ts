import { USER_OPENROUTER_KEY_HEADER } from "@/lib/llm/openrouterShared";

const STORAGE_KEY = "what-if-openrouter-user-key";

export function getUserOpenRouterKey(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(STORAGE_KEY)?.trim();
    return v || null;
  } catch {
    return null;
  }
}

export function setUserOpenRouterKey(key: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!key?.trim()) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, key.trim());
  } catch {
    /* private mode */
  }
}

export function maskOpenRouterKey(key: string): string {
  const k = key.trim();
  if (k.length <= 12) return "••••";
  return `${k.slice(0, 8)}…${k.slice(-4)}`;
}

export function openRouterKeyHeaders(): Record<string, string> {
  const key = getUserOpenRouterKey();
  if (!key) return {};
  return { [USER_OPENROUTER_KEY_HEADER]: key };
}

export { USER_OPENROUTER_KEY_HEADER };
