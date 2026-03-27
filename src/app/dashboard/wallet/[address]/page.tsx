"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApiQuery } from "@/hooks/use-api-query";
import { WalletAnalysis } from "@/types/dashboard";
import { PageError } from "@/components/common/page-error";
import { PageLoading } from "@/components/common/page-loading";
import { TableLoading } from "@/components/common/table-loading";

type PositionWithSignal = {
  symbol: string;
  side: "long" | "short";
  size: number;
  signal?: "buy" | "sell";
};

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

  // Track previous positions to compute buy/sell signals
  const prevPositionsRef = useRef<Map<string, number>>(new Map());
  const positionsWithSignal: PositionWithSignal[] = useMemo(() => {
    const prev = prevPositionsRef.current;
    const curr = new Map<string, number>();
    const result: PositionWithSignal[] = [];
    for (const p of data?.positions ?? []) {
      const key = `${p.symbol}-${p.side}`;
      const prevSize = prev.get(key) ?? 0;
      const currSize = p.size;
      curr.set(key, currSize);
      let signal: "buy" | "sell" | undefined;
      if (prevSize > 0 && currSize > prevSize) signal = "buy";
      else if (prevSize > 0 && currSize < prevSize) signal = "sell";
      result.push({ symbol: p.symbol, side: p.side, size: p.size, signal });
    }
    prevPositionsRef.current = curr;
    return result;
  }, [data?.positions]);

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
          {positionsWithSignal.map((p) => (
            <div key={`${p.symbol}-${p.side}`} className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                {p.signal === "buy" && (
                  <span className="inline-flex items-center rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
                    🟢 BUY
                  </span>
                )}
                {p.signal === "sell" && (
                  <span className="inline-flex items-center rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900 dark:text-red-300">
                    🔴 SELL
                  </span>
                )}
                <span className="text-muted-foreground">{p.symbol}</span>
                <span className="text-xs text-muted-foreground">· {p.side.toUpperCase()}</span>
              </span>
              <span className={p.signal === "buy" ? "text-green-600" : p.signal === "sell" ? "text-red-600" : ""}>
                {p.size}
              </span>
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
