import type { Msg } from "@/lib/types";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function fmtDateTime(ts: number): string {
  const d = new Date(ts);
  return `${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function humanizeDelay(sec: number): string {
  if (sec < 60) return `${sec}초`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}분`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}시간`;
  return `${Math.round(hr / 24)}일`;
}

function renderText(m: Msg): string {
  if (m.isMedia) {
    const t = m.text?.trim();
    return t ? `«${t}»` : "«미디어»";
  }
  if (m.isUrl) return "«링크»";
  return m.text ?? "";
}

/**
 * Format messages as lines:
 *   "[MM-DD HH:MM] sender(나): text  (답장지연 Ns)"
 */
export function formatLines(msgs: Msg[], me: string): string[] {
  const lines: string[] = [];
  let prev: Msg | null = null;
  for (const m of msgs) {
    if (m.isSystem) continue;
    const who = me && m.sender === me ? `${m.sender}(나)` : m.sender;
    let line = `[${fmtDateTime(m.ts)}] ${who}: ${renderText(m)}`;
    if (prev && prev.sender !== m.sender) {
      const delaySec = Math.max(0, Math.round((m.ts - prev.ts) / 1000));
      line += `  (답장지연 ${humanizeDelay(delaySec)})`;
    }
    lines.push(line);
    prev = m;
  }
  return lines;
}

/** Keep head + tail within a char budget, eliding the middle. */
export function clampLinesToBudget(lines: string[], maxChars: number): string {
  const joined = lines.join("\n");
  if (joined.length <= maxChars) return joined;

  const head: string[] = [];
  const tail: string[] = [];
  let used = 0;
  let i = 0;
  let j = lines.length - 1;
  let takeHead = true;
  const reserve = 32;
  const budget = Math.max(0, maxChars - reserve);

  while (i <= j) {
    const line = takeHead ? lines[i] : lines[j];
    if (used + line.length + 1 > budget) break;
    used += line.length + 1;
    if (takeHead) {
      head.push(line);
      i++;
    } else {
      tail.unshift(line);
      j--;
    }
    takeHead = !takeHead;
  }
  const omitted = j - i + 1;
  const marker = omitted > 0 ? `\n... (중략 ${omitted}개 메시지) ...\n` : "\n";
  return head.join("\n") + marker + tail.join("\n");
}

/** Recent-weighted sample of one person's messages, capped at `cap`. */
export function stratifiedSample(messages: Msg[], name: string, cap: number): Msg[] {
  const mine = messages.filter((m) => m.sender === name && !m.isSystem);
  if (mine.length <= cap) return mine;
  const recentCount = Math.floor(cap * 0.6);
  const olderCount = cap - recentCount;
  const recent = mine.slice(mine.length - recentCount);
  const olderPool = mine.slice(0, mine.length - recentCount);
  const step = olderPool.length / Math.max(1, olderCount);
  const older: Msg[] = [];
  for (let k = 0; k < olderCount; k++) {
    const m = olderPool[Math.floor(k * step)];
    if (m) older.push(m);
  }
  return [...older, ...recent];
}
