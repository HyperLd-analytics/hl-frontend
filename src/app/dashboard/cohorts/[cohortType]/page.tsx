"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { useApiQuery } from "@/hooks/use-api-query";
import { PageError } from "@/components/common/page-error";
import { PageLoading } from "@/components/common/page-loading";
import { TableLoading } from "@/components/common/table-loading";
import { ChevronLeft, ChevronRight, ArrowUpDown, TrendingUp, TrendingDown, Crown, Flame, Minus } from "lucide-react";
import type { CohortSegmentResponse, CohortWallet } from "@/types/dashboard";

const COHORT_META: Record<string, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  icon: React.ReactNode;
}> = {
  MONEY_PRINTER: {
    label: "Money Printers",
    color: "text-amber-400",
    bgColor: "bg-amber-950",
    borderColor: "border-amber-600",
    description: "Wallets with >100% PnL — exceptional performers",
    icon: <Crown className="h-5 w-5 text-amber-400" />,
  },
  PROFIT: {
    label: "Profit",
    color: "text-green-400",
    bgColor: "bg-green-950",
    borderColor: "border-green-600",
    description: "Wallets with +10% ~ +100% PnL — consistent profit makers",
    icon: <TrendingUp className="h-5 w-5 text-green-400" />,
  },
  BREAK_EVEN: {
    label: "Break Even",
    color: "text-gray-400",
    bgColor: "bg-gray-900",
    borderColor: "border-gray-600",
    description: "Wallets with -10% ~ +10% PnL — neutral zone",
    icon: <Minus className="h-5 w-5 text-gray-400" />,
  },
  REKT: {
    label: "Rekt",
    color: "text-red-400",
    bgColor: "bg-red-950",
    borderColor: "border-red-600",
    description: "Wallets with -50% ~ -10% PnL — underperformers",
    icon: <TrendingDown className="h-5 w-5 text-red-400" />,
  },
  GIGA_REKT: {
    label: "Giga Rekt",
    color: "text-red-600",
    bgColor: "bg-red-950",
    borderColor: "border-red-800",
    description: "Wallets with <-50% PnL — catastrophic losses",
    icon: <Flame className="h-5 w-5 text-red-600" />,
  },
};

const SIZE_COHORTS = [
  { label: "All", value: "ALL" },
  { label: "Leviathan", value: "LEVIATHAN" },
  { label: "Whale", value: "WHALE" },
  { label: "Shark", value: "SHARK" },
  { label: "Dolphin", value: "DOLPHIN" },
  { label: "Fish", value: "FISH" },
  { label: "Crab", value: "CRAB" },
  { label: "Shrimp", value: "SHRIMP" },
];

type SortBy = "pnl" | "volume" | "win_rate" | "score" | "account_value";

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

function formatLastActive(lastActive: string | undefined): string {
  if (!lastActive) return "-";
  try {
    const date = new Date(lastActive);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return "-";
  }
}

