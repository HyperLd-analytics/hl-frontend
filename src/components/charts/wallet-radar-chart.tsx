"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

type WalletData = {
  name: string;
  address: string;
  score: number;
  total_pnl: number;
  win_rate: number;
  volume_30d: number;
};

type WalletRadarChartProps = {
  wallets: WalletData[];
};

const normalize = (value: number, min: number, max: number) => {
  if (max === min) return 50;
  return Math.round(((value - min) / (max - min)) * 100);
};

export function WalletRadarChart({ wallets }: WalletRadarChartProps) {
  if (wallets.length === 0) return null;

  // Compute normalized data for each wallet
  const maxScore = Math.max(...wallets.map((w) => w.score)) || 1;
  const maxPnl = Math.max(...wallets.map((w) => Math.abs(w.total_pnl))) || 1;
  const maxVolume = Math.max(...wallets.map((w) => w.volume_30d)) || 1;

  const data = wallets.map((w) => ({
    name: w.name || w.address.slice(0, 8),
    address: w.address,
    score: normalize(w.score, 0, maxScore),
    pnl: normalize(Math.abs(w.total_pnl), 0, maxPnl),
    winRate: w.win_rate ?? 0,
    volume: normalize(w.volume_30d, 0, maxVolume),
  }));

  return (
    <div className="h-80 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis
            dataKey="name"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
            tickCount={4}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={0.2}
          />
          <Radar
            name="PnL"
            dataKey="pnl"
            stroke="#22c55e"
            fill="#22c55e"
            fillOpacity={0.15}
          />
          <Radar
            name="Win Rate"
            dataKey="winRate"
            stroke="#f59e0b"
            fill="#f59e0b"
            fillOpacity={0.15}
          />
          <Radar
            name="Volume"
            dataKey="volume"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.15}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value: number, name: string) => [`${value}%`, name]}
          />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            formatter={(value) => <span style={{ color: "hsl(var(--foreground))" }}>{value}</span>}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
