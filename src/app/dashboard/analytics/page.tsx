"use client";

import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WalletRadarChart } from "@/components/charts/wallet-radar-chart";
import { PnLAreaChart } from "@/components/charts/pnl-area-chart";
import { PositionDistributionChart } from "@/components/charts/position-distribution-chart";
import { TradeActivityHeatmap } from "@/components/charts/trade-activity-heatmap";
import { useApiQuery } from "@/hooks/use-api-query";
import { PageLoading } from "@/components/common/page-loading";
import { PageError } from "@/components/common/page-error";
import { TrendingUp, PieChart, Activity, GitCompare, BarChart3 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type WalletCompare = {
  address: string;
  label: string;
  score: number;
  totalPnl: number;
  winRate: number;
  volume30d: number;
  lifetimeTradeCount: number;
  accountValue: number;
  avgPositionSize: number;
  maxLeverage: number;
};

type CompareResponse = {
  wallets: WalletCompare[];
  summary: {
    bestPnl: { address: string; value: number };
    bestWinRate: { address: string; value: number };
    bestScore: { address: string; value: number };
    bestVolume: { address: string; value: number };
  };
};

type Position = {
  symbol: string;
  positionSize: number;
  unrealizedPnl?: number;
  positionValue?: number;
};

type PositionHistoryEvent = {
  symbol: string;
  changeType: string;
  snapshotAt: string;
  unrealizedPnl: number;
};

type PositionsResponse = { address: string; positions: Position[] };
type HistoryResponse = { events: PositionHistoryEvent[] };

// ─── Chart tabs config ─────────────────────────────────────────────────────────

type TabKey = "radar" | "pnl" | "positions" | "activity";

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "radar", label: "钱包雷达图", icon: GitCompare },
  { key: "pnl", label: "PnL 趋势", icon: TrendingUp },
  { key: "positions", label: "仓位分布", icon: PieChart },
  { key: "activity", label: "交易活动", icon: Activity },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shortAddr(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

// ─── Summary cards for radar tab ─────────────────────────────────────────────

function RadarSummary({ data }: { data: CompareResponse }) {
  const { wallets, summary } = data;
  const best = (addr: string) => wallets.find((w) => w.address === addr);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {[
        { label: "综合评分最佳", addr: summary.bestScore?.address, value: summary.bestScore?.value, color: "text-indigo-500" },
        { label: "盈利最高", addr: summary.bestPnl?.address, value: summary.bestPnl?.value, prefix: "$" },
        { label: "胜率最高", addr: summary.bestWinRate?.address, value: summary.bestWinRate?.value, suffix: "%" },
        { label: "交易量最大", addr: summary.bestVolume?.address, value: summary.bestVolume?.value },
      ].map((item) => {
        const wallet = item.addr ? best(item.addr) : null;
        return (
          <Card key={item.label} className="p-3 border-border/50">
            <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
            <p className={`text-lg font-bold ${item.color ?? ""}`}>
              {item.value != null
                ? `${item.prefix ?? ""}${typeof item.value === "number" ? item.value.toLocaleString() : item.value}${item.suffix ?? ""}`
                : "—"}
            </p>
            {wallet && (
              <p className="text-xs text-muted-foreground font-mono mt-1">
                {shortAddr(wallet.address)}
              </p>
            )}
          </Card>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [addresses, setAddresses] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [tab, setTab] = useState<TabKey>("radar");

  const comparePath =
    addresses.length > 0
      ? `/wallets/compare?addresses=${addresses.map(encodeURIComponent).join(",")}`
      : null;

  const { data: compareData, loading: compareLoading, error: compareError, refetch: refetchCompare } =
    useApiQuery<CompareResponse>(comparePath, {
      enabled: addresses.length > 0,
      debounceMs: 300,
    });

  const positionsPath = selectedAddress
    ? `/positions/${encodeURIComponent(selectedAddress)}/current`
    : null;

  const { data: positions, loading: posLoading, error: posError, refetch: refetchPos } =
    useApiQuery<PositionsResponse>(positionsPath, { enabled: Boolean(selectedAddress) });

  const historyPath = selectedAddress
    ? `/positions/${encodeURIComponent(selectedAddress)}/history?limit=500`
    : null;

  const { data: history, loading: histLoading, error: histError, refetch: refetchHist } =
    useApiQuery<HistoryResponse>(historyPath, { enabled: Boolean(selectedAddress) });

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleAddAddresses = () => {
    const trimmed = input
      .trim()
      .replace(/,/g, "")
      .split(/\s+/)
      .filter(Boolean);
    if (!trimmed.length) return;
    const next = [...addresses, ...trimmed].slice(0, 5);
    setAddresses(next);
    setInput("");
    if (!selectedAddress && next.length > 0) {
      setSelectedAddress(next[0]);
    }
  };

  const handleRemove = (addr: string) => {
    setAddresses((prev) => prev.filter((a) => a !== addr));
    if (selectedAddress === addr) {
      setSelectedAddress("");
    }
  };

  // ─── Derived data ─────────────────────────────────────────────────────────

  const pnlData = history?.events
    ?.slice()
    .reverse()
    .map((e, i, arr) => {
      const cumulative = arr
        .slice(0, i + 1)
        .reduce((sum, ev) => sum + (ev.unrealizedPnl ?? 0), 0);
      return {
        date: new Date(e.snapshotAt).toLocaleDateString("zh-CN"),
        pnl: e.unrealizedPnl,
        cumulative,
      };
    }) ?? [];

  const activityData =
    history?.events?.map((e) => {
      const date = new Date(e.snapshotAt);
      const yearStart = new Date(date.getFullYear(), 0, 1);
      const week = Math.floor(
        (date.getTime() - yearStart.getTime()) / (7 * 24 * 60 * 60 * 1000)
      );
      const day = (date.getDay() + 6) % 7;
      return { week, day, count: 1, pnl: e.unrealizedPnl };
    }) ?? [];

  // ─── Render helpers ───────────────────────────────────────────────────────

  const renderTabContent = () => {
    switch (tab) {
      case "radar":
        return (
          <>
            {compareLoading && !compareData ? (
              <PageLoading />
            ) : compareError && !compareData ? (
              <PageError message={compareError.message} onRetry={refetchCompare} />
            ) : compareData?.wallets.length === 1 ? (
              <div className="flex flex-col items-center justify-center py-16 text-sm text-muted-foreground gap-3">
                <GitCompare className="h-8 w-8 opacity-40" />
                <p>请添加至少 2 个钱包进行雷达图对比</p>
                <p className="text-xs">当前: {shortAddr(compareData.wallets[0]?.address ?? "")}</p>
              </div>
            ) : compareData?.wallets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-sm text-muted-foreground gap-3">
                <BarChart3 className="h-8 w-8 opacity-40" />
                <p>未找到匹配的钱包地址</p>
              </div>
            ) : compareData ? (
              <>
                <RadarSummary data={compareData} />
                <div className="mt-4">
                  <WalletRadarChart
                    wallets={compareData.wallets.map((w) => ({
                      name: w.label || shortAddr(w.address),
                      address: w.address,
                      score: w.score ?? 0,
                      total_pnl: w.totalPnl ?? 0,
                      win_rate: w.winRate ?? 0,
                      volume_30d: w.volume30d ?? 0,
                    }))}
                  />
                </div>
              </>
            ) : null}
          </>
        );

      case "pnl":
        return histLoading && !history ? (
          <PageLoading />
        ) : histError && !history ? (
          <PageError message={histError.message} onRetry={refetchHist} />
        ) : pnlData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-sm text-muted-foreground gap-3">
            <TrendingUp className="h-8 w-8 opacity-40" />
            <p>{selectedAddress ? "暂无仓位变动历史" : "请在上方选择一个钱包"}</p>
          </div>
        ) : (
          <PnLAreaChart data={pnlData} showCumulative />
        );

      case "positions":
        return posLoading && !positions ? (
          <PageLoading />
        ) : posError && !positions ? (
          <PageError message={posError.message} onRetry={refetchPos} />
        ) : !positions?.positions || positions.positions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-sm text-muted-foreground gap-3">
            <PieChart className="h-8 w-8 opacity-40" />
            <p>{selectedAddress ? "暂无活跃仓位" : "请在上方选择一个钱包"}</p>
          </div>
        ) : (
          <PositionDistributionChart
            data={positions.positions.map((p) => ({
              asset: p.symbol,
              size: p.positionSize,
              value: p.positionValue ?? Math.abs(p.positionSize),
              pnl: p.unrealizedPnl,
            }))}
          />
        );

      case "activity":
        return histLoading && !history ? (
          <PageLoading />
        ) : histError && !history ? (
          <PageError message={histError.message} onRetry={refetchHist} />
        ) : activityData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-sm text-muted-foreground gap-3">
            <Activity className="h-8 w-8 opacity-40" />
            <p>{selectedAddress ? "暂无交易活动数据" : "请在上方选择一个钱包"}</p>
          </div>
        ) : (
          <TradeActivityHeatmap data={activityData} metric="count" />
        );
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          高级图表分析
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          多钱包对比雷达图 · PnL 趋势面积图 · 仓位分布甜甜圈图 · 交易活动热力图
        </p>
      </div>

      {/* Address input */}
      <Card className="p-4 border-border/50">
        <div className="flex gap-2">
          <input
            className="flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 text-sm font-mono"
            placeholder="输入钱包地址（最多 5 个，空格或逗号分隔）"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddAddresses()}
          />
          <Button
            size="sm"
            className="h-9"
            onClick={handleAddAddresses}
            disabled={!input.trim()}
          >
            添加
          </Button>
        </div>
        {addresses.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {addresses.map((a) => (
              <Badge key={a} variant="outline" className="font-mono text-xs gap-1 pr-1">
                {shortAddr(a)}
                <button
                  className="ml-1 text-muted-foreground hover:text-red-400 rounded-sm px-1"
                  onClick={() => handleRemove(a)}
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}
      </Card>

      {/* Address selector tabs (for position/PnL/activity charts) */}
      {addresses.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {addresses.map((a) => (
            <Button
              key={a}
              size="sm"
              variant={selectedAddress === a ? "default" : "outline"}
              onClick={() => setSelectedAddress(a)}
              className="font-mono text-xs"
            >
              {shortAddr(a)}
            </Button>
          ))}
        </div>
      )}

      {/* Chart type tabs */}
      <div className="flex border-b border-border">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                tab === t.key
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setTab(t.key)}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Chart card */}
      <Card className="p-4 border-border/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">
            {TABS.find((t) => t.key === tab)?.label}
          </h3>
          {selectedAddress && (
            <span className="font-mono text-xs text-muted-foreground">
              {shortAddr(selectedAddress)}
            </span>
          )}
        </div>
        {renderTabContent()}
      </Card>
    </div>
  );
}
