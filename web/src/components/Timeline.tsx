"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceArea,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
  type ScatterPointItem,
} from "recharts";
import type { DerivedStats, DensityPoint, Session } from "@/lib/types";
import { formatDate, formatInt, humanizeSec } from "@/components/format";

type SessionDatum = {
  t: number;
  z: number;
  analyzed: boolean;
  tension: number;
  session: Session;
};

type DropBand = { start: number; end: number };

const DAY_MS = 86_400_000;

/** Days where count falls below 50% of the prior 7-day rolling average. */
export function computeDensityDropBands(density: DensityPoint[]): DropBand[] {
  const sorted = [...density].sort((a, b) => a.date.localeCompare(b.date));
  const bands: DropBand[] = [];
  let i = 0;
  while (i < sorted.length) {
    if (i < 7) {
      i++;
      continue;
    }
    const window = sorted.slice(i - 7, i);
    const avg = window.reduce((s, d) => s + d.count, 0) / 7;
    if (avg <= 0 || sorted[i].count >= avg * 0.5) {
      i++;
      continue;
    }
    const bandStart = Date.parse(sorted[i].date);
    let j = i + 1;
    while (j < sorted.length) {
      const w = sorted.slice(Math.max(0, j - 7), j);
      const a = w.reduce((s, d) => s + d.count, 0) / w.length;
      if (a <= 0 || sorted[j].count >= a * 0.5) break;
      j++;
    }
    const bandEnd = Date.parse(sorted[j - 1].date) + DAY_MS;
    bands.push({ start: bandStart, end: bandEnd });
    i = j;
  }
  return bands;
}

function riskColor(v: number): string {
  const t = Math.max(0, Math.min(1, v / 100));
  const lerp = (a: number, b: number) => Math.round(a + (b - a) * t);
  return `rgb(${lerp(0xff, 0xff)}, ${lerp(0xb0, 0x4d)}, ${lerp(0x20, 0x4d)})`;
}

export function Timeline({
  stats,
  tensionBySession,
  onSelectSession,
}: {
  stats: DerivedStats;
  tensionBySession?: Record<string, number>;
  onSelectSession: (session: Session) => void;
}) {
  const { densityData, latencyData, sessionData, dropBands } = useMemo(() => {
    const density = stats.density.map((d) => ({
      t: Date.parse(d.date),
      density: d.count,
    }));

    const latency = stats.latencyTrend.map((l) => ({
      t: Date.parse(l.weekStart),
      latMin: l.medianSec / 60,
    }));

    const sessions: SessionDatum[] = stats.sessions
      .map((s) => {
        const tension = tensionBySession?.[s.id];
        const analyzed = typeof tension === "number";
        const z = Math.max(s.riskScore, analyzed ? tension : 0);
        return { t: s.startTs, z: Math.max(4, z), analyzed, tension: tension ?? 0, session: s };
      })
      .sort((a, b) => b.z - a.z)
      .slice(0, stats.sessions.length > 60 ? 50 : stats.sessions.length)
      .sort((a, b) => a.t - b.t);

    return {
      densityData: density.sort((a, b) => a.t - b.t),
      latencyData: latency.sort((a, b) => a.t - b.t),
      sessionData: sessions,
      dropBands: computeDensityDropBands(stats.density),
    };
  }, [stats, tensionBySession]);

  const hasData = densityData.length > 0 || sessionData.length > 0;

  if (!hasData) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-border bg-surface text-sm text-muted">
        타임라인을 그릴 데이터가 부족해요.
      </div>
    );
  }

  function handleClick(point: ScatterPointItem) {
    const datum = point.payload as SessionDatum | undefined;
    if (datum?.session) onSelectSession(datum.session);
  }

  return (
    <div className="w-full">
      <div className="h-[420px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart margin={{ top: 16, right: 24, bottom: 12, left: 0 }}>
            <CartesianGrid stroke="#2a2a3d" strokeDasharray="3 3" />
            {dropBands.map((b, idx) => (
              <ReferenceArea
                key={`drop-${idx}`}
                x1={b.start}
                x2={b.end}
                yAxisId="density"
                fill="#ff4d4d"
                fillOpacity={0.12}
                strokeOpacity={0}
              />
            ))}
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(v: number) => formatDate(v)}
              tick={{ fill: "#9a9ab0", fontSize: 11 }}
              stroke="#2a2a3d"
              minTickGap={56}
            />
            <YAxis
              yAxisId="density"
              tick={{ fill: "#9a9ab0", fontSize: 11 }}
              stroke="#2a2a3d"
              width={44}
            />
            <YAxis
              yAxisId="lat"
              orientation="right"
              tickFormatter={(v: number) => humanizeSec(v * 60)}
              tick={{ fill: "#9a9ab0", fontSize: 11 }}
              stroke="#2a2a3d"
              width={56}
            />
            <YAxis yAxisId="risk" type="number" dataKey="z" domain={[0, 110]} hide />
            <ZAxis type="number" dataKey="z" range={[50, 420]} />
            <Tooltip
              contentStyle={{
                background: "#14141f",
                border: "1px solid #2a2a3d",
                borderRadius: 12,
                color: "#ececf2",
                fontSize: 12,
              }}
              labelFormatter={(label) => formatDate(Number(label))}
              formatter={(value, name) => {
                const v = Number(value);
                if (name === "latMin") return [humanizeSec(v * 60), "주간 응답 지연"];
                return [`${formatInt(v)}개`, "일별 메시지"];
              }}
            />
            <Line
              yAxisId="density"
              data={densityData}
              dataKey="density"
              type="monotone"
              stroke="#7c5cff"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              yAxisId="lat"
              data={latencyData}
              dataKey="latMin"
              type="monotone"
              stroke="#36d399"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              isAnimationActive={false}
            />
            <Scatter
              yAxisId="risk"
              data={sessionData}
              tooltipType="none"
              onClick={handleClick}
              isAnimationActive={false}
              cursor="pointer"
            >
              {sessionData.map((d) => (
                <Cell
                  key={d.session.id}
                  fill={d.analyzed ? riskColor(d.z) : "#5a5a72"}
                  fillOpacity={d.analyzed ? 0.9 : 0.5}
                  stroke={d.analyzed ? "#ffffff" : "transparent"}
                  strokeWidth={d.analyzed ? 1.5 : 0}
                />
              ))}
            </Scatter>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1">
          <span className="h-0.5 w-4 rounded bg-accent" /> 일별 메시지 수
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-0.5 w-4 rounded bg-ok" /> 주간 응답 지연(중앙값)
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-4 rounded-sm bg-danger/20 border border-danger/30" /> 밀도
          급락 구간
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="size-2.5 rounded-full bg-danger" /> 위험 구간 상위 (클릭)
        </span>
      </div>
    </div>
  );
}
