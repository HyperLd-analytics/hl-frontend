"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApiQuery } from "@/hooks/use-api-query";
import { WalletAnalysis } from "@/types/dashboard";
import { PageError } from "@/components/common/page-error";
import { PageLoading } from "@/components/common/page-loading";
import { TableLoading } from "@/components/common/table-loading";

export default function WalletDetailPage() {
  const params = useParams<{ address: string }>();
  const address = params.address;
  const [sideFilter, setSideFilter] = useState<"all" | "long" | "short">("all");
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const queryPath = useMemo(() => {
    if (!address) return "";
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    if (sideFilter !== "all") params.set("side", sideFilter);
    return `/wallets/${encodeURIComponent(address)}?${params.toString()}`;
  }, [address, page, pageSize, sideFilter]);
  const { data, loading, error, refetch } = useApiQuery<WalletAnalysis>(
    queryPath,
    { enabled: Boolean(address), debounceMs: 120, staleTimeMs: 8_000, pollingIntervalMs: 15_000 }
  );
  const totalPages = Math.max(1, Math.ceil((data?.totalPositions ?? 0) / (data?.pageSize ?? pageSize)));

  if (loading && !data) return <PageLoading />;
  if (error && !data) return <PageError message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">钱包分析：{address}</h1>
      <Card className="space-y-2">
        <p>标签：{data?.tags?.join(", ") || "-"}</p>
        <p>7D PnL：{data?.pnl7d ?? 0}</p>
        <p>30D PnL：{data?.pnl30d ?? 0}</p>
      </Card>
      <Card>
        <h2 className="mb-2 font-medium">当前仓位</h2>
        <div className="mb-3 flex items-center gap-2">
          <Button
            size="sm"
            variant={sideFilter === "all" ? "default" : "outline"}
            onClick={() => {
              setSideFilter("all");
              setPage(1);
            }}
          >
            全部
          </Button>
          <Button
            size="sm"
            variant={sideFilter === "long" ? "default" : "outline"}
            onClick={() => {
              setSideFilter("long");
              setPage(1);
            }}
          >
            Long
          </Button>
          <Button
            size="sm"
            variant={sideFilter === "short" ? "default" : "outline"}
            onClick={() => {
              setSideFilter("short");
              setPage(1);
            }}
          >
            Short
          </Button>
        </div>
        <div className="space-y-2 text-sm">
          {(data?.positions ?? []).map((p) => (
            <div key={`${p.symbol}-${p.side}`} className="flex justify-between">
              <span>
                {p.symbol} · {p.side.toUpperCase()}
              </span>
              <span>{p.size}</span>
            </div>
          ))}
        </div>
        {loading && <TableLoading rows={4} columns={2} />}
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((prev) => prev - 1)}>
            上一页
          </Button>
          <span className="text-xs text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((prev) => prev + 1)}>
            下一页
          </Button>
        </div>
      </Card>
    </div>
  );
}
