"use client";

import { useMemo, useState } from "react";
import type { ParseResult } from "@/lib/types";
import {
  formatChatFormat,
  formatInt,
  formatRange,
  modeLabel,
  tsBounds,
} from "@/components/format";
import { Button, Chip, Notice, Stat } from "@/components/ui";

export function MeSelect({
  parse,
  onConfirm,
  onBack,
}: {
  parse: ParseResult;
  onConfirm: (me: string) => void;
  onBack: () => void;
}) {
  const [me, setMe] = useState<string>(parse.participants[0] ?? "");

  const summary = useMemo(() => {
    let realCount = 0;
    const tsList: number[] = [];
    for (const m of parse.messages) {
      if (!m.isSystem) realCount += 1;
      tsList.push(m.ts);
    }
    return { realCount, ...tsBounds(tsList) };
  }, [parse]);

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-10">
      <button
        onClick={onBack}
        className="mb-4 text-sm text-muted transition-colors hover:text-foreground"
      >
        ← 다른 파일 올리기
      </button>

      <div className="card p-6">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="mr-1 text-xl font-bold text-foreground">{parse.title}</h1>
          <Chip tone={parse.mode === "one_on_one" ? "accent" : "accent2"}>
            {modeLabel(parse.mode)}
          </Chip>
          <Chip>{formatChatFormat(parse.format)}</Chip>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="참여자" value={`${parse.participants.length}명`} />
          <Stat label="메시지" value={formatInt(summary.realCount)} sub="시스템 메시지 제외" />
          <Stat
            label="기간"
            value={summary.end ? formatRange(summary.start, summary.end) : "—"}
          />
        </div>

        <div className="mt-5">
          <p className="mb-2 text-sm font-medium text-foreground">참여자</p>
          <div className="flex flex-wrap gap-1.5">
            {parse.participants.map((p) => (
              <Chip key={p} tone={p === me ? "accent" : "default"}>
                {p}
              </Chip>
            ))}
          </div>
        </div>

        {parse.warnings && parse.warnings.length > 0 && (
          <Notice tone="warn" className="mt-5" title="파싱 참고">
            <ul className="list-disc pl-4">
              {parse.warnings.slice(0, 4).map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </Notice>
        )}

        <div className="mt-6 border-t border-border pt-5">
          <label
            htmlFor="me-select"
            className="block text-sm font-semibold text-foreground"
          >
            “나”는 누구인가요?
          </label>
          <p className="mb-2 text-xs text-muted">
            보통 당신의 카톡 이름을 고르면 돼요. 분석은 이 사람을 기준으로 풀어줍니다.
          </p>
          <select
            id="me-select"
            value={me}
            onChange={(e) => setMe(e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-surface-2 px-3 text-sm text-foreground outline-none focus:border-accent"
          >
            {parse.participants.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onBack}>
            취소
          </Button>
          <Button onClick={() => me && onConfirm(me)} disabled={!me}>
            {parse.mode === "one_on_one" ? "관계 분석하기 →" : "그룹 분석하기 →"}
          </Button>
        </div>
      </div>
    </div>
  );
}
