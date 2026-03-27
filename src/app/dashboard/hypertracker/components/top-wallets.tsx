"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpDown, ExternalLink } from "lucide-react";

type TopWallet = {
  address: string;
  totalPnl: number;
  volume30d: number;
  winRate: number;
  roi: number;
  trades: number;
  lastActive?: string;
  accountValue?: number;
};

type TopWalletsProps = {
  wallets?: TopWallet[];
  loading?: boolean;
  compact?: boolean;
};

const COHORT_LABELS: Record<string, string> = {
  MONEY_PRINTER: "Money Printer",
  PROFIT: "Profit",
  BREAK_EVEN: "Break Even",
  REKT: "Rekt",
  GIGA_REKT: "Giga Rekt",
};

const COHORT_COLORS: Record<string, string> = {
  MONEY_PRINTER: "bg-green-500/10 text-green-500 border-green-500/20",
  PROFIT: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  BREAK_EVEN: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  REKT: "bg-red-500/10 text-red-500 border-red-500/20",
  GIGA_REKT: "bg-purple-500/10 text-purple-500 border-purple-500/20",
};

function formatPnl(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}$${(value / 1000).toFixed(1)}K`;
}

function formatVolume(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function formatWinRate(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
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

function WalletRow({ wallet, compact }: { wallet: TopWallet; compact?: boolean }) {
  const pnlColor = wallet.totalPnl >= 0 ? "text-green-500" : "text-red-500";

  return (
    <div className="flex items-center gap-3 py-3 px-4 hover:bg-muted/50 transition-colors">
      {/* Address */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-sm text-foreground truncate">
            {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
          </span>
          <CopyButton value={wallet.address} size="xs" />
        </div>
        {!compact && (
          <div className="text-xs text-muted-foreground mt-0.5">
            {formatLastActive(wallet.lastActive)}
          </div>
        )}
      </div>

      {/* PnL */}
      <div className={`text-sm font-medium ${pnlColor} min-w-[80px] text-right`}>
        {formatPnl(wallet.totalPnl)}
      </div>

      {/* Volume */}
      {!compact && (
        <div className="text-sm text-muted-foreground min-w-[70px] text-right">
          {formatVolume(wallet.volume30d)}
        </div>
      )}

      {/* Win Rate */}
      <div className="text-sm min-w-[60px] text-right">
        <span className={wallet.winRate >= 0.5 ? "text-green-500" : "text-red-500"}>
          {formatWinRate(wallet.winRate)}
        </span>
      </div>

      {/* Actions */}
      {!compact && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 shrink-0"
          onClick={() => window.open(`/dashboard/wallet/${wallet.address}`, "_blank")}
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-3 px-4">
      <div className="flex-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20 mt-1" />
      </div>
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-14" />
      <Skeleton className="h-4 w-12" />
    </div>
  );
}

export function TopWallets({ wallets = [], loading = false, compact = false }: TopWalletsProps) {
  const [activeCohort, setActiveCohort] = useState<string>("PROFIT");

  const cohorts = ["MONEY_PRINTER", "PROFIT", "BREAK_EVEN", "REKT", "GIGA_REKT"];

  const filteredWallets = wallets.filter(
    (w) => (w as { pnlCohort?: string }).pnlCohort === activeCohort
  );

  return (
    <Card className="border-border/50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div>
          <h3 className="font-semibold text-foreground">Top Wallets</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {loading ? "Loading..." : `${wallets.length} wallets tracked`}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() => window.open("/dashboard/leaderboard", "_blank")}
        >
          View All
        </Button>
      </div>

      {/* Cohort Tabs */}
      <div className="flex gap-1 px-4 pt-3 overflow-x-auto">
        {cohorts.map((cohort) => (
          <button
            key={cohort}
            onClick={() => setActiveCohort(cohort)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              activeCohort === cohort
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {COHORT_LABELS[cohort] ?? cohort}
          </button>
        ))}
      </div>

      {/* Table Header */}
      {!compact && (
        <div className="flex items-center gap-3 px-4 py-2 border-b bg-muted/30 text-xs text-muted-foreground">
          <div className="flex-1">Wallet</div>
          <div className="min-w-[80px] text-right">PnL</div>
          <div className="min-w-[70px] text-right">Volume</div>
          <div className="min-w-[60px] text-right">Win Rate</div>
          <div className="w-7" />
        </div>
      )}

      {/* Wallet Rows */}
      <div className="divide-y divide-border/50">
        {loading ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : filteredWallets.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No wallets in this cohort
          </div>
        ) : (
          filteredWallets.map((wallet) => (
            <WalletRow key={wallet.address} wallet={wallet} compact={compact} />
          ))
        )}
      </div>
    </Card>
  );
}
