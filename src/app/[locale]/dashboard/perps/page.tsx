"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useApiQuery } from "@/hooks/use-api-query";
import { PageError } from "@/components/common/page-error";
import { PageLoading } from "@/components/common/page-loading";
import { cn } from "@/lib/utils";

interface Perp {
  symbol: string;
  bias: number;
  bias_label: string;
  total_long_usd: number;
  total_short_usd: number;
  total_open_interest_usd: number;
  avg_leverage: number;
  position_count: number;
}

interface PerpsResponse {
  perps: Perp[];
  total_count: number;
}

function formatUSD(v: number): string {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
}

function BiasBar({ bias }: { bias: number }) {
  const longPct = Math.round((bias + 1) / 2 * 100);
  const shortPct = 100 - longPct;
  return (
    <div className="space-y-1">
      <div className="flex h-2 rounded-full overflow-hidden bg-red-500/30">
        <div
          className="bg-green-500 transition-all"
          style={{ width: `${longPct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>空 {shortPct}%</span>
        <span>多 {longPct}%</span>
      </div>
    </div>
  );
}

function PerpCard({ perp }: { perp: Perp }) {
  const netOI = perp.total_long_usd - perp.total_short_usd;
  const isLongBias = perp.bias > 0;

  return (
    <Card className="p-4 space-y-4 hover:border-primary/40 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold">{perp.symbol}</h3>
          <Badge
            className={cn(
              "mt-1 text-xs",
              isLongBias
                ? "bg-green-500/20 text-green-400 border-green-500/30"
                : perp.bias < 0
                ? "bg-red-500/20 text-red-400 border-red-500/30"
                : "bg-gray-500/20 text-gray-400 border-gray-500/30"
            )}
          >
            {perp.bias_label}
          </Badge>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">持仓人数</p>
          <p className="text-xl font-bold">{perp.position_count.toLocaleString()}</p>
        </div>
      </div>

      {/* Bias Bar */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-green-400 font-medium">
            {formatUSD(perp.total_long_usd)}
          </span>
          <span className="text-red-400 font-medium">
            {formatUSD(perp.total_short_usd)}
          </span>
        </div>
        <BiasBar bias={perp.bias} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/50 rounded-lg p-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">多头总额</p>
          <p className="text-sm font-semibold text-green-400">{formatUSD(perp.total_long_usd)}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">空头总额</p>
          <p className="text-sm font-semibold text-red-400">{formatUSD(perp.total_short_usd)}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">总 Open Interest</p>
          <p className="text-sm font-semibold">{formatUSD(perp.total_open_interest_usd)}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">平均杠杆</p>
          <p className="text-sm font-semibold">{perp.avg_leverage.toFixed(1)}x</p>
        </div>
      </div>

      {/* Net Position */}
      <div className="flex items-center justify-between pt-2 border-t">
        <span className="text-xs text-muted-foreground">净敞口</span>
        <span className={cn("text-sm font-bold", netOI > 0 ? "text-green-400" : netOI < 0 ? "text-red-400" : "text-gray-400")}>
          {netOI > 0 ? "+" : ""}{formatUSD(netOI)}
        </span>
      </div>
    </Card>
  );
}

export default function PerpsPage() {
  const t = useTranslations("dashboard");

  const { data, loading, error } = useApiQuery<PerpsResponse>("/perps", {
    pollingIntervalMs: 30000,
  });

  if (loading) return <PageLoading />;
  if (error) return <PageError message={error instanceof Error ? error.message : String(error)} onRetry={() => window.location.reload()} />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">永续合约中心</h1>
          <p className="text-muted-foreground text-sm mt-1">
            全市场 Perp 合约多空数据 · 共 {data.total_count} 个合约
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          🔄 30s 自动刷新
        </Badge>
      </div>

      {/* Market Bias Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-muted-foreground text-xs mb-1">多头总额</p>
          <p className="text-lg font-semibold text-green-500">
            {formatUSD(data.perps.reduce((s, p) => s + p.total_long_usd, 0))}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-muted-foreground text-xs mb-1">空头总额</p>
          <p className="text-lg font-semibold text-red-500">
            {formatUSD(data.perps.reduce((s, p) => s + p.total_short_usd, 0))}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-muted-foreground text-xs mb-1">总 Open Interest</p>
          <p className="text-lg font-semibold">
            {formatUSD(data.perps.reduce((s, p) => s + p.total_open_interest_usd, 0))}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-muted-foreground text-xs mb-1">平均 Bias</p>
          <p className="text-lg font-semibold">
            {data.perps.length > 0
              ? ((data.perps.reduce((s, p) => s + p.bias, 0) / data.perps.length) * 100).toFixed(1)
              : "0.0"}%
          </p>
        </Card>
      </div>

      {/* Perp Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {data.perps.map((perp) => (
          <PerpCard key={perp.symbol} perp={perp} />
        ))}
      </div>

      {data.perps.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">暂无合约数据</p>
        </Card>
      )}
    </div>
  );
}
