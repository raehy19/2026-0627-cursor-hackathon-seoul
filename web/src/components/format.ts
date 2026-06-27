import type { ChatFormat, ChatMode } from "@/lib/types";

/**
 * Pure formatting helpers shared across the UI. All dates are rendered in a
 * stable KST-ish form so a demo looks the same regardless of the viewer's TZ.
 */

const KST = "Asia/Seoul";

type Parts = {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  dayPeriod: string;
};

function dtParts(ts: number): Parts {
  const fmt = new Intl.DateTimeFormat("ko-KR", {
    timeZone: KST,
    hour12: true,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  });
  const out: Record<string, string> = {};
  for (const p of fmt.formatToParts(new Date(ts))) {
    if (p.type !== "literal") out[p.type] = p.value;
  }
  return {
    year: out.year ?? "",
    month: out.month ?? "",
    day: out.day ?? "",
    hour: out.hour ?? "",
    minute: out.minute ?? "",
    dayPeriod: out.dayPeriod ?? "",
  };
}

/** 2024.01.03 */
export function formatDate(ts: number): string {
  const p = dtParts(ts);
  return `${p.year}.${p.month}.${p.day}`;
}

/** 오후 2:32 */
export function formatTime(ts: number): string {
  const p = dtParts(ts);
  return `${p.dayPeriod} ${p.hour}:${p.minute}`.trim();
}

/** 2024.01.03 오후 2:32 */
export function formatDateTime(ts: number): string {
  return `${formatDate(ts)} ${formatTime(ts)}`;
}

/** 2023.05 */
export function formatMonthYear(ts: number): string {
  const p = dtParts(ts);
  return `${p.year}.${p.month}`;
}

/** 2023.05 ~ 2024.01 */
export function formatRange(start: number, end: number): string {
  return `${formatMonthYear(start)} ~ ${formatMonthYear(end)}`;
}

function trimZero(n: string): string {
  return n.replace(/\.0$/, "");
}

/** Humanize a duration given in seconds: 42초 / 3분 / 2.5시간 / 1.2일 */
export function humanizeSec(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return "—";
  if (sec < 60) return `${Math.round(sec)}초`;
  const min = sec / 60;
  if (min < 60) return `${Math.round(min)}분`;
  const hr = min / 60;
  if (hr < 24) return `${hr < 10 ? trimZero(hr.toFixed(1)) : Math.round(hr)}시간`;
  const day = hr / 24;
  return `${day < 10 ? trimZero(day.toFixed(1)) : Math.round(day)}일`;
}

/** 0..1 -> "73%" */
export function pct(x: number): string {
  if (!Number.isFinite(x)) return "—";
  return `${Math.round(x * 100)}%`;
}

export function formatInt(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return Math.round(n).toLocaleString("ko-KR");
}

/** 21 -> "오후 9시" */
export function formatHour(h: number): string {
  if (!Number.isInteger(h) || h < 0 || h > 23) return `${h}시`;
  const period = h < 12 ? "오전" : "오후";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${period} ${h12}시`;
}

/** top active hours, compact: "오후 9시 · 오후 11시 · 오전 1시" */
export function formatActiveHours(hours: number[], take = 3): string {
  if (!hours || hours.length === 0) return "—";
  return hours.slice(0, take).map(formatHour).join(" · ");
}

const FORMAT_LABEL: Record<ChatFormat, string> = {
  csv: "CSV (Mac)",
  android: "안드로이드 TXT",
  ios: "iOS TXT",
  pc: "PC TXT",
};

export function formatChatFormat(f: ChatFormat): string {
  return FORMAT_LABEL[f] ?? f;
}

export function modeLabel(m: ChatMode): string {
  return m === "one_on_one" ? "1:1 회고" : "그룹 예측";
}

/** classnames helper */
export function cx(
  ...xs: Array<string | false | null | undefined>
): string {
  return xs.filter(Boolean).join(" ");
}

/** Min/max timestamp across messages (single pass, ignores nothing). */
export function tsBounds(tsList: number[]): { start: number; end: number } {
  let start = Infinity;
  let end = -Infinity;
  for (const t of tsList) {
    if (t < start) start = t;
    if (t > end) end = t;
  }
  if (!Number.isFinite(start)) return { start: 0, end: 0 };
  return { start, end };
}
