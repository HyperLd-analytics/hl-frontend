"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApiQuery } from "@/hooks/use-api-query";
import { PageError } from "@/components/common/page-error";
import { PageLoading } from "@/components/common/page-loading";
import { TableLoading } from "@/components/common/table-loading";

type Position = {
  symbol: string;
  positionSize: number;
  entryPrice: number;
  markPrice: number;
  leverage: number;
  liquidationPx?: number;
  unrealizedPnl?: number;
  positionValue?: number;
  returnOnEquity?: number;
  snapshotAt: string;
};

type PositionHistoryEvent = {
  symbol: string;
  changeType: string;
  previousSize: number;
  currentSize: number;
  changeAmount: number;
  entryPrice: number;
  markPrice: number;
  leverage: number;
  unrealizedPnl: number;
  pnlPercent: number;
  snapshotAt: string;
};

type PositionsResponse = { address: string; positions: Position[]; message?: string };
type HistoryResponse = { address: string; events: PositionHistoryEvent[]; total: number; message?: string };

const CHANGE_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  open: { label: "开仓", color: "bg-blue-500/20 text-blue-400" },
  close: { label: "平仓", color: "bg-red-500/20 text-red-400" },
  add: { label: "增仓", color: "bg-green-500/20 text-green-400" },
  reduce: { label: "减仓", color: "bg-yellow-500/20 text-yellow-400" },
};

function formatUSD(v?: number | null) {
  if (v === undefined || v === null) return "-";
  return v >= 0 ? `+$${v.toFixed(2)}` : `-$${Math.abs(v).toFixed(2)}`;
}
function formatPct(v?: number | null) {
  if (v === undefined || v === null) return "-";
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}

export default function WalletDetailPage() {
  const params = useParams<{ address: string }>();
  const address = params.address;
  const [tab, setTab] = useState<"positions" | "history">("positions");
  const [historyLimit] = useState(30);

  const {
    data: positions,
    loading: posLoading,
    error: posError,
    refetch: posRefetch,
  } = useApiQuery<PositionsResponse>(
    `/positions/${encodeURIComponent(address!)}/current`,
    { enabled: Boolean(address) && tab === "positions", staleTimeMs: 30_000, pollingIntervalMs: 60_000 },
  );

  const {
    data: history,
    loading: histLoading,
    error: histError,
    refetch: histRefetch,
  } = useApiQuery<HistoryResponse>(
    `/positions/${encodeURIComponent(address!)}/history?limit=${historyLimit}`,
    { enabled: Boolean(address) && tab === "history", staleTimeMs: 30_000 },
  );

  if (!address) return null;

  const loading = tab === "positions" ? posLoading : histLoading;
  const error = tab === "positions" ? posError : histError;
  const refetch = tab === "positions" ? posRefetch : histRefetch;

  if (loading && !positions && !history) return <PageLoading />;
  if (error && !positions && !history) return <PageError message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          钱包追踪
          <span className="ml-2 font-mono text-sm text-muted-foreground">
            {address?.slice(0, 8)}...{address?.slice(-6)}
          </span>
        </h1>
        {/* Tab 切换 */}
        <div className="flex gap-1 rounded-md border border-border p-1">
          {(["positions", "history"] as const).map((t) => (
            <Button
              key={t}
              size="sm"
              variant={tab === t ? "default" : "ghost"}
              onClick={() => setTab(t)}
            >
              {t === "positions" ? "当前仓位" : "仓位变动"}
            </Button>
          ))}
        </div>
      </div>

      {/* 当前仓位 */}
      {tab === "positions" && (
        <>
          {positions?.positions && positions.positions.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {positions.positions.map((p) => {
                const pnlColor = (p.unrealizedPnl ?? 0) >= 0 ? "text-green-400" : "text-red-400";
                return (
                  <Card key={p.symbol} className="space-y-2 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold">{p.symbol}</span>
                      <span className="text-xs text-muted-foreground">
                        {p.leverage}x 杠杆
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      <div>
                        <div className="text-xs text-muted-foreground">持仓数量</div>
                        <div>{(p.positionSize ?? 0).toFixed(4)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">开仓均价</div>
                        <div>${(p.entryPrice ?? 0).toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">标记价格</div>
                        <div>${(p.markPrice ?? 0).toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">强平价格</div>
                        <div>{p.liquidationPx ? `$${p.liquidationPx.toFixed(2)}` : "-"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">未实现盈亏</div>
                        <div className={pnlColor}>{formatUSD(p.unrealizedPnl)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">收益率</div>
                        <div className={pnlColor}>{formatPct(p.returnOnEquity)}</div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="py-12 text-center text-muted-foreground">
              当前无活跃仓位
            </Card>
          )}
          {posLoading && <TableLoading rows={3} columns={6} />}
        </>
      )}

      {/* 仓位变动历史 */}
      {tab === "history" && (
        <>
          {history?.events && history.events.length > 0 ? (
            <Card className="overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">时间</th>
                    <th className="px-3 py-2 text-left">币种</th>
                    <th className="px-3 py-2 text-left">变动类型</th>
                    <th className="px-3 py-2 text-right">数量变化</th>
                    <th className="px-3 py-2 text-right">当前数量</th>
                    <th className="px-3 py-2 text-right">开仓均价</th>
                    <th className="px-3 py-2 text-right">盈亏</th>
                  </tr>
                </thead>
                <tbody>
                  {history.events.map((e, i) => {
                    const ct = CHANGE_TYPE_LABELS[e.changeType] ?? { label: e.changeType, color: "bg-muted" };
                    return (
                      <tr key={i} className="border-t border-border">
                        <td className="px-3 py-2 text-muted-foreground">
                          {new Date(e.snapshotAt).toLocaleString("zh-CN")}
                        </td>
                        <td className="px-3 py-2 font-medium">{e.symbol}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-block rounded px-1.5 py-0.5 text-xs ${ct.color}`}>
                            {ct.label}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span className={e.changeAmount >= 0 ? "text-green-400" : "text-red-400"}>
                            {e.changeAmount >= 0 ? "+" : ""}{e.changeAmount.toFixed(4)}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">{(e.currentSize ?? 0).toFixed(4)}</td>
                        <td className="px-3 py-2 text-right">${(e.entryPrice ?? 0).toFixed(2)}</td>
                        <td className="px-3 py-2 text-right">
                          <span className={e.unrealizedPnl >= 0 ? "text-green-400" : "text-red-400"}>
                            {formatUSD(e.unrealizedPnl)} ({formatPct(e.pnlPercent)})
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          ) : (
            <Card className="py-12 text-center text-muted-foreground">
              暂无仓位变动记录
            </Card>
          )}
          {histLoading && <TableLoading rows={5} columns={7} />}
        </>
      )}
    </div>
  );
}
