"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
  type ScatterPointItem,
} from "recharts";
import type { DerivedStats, Session } from "@/lib/types";
import { formatDate, formatInt, humanizeSec } from "@/components/format";

type SessionDatum = {
  t: number;
  z: number;
  analyzed: boolean;
  tension: number;
  session: Session;
};

/** warn (#ffb020) -> danger (#ff4d4d) by value 0..100 */
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
  const { densityData, latencyData, sessionData } = useMemo(() => {
    const density = stats.density.map((d) => ({
      t: Date.parse(d.date),
      density: d.count,
    }));

    const latency = stats.latencyTrend.map((l) => ({
      t: Date.parse(l.weekStart),
      latMin: l.medianSec / 60,
    }));

    const sessions: SessionDatum[] = stats.sessions.map((s) => {
      const tension = tensionBySession?.[s.id];
      const analyzed = typeof tension === "number";
      const z = Math.max(s.riskScore, analyzed ? tension : 0);
      return { t: s.startTs, z: Math.max(4, z), analyzed, tension: tension ?? 0, session: s };
    });

    return {
      densityData: density.sort((a, b) => a.t - b.t),
      latencyData: latency.sort((a, b) => a.t - b.t),
      sessionData: sessions.sort((a, b) => a.t - b.t),
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
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart margin={{ top: 16, right: 16, bottom: 8, left: -8 }}>
            <CartesianGrid stroke="#2a2a3d" strokeDasharray="3 3" />
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(v: number) => formatDate(v)}
              tick={{ fill: "#9a9ab0", fontSize: 11 }}
              stroke="#2a2a3d"
              minTickGap={40}
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

      {/* legend */}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1">
          <span className="h-0.5 w-4 rounded bg-accent" /> 일별 메시지 수
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-0.5 w-4 rounded bg-ok" /> 주간 응답 지연(중앙값)
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="size-2.5 rounded-full bg-danger" /> 분석된 구간 (클릭)
        </span>
      </div>
    </div>
  );
}
