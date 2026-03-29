"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLoading } from "@/components/common/page-loading";
import { PageError } from "@/components/common/page-error";
import { useApiQuery } from "@/hooks/use-api-query";
import { TrendingUp, TrendingDown, Users, Activity, Wallet, TrendingUpIcon } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine
} from "recharts";

interface CohortEntry {
  cohort?: string;
  cohort_type?: string;
  account_value_cohort?: string;
  pnl_cohort?: string;
  size_cohort?: string;
  wallet_count?: number;
  walletCount?: number;
  avg_pnl?: number;
  avgPnl?: number;
  avg_win_rate?: number;
  avgWinRate?: number;
  total_volume?: number;
  totalVolume?: number;
  avg_leverage?: number;
  avgLeverage?: number;
  total_account_value?: number;
  totalAccountValue?: number;
}

interface CohortsResponse {
  cohorts?: CohortEntry[];
  data?: CohortEntry[];
  error?: string;
}

const COHORT_COLORS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  MONEY_PRINTER: { label: "Money Printer", color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20" },
  PROFIT: { label: "Profit", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  BREAK_EVEN: { label: "Break Even", color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
  REKT: { label: "Rekt", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" },
  GIGA_REKT: { label: "Giga Rekt", color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  whale: { label: "Whale", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  small: { label: "Small", color: "text-gray-500", bg: "bg-gray-500/10", border: "border-gray-500/20" },
  medium: { label: "Medium", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  large: { label: "Large", color: "text-cyan-500", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
};

function fmtVolume(v: number | undefined): string {
  if (v == null) return "-";
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
}

function fmtPnl(v: number | undefined): { text: string; cls: string } {
  if (v == null) return { text: "-", cls: "text-muted-foreground" };
  const sign = v >= 0 ? "+" : "";
  return { text: `${sign}$${v.toFixed(2)}`, cls: v >= 0 ? "text-green-600" : "text-red-600" };
}

function CohortRow({ entry }: { entry: CohortEntry }) {
  const cohortKey = (entry.cohort ?? entry.pnl_cohort ?? entry.size_cohort ?? entry.account_value_cohort ?? "").toUpperCase().replace("-", "_");
  const meta = COHORT_COLORS[cohortKey] ?? { label: entry.cohort ?? entry.pnl_cohort ?? "-", color: "text-foreground", bg: "bg-muted", border: "" };
  const pnlInfo = fmtPnl(entry.avg_pnl ?? entry.avgPnl);
  const walletCount = entry.wallet_count ?? entry.walletCount ?? 0;
  const winRate = ((entry.avg_win_rate ?? entry.avgWinRate ?? 0) * 100).toFixed(1);
  const volume = fmtVolume(entry.total_volume ?? entry.totalVolume);
  const leverage = entry.avg_leverage ?? entry.avgLeverage;
  const accountValue = fmtVolume(entry.total_account_value ?? entry.totalAccountValue);

  return (
    <tr className={`border-t border-border hover:bg-muted/30 transition-colors ${meta.bg}`}>
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          {(entry.avg_pnl ?? entry.avgPnl ?? 0) >= 0 ? (
            <TrendingUp className={`h-4 w-4 ${meta.color}`} />
          ) : (
            <TrendingDown className={`h-4 w-4 ${meta.color}`} />
          )}
          <div>
            <span className={`font-semibold text-sm ${meta.color}`}>{meta.label}</span>
            {entry.pnl_cohort && entry.pnl_cohort !== entry.cohort && (
              <span className="text-xs text-muted-foreground ml-2">pnl: {entry.pnl_cohort}</span>
            )}
          </div>
        </div>
      </td>
      <td className="px-3 py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-medium">{walletCount.toLocaleString()}</span>
        </div>
      </td>
      <td className={`px-3 py-3 text-right font-mono font-medium ${pnlInfo.cls}`}>
        {pnlInfo.text}
      </td>
      <td className="px-3 py-3 text-right">
        <span className="text-muted-foreground">{winRate}%</span>
      </td>
      <td className="px-3 py-3 text-right font-mono">
        {volume}
      </td>
      <td className="px-3 py-3 text-right">
        {leverage != null ? `${leverage}x` : "-"}
      </td>
      <td className="px-3 py-3 text-right font-mono text-xs">
        {accountValue}
      </td>
    </tr>
  );
}

export default function CohortsPage() {
  const { data, loading, error, refetch } = useApiQuery<CohortsResponse>("/cohorts", {
    staleTimeMs: 30_000,
  });
  const [trendDays, setTrendDays] = useState<"7" | "14" | "30">("14");
  const [cohortType, setCohortType] = useState<"size" | "pnl">("size");

  const { data: biasData, loading: biasLoading } = useApiQuery<{
    data: Array<{ date: string; bias: number; long_usd: number; short_usd: number; wallet_count: number }>;
  }>(`/cohorts/bias-history?cohort_type=${cohortType}&days=${trendDays}`, {
    staleTimeMs: 60_000,
  });

  const cohorts: CohortEntry[] = data?.cohorts ?? data?.data ?? [];

  const biasPoints = biasData?.data ?? [];
  const latestBias = biasPoints.length > 0 ? biasPoints[biasPoints.length - 1].bias : 0;
  const startBias = biasPoints.length > 0 ? biasPoints[0].bias : 0;
  const biasDelta = latestBias - startBias;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">队列分析</h1>
        <p className="text-sm text-muted-foreground mt-1">
          按账户价值、盈亏和规模分类的钱包群体分析
        </p>
      </div>

      {/* Cohort Summary Cards */}
      <div className="grid grid-cols-5 gap-3">
        {Object.entries(COHORT_COLORS).slice(0, 5).map(([key, meta]) => {
          const entry = cohorts.find(
            (c) => (c.cohort ?? c.pnl_cohort ?? "").toUpperCase().replace("-", "_") === key
          );
          const walletCount = entry?.wallet_count ?? entry?.walletCount ?? 0;
          const pnlInfo = fmtPnl(entry?.avg_pnl ?? entry?.avgPnl);

          return (
            <Card key={key} className={`p-4 border ${meta.border} ${meta.bg}`}>
              <div className={`text-sm font-semibold ${meta.color}`}>{meta.label}</div>
              <div className="text-2xl font-bold mt-1">
                {walletCount > 0 ? walletCount.toLocaleString() : "-"}
              </div>
              <div className={`text-xs font-mono mt-1 ${pnlInfo.cls}`}>
                {pnlInfo.text} avg
              </div>
            </Card>
          );
        })}
      </div>

      {/* Bias Trend Chart */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUpIcon className="h-5 w-5 text-primary" />
              多空偏向趋势（Bias Trend）
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              各 Cohort 过去{trendDays}天多空偏向变化
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Cohort Type Toggle */}
            <div className="flex rounded-lg border bg-muted p-0.5 text-xs">
              <button
                onClick={() => setCohortType("size")}
                className={`px-3 py-1.5 rounded-md transition-colors ${cohortType === "size" ? "bg-background shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}
              >
                规模 Cohort
              </button>
              <button
                onClick={() => setCohortType("pnl")}
                className={`px-3 py-1.5 rounded-md transition-colors ${cohortType === "pnl" ? "bg-background shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}
              >
                盈亏 Cohort
              </button>
            </div>
            {/* Days Toggle */}
            <div className="flex rounded-lg border bg-muted p-0.5 text-xs">
              {(["7", "14", "30"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setTrendDays(d)}
                  className={`px-3 py-1.5 rounded-md transition-colors ${trendDays === d ? "bg-background shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {d}D
                </button>
              ))}
            </div>
          </div>
        </div>

        {biasLoading ? (
          <div className="h-48 flex items-center justify-center">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : biasPoints.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-muted-foreground gap-2">
            <Activity className="h-8 w-8 opacity-30" />
            <p className="text-sm">暂无{trendDays}天偏向数据</p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="flex items-center gap-6 mb-3">
              <div>
                <span className="text-xs text-muted-foreground">当前 Bias</span>
                <p className={`text-lg font-bold ${latestBias > 0 ? "text-green-500" : latestBias < 0 ? "text-red-500" : "text-muted-foreground"}`}>
                  {latestBias >= 0 ? "+" : ""}{(latestBias * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">{trendDays}天变化</span>
                <p className={`text-lg font-bold ${biasDelta >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {biasDelta >= 0 ? "+" : ""}{(biasDelta * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">最近更新</span>
                <p className="text-sm font-medium">{biasPoints[biasPoints.length - 1]?.date ?? "-"}</p>
              </div>
            </div>

            {/* Chart */}
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={biasPoints}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickFormatter={(v: string) => v.slice(5)}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
                    domain={[-1, 1]}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                    }}
                    formatter={(value) => [`${((value as number) * 100).toFixed(2)}%`, "Bias"]}
                    labelFormatter={(label: string) => `日期: ${label}`}
                  />
                  <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                  <Line
                    type="monotone"
                    dataKey="bias"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </Card>

      {loading && <PageLoading />}

      {error && !data && (
        <PageError message={String(error)} onRetry={() => void refetch()} />
      )}

      {/* Cohort Breakdown Table */}
      {cohorts.length > 0 && (
        <div>
          <h2 className="text-lg font-medium mb-3">详细分析</h2>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2.5 text-left font-medium">队列</th>
                    <th className="px-3 py-2.5 text-right font-medium">钱包数量</th>
                    <th className="px-3 py-2.5 text-right font-medium">平均 PnL</th>
                    <th className="px-3 py-2.5 text-right font-medium">平均胜率</th>
                    <th className="px-3 py-2.5 text-right font-medium">总交易量</th>
                    <th className="px-3 py-2.5 text-right font-medium">平均杠杆</th>
                    <th className="px-3 py-2.5 text-right font-medium">总账户价值</th>
                  </tr>
                </thead>
                <tbody>
                  {cohorts.map((entry, i) => (
                    <CohortRow key={i} entry={entry} />
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {data && !loading && cohorts.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">
          <div className="flex flex-col items-center gap-2">
            <Activity className="h-8 w-8 opacity-30" />
            <p>暂无队列数据</p>
          </div>
        </Card>
      )}
    </div>
  );
}
