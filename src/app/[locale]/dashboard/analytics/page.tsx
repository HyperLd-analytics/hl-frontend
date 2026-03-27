"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApiQuery } from "@/hooks/use-api-query";
import { PageLoading } from "@/components/common/page-loading";
import { PageError } from "@/components/common/page-error";
import { WalletRadarChart } from "@/components/charts/wallet-radar-chart";
import { PnLAreaChart } from "@/components/charts/pnl-area-chart";
import { PositionDistributionChart } from "@/components/charts/position-distribution-chart";
import { TradeActivityHeatmap } from "@/components/charts/trade-activity-heatmap";
import { useApi } from "@/hooks/use-api";
import { useToast } from "@/components/providers/toast-provider";
import { TrendingUp, PieChart, Activity, GitCompare } from "lucide-react";

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

type Tab = "radar" | "pnl" | "positions" | "activity";

function shortAddr(a: string) {
  return `${a.slice(0, 6)}...${a.slice(-4)}`;
}

export default function AnalyticsPage() {
  const t = useTranslations("compare");
  const locale = useLocale();
  const { request } = useApi();
  const { pushToast } = useToast();
  const [tab, setTab] = useState<Tab>("radar");
  const [compareAddresses, setCompareAddresses] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [selectedAddress, setSelectedAddress] = useState<string>("");

  const { data: compareData, loading: compareLoading, error: compareError, refetch: refetchCompare } =
    useApiQuery<CompareResponse>(
      compareAddresses.length > 0
        ? `/wallets/compare?addresses=${compareAddresses.map(encodeURIComponent).join(",")}`
        : null,
      { enabled: compareAddresses.length > 0, debounceMs: 300 }
    );

  const { data: positions, loading: posLoading, error: posError, refetch: refetchPos } =
    useApiQuery<PositionsResponse>(
      selectedAddress ? `/positions/${encodeURIComponent(selectedAddress)}/current` : null,
      { enabled: Boolean(selectedAddress) }
    );

  const { data: history, loading: histLoading, error: histError, refetch: refetchHist } =
    useApiQuery<HistoryResponse>(
      selectedAddress
        ? `/positions/${encodeURIComponent(selectedAddress)}/history?limit=500`
        : null,
      { enabled: Boolean(selectedAddress) }
    );

  const handleAddAddress = () => {
    const trimmed = input.trim().replace(/,/g, "").split(/\s+/).filter(Boolean);
    if (!trimmed.length) return;
    const newAddrs = [...compareAddresses, ...trimmed].slice(0, 5);
    setCompareAddresses(newAddrs);
    setInput("");
    if (!selectedAddress && newAddrs.length > 0) {
      setSelectedAddress(newAddrs[0]);
    }
  };

  const handleRemove = (addr: string) => {
    setCompareAddresses((prev) => prev.filter((a) => a !== addr));
    if (selectedAddress === addr) {
      setSelectedAddress("");
    }
  };

  // Derive PnL trend from history events
  const pnlData = history?.events?.slice().reverse().map((e, i) => {
    const cumulative = history.events
      .slice(0, i + 1)
      .reduce((sum, ev) => sum + (ev.unrealizedPnl ?? 0), 0);
    return {
      date: new Date(e.snapshotAt).toLocaleDateString("zh-CN"),
      pnl: e.unrealizedPnl,
      cumulative,
    };
  }) ?? [];

  // Derive trade activity heatmap from history events
  const activityData = history?.events?.map((e) => {
    const date = new Date(e.snapshotAt);
    const yearStart = new Date(date.getFullYear(), 0, 1);
    const week = Math.floor(
      (date.getTime() - yearStart.getTime()) / (7 * 24 * 60 * 60 * 1000)
    );
    const day = (date.getDay() + 6) % 7; // Mon=0
    return { week, day, count: 1, pnl: e.unrealizedPnl };
  }) ?? [];

  const tabs = [
    { key: "radar" as const, label: "钱包雷达图", icon: GitCompare },
    { key: "pnl" as const, label: "PnL 趋势", icon: TrendingUp },
    { key: "positions" as const, label: "仓位分布", icon: PieChart },
    { key: "activity" as const, label: "交易活动", icon: Activity },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">高级图表分析</h1>

      {/* 地址输入 */}
      <Card className="space-y-3 p-4">
        <div className="text-sm text-muted-foreground">
          输入钱包地址进行高级分析（最多 5 个，用于雷达图对比）
        </div>
        <div className="flex gap-2">
          <input
            className="h-10 flex-1 rounded-md border border-border bg-background px-3 text-sm font-mono"
            placeholder="0x... 或多个地址（空格分隔）"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddAddress()}
          />
          <Button onClick={handleAddAddress} disabled={!input.trim()}>
            添加
          </Button>
        </div>
        {compareAddresses.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {compareAddresses.map((a) => (
              <span
                key={a}
                className="inline-flex items-center gap-1 rounded bg-muted px-2 py-1 font-mono text-xs"
              >
                {shortAddr(a)}
                <button
                  className="ml-1 text-muted-foreground hover:text-red-400"
                  onClick={() => handleRemove(a)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </Card>

      {/* 分析地址选择（用于仓位/PnL分析） */}
      {compareAddresses.length > 0 && (
        <div className="flex gap-2">
          {compareAddresses.map((a) => (
            <Button
              key={a}
              size="sm"
              variant={selectedAddress === a ? "default" : "outline"}
              onClick={() => setSelectedAddress(a)}
            >
              {shortAddr(a)}
            </Button>
          ))}
        </div>
      )}

      {/* 标签切换 */}
      <div className="flex border-b border-border">
        {tabs.map((tabItem) => {
          const Icon = tabItem.icon;
          return (
            <button
              key={tabItem.key}
              className={`flex flex-1 items-center justify-center gap-2 pb-3 text-sm font-medium transition-colors ${
                tab === tabItem.key
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setTab(tabItem.key)}
            >
              <Icon className="h-4 w-4" />
              {tabItem.label}
            </button>
          );
        })}
      </div>

      {/* 雷达图 */}
      {tab === "radar" && (
        <Card className="p-4">
          <h3 className="mb-4 text-sm font-medium">多钱包多维对比雷达图</h3>
          {compareLoading && !compareData ? (
            <PageLoading />
          ) : compareError && !compareData ? (
            <PageError message={compareError.message} onRetry={refetchCompare} />
          ) : compareData?.wallets.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">未找到匹配的钱包</div>
          ) : compareData?.wallets.length === 1 ? (
            <div className="py-12 text-center text-muted-foreground">请添加至少 2 个钱包进行对比</div>
          ) : compareData ? (
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
          ) : null}
        </Card>
      )}

      {/* PnL 趋势面积图 */}
      {tab === "pnl" && (
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">累计盈亏趋势</h3>
            {selectedAddress && (
              <span className="font-mono text-xs text-muted-foreground">{shortAddr(selectedAddress)}</span>
            )}
          </div>
          {histLoading && !history ? (
            <PageLoading />
          ) : histError && !history ? (
            <PageError message={histError.message} onRetry={refetchHist} />
          ) : pnlData.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {selectedAddress ? "暂无仓位变动数据" : "请选择一个钱包地址查看 PnL 趋势"}
            </div>
          ) : (
            <PnLAreaChart data={pnlData} showCumulative />
          )}
        </Card>
      )}

      {/* 仓位分布甜甜圈图 */}
      {tab === "positions" && (
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">仓位分布</h3>
            {selectedAddress && (
              <span className="font-mono text-xs text-muted-foreground">{shortAddr(selectedAddress)}</span>
            )}
          </div>
          {posLoading && !positions ? (
            <PageLoading />
          ) : posError && !positions ? (
            <PageError message={posError.message} onRetry={refetchPos} />
          ) : !positions?.positions || positions.positions.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {selectedAddress ? "暂无活跃仓位" : "请选择一个钱包地址查看仓位分布"}
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
          )}
        </Card>
      )}

      {/* 交易活动热力图 */}
      {tab === "activity" && (
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">交易活动热力图</h3>
            {selectedAddress && (
              <span className="font-mono text-xs text-muted-foreground">{shortAddr(selectedAddress)}</span>
            )}
          </div>
          {histLoading && !history ? (
            <PageLoading />
          ) : histError && !history ? (
            <PageError message={histError.message} onRetry={refetchHist} />
          ) : activityData.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {selectedAddress ? "暂无交易活动数据" : "请选择一个钱包地址查看交易活动"}
            </div>
          ) : (
            <TradeActivityHeatmap data={activityData} />
          )}
        </Card>
      )}
    </div>
  );
}
