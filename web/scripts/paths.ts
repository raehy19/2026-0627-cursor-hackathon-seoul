import { resolve } from "node:path";

export const REPO_ROOT = resolve(process.cwd(), "..");
export const CHAT_EXPORTS_DIR = resolve(REPO_ROOT, "data/chat-exports");

export function chatExportPath(name: string): string {
  return resolve(CHAT_EXPORTS_DIR, name);
}
