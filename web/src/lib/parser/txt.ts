import type { Msg, ParseResult } from "@/lib/types";
import {
  ANDROID_EN_PREFIX,
  ANDROID_KO_PREFIX,
  buildTs,
  classifyMedia,
  classifyUrl,
  IOS_KO_PREFIX,
  isPmMarker,
  isStandaloneSystem,
  KO_DATE_DIVIDER,
  monthIndexFromName,
  PC_DATE,
  PC_MSG,
  to24Hour,
  type TxtLocale,
} from "./detect";

/**
 * Parser for KakaoTalk *.txt exports (Android / iOS / PC, KO & EN). Runs in a
 * single O(n) pass over the already-normalized lines (see normalizeTxt) so the
 * 23MB / 380k-line group export finishes in well under a second.
 *
 * Classification per line:
 *  - date divider            -> sets the "current date" context, not a message
 *  - "<ts>, name : message"  -> a real message
 *  - "<ts>, name invited ..."/deleted/left -> system (no " : " colon)
 *  - anything else non-empty -> multiline continuation of the previous message
 */

export interface TxtDiag {
  matched: number;
  system: number;
  dividers: number;
  continuations: number;
  headerLines: number;
  /** Non-empty, non-header content lines (messages + system + continuations + dividers). */
  contentLines: number;
  /** matched / (contentLines - dividers). */
  matchRate: number;
}

type LineResult =
  | { kind: "date"; ts: number }
  | { kind: "message"; ts: number; sender: string; text: string }
  | { kind: "system"; ts: number | null; text: string }
  | { kind: "none" };

type PcDate = { y: number; mo0: number; d: number };

function prefixAndroidEn(line: string): { ts: number; rest: string } | null {
  const m = ANDROID_EN_PREFIX.exec(line);
  if (!m) return null;
  const ts = buildTs(
    Number(m[3]),
    monthIndexFromName(m[1]),
    Number(m[2]),
    to24Hour(Number(m[4]), isPmMarker(m[6])),
    Number(m[5]),
  );
  return { ts, rest: m[7] };
}

function prefixAndroidKo(line: string): { ts: number; rest: string } | null {
  const m = ANDROID_KO_PREFIX.exec(line);
  if (!m) return null;
  const ts = buildTs(
    Number(m[1]),
    Number(m[2]) - 1,
    Number(m[3]),
    to24Hour(Number(m[5]), isPmMarker(m[4])),
    Number(m[6]),
  );
  return { ts, rest: m[7] };
}

function prefixIosKo(line: string): { ts: number; rest: string } | null {
  const m = IOS_KO_PREFIX.exec(line);
  if (!m) return null;
  const ts = buildTs(
    Number(m[1]),
    Number(m[2]) - 1,
    Number(m[3]),
    to24Hour(Number(m[5]), isPmMarker(m[4])),
    Number(m[6]),
  );
  return { ts, rest: m[7] };
}

/** Turn the "rest" after a timestamp prefix into a classified line result. */
function handleRest(ts: number, rest: string): LineResult {
  if (rest === "") return { kind: "date", ts };
  let body = rest;
  if (body.startsWith(", ")) body = body.slice(2);
  else if (body.startsWith(",")) body = body.slice(1).replace(/^\s+/, "");
  else return { kind: "none" };

  const idx = body.indexOf(" : ");
  if (idx === -1) return { kind: "system", ts, text: body };
  return { kind: "message", ts, sender: body.slice(0, idx), text: body.slice(idx + 3) };
}

function classifyPc(
  line: string,
  getDate: () => PcDate | null,
  setDate: (d: PcDate) => void,
): LineResult {
  const dm = PC_DATE.exec(line);
  if (dm) {
    const d: PcDate = { y: Number(dm[1]), mo0: Number(dm[2]) - 1, d: Number(dm[3]) };
    setDate(d);
    return { kind: "date", ts: buildTs(d.y, d.mo0, d.d, 0, 0) };
  }
  const mm = PC_MSG.exec(line);
  if (mm) {
    const cur = getDate() ?? { y: 1970, mo0: 0, d: 1 };
    const ts = buildTs(
      cur.y,
      cur.mo0,
      cur.d,
      to24Hour(Number(mm[3]), isPmMarker(mm[2])),
      Number(mm[4]),
    );
    return { kind: "message", ts, sender: mm[1], text: mm[5] };
  }
  if (isStandaloneSystem(line)) return { kind: "system", ts: null, text: line.trim() };
  return { kind: "none" };
}

