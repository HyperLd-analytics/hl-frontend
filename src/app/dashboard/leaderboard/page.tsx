"use client";

import { useState } from "react";
import useSWR from "swr";
import { Trophy, TrendingUp, TrendingDown, BarChart2, ChevronUp, ChevronDown } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  wallet_id: number;
  wallet_address: string;
  pnl: number;
  pnl_percent: number;
  volume_usd: number;
  win_rate: number;
  trades: number;
}

interface LeaderboardResponse {
  period: string;
  entries: LeaderboardEntry[];
  total: number;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const PERIODS = [
  { label: "24小时", value: "24h" },
  { label: "7天", value: "7d" },
  { label: "30天", value: "30d" },
  { label: "全部", value: "all" },
];

export default function LeaderboardPage() {
  const [period, setPeriod] = useState("7d");
  const [selectedWallets, setSelectedWallets] = useState<Set<number>>(new Set());

  const { data, error, isLoading } = useSWR<LeaderboardResponse>(
    `/api/v1/leaderboard?period=${period}`,
    fetcher
  );

  const toggleWallet = (id: number) => {
    const next = new Set(selectedWallets);
    if (next.has(id)) next.delete(id);
    else if (next.size < 5) next.add(id);
    setSelectedWallets(next);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-96 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-600">
          <p className="font-medium">加载失败</p>
          <p className="text-sm mt-1">请稍后刷新页面重试</p>
        </div>
      </div>
    );
  }

  const entries = data?.entries || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">钱包排行榜</h1>
          <p className="text-muted-foreground mt-1">
            按 {PERIODS.find((p) => p.value === period)?.label} 收益排序
          </p>
        </div>

        {/* 周期选择 */}
        <div className="flex rounded-lg border bg-card p-1 gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                period === p.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 选中钱包对比区 */}
      {selectedWallets.size > 0 && (
        <div className="rounded-xl border bg-card shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium">已选钱包 ({selectedWallets.size}/5)</p>
            <button
              onClick={() => setSelectedWallets(new Set())}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              清除
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {Array.from(selectedWallets).map((id) => {
              const entry = entries.find((e) => e.wallet_id === id);
              if (!entry) return null;
              return (
                <div
                  key={id}
                  className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-1.5"
                >
                  <span className="text-xs font-mono">
                    {entry.wallet_address.slice(0, 6)}...{entry.wallet_address.slice(-4)}
                  </span>
                  <span className={`text-xs font-bold ${entry.pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {entry.pnl >= 0 ? "+" : ""}{entry.pnl.toLocaleString()}
                  </span>
                  <button
                    onClick={() => toggleWallet(id)}
                    className="text-muted-foreground hover:text-red-500 ml-1"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 排行榜表格 */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="overflow-auto max-h-[600px]">
          <table className="w-full">
            <thead className="sticky top-0 z-10">
              <tr className="border-b bg-card">
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide w-16">
                  排名
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  钱包地址
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  PnL
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  收益率
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  交易量
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  胜率
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  交易次数
                </th>
                <th className="px-5 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wide w-16">
                  对比
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-muted-foreground">
                    暂无排行榜数据
                  </td>
                </tr>
              ) : (
                entries.map((entry) => {
                  const isTop3 = entry.rank <= 3;
                  const isSelected = selectedWallets.has(entry.wallet_id);

                  return (
                    <tr
                      key={entry.wallet_id}
                      className={`hover:bg-muted/50 transition-colors ${
                        isSelected ? "bg-primary/5" : ""
                      }`}
                    >
                      {/* 排名 */}
                      <td className="px-5 py-3.5">
                        {isTop3 ? (
                          <div className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${
                            entry.rank === 1
                              ? "bg-yellow-100 text-yellow-600"
                              : entry.rank === 2
                              ? "bg-gray-100 text-gray-500"
                              : "bg-orange-100 text-orange-600"
                          }`}>
                            <Trophy className="h-3.5 w-3.5" />
                          </div>
                        ) : (
                          <span className="font-mono text-sm text-muted-foreground">
                            #{entry.rank}
                          </span>
                        )}
                      </td>

                      {/* 地址 */}
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-sm">
                          {entry.wallet_address.slice(0, 8)}...
                          {entry.wallet_address.slice(-6)}
                        </span>
                      </td>

                      {/* PnL */}
                      <td className={`px-5 py-3.5 text-right font-mono font-medium ${
                        entry.pnl >= 0 ? "text-green-500" : "text-red-500"
                      }`}>
                        {entry.pnl >= 0 ? (
                          <span className="inline-flex items-center gap-1">
                            <TrendingUp className="h-3.5 w-3.5" />
                            ${Math.abs(entry.pnl).toLocaleString()}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <TrendingDown className="h-3.5 w-3.5" />
                            -${Math.abs(entry.pnl).toLocaleString()}
                          </span>
                        )}
                      </td>

                      {/* 收益率 */}
                      <td className={`px-5 py-3.5 text-right font-mono ${
                        entry.pnl_percent >= 0 ? "text-green-500/80" : "text-red-500/80"
                      }`}>
                        {entry.pnl_percent >= 0 ? "+" : ""}{entry.pnl_percent.toFixed(2)}%
                      </td>

                      {/* 交易量 */}
                      <td className="px-5 py-3.5 text-right font-mono text-muted-foreground">
                        ${entry.volume_usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>

                      {/* 胜率 */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${Math.min(entry.win_rate, 100)}%` }}
                            />
                          </div>
                          <span className="font-mono text-sm text-muted-foreground">
                            {entry.win_rate.toFixed(1)}%
                          </span>
                        </div>
                      </td>

                      {/* 交易次数 */}
                      <td className="px-5 py-3.5 text-right font-mono text-muted-foreground">
                        {entry.trades.toLocaleString()}
                      </td>

                      {/* 对比选择 */}
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => toggleWallet(entry.wallet_id)}
                          disabled={!isSelected && selectedWallets.size >= 5}
                          className={`w-6 h-6 rounded border transition-colors ${
                            isSelected
                              ? "bg-primary border-primary text-primary-foreground"
                              : selectedWallets.size >= 5
                              ? "border-muted-foreground/20 text-muted-foreground/20 cursor-not-allowed"
                              : "border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary"
                          }`}
                        >
                          {isSelected ? (
                            <ChevronUp className="h-3.5 w-3.5 mx-auto" />
                          ) : (
                            <BarChart2 className="h-3.5 w-3.5 mx-auto" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
