"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useApiQuery } from "@/hooks/use-api-query";
import { PageError } from "@/components/common/page-error";
import { PageLoading } from "@/components/common/page-loading";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ChevronDown, ChevronRight } from "lucide-react";

interface HeatmapCell {
  asset: string;
  cohort: string;
  bias: number; // -1 to 1, negative = short, positive = long
  total_long_usd: number;
  total_short_usd: number;
  wallet_count: number;
}

interface PositionHeatmapData {
  assets: string[];
  cohorts: string[];
  matrix: HeatmapCell[][];
  summary: {
    total_long_usd: number;
    total_short_usd: number;
    avg_bias: number;
    bias_label: string;
  };
}

interface WalletSummary {
  address: string;
  name?: string;
  total_pnl: number;
  win_rate: number;
  bias: number;
  avg_leverage: number;
}

function getBiasColor(bias: number): string {
  if (bias > 0.3) return "bg-green-500/80 hover:bg-green-500";
  if (bias > 0.1) return "bg-green-400/60 hover:bg-green-400";
  if (bias > 0) return "bg-green-300/40 hover:bg-green-300";
  if (bias === 0) return "bg-gray-700/60 hover:bg-gray-700";
  if (bias > -0.1) return "bg-red-300/40 hover:bg-red-300";
  if (bias > -0.3) return "bg-red-400/60 hover:bg-red-400";
  return "bg-red-500/80 hover:bg-red-500";
}

function getBiasLabel(bias: number): string {
  if (bias > 0.3) return "Strong Long";
  if (bias > 0.1) return "Long";
  if (bias > 0) return "Slight Long";
  if (bias === 0) return "Neutral";
  if (bias > -0.1) return "Slight Short";
  if (bias > -0.3) return "Short";
  return "Strong Short";
}

