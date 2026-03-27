"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";

type PnLAreaChartProps = {
  data: Array<{
    date: string;
    pnl?: number | null;
    cumulative?: number | null;
    tradeCount?: number;
  }>;
  showCumulative?: boolean;
  positiveColor?: string;
  negativeColor?: string;
};

export function PnLAreaChart({
  data,
  showCumulative = true,
  positiveColor = "#22c55e",
  negativeColor = "#ef4444",
}: PnLAreaChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center text-muted-foreground text-sm">
        暂无数据
      </div>
    );
  }

  return (
    <div className="h-72 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPnlPos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={positiveColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={positiveColor} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="colorPnlNeg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={negativeColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={negativeColor} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="colorCum" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="date"
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
            formatter={(value: number, name: string) => [
              `$${value.toLocaleString()}`,
              name === "pnl" ? "每日盈亏" : "累计盈亏",
            ]}
          />
          {showCumulative && (
            <Area
              type="monotone"
              dataKey="cumulative"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#colorCum)"
              dot={false}
              name="cumulative"
            />
          )}
          <Area
            type="monotone"
            dataKey="pnl"
            stroke={positiveColor}
            strokeWidth={1.5}
            fill={positiveColor}
            fillOpacity={0.1}
            dot={false}
            name="pnl"
            connectNulls={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
