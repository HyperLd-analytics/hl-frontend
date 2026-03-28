"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { BarChart3, TrendingUp, Users, Wallet } from "lucide-react";

interface SegmentData {
  wallet_address: string;
  wallet_name?: string;
  segment: string;
  pnl: number;
  volume: number;
  win_rate: number;
  trades: number;
}

interface SegmentsResponse {
  size_segments: Array<{
    bucket: string;
    count: number;
    avg_pnl: number;
    avg_volume: number;
    avg_win_rate: number;
    total_trades: number;
  }>;
  total_wallets: number;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function SegmentsPage() {
  const { data, error, isLoading } = useSWR<SegmentsResponse>("/api/v1/segments", fetcher);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-600">
          <p className="font-medium">加载失败</p>
          <p className="text-sm mt-1">请稍后刷新页面重试</p>
        </div>
      </div>
    );
  }

  const segments = data?.size_segments || [];
  const totalWallets = data?.total_wallets || 0;

  const totalPnl = segments.reduce((sum, s) => sum + (s.avg_pnl * s.count), 0);
  const totalVolume = segments.reduce((sum, s) => sum + (s.avg_volume * s.count), 0);
  const avgWinRate = segments.length
    ? segments.reduce((sum, s) => sum + s.avg_win_rate, 0) / segments.length
    : 0;

  const bucketLabels: Record<string, string> = {
    "< $1K": "微型 ($1K)",
    "$1K-$10K": "小型 ($1K-$10K)",
    "$10K-$100K": "中型 ($10K-$100K)",
    "$100K-$1M": "大型 ($100K-$1M)",
    "> $1M": "巨型 ($1M+)",
    unknown: "未分类",
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">钱包分群</h1>
        <p className="text-muted-foreground mt-1">
          基于账户规模和交易行为的钱包群体分析
        </p>
      </div>

      {/* 总览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2.5">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                总钱包数
              </p>
              <p className="text-2xl font-bold mt-0.5">{totalWallets.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-500/10 p-2.5">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                群体数量
              </p>
              <p className="text-2xl font-bold mt-0.5">{segments.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/10 p-2.5">
              <BarChart3 className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                平均胜率
              </p>
              <p className="text-2xl font-bold mt-0.5">{avgWinRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-500/10 p-2.5">
              <Wallet className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                平均 PnL
              </p>
              <p className="text-2xl font-bold mt-0.5">
                ${(totalPnl / (totalWallets || 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 分群表格 */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold">规模分群详情</h2>
        </div>
        <div className="overflow-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  群体
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  钱包数量
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  平均 PnL
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  平均交易量
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  平均胜率
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  总交易次数
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {segments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                    暂无分群数据
                  </td>
                </tr>
              ) : (
                segments.map((seg) => (
                  <tr key={seg.bucket} className="hover:bg-muted/50 transition-colors">
                    <td className="px-5 py-3.5 font-medium">
                      {bucketLabels[seg.bucket] || seg.bucket}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono">
                      {seg.count.toLocaleString()}
                    </td>
                    <td className={`px-5 py-3.5 text-right font-mono ${seg.avg_pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                      ${seg.avg_pnl.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono">
                      ${seg.avg_volume.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono">
                      {seg.avg_win_rate.toFixed(1)}%
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono">
                      {seg.total_trades.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
