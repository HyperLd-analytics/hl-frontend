"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApiQuery } from "@/hooks/use-api-query";
import { WalletFilterPanel } from "@/components/common/wallet-filter-panel";
import { PageError } from "@/components/common/page-error";
import { PageLoading } from "@/components/common/page-loading";
import { TableLoading } from "@/components/common/table-loading";
import {
  SavedFilter,
  SIZE_COHORT_LABELS,
  WalletFilter,
  WalletLeaderboardResponse,
} from "@/types/wallet";
import { useApi } from "@/hooks/use-api";

const DEFAULT_FILTERS: WalletFilter = {
  sortBy: "score",
  sortDir: "desc",
  search: "",
};

function formatPnl(v: number | undefined) {
  if (v === undefined || v === null) return "-";
  return v >= 0 ? `+$${v.toFixed(2)}` : `-$${Math.abs(v).toFixed(2)}`;
}

function formatVolume(v: number | undefined) {
  if (!v) return "-";
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
}

export default function LeaderboardPage() {
  const { request } = useApi();
  const [filters, setFilters] = useState<WalletFilter>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);

  // 加载已保存的筛选器
  const loadSavedFilters = useCallback(async () => {
    try {
      const data = await request<SavedFilter[]>({
        path: "/saved-filters?filter_type=cohort_leaderboard",
        method: "GET",
      });
      setSavedFilters(data);
    } catch {
      // ignore
    }
  }, [request]);

  useEffect(() => {
    loadSavedFilters();
  }, [loadSavedFilters]);

  // 构建查询路径
  const queryPath = (() => {
    const params = new URLSearchParams();
    params.set("sort_by", filters.sortBy);
    params.set("sort_dir", filters.sortDir);
    params.set("page", String(page));
    params.set("page_size", "20");
    if (filters.search?.trim()) params.set("search", filters.search.trim());
    if (filters.minScore != null) params.set("min_score", String(filters.minScore));
    if (filters.maxScore != null) params.set("max_score", String(filters.maxScore));
    if (filters.minPnl != null) params.set("min_pnl", String(filters.minPnl));
    if (filters.maxPnl != null) params.set("max_pnl", String(filters.maxPnl));
    if (filters.minWinRate != null) params.set("min_win_rate", String(filters.minWinRate));
    if (filters.maxWinRate != null) params.set("max_win_rate", String(filters.maxWinRate));
    if (filters.minVolume != null) params.set("min_volume", String(filters.minVolume));
    if (filters.maxVolume != null) params.set("max_volume", String(filters.maxVolume));
    if (filters.sizeCohort) params.set("size_cohort", filters.sizeCohort);
    if (filters.pnlCohort) params.set("pnl_cohort", filters.pnlCohort);
    if (filters.label) params.set("label", filters.label);
    return `/wallets/leaderboard?${params.toString()}`;
  })();

  const { data, loading, error, refetch } = useApiQuery<WalletLeaderboardResponse>(queryPath, {
    debounceMs: 250,
    staleTimeMs: 30_000,
  });

  const totalPages = Math.max(
    1,
    Math.ceil((data?.pagination?.total ?? 0) / (data?.pagination?.pageSize ?? 20)),
  );

  // 搜索变化时重置页码
  const handleSearchChange = (search: string) => {
    setFilters((f) => ({ ...f, search }));
    setPage(1);
  };

  // 筛选变化时重置页码
  const handleFiltersChange = (newFilters: WalletFilter) => {
    setFilters(newFilters);
    setPage(1);
  };

  if (loading && !data) return <PageLoading />;
  if (error && !data) return <PageError message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Smart Money 排行榜</h1>

      {/* 搜索 */}
      <Card className="flex items-center gap-2 p-3">
        <input
          className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
          placeholder="搜索钱包地址..."
          value={filters.search ?? ""}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
        <span className="shrink-0 text-sm text-muted-foreground">
          共 {data?.pagination?.total ?? 0} 个钱包
        </span>
      </Card>

      {/* 筛选面板 */}
      <WalletFilterPanel
        filters={filters}
        onFiltersChange={handleFiltersChange}
        savedFilters={savedFilters}
        onSavedFiltersChange={loadSavedFilters}
      />

      {/* 排行榜表格 */}
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">地址</th>
              <th className="px-3 py-2 text-left">评分</th>
              <th className="px-3 py-2 text-left">累计 PnL</th>
              <th className="px-3 py-2 text-left">胜率</th>
              <th className="px-3 py-2 text-left hidden md:table-cell">30天交易量</th>
              <th className="px-3 py-2 text-left hidden lg:table-cell">资金规模</th>
              <th className="px-3 py-2 text-left hidden lg:table-cell">最后活跃</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items ?? []).map((item) => (
              <tr key={item.address} className="border-t border-border hover:bg-muted/50">
                <td className="px-3 py-2">
                  <a
                    href={`/dashboard/wallet/${item.address}`}
                    className="font-mono text-xs text-primary hover:underline"
                  >
                    {item.address.slice(0, 6)}...{item.address.slice(-4)}
                  </a>
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${
                      item.score >= 80
                        ? "bg-green-500/20 text-green-500"
                        : item.score >= 50
                          ? "bg-yellow-500/20 text-yellow-500"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {item.score.toFixed(1)}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className={item.total_pnl >= 0 ? "text-green-500" : "text-red-500"}>
                    {formatPnl(item.total_pnl)}
                  </span>
                </td>
                <td className="px-3 py-2">{item.win_rate?.toFixed(1)}%</td>
                <td className="px-3 py-2 hidden md:table-cell">{formatVolume(item.volume_30d_usd)}</td>
                <td className="px-3 py-2 hidden lg:table-cell">
                  {item.size_cohort
                    ? `${SIZE_COHORT_LABELS[item.size_cohort] ?? ""} ${item.size_cohort}`
                    : "-"}
                </td>
                <td className="px-3 py-2 hidden lg:table-cell">
                  {item.last_active
                    ? new Date(item.last_active).toLocaleDateString("zh-CN")
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <TableLoading rows={6} columns={7} />}
        {(!data?.items || data.items.length === 0) && !loading && (
          <div className="py-12 text-center text-muted-foreground">暂无数据</div>
        )}
      </Card>

      {/* 分页 */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          第 {page} / {totalPages} 页
        </span>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            上一页
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            下一页
          </Button>
        </div>
      </div>
    </div>
  );
}
