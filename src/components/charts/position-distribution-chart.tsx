"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

type PositionItem = {
  asset: string;
  size: number;
  pnl?: number;
  value?: number;
};

type PositionDistributionChartProps = {
  data: PositionItem[];
};

const COLORS = [
  "#6366f1", // indigo
  "#22c55e", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#3b82f6", // blue
  "#a855f7", // purple
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
  "#84cc16", // lime
];

export function PositionDistributionChart({ data }: PositionDistributionChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center text-muted-foreground text-sm">
        暂无仓位数据
      </div>
    );
  }

  const totalSize = data.reduce((sum, item) => sum + Math.abs(item.value ?? item.size), 0);
  const chartData = data.map((item) => ({
    ...item,
    value: Math.abs(item.value ?? item.size),
    pct: totalSize > 0 ? ((Math.abs(item.value ?? item.size) / totalSize) * 100).toFixed(1) : "0",
  }));

  return (
    <div className="h-72 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            nameKey="asset"
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value: number, name: string, props: any) => {
              const item = props.payload;
              return [
                <div key={name} className="space-y-1">
                  <div>{name}: ${value.toLocaleString()} ({item.pct}%)</div>
                  {item.pnl !== undefined && (
                    <div className="text-xs text-muted-foreground">
                      PnL: <span style={{ color: item.pnl >= 0 ? "#22c55e" : "#ef4444" }}>
                        {item.pnl >= 0 ? "+" : ""}${item.pnl.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>,
                "",
              ];
            }}
          />
          <Legend
            formatter={(value) => <span style={{ color: "hsl(var(--foreground))", fontSize: 12 }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
