"use client";

import type { PersonaCard as PersonaCardData } from "@/lib/types";
import {
  formatActiveHours,
  formatInt,
  humanizeSec,
  pct,
} from "@/components/format";
import { Chip } from "@/components/ui";

function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return `hsl(${h} 60% 45%)`;
}

export function PersonaCard({
  persona,
  isMe,
}: {
  persona: PersonaCardData;
  isMe?: boolean;
}) {
  const { stats } = persona;
  return (
    <div className="card flex flex-col gap-3 p-4">
      <div className="flex items-center gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ background: avatarColor(persona.name) }}
        >
          {persona.name.slice(0, 2)}
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 font-semibold text-foreground">
            <span className="truncate">{persona.name}</span>
            {isMe && <Chip tone="accent">나</Chip>}
          </p>
          {persona.voice && (
            <p className="truncate text-xs text-muted">{persona.voice}</p>
          )}
        </div>
      </div>

      {persona.signature_phrases.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {persona.signature_phrases.slice(0, 6).map((s, i) => (
            <Chip key={i} tone="accent2">
              “{s}”
            </Chip>
          ))}
        </div>
      )}

      {persona.reaction_style && (
        <p className="text-sm text-muted">
          <span className="text-foreground">반응 스타일 </span>
          {persona.reaction_style}
        </p>
      )}

      {(persona.engages_with.length > 0 || persona.ignores.length > 0) && (
        <div className="flex flex-col gap-1.5 text-xs">
          {persona.engages_with.length > 0 && (
            <p className="text-muted">
              <span className="text-ok">잘 무는 떡밥 </span>
              {persona.engages_with.join(", ")}
            </p>
          )}
          {persona.ignores.length > 0 && (
            <p className="text-muted">
              <span className="text-danger">무시하는 주제 </span>
              {persona.ignores.join(", ")}
            </p>
          )}
        </div>
      )}

      <div className="mt-auto grid grid-cols-2 gap-2 border-t border-border pt-3 text-xs">
        <div>
          <p className="text-muted">평균 길이</p>
          <p className="font-semibold text-foreground">
            {formatInt(stats.avg_len)}자
          </p>
        </div>
        <div>
          <p className="text-muted">ㅋㅎ 비율</p>
          <p className="font-semibold text-foreground">{pct(stats.laugh_rate)}</p>
        </div>
        <div>
          <p className="text-muted">응답 속도</p>
          <p className="font-semibold text-foreground">
            {humanizeSec(stats.median_reply_sec)}
          </p>
        </div>
        <div>
          <p className="text-muted">활동 시간</p>
          <p className="font-semibold text-foreground">
            {formatActiveHours(stats.active_hours, 2)}
          </p>
        </div>
      </div>

      {persona.talks_most_to && (
        <p className="text-xs text-muted">
          🫶 가장 많이 대화하는 상대:{" "}
          <span className="text-foreground">{persona.talks_most_to}</span>
        </p>
      )}
    </div>
  );
}