function classifyLine(
  line: string,
  format: TxtLocale,
  getPcDate: () => PcDate | null,
  setPcDate: (d: PcDate) => void,
): LineResult {
  if (format === "pc") return classifyPc(line, getPcDate, setPcDate);

  const pre =
    format === "ios"
      ? (prefixIosKo(line) ?? prefixAndroidKo(line))
      : (prefixAndroidEn(line) ?? prefixAndroidKo(line));
  if (pre) return handleRest(pre.ts, pre.rest);

  const kd = KO_DATE_DIVIDER.exec(line);
  if (kd) {
    return { kind: "date", ts: buildTs(Number(kd[1]), Number(kd[2]) - 1, Number(kd[3]), 0, 0) };
  }
  if (isStandaloneSystem(line)) return { kind: "system", ts: null, text: line.trim() };
  return { kind: "none" };
}

function detectHeaderTitle(line: string): string | null {
  let m = /^KakaoTalk Chats with (.+)$/.exec(line);
  if (m) return m[1].trim();
  m = /^KakaoTalk Chats (.+)$/.exec(line);
  if (m) return m[1].replace(/\s*\(\d+\)\s*$/, "").trim();
  m = /^(.+?) 님과 카카오톡 대화$/.exec(line);
  if (m) return m[1].trim();
  return null;
}

const DATE_SAVED_RE = /^(Date Saved|저장한 날짜)\s*:/;

export function parseTxt(
  normalized: string,
  format: TxtLocale,
): { result: ParseResult; diag: TxtDiag } {
  const lines = normalized.split("\n");
  const messages: Msg[] = [];
  const participants: string[] = [];
  const seen = new Set<string>();
  const warnings: string[] = [];
  let title = "대화";

  let matched = 0;
  let system = 0;
  let dividers = 0;
  let continuations = 0;
  let headerLines = 0;
  let contentLines = 0;

  let curTs: number | null = null;
  let pcDate: PcDate | null = null;
  const getPcDate = (): PcDate | null => pcDate;
  const setPcDate = (d: PcDate): void => {
    pcDate = d;
  };

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    if (!line || !line.trim()) continue;

    if (messages.length === 0) {
      const headerTitle = detectHeaderTitle(line);
      if (headerTitle !== null) {
        if (headerTitle) title = headerTitle;
        headerLines++;
        continue;
      }
      if (DATE_SAVED_RE.test(line)) {
        headerLines++;
        continue;
      }
    }

    contentLines++;
    const res = classifyLine(line, format, getPcDate, setPcDate);
    switch (res.kind) {
      case "date":
        curTs = res.ts;
        dividers++;
        break;
      case "message": {
        curTs = res.ts;
        const msg: Msg = { ts: res.ts, sender: res.sender, text: res.text, isSystem: false };
        if (classifyMedia(res.text)) msg.isMedia = true;
        else if (classifyUrl(res.text)) msg.isUrl = true;
        messages.push(msg);
        if (!seen.has(res.sender)) {
          seen.add(res.sender);
          participants.push(res.sender);
        }
        matched++;
        break;
      }
      case "system": {
        const ts = res.ts ?? curTs ?? 0;
        if (res.ts !== null) curTs = res.ts;
        messages.push({ ts, sender: "", text: res.text, isSystem: true });
        system++;
        break;
      }
      case "none": {
        const prev = messages[messages.length - 1];
        if (prev) {
          prev.text += "\n" + line;
          continuations++;
        }
        break;
      }
    }
  }

  const denom = contentLines - dividers;
  const matchRate = denom > 0 ? matched / denom : 0;

  if (continuations) warnings.push(`merged ${continuations} multiline continuation line(s)`);
  if (system) warnings.push(`classified ${system} system event line(s)`);

  const result: ParseResult = {
    format,
    title: title || "대화",
    participants,
    messages,
    mode: participants.length === 2 ? "one_on_one" : "group",
    warnings: warnings.length ? warnings : undefined,
  };

  return {
    result,
    diag: { matched, system, dividers, continuations, headerLines, contentLines, matchRate },
  };
}
