"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageLoading } from "@/components/common/page-loading";
import { PageError } from "@/components/common/page-error";
import { useApiQuery } from "@/hooks/use-api-query";
import { TrendingUp, Wallet, Activity, DollarSign, Users, ChevronRight, BarChart3 } from "lucide-react";

interface Segment {
  id?: string;
  name?: string;
  label?: string;
  wallet_count?: number;
  walletCount?: number;
  total_pnl?: number;
  totalPnl?: number;
  avg_win_rate?: number;
  avgWinRate?: number;
  volume_30d?: number;
  volume30d?: number;
  description?: string;
  cohort?: string;
}

interface SegmentsResponse {
  segments?: Segment[];
  data?: Segment[];
  wallets?: Segment[];
  error?: string;
}

const SEGMENT_CARDS = [
  { id: "whale-tracker", label: "Whale Tracker", desc: "Track large position changes", icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-500/10", href: "/dashboard/segments/whale-tracker" },
  { id: "momentum-tracker", label: "Momentum Tracker", desc: "Strong directional trades", icon: Activity, color: "text-purple-500", bg: "bg-purple-500/10", href: "/dashboard/segments/momentum-tracker" },
  { id: "money-printer", label: "Money Printer", desc: "Consistent profitable trades", icon: DollarSign, color: "text-green-500", bg: "bg-green-500/10", href: "/dashboard/segments/money-printer" },
  { id: "defi-trends", label: "DeFi Trends", desc: "DeFi protocol interactions", icon: BarChart3, color: "text-orange-500", bg: "bg-orange-500/10", href: "/dashboard/segments/defi-trends" },
];

function StatPill({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ElementType; color: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1">
      <Icon className={`h-3.5 w-3.5 ${color}`} />
      <span className="text-xs text-muted-foreground">{label}:</span>
      <span className="text-xs font-medium">{value}</span>
    </div>
  );
}

export default function SegmentsPage() {
  const { data, loading, error, refetch } = useApiQuery<SegmentsResponse>("/segments", {
    staleTimeMs: 30_000,
  });

  const segments: Segment[] = data?.segments ?? data?.data ?? data?.wallets ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">钱包分段</h1>
          <p className="text-sm text-muted-foreground mt-1">
            按交易风格和策略分类的钱包列表
          </p>
        </div>
      </div>

      {/* Static Segment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SEGMENT_CARDS.map((seg) => {
          const Icon = seg.icon;
          return (
            <Link key={seg.id} href={seg.href}>
              <Card className="p-5 border-border/50 hover:border-primary/30 transition-colors cursor-pointer group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg ${seg.bg}`}>
                      <Icon className={`h-5 w-5 ${seg.color}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold">{seg.label}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">{seg.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors mt-1" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* API-loaded segments table */}
      {loading && <PageLoading />}

      {error && !data && (
        <PageError message={String(error)} onRetry={() => void refetch()} />
      )}

      {segments.length > 0 && (
        <div>
          <h2 className="text-lg font-medium mb-3">实时分段数据</h2>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2.5 text-left font-medium">名称</th>
                    <th className="px-3 py-2.5 text-right font-medium">钱包数量</th>
                    <th className="px-3 py-2.5 text-right font-medium">总 PnL</th>
                    <th className="px-3 py-2.5 text-right font-medium">平均胜率</th>
                    <th className="px-3 py-2.5 text-right font-medium">30D 交易量</th>
                  </tr>
                </thead>
                <tbody>
                  {segments.map((seg, i) => (
                    <tr key={seg.id ?? seg.name ?? i} className="border-t border-border hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2.5 font-medium">
                        <div className="flex items-center gap-2">
                          <span>{seg.label ?? seg.name ?? "-"}</span>
                          {seg.cohort && (
                            <Badge variant="outline" className="text-[10px]">
                              {seg.cohort}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          {(seg.wallet_count ?? seg.walletCount ?? 0).toLocaleString()}
                        </div>
                      </td>
                      <td className={`px-3 py-2.5 text-right font-mono ${
                        (seg.total_pnl ?? seg.totalPnl ?? 0) >= 0 ? "text-green-600" : "text-red-600"
                      }`}>
                        {((seg.total_pnl ?? seg.totalPnl ?? 0) >= 0 ? "+" : "")}$
                        {((seg.total_pnl ?? seg.totalPnl ?? 0) / 1000).toFixed(1)}K
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {((seg.avg_win_rate ?? seg.avgWinRate ?? 0) * 100).toFixed(1)}%
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono">
                        {((seg.volume_30d ?? seg.volume30d ?? 0) >= 1_000_000
                          ? `$${((seg.volume_30d ?? seg.volume30d ?? 0) / 1_000_000).toFixed(1)}M`
                          : (seg.volume_30d ?? seg.volume30d ?? 0) >= 1_000
                          ? `$${((seg.volume_30d ?? seg.volume30d ?? 0) / 1_000).toFixed(1)}K`
                          : `-`)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {data && !loading && segments.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">
          <div className="flex flex-col items-center gap-2">
            <Wallet className="h-8 w-8 opacity-30" />
            <p>暂无分段数据</p>
          </div>
        </Card>
      )}
    </div>
  );
}
