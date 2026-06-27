"use client";

import { cx, formatTime } from "@/components/format";
import type {
  CounterfactualTurn,
  GroupSimTurn,
  Msg,
} from "@/lib/types";

/** Normalized row the renderer understands, regardless of source shape. */
export type ThreadRow = {
  key: string;
  sender: string;
  text: string;
  isMe: boolean;
  isSystem?: boolean;
  isMedia?: boolean;
  time?: string;
  delayHint?: string;
  note?: string;
  danger?: boolean;
  showName?: boolean;
};

/* --------------------------------------------------------- quote matching */

function norm(s: string): string {
  return s.replace(/\s+/g, "").toLowerCase();
}

/** Does a message text correspond to one of the (LLM) risky quotes? */
export function matchesQuote(text: string, quotes: string[]): boolean {
  if (!quotes || quotes.length === 0) return false;
  const nt = norm(text);
  if (nt.length < 2) return false;
  for (const q of quotes) {
    const nq = norm(q);
    if (nq.length < 3) continue;
    if (nt.includes(nq) || nq.includes(nt)) return true;
  }
  return false;
}

/* ----------------------------------------------------------- row builders */

export function msgsToRows(
  msgs: Msg[],
  me: string,
  opts?: { dangerQuotes?: string[]; showNames?: boolean; keyPrefix?: string },
): ThreadRow[] {
  const dangerQuotes = opts?.dangerQuotes ?? [];
  const showNames = opts?.showNames ?? false;
  const prefix = opts?.keyPrefix ?? "m";
  const rows: ThreadRow[] = [];
  let prevSender: string | null = null;

  msgs.forEach((m, i) => {
    if (m.isSystem) {
      rows.push({
        key: `${prefix}-${i}`,
        sender: m.sender,
        text: m.text,
        isMe: false,
        isSystem: true,
      });
      prevSender = null;
      return;
    }
    const isMe = m.sender === me;
    rows.push({
      key: `${prefix}-${i}`,
      sender: m.sender,
      text: m.text,
      isMe,
      isMedia: m.isMedia,
      time: formatTime(m.ts),
      danger: dangerQuotes.length > 0 && matchesQuote(m.text, dangerQuotes),
      showName: showNames && !isMe && m.sender !== prevSender,
    });
    prevSender = m.sender;
  });

  return rows;
}

export function cfTurnsToRows(
  turns: CounterfactualTurn[],
  me: string,
): ThreadRow[] {
  let prev: string | null = null;
  return turns.map((t, i) => {
    const isMe = t.sender === me;
    const row: ThreadRow = {
      key: `cf-${i}`,
      sender: t.sender,
      text: t.text,
      isMe,
      delayHint: t.delay_hint,
      showName: !isMe && t.sender !== prev,
    };
    prev = t.sender;
    return row;
  });
}

export function simTurnsToRows(
  turns: GroupSimTurn[],
  me: string,
): ThreadRow[] {
  return turns.map((t, i) => {
    const isMe = t.speaker === me;
    return {
      key: `sim-${i}`,
      sender: t.speaker,
      text: t.text,
      isMe,
      delayHint: t.delay_hint,
      note: t.in_character_note,
      showName: !isMe,
    };
  });
}

/* -------------------------------------------------------------- component */

function MediaChip({ text }: { text: string }) {
  const label = text?.trim() || "사진";
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-black/5 px-2 py-0.5 text-[13px] text-[#3d4d5c]">
      🖼️ «{label}»
    </span>
  );
}

export function KakaoThread({
  rows,
  className,
  maxRows = 400,
  emptyText = "표시할 메시지가 없어요.",
}: {
  rows: ThreadRow[];
  className?: string;
  maxRows?: number;
  emptyText?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className={cx("kakao-bg rounded-2xl", className)}>
        <div className="kchat">
          <div className="ksys">{emptyText}</div>
        </div>
      </div>
    );
  }

  const truncated = rows.length > maxRows;
  const shown = truncated ? rows.slice(rows.length - maxRows) : rows;
  const hiddenCount = rows.length - shown.length;

  return (
    <div className={cx("kakao-bg rounded-2xl", className)}>
      <div className="kchat">
        {truncated && (
          <div className="ksys">앞부분 {hiddenCount}개 메시지 생략 (최근 부분만 표시)</div>
        )}
        {shown.map((r) => {
          if (r.isSystem) {
            return (
              <div key={r.key} className="ksys">
                {r.text}
              </div>
            );
          }
          return (
            <div
              key={r.key}
              className={cx("krow", r.isMe ? "krow--me" : "krow--them")}
            >
              {r.showName && <span className="kname">{r.sender}</span>}
              <div
                className={cx(
                  "flex items-end gap-1",
                  r.isMe && "flex-row-reverse",
                )}
              >
                <div
                  className={cx(
                    "kbubble",
                    r.isMe ? "kbubble--me" : "kbubble--them",
                    r.danger && "kbubble--danger",
                  )}
                >
                  {r.isMedia ? <MediaChip text={r.text} /> : r.text}
                </div>
                {r.time && <span className="ktime">{r.time}</span>}
              </div>
              {r.delayHint && (
                <span
                  className={cx(
                    "mt-0.5 inline-flex w-fit rounded-full bg-black/15 px-2 py-0.5 text-[10px] font-medium text-[#22303c]",
                  )}
                >
                  ⏱ {r.delayHint}
                </span>
              )}
              {r.note && (
                <span className="mt-0.5 max-w-[85%] text-[11px] italic text-[#34465a]">
                  {r.note}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