export default function CohortDetailPage() {
  const params = useParams();
  const cohortType = params.cohortType as string;

  const [sortBy, setSortBy] = useState<SortBy>("pnl");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [sizeFilter, setSizeFilter] = useState<string>("ALL");
  const pageSize = 20;

  const cohortMeta = COHORT_META[cohortType];
  const isValidCohort = !!cohortMeta;

  const queryPath = useMemo(() => {
    const params = new URLSearchParams();
    params.set("sort_by", sortBy);
    params.set("limit", String(pageSize));
    params.set("offset", String((page - 1) * pageSize));
    if (sizeFilter !== "ALL") {
      params.set("size_cohort", sizeFilter);
    }
    return `/cohorts/segment/${cohortType}?${params.toString()}`;
  }, [cohortType, sortBy, page, sizeFilter]);

  const { data, loading, error, refetch } = useApiQuery<CohortSegmentResponse>(queryPath, {
    debounceMs: 250,
    staleTimeMs: 10_000,
  });

  const totalPages = Math.max(1, Math.ceil((data?.pagination?.total ?? 0) / pageSize));

  const handleSort = (field: SortBy) => {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
    setPage(1);
  };

  const wallets = data?.wallets ?? [];
  const stats = data?.stats;

  const sortedWallets = useMemo(() => {
    return [...wallets].sort((a, b) => {
      const aVal = a[sortBy === "win_rate" ? "winRate" : sortBy === "account_value" ? "accountValue" : sortBy === "volume" ? "volume30d" : sortBy === "score" ? "score" : "totalPnl"] ?? 0;
      const bVal = b[sortBy === "win_rate" ? "winRate" : sortBy === "account_value" ? "accountValue" : sortBy === "volume" ? "volume30d" : sortBy === "score" ? "score" : "totalPnl"] ?? 0;
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [wallets, sortBy, sortDir]);

  if (!isValidCohort) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-muted-foreground">Invalid cohort type: {cohortType}</p>
        <Link href="/dashboard/segments">
          <Button variant="outline">Back to Segments</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
        <span>/</span>
        <Link href="/dashboard/segments" className="hover:text-foreground">Hypertracker</Link>
        <span>/</span>
        <span className="text-foreground">Segments</span>
        <span>/</span>
        <span className="text-foreground">{cohortMeta.label}</span>
      </div>

      {/* Header */}
      <div className={`flex items-center gap-3 rounded-lg border p-4 ${cohortMeta.borderColor} ${cohortMeta.bgColor}`}>
        {cohortMeta.icon}
        <div>
          <h1 className={`text-xl font-semibold ${cohortMeta.color}`}>{cohortMeta.label}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{cohortMeta.description}</p>
        </div>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Wallets</p>
            <p className="mt-1 text-xl font-semibold">{stats.walletCount.toLocaleString()}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Total Value</p>
            <p className="mt-1 text-xl font-semibold">{formatValue(stats.totalAccountValue)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Avg PnL</p>
            <p className={`mt-1 text-xl font-semibold ${stats.avgPnl >= 0 ? "text-green-400" : "text-red-400"}`}>
              {formatPnl(stats.avgPnl)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Avg Win Rate</p>
            <p className="mt-1 text-xl font-semibold">{stats.avgWinRate?.toFixed(1) ?? "-"}%</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Avg Leverage</p>
            <p className="mt-1 text-xl font-semibold">{stats.avgLeverage?.toFixed(1) ?? "-"}x</p>
          </Card>
        </div>
      )}

      {/* Size Cohort Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {SIZE_COHORTS.map((sc) => (
          <Button
            key={sc.value}
            size="sm"
            variant={sizeFilter === sc.value ? "default" : "outline"}
            onClick={() => { setSizeFilter(sc.value); setPage(1); }}
            className="text-xs"
          >
            {sc.label}
          </Button>
        ))}
      </div>

      {/* Leaderboard Table */}
      {loading ? (
        <TableLoading columns={8} rows={pageSize} />
      ) : error && !data ? (
        <PageError message={error.message} onRetry={refetch} />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-3 py-3 text-left font-medium text-muted-foreground">#</th>
                  <th className="px-3 py-3 text-left font-medium text-muted-foreground">Wallet</th>
                  <th className="px-3 py-3 text-left font-medium text-muted-foreground">Size Cohort</th>
                  <th
                    className="cursor-pointer px-3 py-3 text-left font-medium text-muted-foreground hover:text-foreground"
                    onClick={() => handleSort("volume")}
                  >
                    <span className="flex items-center gap-1">
                      30d Volume
                      <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </th>
                  <th
                    className="cursor-pointer px-3 py-3 text-left font-medium text-muted-foreground hover:text-foreground"
                    onClick={() => handleSort("win_rate")}
                  >
                    <span className="flex items-center gap-1">
                      Win Rate
                      <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </th>
                  <th
                    className="cursor-pointer px-3 py-3 text-left font-medium text-muted-foreground hover:text-foreground"
                    onClick={() => handleSort("pnl")}
                  >
                    <span className="flex items-center gap-1">
                      PnL %
                      <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </th>
                  <th className="px-3 py-3 text-left font-medium text-muted-foreground">Avg Position</th>
                  <th
                    className="cursor-pointer px-3 py-3 text-left font-medium text-muted-foreground hover:text-foreground"
                    onClick={() => handleSort("score")}
                  >
                    <span className="flex items-center gap-1">
                      Score
                      <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </th>
                  <th className="px-3 py-3 text-left font-medium text-muted-foreground">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedWallets.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-muted-foreground">
                      No wallets in this cohort
                    </td>
                  </tr>
                ) : (
                  sortedWallets.map((wallet, i) => (
                    <tr key={wallet.address} className="transition-colors hover:bg-muted/50">
                      <td className="px-3 py-3 text-muted-foreground">
                        {(page - 1) * pageSize + i + 1}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dashboard/wallet/${wallet.address}`}
                            className="font-mono text-xs hover:text-primary"
                          >
                            {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                          </Link>
                          <CopyButton value={wallet.address} />
                        </div>
                        {wallet.label && (
                          <p className="mt-0.5 text-xs text-muted-foreground">{wallet.label}</p>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span className="rounded bg-muted px-1.5 py-0.5 text-xs">
                          {wallet.sizeCohort}
                        </span>
                      </td>
                      <td className="px-3 py-3">{formatValue(wallet.volume30d)}</td>
                      <td className="px-3 py-3">{wallet.winRate?.toFixed(1) ?? "-"}%</td>
                      <td className={`px-3 py-3 font-medium ${wallet.totalPnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {formatPnl(wallet.totalPnl)}
                      </td>
                      <td className="px-3 py-3">{formatValue(wallet.avgPositionSize)}</td>
                      <td className="px-3 py-3">{wallet.score?.toFixed(1) ?? "-"}</td>
                      <td className="px-3 py-3 text-muted-foreground">{formatLastActive(wallet.lastActive)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t p-3">
            <p className="text-xs text-muted-foreground">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, data?.pagination?.total ?? 0)} of {data?.pagination?.total ?? 0}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
