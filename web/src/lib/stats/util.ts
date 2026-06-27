/**
 * Pure, dependency-free helpers for the local statistics engine: text feature
 * detectors (laugh / emoji / question), median, and local-time date formatting.
 */

/** Median of a numeric list (0 when empty). Does not mutate the input. */
export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function pad2(n: number): string {
  return n < 10 ? "0" + n : String(n);
}

/** Local-time YYYY-MM-DD for an epoch-ms timestamp. */
export function ymd(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Local-time Monday (week start) as YYYY-MM-DD for an epoch-ms timestamp. */
export function weekStartYmd(ts: number): string {
  const d = new Date(ts);
  const dow = d.getDay(); // 0 Sun .. 6 Sat
  const deltaToMonday = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() + deltaToMonday);
  return ymd(monday.getTime());
}

// Broad emoji coverage without relying on \p{Emoji} (keeps older targets happy).
const EMOJI_RE =
  /[\u{1F1E6}-\u{1F1FF}\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}\u{2764}\u{FE0F}\u{2122}\u{2049}\u{203C}]/u;

export function hasEmoji(text: string): boolean {
  return EMOJI_RE.test(text);
}

const LAUGH_RE = /lol|lmao|rofl|haha|hehe/i;

/** ㅋ/ㅎ runs or romanized laughter. */
export function hasLaugh(text: string): boolean {
  return text.includes("ㅋ") || text.includes("ㅎ") || LAUGH_RE.test(text);
}

const QUESTION_RE = /[?？]\s*$/;

export function isQuestion(text: string): boolean {
  return QUESTION_RE.test(text);
}

const EMOTICON_RE = /emoticon|이모티콘/i;

/** Media placeholder that is specifically an emoticon/sticker. */
export function isEmoticonMedia(text: string): boolean {
  return EMOTICON_RE.test(text);
}

/** Min-max normalize to [0,1]; all-equal inputs map to 0. */
export function minMaxNormalize(values: number[]): number[] {
  let min = Infinity;
  let max = -Infinity;
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const span = max - min;
  if (!Number.isFinite(span) || span <= 0) return values.map(() => 0);
  return values.map((v) => (v - min) / span);
}
