"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApiQuery } from "@/hooks/use-api-query";
import { PageError } from "@/components/common/page-error";
import { PageLoading } from "@/components/common/page-loading";
import { TrendingUp, TrendingDown, Minus, Crown, Flame, Users } from "lucide-react";
import type { CohortOverview } from "@/types/dashboard";

interface CohortCardData {
  pnlCohort: string;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
  href: string;
  stats?: {
    walletCount: number;
    totalAccountValue: number;
    avgPnl: number;
    avgWinRate: number;
    avgLeverage: number;
  };
  topWallets?: Array<{
    address: string;
    totalPnl: number;
    volume30d: number;
    winRate: number;
  }>;
}

const COHORT_DEFS = [
  {
    pnlCohort: "MONEY_PRINTER",
    label: "Money Printers",
    description: ">100% gains — Top performers with exceptional returns",
    color: "text-amber-400",
    bgColor: "bg-amber-950",
    borderColor: "border-amber-600",
    icon: <Crown className="h-5 w-5 text-amber-400" />,
    href: "/dashboard/cohorts/MONEY_PRINTER",
  },
  {
    pnlCohort: "PROFIT",
    label: "Profit",
    description: "+10% ~ +100% gains — Consistent profitable traders",
    color: "text-green-400",
    bgColor: "bg-green-950",
    borderColor: "border-green-600",
    icon: <TrendingUp className="h-5 w-5 text-green-400" />,
    href: "/dashboard/cohorts/PROFIT",
  },
  {
    pnlCohort: "BREAK_EVEN",
    label: "Break Even",
    description: "-10% ~ +10% — Neutral performance zone",
    color: "text-gray-400",
    bgColor: "bg-gray-900",
    borderColor: "border-gray-600",
    icon: <Minus className="h-5 w-5 text-gray-400" />,
    href: "/dashboard/cohorts/BREAK_EVEN",
  },
  {
    pnlCohort: "REKT",
    label: "Rekt",
    description: "-50% ~ -10% losses — Underperforming traders",
    color: "text-red-400",
    bgColor: "bg-red-950",
    borderColor: "border-red-600",
    icon: <TrendingDown className="h-5 w-5 text-red-400" />,
    href: "/dashboard/cohorts/REKT",
  },
  {
    pnlCohort: "GIGA_REKT",
    label: "Giga Rekt",
    description: "<-50% losses — Catastrophic losses",
    color: "text-red-600",
    bgColor: "bg-red-950",
    borderColor: "border-red-800",
    icon: <Flame className="h-5 w-5 text-red-600" />,
    href: "/dashboard/cohorts/GIGA_REKT",
  },
];

function formatValue(v: number | undefined | null): string {
  if (v == null) return "-";
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
}

function formatPnl(v: number | undefined | null): string {
  if (v == null) return "-";
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}

function formatAddress(addr: string): string {
  if (!addr) return "-";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function CohortCard({ cohort }: { cohort: CohortCardData }) {
  return (
    <Card className={`relative overflow-hidden border ${cohort.borderColor} ${cohort.bgColor}`}>
      <div className="p-5">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`rounded-md p-2 ${cohort.bgColor}`}>
              {cohort.icon}
            </div>
            <div>
              <h3 className={`font-semibold ${cohort.color}`}>{cohort.label}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">{cohort.description}</p>
            </div>
          </div>
          <Link href={cohort.href}>
            <Button size="sm" variant="outline" className="text-xs">
              Explore All
            </Button>
          </Link>
        </div>

        {/* Stats */}
        {cohort.stats && (
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Wallets</p>
              <p className="text-sm font-medium">{cohort.stats.walletCount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Value</p>
              <p className="text-sm font-medium">{formatValue(cohort.stats.totalAccountValue)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg PnL</p>
              <p className={`text-sm font-medium ${cohort.stats.avgPnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                {formatPnl(cohort.stats.avgPnl)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg Win Rate</p>
              <p className="text-sm font-medium">{cohort.stats.avgWinRate?.toFixed(1) ?? "-"}%</p>
            </div>
          </div>
        )}

        {/* Top Wallets */}
        {cohort.topWallets && cohort.topWallets.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Top Wallets</p>
            <div className="space-y-1.5">
              {cohort.topWallets.slice(0, 5).map((w, i) => (
                <Link
                  key={w.address}
                  href={`/dashboard/wallet/${w.address}`}
                  className="flex items-center justify-between rounded bg-black/20 px-2 py-1 text-xs transition-colors hover:bg-black/30"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-muted-foreground">{i + 1}.</span>
                    <span className="font-mono">{formatAddress(w.address)}</span>
                  </span>
                  <span className={`font-medium ${w.totalPnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {formatPnl(w.totalPnl)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

export default function SegmentsPage() {
  const { data, loading, error, refetch } = useApiQuery<CohortOverview>("/cohorts/overview", {
    debounceMs: 120,
  });

  if (loading && !data) return <PageLoading />;
  if (error && !data) return <PageError message={error.message} onRetry={refetch} />;

  // Build cohort cards from overview data
  const cohortCards: CohortCardData[] = COHORT_DEFS.map((def) => {
    const cohortKey = def.pnlCohort as keyof CohortOverview;
    const cohortData = data?.[cohortKey] as Record<string, unknown> | undefined;
    if (!cohortData) return { ...def, stats: undefined, topWallets: [] };
    return {
      ...def,
      stats: {
        walletCount: Number(cohortData.walletCount ?? 0),
        totalAccountValue: Number(cohortData.totalAccountValue ?? 0),
        avgPnl: Number(cohortData.avgPnl ?? 0),
        avgWinRate: Number(cohortData.avgWinRate ?? 0),
        avgLeverage: Number(cohortData.avgLeverage ?? 0),
      },
      topWallets: (cohortData.topWallets as CohortCardData["topWallets"]) ?? [],
    };
  });

  // Money printers first, then others
  const sortedCards = [
    cohortCards.find((c) => c.pnlCohort === "MONEY_PRINTER")!,
    ...cohortCards.filter((c) => c.pnlCohort !== "MONEY_PRINTER"),
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
        <span>/</span>
        <span className="text-foreground">Hypertracker</span>
        <span>/</span>
        <span className="text-foreground">Segments</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Hypertracker Segments</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track smart money wallets segmented by performance
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{data?.totalTracked ?? 0} tracked wallets</span>
        </div>
      </div>

      {/* Overall Stats Bar */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total Account Value</p>
          <p className="mt-1 text-xl font-semibold">{formatValue(data?.totalAccountValue)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total 30d Volume</p>
          <p className="mt-1 text-xl font-semibold">{formatValue(data?.totalVolume30d)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Money Printers</p>
          <p className="mt-1 text-xl font-semibold text-amber-400">{data?.MONEY_PRINTER?.walletCount ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Giga Rekt</p>
          <p className="mt-1 text-xl font-semibold text-red-600">{data?.GIGA_REKT?.walletCount ?? 0}</p>
        </Card>
      </div>

      {/* Cohort Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sortedCards.map((cohort) => (
          <CohortCard key={cohort.pnlCohort} cohort={cohort} />
        ))}
      </div>
    </div>
  );
}
