"use client";

import { useState } from "react";
import useSWR from "swr";
import { TrendingUp, TrendingDown, Users, BarChart2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type PerpStats = {
  symbol: string;
  position_count: number;
  total_long_usd: number;
  total_short_usd: number;
  total_open_interest_usd: number;
  avg_leverage: number;
  bias: number;
  bias_label: string;
};

type PerpListResponse = { perps: PerpStats[] };

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const COHORT_LABELS: Record<string, string> = {
  Shrimp: "Shrimp", Fish: "Fish", Dolphin: "Dolphin",
  "Apex Predator": "Apex Predator", "Small Whale": "Small Whale",
  Whale: "Whale", "Tidal Whale": "Tidal Whale", Leviathan: "Leviathan",
};

export default function PerpsPage() {
  const { data, error, isLoading } = useSWR<PerpListResponse>("/api/v1/perps", fetcher);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

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

  const perps = data.perps || [];
  const totalOi = perps.reduce((sum, p) => sum + p.total_open_interest_usd, 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">永续合约中心</h1>
        <p className="text-muted-foreground mt-1">
          全市场 Perp 标的全局统计 · 总 open interest ${totalOi.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </p>
      </div>

      {/* 总览 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2.5">
              <BarChart2 className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">交易品种</p>
              <p className="text-2xl font-bold mt-0.5">{perps.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-500/10 p-2.5">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">总多头仓位</p>
              <p className="text-2xl font-bold mt-0.5 text-green-500">
                ${perps.reduce((s, p) => s + p.total_long_usd, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-500/10 p-2.5">
              <TrendingDown className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">总空头仓位</p>
              <p className="text-2xl font-bold mt-0.5 text-red-500">
                ${perps.reduce((s, p) => s + p.total_short_usd, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Perp 列表 */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold">各币种详情</h2>
        </div>
        <div className="overflow-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">币种</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">仓位数</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">多头</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">空头</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">总 OI</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">平均杠杆</th>
                <th className="px-5 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wide">Bias</th>
                <th className="px-5 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wide">方向</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {perps.map((perp) => {
                const biasColor = perp.bias > 0.1 ? "text-green-500" : perp.bias < -0.1 ? "text-red-500" : "text-muted-foreground";
                const biasBarWidth = Math.abs(perp.bias) * 50;
                return (
                  <tr
                    key={perp.symbol}
                    className="hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedSymbol(selectedSymbol === perp.symbol ? null : perp.symbol)}
                  >
                    <td className="px-5 py-3.5 font-mono font-bold text-sm">{perp.symbol}</td>
                    <td className="px-5 py-3.5 text-right font-mono text-muted-foreground">{perp.position_count.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-right font-mono text-green-500">
                      ${perp.total_long_usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-red-500">
                      ${perp.total_short_usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-medium">
                      ${perp.total_open_interest_usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-muted-foreground">{perp.avg_leverage}x</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className={`h-full rounded-full ${perp.bias > 0 ? "bg-green-500" : "bg-red-500"}`} style={{ width: `${biasBarWidth}%` }} />
                        </div>
                        <span className={`font-mono text-xs font-medium ${biasColor}`}>
                          {perp.bias > 0 ? "+" : ""}{(perp.bias * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                        perp.bias_label === "Long"
                          ? "bg-green-100 text-green-700"
                          : perp.bias_label === "Short"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {perp.bias > 0 ? <TrendingUp className="h-3 w-3" /> : perp.bias < 0 ? <TrendingDown className="h-3 w-3" /> : null}
                        {perp.bias_label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 选中币种详情 */}
      {selectedSymbol && (
        <PerpDetailPanel symbol={selectedSymbol} />
      )}
    </div>
  );
}

function PerpDetailPanel({ symbol }: { symbol: string }) {
  const { data, isLoading } = useSWR<any>(
    selectedSymbol ? `/api/v1/perps/${symbol}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  if (isLoading) {
    return <div className="h-48 animate-pulse rounded-xl bg-muted" />;
  }

  if (!data?.found) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-600">
        暂无该品种数据
      </div>
    );
  }

  const { cohort_breakdown, leverage_distribution } = data;

  return (
    <div className="rounded-xl border bg-card shadow-sm p-5 space-y-5">
      <h3 className="font-semibold text-lg">{symbol} 深度统计</h3>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "总仓位", value: data.total_positions },
          { label: "总 OI", value: `$${data.total_open_interest_usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
          { label: "平均杠杆", value: `${data.avg_leverage}x` },
          { label: "最高杠杆", value: `${data.max_leverage}x` },
          { label: "Bias", value: `${data.bias >= 0 ? "+" : ""}${(data.bias * 100).toFixed(1)}%` },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-bold mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* Cohort 分解 */}
      <div>
        <p className="text-sm font-medium mb-3">各规模 Cohort 多空分布</p>
        <div className="space-y-2">
          {Object.entries(cohort_breakdown || {})
            .filter(([, v]) => v.long_usd > 0 || v.short_usd > 0)
            .map(([cohort, stats]: [string, any]) => {
              const total = stats.long_usd + stats.short_usd;
              const longPct = total > 0 ? (stats.long_usd / total) * 100 : 50;
              return (
                <div key={cohort} className="flex items-center gap-3">
                  <span className="w-24 text-xs font-medium shrink-0">{COHORT_LABELS[cohort] || cohort}</span>
                  <div className="flex-1 h-4 rounded-full bg-red-500 overflow-hidden flex">
                    <div className="bg-green-500 h-full" style={{ width: `${longPct}%` }} />
                  </div>
                  <span className="text-xs font-mono w-16 text-right">
                    <span className="text-green-500">{stats.long_usd ? `$${stats.long_usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "-"}</span>
                    {" / "}
                    <span className="text-red-500">{stats.short_usd ? `$${stats.short_usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "-"}</span>
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      {/* 杠杆分布 */}
      <div>
        <p className="text-sm font-medium mb-3">杠杆分布</p>
        <div className="space-y-2">
          {(leverage_distribution || []).map((bucket: any) => (
            <div key={bucket.bucket} className="flex items-center gap-3">
              <span className="w-12 text-xs font-mono shrink-0">{bucket.bucket}</span>
              <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${Math.min((bucket.notional_usd / (data.total_open_interest_usd || 1)) * 100, 100)}%` }}
                />
              </div>
              <span className="text-xs font-mono text-muted-foreground w-24 text-right">
                {bucket.position_count} 仓位
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
