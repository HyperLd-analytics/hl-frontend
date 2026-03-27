"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApiQuery } from "@/hooks/use-api-query";
import { PageError } from "@/components/common/page-error";
import { PageLoading } from "@/components/common/page-loading";

type WalletCompare = {
  address: string;
  label: string;
  score: number;
  totalPnl: number;
  winRate: number;
  volume30d: number;
  lifetimeTradeCount: number;
  accountValue: number;
  avgPositionSize: number;
  maxLeverage: number;
  sizeCohort: string;
  pnlCohort: string;
  lastActive: string | null;
};

type CompareResponse = {
  wallets: WalletCompare[];
  summary: {
    bestPnl: { address: string; value: number };
    bestWinRate: { address: string; value: number };
    bestScore: { address: string; value: number };
    bestVolume: { address: string; value: number };
  };
  count: number;
};

function shortAddr(a: string) {
  return `${a.slice(0, 6)}...${a.slice(-4)}`;
}

function fmtUSD(v: number) {
  return v >= 0 ? `+$${v.toFixed(2)}` : `-$${Math.abs(v).toFixed(2)}`;
}

function MetricRow({ label, values, best }: { label: string; values: { addr: string; v: string; raw: number }[]; best: number }) {
  return (
    <tr className="border-t border-border">
      <td className="px-3 py-2 text-muted-foreground">{label}</td>
      {values.map((r, i) => (
        <td
          key={i}
          className={`px-3 py-2 text-center text-sm ${
            r.raw === best && r.raw !== 0 ? "font-bold text-green-400" : ""
          }`}
        >
          {r.v}
        </td>
      ))}
    </tr>
  );
}

export default function ComparePage() {
  const [input, setInput] = useState("");
  const [addresses, setAddresses] = useState<string[]>([]);

  const queryPath = addresses.length > 0
    ? `/wallets/compare?addresses=${addresses.map(encodeURIComponent).join(",")}`
    : "";

  const { data, loading, error, refetch } = useApiQuery<CompareResponse>(queryPath, {
    enabled: addresses.length > 0,
    debounceMs: 300,
  });

  const handleAdd = () => {
    const trimmed = input.trim().replace(/,/g, "").split(/\s+/).filter(Boolean);
    if (!trimmed.length) return;
    const newAddrs = [...addresses, ...trimmed].slice(0, 5);
    setAddresses(newAddrs);
    setInput("");
  };

  const handleRemove = (addr: string) => setAddresses((prev) => prev.filter((a) => a !== addr));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">钱包对比分析</h1>

      {/* 地址输入 */}
      <Card className="space-y-3 p-4">
        <div className="text-sm text-muted-foreground">
          输入钱包地址进行对比（最多 5 个，回车或点击添加）
        </div>
        <div className="flex gap-2">
          <input
            className="h-10 flex-1 rounded-md border border-border bg-background px-3 text-sm font-mono"
            placeholder="0x... 或多个地址（空格分隔）"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Button onClick={handleAdd} disabled={!input.trim()}>
            添加
          </Button>
        </div>
        {addresses.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {addresses.map((a) => (
              <span
                key={a}
                className="inline-flex items-center gap-1 rounded bg-muted px-2 py-1 font-mono text-xs"
              >
                {shortAddr(a)}
                <button
                  className="ml-1 text-muted-foreground hover:text-red-400"
                  onClick={() => handleRemove(a)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </Card>

      {/* 对比结果 */}
      {addresses.length > 0 && (
        <>
          {loading && !data && <PageLoading />}
          {error && !data && <PageError message={error.message} onRetry={refetch} />}

          {data && (
            <>
              {/* 最佳指标摘要 */}
              {data.summary && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {([
                    ["最高 PnL", data.summary.bestPnl, fmtUSD],
                    ["最高胜率", data.summary.bestWinRate, (v: number) => `${v.toFixed(1)}%`],
                    ["最高评分", data.summary.bestScore, (v: number) => v.toFixed(1)],
                    ["最大交易量", data.summary.bestVolume, fmtUSD],
                  ] as const).map(([label, item, fmt]) => (
                    <Card key={label} className="p-4">
                      <div className="text-xs text-muted-foreground">{label}</div>
                      <div className="mt-1 text-lg font-bold text-green-400">{fmt(item.value)}</div>
                      <div className="mt-1 truncate font-mono text-xs text-muted-foreground">
                        {shortAddr(item.address)}
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* 对比表格 */}
              {data.wallets.length > 0 ? (
                <Card className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-3 py-2 text-left text-muted-foreground">指标</th>
                        {data.wallets.map((w) => (
                          <th key={w.address} className="px-3 py-2 text-center">
                            <div className="font-mono text-xs">{shortAddr(w.address)}</div>
                            <div className="text-xs font-normal text-muted-foreground">{w.label}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <MetricRow
                        label="综合评分"
                        values={data.wallets.map((w) => ({ addr: w.address, v: (w.score ?? 0).toFixed(1), raw: w.score ?? 0 }))}
                        best={Math.max(...data.wallets.map((w) => w.score ?? 0))}
                      />
                      <MetricRow
                        label="累计 PnL"
                        values={data.wallets.map((w) => ({ addr: w.address, v: fmtUSD(w.totalPnl), raw: w.totalPnl ?? 0 }))}
                        best={Math.max(...data.wallets.map((w) => w.totalPnl ?? 0))}
                      />
                      <MetricRow
                        label="胜率"
                        values={data.wallets.map((w) => ({ addr: w.address, v: `${(w.winRate ?? 0).toFixed(1)}%`, raw: w.winRate ?? 0 }))}
                        best={Math.max(...data.wallets.map((w) => w.winRate ?? 0))}
                      />
                      <MetricRow
                        label="30天交易量"
                        values={data.wallets.map((w) => ({ addr: w.address, v: fmtUSD(w.volume30d), raw: w.volume30d }))}
                        best={Math.max(...data.wallets.map((w) => w.volume30d))}
                      />
                      <MetricRow
                        label="累计交易次数"
                        values={data.wallets.map((w) => ({ addr: w.address, v: String(w.lifetimeTradeCount), raw: w.lifetimeTradeCount }))}
                        best={Math.max(...data.wallets.map((w) => w.lifetimeTradeCount))}
                      />
                      <MetricRow
                        label="账户价值"
                        values={data.wallets.map((w) => ({ addr: w.address, v: fmtUSD(w.accountValue), raw: w.accountValue }))}
                        best={Math.max(...data.wallets.map((w) => w.accountValue))}
                      />
                      <MetricRow
                        label="平均仓位"
                        values={data.wallets.map((w) => ({ addr: w.address, v: fmtUSD(w.avgPositionSize), raw: w.avgPositionSize }))}
                        best={Math.max(...data.wallets.map((w) => w.avgPositionSize))}
                      />
                      <MetricRow
                        label="最大杠杆"
                        values={data.wallets.map((w) => ({ addr: w.address, v: `${w.maxLeverage}x`, raw: w.maxLeverage }))}
                        best={Math.max(...data.wallets.map((w) => w.maxLeverage))}
                      />
                      <MetricRow
                        label="资金规模"
                        values={data.wallets.map((w) => ({ addr: w.address, v: w.sizeCohort, raw: 0 }))}
                        best={-1}
                      />
                      <MetricRow
                        label="盈亏分组"
                        values={data.wallets.map((w) => ({ addr: w.address, v: w.pnlCohort, raw: 0 }))}
                        best={-1}
                      />
                    </tbody>
                  </table>
                </Card>
              ) : (
                <Card className="py-12 text-center text-muted-foreground">
                  未找到匹配的钱包
                </Card>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
