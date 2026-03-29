"use client";

import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { ArrowLeft, BarChart2, DollarSign, TrendingUp } from "lucide-react";

type BuilderDetail = {
  builder_address: string;
  period_days: number;
  trade_count: number;
  total_volume_usd: number;
  net_pnl_usd: number;
  estimated_revenue_usd: number;
  unique_symbols: number;
  symbol_distribution: Array<{ symbol: string; trade_count: number; volume_usd: number }>;
  top_traders: Array<{ address: string; label: string | null; volume_usd: number }>;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatUSD(v: number): string {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
}

export default function BuilderDetailPage() {
  const searchParams = useSearchParams();
  const address = searchParams.get("address") || "";
  const days = searchParams.get("days") || "30";

  const { data, isLoading } = useSWR<BuilderDetail>(
    address ? `/api/v1/builders/${address}/route.ts?days=${days}` : null,
    fetcher
  );

  if (!address) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-700">
          <p className="font-medium">请从 Builder 排行榜选择一个 Builder</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-600">
          <p className="font-medium">加载失败</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button onClick={() => window.history.back()} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="h-4 w-4" /> 返回
          </button>
          <h1 className="text-2xl font-bold tracking-tight">Builder 详情</h1>
          <p className="font-mono text-sm text-muted-foreground mt-1">
            {data.builder_address}
          </p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <BarChart2 className="h-4 w-4 text-blue-500" />
            <p className="text-xs font-medium text-muted-foreground uppercase">交易笔数</p>
          </div>
          <p className="text-2xl font-bold">{data.trade_count.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <p className="text-xs font-medium text-muted-foreground uppercase">总交易量</p>
          </div>
          <p className="text-2xl font-bold text-green-500">{formatUSD(data.total_volume_usd)}</p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-purple-500" />
            <p className="text-xs font-medium text-muted-foreground uppercase">估算收入</p>
          </div>
          <p className="text-2xl font-bold text-purple-500">{formatUSD(data.estimated_revenue_usd)}</p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <BarChart2 className="h-4 w-4 text-orange-500" />
            <p className="text-xs font-medium text-muted-foreground uppercase">覆盖币种</p>
          </div>
          <p className="text-2xl font-bold">{data.unique_symbols}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 代币分布 */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="font-semibold">代币分布</h2>
          </div>
          <div className="divide-y">
            {data.symbol_distribution.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">暂无数据</div>
            ) : (
              data.symbol_distribution.map((item) => (
                <div key={item.symbol} className="flex items-center justify-between px-5 py-3">
                  <span className="font-mono font-semibold">{item.symbol}</span>
                  <div className="text-right">
                    <span className="font-mono">{formatUSD(item.volume_usd)}</span>
                    <span className="text-xs text-muted-foreground ml-2">{item.trade_count}笔</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Traders */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="font-semibold">Top Traders</h2>
          </div>
          <div className="divide-y">
            {data.top_traders.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">暂无数据</div>
            ) : (
              data.top_traders.map((trader) => (
                <div key={trader.address} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <span className="font-medium text-sm">{trader.label || "Unnamed"}</span>
                    <span className="font-mono text-xs text-muted-foreground ml-2">
                      {trader.address.slice(0, 8)}...{trader.address.slice(-4)}
                    </span>
                  </div>
                  <span className="font-mono">{formatUSD(trader.volume_usd)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
