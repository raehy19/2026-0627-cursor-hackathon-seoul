import type { ChatFormat } from "@/lib/types";

/**
 * Shared low-level helpers for the KakaoTalk parsers: BOM/whitespace
 * normalization, format/locale detection, message-body classification
 * (media / url / system) and time construction. Kept dependency-free so it can
 * be unit-tested and reused by both the CSV and txt parsers.
 */

/** Strip a single leading UTF-8 BOM if present. */
export function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/**
 * Normalize a txt export for regex matching. CRITICAL: KakaoTalk txt exports put
 * a U+202F (narrow no-break space) between the time and AM/PM — without this the
 * message regexes match 0%. We also fold U+00A0 / U+2009 and CRLF.
 */
export function normalizeTxt(raw: string): string {
  return stripBom(raw)
    .replace(/\r\n?/g, "\n")
    .replace(/[\u202f\u00a0\u2009]/g, " ");
}

/** First non-empty (trimmed) line of a document, or "". */
export function firstNonEmptyLine(text: string): string {
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (t) return t;
  }
  return "";
}

/** macOS CSV export starts with the exact header `Date,User,Message`. */
export function isCsvHeader(noBomText: string): boolean {
  return firstNonEmptyLine(noBomText) === "Date,User,Message";
}

// --- txt locale detection ---------------------------------------------------

export const MONTHS_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTHS_ALT = MONTHS_EN.join("|");

/** Anchored prefix of an Android-EN line/divider (no sender/message captured). */
export const ANDROID_EN_PREFIX = new RegExp(
  `^(${MONTHS_ALT}) (\\d{1,2}), (\\d{4}) at (\\d{1,2}):(\\d{2}) (AM|PM)(.*)$`,
);
/** Anchored prefix of an Android-KO line. */
export const ANDROID_KO_PREFIX =
  /^(\d{4})년 (\d{1,2})월 (\d{1,2})일 (오전|오후) (\d{1,2}):(\d{2})(.*)$/;
/** Anchored prefix of an iOS-KO line. */
export const IOS_KO_PREFIX =
  /^(\d{4})\. (\d{1,2})\. (\d{1,2})\. (오전|오후) (\d{1,2}):(\d{2})(.*)$/;
/** PC message line `[name] [오후 2:30] message`. */
export const PC_MSG =
  /^\[(.+?)\] \[(오전|오후) (\d{1,2}):(\d{2})\] ([\s\S]*)$/;
/** PC date divider `--------------- 2024년 1월 1일 ... ---------------`. */
export const PC_DATE = /^-{5,}\s*(\d{4})년 (\d{1,2})월 (\d{1,2})일.*-{5,}$/;

/** KO weekday date divider used by Android/iOS exports. */
export const KO_DATE_DIVIDER =
  /^(\d{4})년 (\d{1,2})월 (\d{1,2})일 [가-힣]+요일$/;

export type TxtLocale = Extract<ChatFormat, "android" | "ios" | "pc">;

/**
 * Sample the first lines of a normalized txt doc and pick the locale whose
 * message pattern matches most often. Defaults to "android".
 */
export function detectTxtLocale(normalized: string): TxtLocale {
  const lines = normalized.split("\n");
  let android = 0;
  let ios = 0;
  let pc = 0;
  let seen = 0;
  for (let i = 0; i < lines.length && seen < 60; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    seen++;
    if (ANDROID_EN_PREFIX.test(line) || ANDROID_KO_PREFIX.test(line)) android++;
    else if (IOS_KO_PREFIX.test(line)) ios++;
    else if (PC_MSG.test(line) || PC_DATE.test(line)) pc++;
  }
  if (pc > android && pc > ios) return "pc";
  if (ios > android) return "ios";
  return "android";
}

// --- timestamp construction -------------------------------------------------

const MONTH_INDEX: Record<string, number> = Object.fromEntries(
  MONTHS_EN.map((m, i) => [m, i]),
);

/** Convert a 12-hour clock + AM/PM (or 오전/오후) into a 0..23 hour. */
export function to24Hour(hour12: number, isPm: boolean): number {
  const base = hour12 % 12; // 12 -> 0
  return isPm ? base + 12 : base;
}

export function isPmMarker(marker: string): boolean {
  return marker === "PM" || marker === "오후";
}

/** Build an epoch-ms timestamp from local calendar fields. */
export function buildTs(
  year: number,
  monthIndex0: number,
  day: number,
  hour24: number,
  minute: number,
): number {
  return new Date(year, monthIndex0, day, hour24, minute, 0, 0).getTime();
}

export function monthIndexFromName(name: string): number {
  return MONTH_INDEX[name] ?? 0;
}

// --- body classification (media / url / system) ----------------------------

const EN_MEDIA = new Set([
  "Photo",
  "Video",
  "Emoticon",
  "Emoticons",
  "Voice Note",
  "File",
  "Audio",
  "Contact",
  "Map",
  "Live Talk",
]);
const KO_MEDIA = new Set([
  "사진",
  "이모티콘",
  "동영상",
  "음성메시지",
  "음성 메시지",
  "파일",
  "연락처",
  "지도",
  "보이스톡",
  "페이스톡",
]);
const EN_MEDIA_N = /^\d+\s+(photos|videos|files)$/i;
const KO_MEDIA_N = /^사진 \d+장$/;

/** True when the body is a media placeholder token (both locales). */
export function classifyMedia(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (EN_MEDIA.has(t) || KO_MEDIA.has(t)) return true;
  if (EN_MEDIA_N.test(t) || KO_MEDIA_N.test(t)) return true;
  return false;
}

const URL_RE = /^(https?:\/\/|www\.)\S+$/;

/** True when the body is essentially just a single URL. */
export function classifyUrl(text: string): boolean {
  return URL_RE.test(text.trim());
}

const STANDALONE_SYSTEM = new Set([
  "The message has been deleted.",
  "This message was deleted.",
  "삭제된 메시지입니다.",
]);

/** Standalone (no-timestamp) system notice such as a deleted message. */
export function isStandaloneSystem(line: string): boolean {
  return STANDALONE_SYSTEM.has(line.trim());
}
