"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { useApiQuery } from "@/hooks/use-api-query";
import { PageError } from "@/components/common/page-error";
import { PageLoading } from "@/components/common/page-loading";

interface CompareWallet {
  address: string;
  total_pnl?: number;
  pnl?: number;
  win_rate?: number;
  winRate?: number;
  volume?: number;
  volume_30d?: number;
  leverage?: number;
  avg_leverage?: number;
  last_active?: string;
  lastActive?: string;
}

interface CompareResponse {
  wallets?: CompareWallet[];
  error?: string;
}

function formatPnl(value: number | undefined | null): string {
  if (value == null) return "-";
  const sign = value >= 0 ? "+" : "";
  return `${sign}$${value.toFixed(2)}`;
}

function formatVolume(value: number | undefined | null): string {
  if (value == null) return "-";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

export default function ComparePage() {
  const [addresses, setAddresses] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const queryPath = useMemo(() => {
    if (addresses.length === 0) return null;
    const params = new URLSearchParams();
    addresses.forEach((addr) => params.append("addresses", addr));
    return `/compare?${params.toString()}`;
  }, [addresses]);

  const { data, loading, refetch } = useApiQuery<CompareResponse>(queryPath, {
    enabled: !!queryPath,
    staleTimeMs: 15_000,
  });

  const handleAddAddress = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (!/^0x[a-fA-F0-9]{32,44}$/.test(trimmed)) {
      setError("Invalid Ethereum address format");
      return;
    }
    if (addresses.includes(trimmed)) {
      setError("Address already added");
      return;
    }
    if (addresses.length >= 10) {
      setError("Maximum 10 addresses allowed");
      return;
    }
    setAddresses((prev) => [...prev, trimmed]);
    setInput("");
    setError(null);
  };

  const handleRemove = (addr: string) => {
    setAddresses((prev) => prev.filter((a) => a !== addr));
  };

  const wallets: CompareWallet[] = data?.wallets ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">钱包对比</h1>
        <p className="text-sm text-muted-foreground mt-1">
          输入钱包地址进行对比分析
        </p>
      </div>

      {/* Address Input */}
      <Card className="p-4">
        <div className="flex gap-2">
          <input
            className="flex-1 h-9 rounded-md border border-border bg-background px-3 text-sm"
            placeholder="输入钱包地址 (0x...)"
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(null); }}
            onKeyDown={(e) => { if (e.key === "Enter") handleAddAddress(); }}
          />
          <Button size="sm" onClick={handleAddAddress}>添加</Button>
        </div>
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        {addresses.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {addresses.map((addr) => (
              <div key={addr} className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs">
                <span className="font-mono">{addr.slice(0, 6)}...{addr.slice(-4)}</span>
                <button
                  onClick={() => handleRemove(addr)}
                  className="text-muted-foreground hover:text-foreground ml-1"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Compare Button */}
      {addresses.length >= 2 && (
        <div className="flex gap-2">
          <Button onClick={() => void refetch()} disabled={loading}>
            {loading ? "加载中..." : "开始对比"}
          </Button>
        </div>
      )}

      {/* Results Table */}
      {queryPath && (
        <>
          {loading && !data ? (
            <PageLoading />
          ) : data?.error ? (
            <PageError message={data.error} onRetry={() => void refetch()} />
          ) : wallets.length > 0 ? (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2.5 text-left font-medium">地址</th>
                      <th className="px-3 py-2.5 text-right font-medium">总 PnL</th>
                      <th className="px-3 py-2.5 text-right font-medium">30D 交易量</th>
                      <th className="px-3 py-2.5 text-right font-medium">胜率</th>
                      <th className="px-3 py-2.5 text-right font-medium">平均杠杆</th>
                      <th className="px-3 py-2.5 text-left font-medium">最近活跃</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wallets.map((wallet) => (
                      <tr key={wallet.address} className="border-t border-border hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-2.5">
                          <CopyButton value={wallet.address} />
                        </td>
                        <td className={`px-3 py-2.5 text-right font-mono ${
                          (wallet.total_pnl ?? wallet.pnl ?? 0) >= 0 ? "text-green-600" : "text-red-600"
                        }`}>
                          {formatPnl(wallet.total_pnl ?? wallet.pnl)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono">
                          {formatVolume(wallet.volume ?? wallet.volume_30d)}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          {wallet.win_rate ?? wallet.winRate ?? "-"}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          {(wallet.leverage ?? wallet.avg_leverage) != null
                            ? `${wallet.leverage ?? wallet.avg_leverage}x`
                            : "-"}
                        </td>
                        <td className="px-3 py-2.5 text-left text-muted-foreground text-xs">
                          {wallet.last_active ?? wallet.lastActive ?? "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center text-muted-foreground">
              暂无对比数据
            </Card>
          )}
        </>
      )}

      {/* Quick Stats Comparison */}
      {wallets.length >= 2 && (
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-3">快速对比</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {([
              { label: "最高 PnL", key: "pnl", higher: true },
              { label: "最高交易量", key: "volume", higher: true },
              { label: "最高胜率", key: "winRate", higher: true },
              { label: "最高杠杆", key: "leverage", higher: false },
            ] as const).map(({ label, key, higher }) => {
              interface Best { addr: string; val: number }
              let best: Best | null = null;
              for (const w of wallets) {
                const val: number | null = key === "pnl"
                  ? (w.total_pnl ?? w.pnl ?? null)
                  : key === "volume"
                  ? (w.volume ?? w.volume_30d ?? null)
                  : key === "winRate"
                  ? (w.win_rate ?? w.winRate ?? null)
                  : (w.leverage ?? w.avg_leverage ?? null);
                if (val != null && (best === null || (higher ? val > best.val : val < best.val))) {
                  best = { addr: w.address, val };
                }
              }
              return (
                <div key={key} className="text-center">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  {best && (
                    <>
                      <p className="text-sm font-medium mt-1 font-mono">
                        {key === "winRate" ? `${best.val}%`
                         : key === "leverage" ? `${best.val}x`
                         : key === "volume" ? formatVolume(best.val)
                         : formatPnl(best.val)}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        {best.addr.slice(0, 6)}...{best.addr.slice(-4)}
                      </p>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
