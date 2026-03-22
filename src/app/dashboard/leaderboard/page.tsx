"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApiQuery } from "@/hooks/use-api-query";
import { LeaderboardResponse } from "@/types/dashboard";
import { PageError } from "@/components/common/page-error";
import { PageLoading } from "@/components/common/page-loading";
import { TableLoading } from "@/components/common/table-loading";

export default function LeaderboardPage() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"roi" | "winRate" | "trades">("roi");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const queryPath = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    params.set("sortBy", sortBy);
    if (search.trim()) params.set("search", search.trim());
    return `/wallets/leaderboard?${params.toString()}`;
  }, [page, pageSize, search, sortBy]);

  const { data, loading, error, refetch } = useApiQuery<LeaderboardResponse>(queryPath, {
    debounceMs: 250,
    staleTimeMs: 10_000,
    pollingIntervalMs: 20_000
  });
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.pageSize ?? pageSize)));

  if (loading && !data) return <PageLoading />;
  if (error && !data) return <PageError message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Smart Money 排行榜</h1>
      <Card className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <input
          className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm md:max-w-sm"
          placeholder="搜索钱包地址"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">排序</span>
          <Button size="sm" variant={sortBy === "roi" ? "default" : "outline"} onClick={() => setSortBy("roi")}>
            ROI
          </Button>
          <Button size="sm" variant={sortBy === "winRate" ? "default" : "outline"} onClick={() => setSortBy("winRate")}>
            胜率
          </Button>
          <Button size="sm" variant={sortBy === "trades" ? "default" : "outline"} onClick={() => setSortBy("trades")}>
            交易次数
          </Button>
        </div>
      </Card>
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-muted-foreground">
            <tr>
              <th className="px-2 py-2 text-left">地址</th>
              <th className="px-2 py-2 text-left">ROI</th>
              <th className="px-2 py-2 text-left">胜率</th>
              <th className="px-2 py-2 text-left">交易次数</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items ?? []).map((item) => (
              <tr key={item.address} className="border-t border-border">
                <td className="px-2 py-2">{item.address}</td>
                <td className="px-2 py-2">{item.roi}%</td>
                <td className="px-2 py-2">{item.winRate}%</td>
                <td className="px-2 py-2">{item.trades}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <TableLoading rows={6} columns={4} />}
      </Card>
      <div className="flex items-center justify-end gap-2">
        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          上一页
        </Button>
        <span className="text-sm text-muted-foreground">
          {page} / {totalPages}
        </span>
        <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
          下一页
        </Button>
      </div>
    </div>
  );
}
