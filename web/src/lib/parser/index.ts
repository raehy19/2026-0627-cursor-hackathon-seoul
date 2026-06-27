import type { ParseResult } from "@/lib/types";
import { detectTxtLocale, isCsvHeader, normalizeTxt, stripBom } from "./detect";
import { parseCsv } from "./csv";
import { parseTxt } from "./txt";

/**
 * Parse a KakaoTalk export File into structured messages. See PRD §4.
 *
 * VALIDATED LANDMINES (confirmed against real sample files):
 *  - All three exports begin with a UTF-8 BOM (\uFEFF) -> stripped.
 *  - CSV (macOS): header `Date,User,Message`, Date `YYYY-MM-DD HH:MM:SS` (24h).
 *    Parsed with papaparse; empty-Date rows are multiline leakage and merged.
 *  - txt (Android/iOS/PC): normalized first — CRLF folded and the U+202F narrow
 *    no-break space between time and AM/PM converted to a normal space, without
 *    which the message regexes match 0%.
 *  - Standalone date dividers, deleted notices and invited/left/removed events
 *    have no " : " and are treated as system/context, never analysis messages.
 *  - participants.length === 2 -> "one_on_one", else "group".
 */
export async function parseKakaoExport(file: File): Promise<ParseResult> {
  const raw = await file.text();
  const noBom = stripBom(raw);

  if (isCsvHeader(noBom)) {
    const title = deriveTitleFromFilename(file.name);
    return parseCsv(noBom, title);
  }

  const normalized = normalizeTxt(noBom);
  const locale = detectTxtLocale(normalized);
  return parseTxt(normalized, locale).result;
}

/** Best-effort room title from a CSV filename like `KakaoTalk_Chat_<room>_<ts>.csv`. */
function deriveTitleFromFilename(name: string): string {
  const base = name.replace(/\.[^.]+$/, "");
  const m = /^KakaoTalk_Chat_(.+?)_\d{4}-\d{2}-\d{2}/.exec(base);
  if (m) return m[1];
  return "대화";
}
