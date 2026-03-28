"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpDown, TrendingUp, Users, Activity, Wallet, ChevronRight, Layers } from "lucide-react";
import { TopWallets } from "./components/top-wallets";

const SEGMENTS = [
  {
    id: "whale-tracker",
    label: "Whale Tracker",
    description: "Track large position changes and wallet movements",
    href: "/dashboard/segments/whale-tracker",
    icon: TrendingUp,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    badge: "Live",
    badgeColor: "bg-blue-500/10 text-blue-500",
  },
  {
    id: "momentum-tracker",
    label: "Momentum Tracker",
    description: "Follow wallets with strong directional trades",
    href: "/dashboard/segments/momentum-tracker",
    icon: Activity,
    bgColor: "bg-purple-500/10",
    color: "text-purple-500",
    badge: "New",
    badgeColor: "bg-purple-500/10 text-purple-500",
  },
  {
    id: "money-printer",
    label: "Money Printer",
    description: "Wallets with consistent profitable trades",
    href: "/dashboard/segments/money-printer",
    icon: Wallet,
    bgColor: "bg-green-500/10",
    color: "text-green-500",
  },
  {
    id: "defi-trends",
    label: "DeFi Trends",
    description: "Monitor DeFi protocol interactions",
    href: "/dashboard/segments/defi-trends",
    icon: Layers,
    bgColor: "bg-orange-500/10",
    color: "text-orange-500",
  },
];

type Stat = {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
};

type StatsState = {
  totalWallets: number;
  totalPnl: number;
  avgWinRate: number;
  totalVolume: number;
};

function StatCard({ stat, loading }: { stat: Stat; loading?: boolean }) {
  const Icon = stat.icon;
  return (
    <Card className="p-4 border-border/50">
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-1.5 rounded-md ${stat.bgColor}`}>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <span className="text-xs text-muted-foreground">{stat.label}</span>
          </div>
          <div className="text-2xl font-bold">{stat.value}</div>
          {stat.sub && (
            <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
          )}
        </>
      )}
    </Card>
  );
}

export default function HypertrackerPage() {
  const [stats, setStats] = useState<StatsState>({
    totalWallets: 0,
    totalPnl: 0,
    avgWinRate: 0,
    totalVolume: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [analyticsRes, leaderboardRes] = await Promise.all([
          fetch("/api/v1/analytics", { cache: "no-store" }),
          fetch("/api/v1/wallets/leaderboard?page=1&pageSize=1&sortBy=total_pnl", { cache: "no-store" }),
        ]);

        if (analyticsRes.ok && leaderboardRes.ok) {
          const analytics = await analyticsRes.json();
          const leaderboard = await leaderboardRes.json();

          // Prefer analytics API if available, fall back to leaderboard totals
          const totalWallets = analytics.total_wallets
            ?? analytics.totalWallets
            ?? analytics.wallet_count
            ?? leaderboard.total
            ?? 0;
          const totalPnl = analytics.total_pnl ?? analytics.totalPnl ?? 0;
          const avgWinRate = analytics.avg_win_rate ?? analytics.avgWinRate ?? 0;
          const totalVolume = analytics.total_volume ?? analytics.totalVolume ?? 0;

          setStats({
            totalWallets,
            totalPnl,
            avgWinRate,
            totalVolume,
          });
        }
      } catch (e) {
        // silent fail, keep defaults
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const statCards: Stat[] = [
    {
      label: "Tracked Wallets",
      value: loading ? "-" : stats.totalWallets.toLocaleString(),
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Total PnL",
      value: loading
        ? "-"
        : `${stats.totalPnl >= 0 ? "+" : ""}$${(stats.totalPnl / 1000).toFixed(1)}K`,
      sub: "Across all cohorts",
      icon: TrendingUp,
      color: stats.totalPnl >= 0 ? "text-green-500" : "text-red-500",
      bgColor: stats.totalPnl >= 0 ? "bg-green-500/10" : "bg-red-500/10",
    },
    {
      label: "Volume (30d)",
      value: loading
        ? "-"
        : stats.totalVolume >= 1_000_000
        ? `$${(stats.totalVolume / 1_000_000).toFixed(1)}M`
        : stats.totalVolume >= 1_000
        ? `$${(stats.totalVolume / 1_000).toFixed(1)}K`
        : `$${stats.totalVolume.toFixed(0)}`,
      sub: "Total trading volume",
      icon: Activity,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      label: "Avg Win Rate",
      value: loading ? "-" : `${(stats.avgWinRate * 100).toFixed(1)}%`,
      sub: "Across all wallets",
      icon: Wallet,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ];

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hypertracker</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor wallet segments and track top traders on Hyperliquid
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/leaderboard">
            <Button variant="outline" size="sm" className="h-9">
              Leaderboard
            </Button>
          </Link>
          <Link href="/dashboard/segments">
            <Button size="sm" className="h-9">
              Segments
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <StatCard key={stat.label} stat={stat} loading={loading} />
        ))}
      </div>

      {/* Segment Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Segments</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SEGMENTS.map((segment) => {
            const Icon = segment.icon;
            return (
              <Link key={segment.id} href={segment.href}>
                <Card className="p-5 border-border/50 hover:border-primary/30 transition-colors cursor-pointer group">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-lg ${segment.bgColor}`}>
                        <Icon className={`h-5 w-5 ${segment.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{segment.label}</h3>
                          {segment.badge && (
                            <Badge className={`text-[10px] px-1.5 py-0.5 ${segment.badgeColor}`}>
                              {segment.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {segment.description}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors mt-1" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Top Wallets */}
      <TopWallets limit={8} />

      {/* Cohort Overview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Cohort Overview</h2>
          <Link href="/dashboard/segments" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            View Details →
          </Link>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {["MONEY_PRINTER", "PROFIT", "BREAK_EVEN", "REKT", "GIGA_REKT"].map((cohort) => {
            const cohortData = {
              MONEY_PRINTER: { label: "Money Printer", color: "text-green-500", bg: "bg-green-500/10" },
              PROFIT: { label: "Profit", color: "text-emerald-500", bg: "bg-emerald-500/10" },
              BREAK_EVEN: { label: "Break Even", color: "text-yellow-500", bg: "bg-yellow-500/10" },
              REKT: { label: "Rekt", color: "text-red-500", bg: "bg-red-500/10" },
              GIGA_REKT: { label: "Giga Rekt", color: "text-purple-500", bg: "bg-purple-500/10" },
            }[cohort]!;

            return (
              <Link key={cohort} href={`/dashboard/cohorts/${cohort}`}>
                <Card className={`p-4 border-border/50 hover:border-primary/30 transition-colors cursor-pointer text-center group ${cohortData.bg}`}>
                  <div className={`font-semibold text-sm ${cohortData.color}`}>
                    {cohortData.label}
                  </div>
                  <div className="text-2xl font-bold mt-2 group-hover:text-primary transition-colors">
                    →
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
