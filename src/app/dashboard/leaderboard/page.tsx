"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { useApiQuery } from "@/hooks/use-api-query";
import { LeaderboardResponse } from "@/types/dashboard";
import { PageError } from "@/components/common/page-error";
import { PageLoading } from "@/components/common/page-loading";
import { TableLoading } from "@/components/common/table-loading";

type TimeRange = "1h" | "24h" | "7d" | "30d" | "all";

const TIME_RANGES: { label: string; value: TimeRange }[] = [
  { label: "1H", value: "1h" },
  { label: "24H", value: "24h" },
  { label: "7D", value: "7d" },
  { label: "30D", value: "30d" },
  { label: "All", value: "all" },
];

function formatPnl(value: number | undefined | null): string {
  if (value == null) return "-";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function formatLastActive(lastActive: string | undefined): string {
  if (!lastActive) return "-";
  try {
    const date = new Date(lastActive);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return "-";
  }
}

export default function LeaderboardPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [sortBy, setSortBy] = useState<"score" | "total_pnl" | "win_rate" | "volume_30d" | "lifetime_trade_count">("score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const queryPath = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    params.set("sortBy", sortBy);
    params.set("sortDir", sortDir);
    params.set("timeRange", timeRange);
    if (search.trim()) params.set("search", search.trim());
    return `/wallets/leaderboard?${params.toString()}`;
  }, [page, pageSize, sortBy, sortDir, timeRange, search]);

  const { data, loading, error, refetch } = useApiQuery<LeaderboardResponse>(queryPath, {
    debounceMs: 250,
    staleTimeMs: 10_000,
    pollingIntervalMs: 30_000,
  });

  const totalPages = Math.max(1, Math.ceil((data?.pagination?.total ?? 0) / (data?.pagination?.pageSize ?? pageSize)));

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
    setPage(1);
  };

  // Auto-refresh every 30s when enabled
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      void refetch();
    }, 30_000);
    return () => clearInterval(interval);
  }, [autoRefresh, refetch]);

  if (loading && !data) return <PageLoading />;
  if (error && !data) return <PageError message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Smart Money 排行榜</h1>
        <div className="flex items-center gap-3">
          {autoRefresh && (
            <span className="text-xs text-muted-foreground animate-pulse">Auto-refresh: ON</span>
          )}
          <Button
            size="sm"
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh((v) => !v)}
          >
            {autoRefresh ? "⟳ On" : "⟳ Off"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => void refetch()}>
            ↻
          </Button>
        </div>
      </div>

      {/* Time Filter Tabs */}
      <Card className="p-1 inline-flex items-center gap-1">
        {TIME_RANGES.map((range) => (
          <button
            key={range.value}
            onClick={() => handleTimeRangeChange(range.value)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              timeRange === range.value
                ? "bg-blue-600 text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {range.label}
          </button>
        ))}
      </Card>

      {/* Filters Row */}
      <Card className="flex flex-col gap-3 p-3 md:flex-row md:items-center md:justify-between">
        <input
          className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm md:max-w-xs"
          placeholder="搜索钱包地址..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">排序</span>
          <Button size="sm" variant={sortBy === "score" ? "default" : "outline"} onClick={() => { setSortBy("score"); setPage(1); }}>
            Score
          </Button>
          <Button size="sm" variant={sortBy === "total_pnl" ? "default" : "outline"} onClick={() => { setSortBy("total_pnl"); setPage(1); }}>
            PnL
          </Button>
          <Button size="sm" variant={sortBy === "win_rate" ? "default" : "outline"} onClick={() => { setSortBy("win_rate"); setPage(1); }}>
            胜率
          </Button>
          <Button size="sm" variant={sortBy === "volume_30d" ? "default" : "outline"} onClick={() => { setSortBy("volume_30d"); setPage(1); }}>
            交易量
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-3 py-2.5 text-left font-medium">地址</th>
                <th className="px-3 py-2.5 text-left font-medium">Markets</th>
                <th className="px-3 py-2.5 text-right font-medium">Score</th>
                <th className="px-3 py-2.5 text-right font-medium">7D PnL</th>
                <th className="px-3 py-2.5 text-right font-medium">24H PnL</th>
                <th className="px-3 py-2.5 text-right font-medium">1H PnL</th>
                <th className="px-3 py-2.5 text-right font-medium">胜率</th>
                <th className="px-3 py-2.5 text-right font-medium">交易次数</th>
                <th className="px-3 py-2.5 text-left font-medium">最近活跃</th>
              </tr>
            </thead>
            <tbody>
              {(data?.items ?? []).map((item, idx) => {
                const rank = (page - 1) * pageSize + idx + 1;
                const pnl7d = item.pnl_7d ?? item.pnl7d ?? 0;
                const pnl24h = item.pnl_24h ?? item.pnl24h ?? 0;
                const pnl1h = item.pnl_1h ?? item.pnl1h ?? 0;
                const isTopHolder = item.is_top_holder ?? item.isTopHolder ?? false;
                const lastActive = item.last_active ?? item.lastActive;

                return (
                  <tr key={item.address} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xs w-5">#{rank}</span>
                        {isTopHolder && (
                          <span className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                            🐋 Top Holder
                          </span>
                        )}
                        <CopyButton value={item.address} />
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {(item.markets ?? []).slice(0, 5).map((m) => (
                          <span
                            key={m}
                            className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground"
                          >
                            {m}
                          </span>
                        ))}
                        {(item.markets?.length ?? 0) > 5 && (
                          <span className="text-xs text-muted-foreground">
                            +{(item.markets?.length ?? 0) - 5}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium">
                      {(item.score ?? 0).toFixed(1)}
                    </td>
                    <td className={`px-3 py-2.5 text-right font-mono ${pnl7d >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatPnl(pnl7d)}
                    </td>
                    <td className={`px-3 py-2.5 text-right font-mono ${pnl24h >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatPnl(pnl24h)}
                    </td>
                    <td className={`px-3 py-2.5 text-right font-mono ${pnl1h >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatPnl(pnl1h)}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span className={item.win_rate ?? item.winRate ? "" : "text-muted-foreground"}>
                        {item.win_rate ?? item.winRate ?? 0}%
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right text-muted-foreground">
                      {item.lifetime_trade_count ?? item.trades ?? 0}
                    </td>
                    <td className="px-3 py-2.5 text-left text-muted-foreground text-xs">
                      {formatLastActive(lastActive)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {loading && <TableLoading rows={6} columns={8} />}
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {search.trim()
            ? `Showing ${data?.items?.length ?? 0} results for '${search.trim()}'`
            : `共 ${data?.pagination?.total ?? 0} 条结果`}
        </span>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            上一页
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button size="sm" variant="outline" disabled={!(data?.pagination?.hasMore)} onClick={() => setPage((p) => p + 1)}>
            下一页
          </Button>
        </div>
      </div>
    </div>
  );
}
