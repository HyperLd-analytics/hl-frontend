"use client";

import { useState } from "react";
import useSWR from "swr";
import { TrendingUp, Users, DollarSign, BarChart2 } from "lucide-react";

type Builder = {
  rank: number;
  builder_address: string;
  builder_name: string;
  trade_count: number;
  total_volume_usd: number;
  net_pnl_usd: number;
  estimated_revenue_usd: number;
  period_days: number;
};

type LeaderboardResponse = {
  period_days: number;
  builders: Builder[];
  total_builders: number;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatUSD(v: number): string {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
}

export default function BuildersPage() {
  const [days, setDays] = useState<"7" | "30">("7");
  const { data, error, isLoading } = useSWR<LeaderboardResponse>(
    `/api/v1/builders/leaderboard/route.ts?days=${days}&limit=20`,
    fetcher
  );

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-600">
          <p className="font-medium">加载失败</p>
          <p className="text-sm mt-1">请确保后端服务已启动</p>
        </div>
      </div>
    );
  }

  const builders = data.builders ?? [];
  const totalVolume = builders.reduce((s, b) => s + b.total_volume_usd, 0);
  const totalRevenue = builders.reduce((s, b) => s + b.estimated_revenue_usd, 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Builder 生态分析</h1>
        <p className="text-muted-foreground mt-1">
          Builder 收入排行榜 · 基于 {days}天 交易量估算
        </p>
      </div>

      {/* 摘要 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2.5">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">活跃 Builder</p>
              <p className="text-2xl font-bold mt-0.5">{data.total_builders}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-500/10 p-2.5">
              <BarChart2 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">总交易量</p>
              <p className="text-2xl font-bold mt-0.5 text-green-500">{formatUSD(totalVolume)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/10 p-2.5">
              <DollarSign className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">估算总收入</p>
              <p className="text-2xl font-bold mt-0.5 text-purple-500">{formatUSD(totalRevenue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 时间切换 */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">时间范围：</span>
        <div className="flex rounded-lg border bg-card p-1 gap-1">
          {(["7", "30"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                days === d ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {d}天
            </button>
          ))}
        </div>
      </div>

      {/* Builder 列表 */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold">Builder 排行榜</h2>
        </div>
        <div className="overflow-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">排名</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Builder</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">交易笔数</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">总交易量</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">净 PnL</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">估算收入</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {builders.map((builder) => (
                <tr
                  key={builder.builder_address}
                  className="hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => window.location.href = `/dashboard/builders/${builder.builder_address}`}
                >
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full ${
                      builder.rank === 1 ? "bg-yellow-500 text-white" :
                      builder.rank === 2 ? "bg-gray-400 text-white" :
                      builder.rank === 3 ? "bg-amber-600 text-white" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {builder.rank}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div>
                      <p className="font-semibold text-sm">{builder.builder_name}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {builder.builder_address.slice(0, 8)}...{builder.builder_address.slice(-6)}
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-muted-foreground">
                    {builder.trade_count.toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono font-medium">
                    {formatUSD(builder.total_volume_usd)}
                  </td>
                  <td className={`px-5 py-3.5 text-right font-mono ${builder.net_pnl_usd >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {builder.net_pnl_usd >= 0 ? "+" : ""}{formatUSD(builder.net_pnl_usd)}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-purple-500 font-medium">
                    {formatUSD(builder.estimated_revenue_usd)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {builders.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              暂无 Builder 数据
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