function formatUSD(v: number): string {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

export default function PositionHeatmapPage() {
  const t = useTranslations("dashboard");
  const [selectedCell, setSelectedCell] = useState<{ asset: string; cohort: string } | null>(null);
  const [expandedWallets, setExpandedWallets] = useState<Set<string>>(new Set());

  const queryPath = "/position-heatmap";
  const { data, loading, error } = useApiQuery<PositionHeatmapData>(queryPath, {
    pollingIntervalMs: 60000,
  });

  const handleCellClick = useCallback((asset: string, cohort: string) => {
    setSelectedCell((prev) =>
      prev?.asset === asset && prev?.cohort === cohort ? null : { asset, cohort }
    );
  }, []);

  if (loading) return <PageLoading />;
  if (error) return <PageError message={error instanceof Error ? error.message : String(error)} onRetry={() => window.location.reload()} />;
  if (!data) return null;

  const cohortLabels: Record<string, string> = {
    SHRIMP: "🦐 Shrimp",
    CRAB: "🦀 Crab",
    FISH: "🐟 Fish",
    DOLPHIN: "🐬 Dolphin",
    WHALE: "🐋 Whale",
    SHARK: "🦈 Shark",
    LEVIATHAN: "🦈 Leviathan",
    MONEY_PRINTER: "💰 Money Printer",
    PROFIT_TAKER: "💸 Profit Taker",
    BREAK_EVEN: "⚖️ Break Even",
    REKT: "💀 Rekt",
    GIGA_REKT: "☠️ Giga-Rekt",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">全局仓位热图</h1>
        <p className="text-muted-foreground text-sm mt-1">
          各交易标的 × 各 Cohort 群组的净多空偏向
        </p>
      </div>

      {/* Market Bias Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-muted-foreground text-xs mb-1">多头总额</p>
          <p className="text-lg font-semibold text-green-500">
            {formatUSD(data.summary.total_long_usd)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-muted-foreground text-xs mb-1">空头总额</p>
          <p className="text-lg font-semibold text-red-500">
            {formatUSD(data.summary.total_short_usd)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-muted-foreground text-xs mb-1">全市场 Bias</p>
          <p className={`text-lg font-semibold ${data.summary.avg_bias > 0 ? "text-green-500" : data.summary.avg_bias < 0 ? "text-red-500" : "text-gray-400"}`}>
            {data.summary.avg_bias > 0 ? "+" : ""}{(data.summary.avg_bias * 100).toFixed(1)}%
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-muted-foreground text-xs mb-1">市场方向</p>
          <Badge className={data.summary.avg_bias > 0 ? "bg-green-500/20 text-green-400 border-green-500/30" : data.summary.avg_bias < 0 ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"}>
            {data.summary.bias_label}
          </Badge>
        </Card>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="font-medium">颜色图例：</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-red-500/80" />
          <span>强空</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-red-400/60" />
          <span>空</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-red-300/40" />
          <span>轻空</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-gray-700/60" />
          <span>中性</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-green-300/40" />
          <span>轻多</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-green-400/60" />
          <span>多</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-green-500/80" />
          <span>强多</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <Card className="p-4 overflow-hidden">
        <ScrollArea className="w-full">
          <div className="min-w-[600px]">
            {/* Column headers */}
            <div className="flex">
              <div className="w-20 shrink-0 p-2 text-xs font-medium text-muted-foreground border-b border-r">
                标的 \ Cohort
              </div>
              {data.cohorts.map((cohort) => (
                <div
                  key={cohort}
                  className="flex-1 min-w-[100px] p-2 text-xs font-medium text-center border-b border-r last:border-r-0"
                >
                  {cohortLabels[cohort] ?? cohort}
                </div>
              ))}
            </div>

            {/* Rows */}
            {data.assets.map((asset) => (
              <div key={asset} className="flex">
                <div className="w-20 shrink-0 p-2 text-sm font-semibold border-r flex items-center">
                  {asset}
                </div>
                {data.matrix[data.assets.indexOf(asset)]?.map((cell, idx) => {
                  const isSelected =
                    selectedCell?.asset === asset && selectedCell?.cohort === cell.cohort;
                  return (
                    <div
                      key={cell.cohort}
                      className={`flex-1 min-w-[100px] h-16 p-1 border-r last:border-r-0 cursor-pointer transition-all ${isSelected ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""}`}
                      onClick={() => handleCellClick(asset, cell.cohort)}
                    >
                      <div
                        className={`w-full h-full rounded flex flex-col items-center justify-center text-xs transition-colors ${getBiasColor(cell.bias)}`}
                      >
                        <span className="font-semibold text-white">
                          {cell.bias > 0 ? "+" : ""}{(cell.bias * 100).toFixed(0)}%
                        </span>
                        <span className="text-white/70 text-[10px]">
                          {cell.wallet_count} 🪙
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </Card>

      {/* Expanded Wallet List */}
      {selectedCell && (
        <ExpandedCellPanel
          asset={selectedCell.asset}
          cohort={selectedCell.cohort}
        />
      )}
    </div>
  );
}

function ExpandedCellPanel({ asset, cohort }: { asset: string; cohort: string }) {
  const [expandedWallets, setExpandedWallets] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const queryPath = `/position-heatmap/${asset}/${cohort}?page=${page}&page_size=${pageSize}`;
  const { data, loading, error } = useApiQuery<{
    wallets: WalletSummary[];
    total: number;
    bias: number;
    total_long_usd: number;
    total_short_usd: number;
  }>(queryPath);

  const toggleWallet = useCallback((address: string) => {
    setExpandedWallets((prev) => {
      const next = new Set(prev);
      if (next.has(address)) next.delete(address);
      else next.add(address);
      return next;
    });
  }, []);

  if (loading) return <Card className="p-6 text-center text-muted-foreground">加载中...</Card>;
  if (error) return <Card className="p-6 text-center text-red-400">加载失败</Card>;
  if (!data) return null;

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">
            {asset} × {cohort} 钱包列表
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            共 {data.total} 个钱包 | Bias: {data.bias > 0 ? "+" : ""}{(data.bias * 100).toFixed(1)}%
            | 多头: {formatUSD(data.total_long_usd)} / 空头: {formatUSD(data.total_short_usd)}
          </p>
        </div>
        <Badge variant="outline">{data.wallets.length} / {data.total}</Badge>
      </div>

      <div className="space-y-2">
        {data.wallets.map((wallet) => (
          <div key={wallet.address} className="border rounded-lg p-3">
            <button
              className="w-full flex items-center justify-between"
              onClick={() => toggleWallet(wallet.address)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-mono">
                  {wallet.address.slice(2, 4).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="font-mono text-sm">{wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}</p>
                  {wallet.name && <p className="text-xs text-muted-foreground">{wallet.name}</p>}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className={`text-sm font-semibold ${wallet.total_pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {wallet.total_pnl >= 0 ? "+" : ""}${wallet.total_pnl.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">胜率 {wallet.win_rate}%</p>
                </div>
                <Badge className={wallet.bias > 0 ? "bg-green-500/20 text-green-400 border-green-500/30" : wallet.bias < 0 ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"}>
                  {wallet.bias > 0 ? "Long" : wallet.bias < 0 ? "Short" : "Neutral"}
                </Badge>
                {expandedWallets.has(wallet.address) ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </button>

            {expandedWallets.has(wallet.address) && (
              <div className="mt-3 pt-3 border-t space-y-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <p className="text-muted-foreground">平均杠杆</p>
                    <p className="font-medium">{wallet.avg_leverage}x</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Bias</p>
                    <p className={`font-semibold ${wallet.bias > 0 ? "text-green-500" : wallet.bias < 0 ? "text-red-500" : "text-gray-400"}`}>
                      {wallet.bias > 0 ? "+" : ""}{(wallet.bias * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">总 PNL</p>
                    <p className={`font-semibold ${wallet.total_pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {wallet.total_pnl >= 0 ? "+" : ""}${wallet.total_pnl.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">胜率</p>
                    <p className="font-medium">{wallet.win_rate}%</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                  <a href={`/dashboard/wallet/${wallet.address}`} target="_blank" rel="noopener noreferrer">
                    查看钱包详情 →
                  </a>
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {data.total > pageSize && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            上一页
          </Button>
          <span className="text-xs text-muted-foreground">
            {page} / {Math.ceil(data.total / pageSize)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page * pageSize >= data.total}
            onClick={() => setPage((p) => p + 1)}
          >
            下一页
          </Button>
        </div>
      )}
    </Card>
  );
}
