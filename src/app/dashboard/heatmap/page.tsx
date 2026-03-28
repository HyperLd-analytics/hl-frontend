"use client";

import { useState } from "react";
import useSWR from "swr";

const COHORT_LABELS: Record<string, string> = {
  Shrimp: "Shrimp<br/>($0-1K)",
  Fish: "Fish<br/>($1K-10K)",
  Dolphin: "Dolphin<br/>($10K-100K)",
  "Apex Predator": "Apex Pred<br/>($100K-1M)",
  "Small Whale": "Sm Whale<br/>($1M-10M)",
  Whale: "Whale<br/>($10M-100M)",
  "Tidal Whale": "Tidal Whale<br/>($100M-1B)",
  Leviathan: "Leviathan<br/>>($1B)",
  "Money Printer": "Money Printer",
  "Smart Money": "Smart Money",
  Grinder: "Grinder",
  "Humble Earner": "Humble Earner",
  "Exit Liquidity": "Exit Liquidity",
  "Semi-Rekt": "Semi-Rekt",
  "Full Rekt": "Full Rekt",
  "Giga-Rekt": "Giga-Rekt",
};

type HeatmapResponse = {
  assets: string[];
  cohorts: string[];
  matrix: Record<string, Record<string, {
    bias: number;
    long_usd: number;
    short_usd: number;
    wallet_count: number;
  }>>;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function biasColor(bias: number): string {
  // bias: -1 (全空) → red, 0 (中性) → gray, +1 (全多) → green
  if (bias > 0) {
    const intensity = Math.round(bias * 200);
    return `rgba(34, 197, 94, ${Math.min(0.1 + bias * 0.8, 1)})`;
  } else if (bias < 0) {
    const intensity = Math.round(Math.abs(bias) * 200);
    return `rgba(239, 68, 68, ${Math.min(0.1 + Math.abs(bias) * 0.8, 1)})`;
  }
  return "rgba(107, 114, 128, 0.15)";
}

function BiasBar({ bias }: { bias: number }) {
  const pct = Math.abs(bias) * 100;
  return (
    <div className="flex items-center gap-1">
      <div className="w-10 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${bias >= 0 ? "bg-green-500" : "bg-red-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-mono ${bias > 0 ? "text-green-500" : bias < 0 ? "text-red-500" : "text-muted-foreground"}`}>
        {bias > 0 ? "+" : ""}{(bias * 100).toFixed(0)}%
      </span>
    </div>
  );
}

export default function HeatmapPage() {
  const { data, error, isLoading } = useSWR<HeatmapResponse>("/api/v1/position-heatmap", fetcher);
  const [selectedCell, setSelectedCell] = useState<{ asset: string; cohort: string } | null>(null);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="h-[500px] animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-600">
          <p className="font-medium">加载失败</p>
          <p className="text-sm mt-1">请确保后端服务已启动</p>
        </div>
      </div>
    );
  }

  const { assets, cohorts, matrix } = data;
  const cell = selectedCell ? matrix[selectedCell.asset]?.[selectedCell.cohort] : null;

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">全局仓位热图</h1>
        <p className="text-muted-foreground mt-1">
          全市场 × 全规模 Cohort 多空偏向矩阵
        </p>
      </div>

      {/* 图例 */}
      <div className="flex items-center gap-4 text-xs">
        <span className="text-muted-foreground">多空偏向：</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-3 rounded-sm bg-red-500/80" />
          <span className="text-muted-foreground">偏空</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-3 rounded-sm bg-gray-300" />
          <span className="text-muted-foreground">中性</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-3 rounded-sm bg-green-500/80" />
          <span className="text-muted-foreground">偏多</span>
        </div>
      </div>

      {/* 热图网格 */}
      <div className="rounded-xl border bg-card shadow-sm overflow-x-auto">
        <div className="min-w-[900px]">
          {/* 表头 Cohort */}
          <div className="flex">
            <div className="w-24 shrink-0 px-3 py-2 border-b border-r bg-muted/50" />
            {cohorts.map((cohort) => (
              <div
                key={cohort}
                className="flex-1 min-w-[80px] px-1 py-2 border-b border-r text-center text-[10px] leading-tight text-muted-foreground bg-muted/50"
                dangerouslySetInnerHTML={{ __html: COHORT_LABELS[cohort] || cohort }}
              />
            ))}
          </div>

          {/* 资产行 */}
          {assets.map((asset) => (
            <div key={asset} className="flex hover:bg-muted/30 transition-colors">
              {/* 资产名列 */}
              <div className="w-24 shrink-0 px-3 py-2 border-b border-r font-mono font-medium text-sm bg-card sticky left-0">
                {asset}
              </div>

              {/* 单元格 */}
              {cohorts.map((cohort) => {
                const stats = matrix[asset]?.[cohort];
                const bias = stats?.bias ?? 0;
                const bg = biasColor(bias);
                const isSelected =
                  selectedCell?.asset === asset && selectedCell?.cohort === cohort;

                return (
                  <div
                    key={cohort}
                    className={`flex-1 min-w-[80px] h-14 px-1 py-1 border-b border-r cursor-pointer transition-all ${isSelected ? "ring-2 ring-primary z-10" : ""}`}
                    style={{ backgroundColor: bg }}
                    onClick={() =>
                      setSelectedCell(
                        isSelected ? null : { asset, cohort }
                      )
                    }
                    title={`${asset} × ${cohort}: ${bias >= 0 ? "+" : ""}${(bias * 100).toFixed(1)}%`}
                  >
                    {stats && (
                      <div className="flex flex-col justify-center h-full">
                        <BiasBar bias={bias} />
                        <div className="text-[10px] text-muted-foreground/70 mt-0.5 text-center">
                          {stats.wallet_count} 钱包
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* 选中详情 */}
      {selectedCell && cell && (
        <div className="rounded-xl border bg-card shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">
              {selectedCell.asset} × {COHORT_LABELS[selectedCell.cohort]?.replace(/<[^>]+>/g, " ") || selectedCell.cohort}
            </h3>
            <button
              onClick={() => setSelectedCell(null)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              关闭
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">Bias</p>
              <p className={`text-xl font-bold mt-1 ${cell.bias >= 0 ? "text-green-500" : "text-red-500"}`}>
                {cell.bias >= 0 ? "+" : ""}{(cell.bias * 100).toFixed(1)}%
              </p>
            </div>
            <div className="rounded-lg bg-green-500/10 p-3">
              <p className="text-xs text-muted-foreground">多头仓位</p>
              <p className="text-xl font-bold mt-1 text-green-500">
                ${cell.long_usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="rounded-lg bg-red-500/10 p-3">
              <p className="text-xs text-muted-foreground">空头仓位</p>
              <p className="text-xl font-bold mt-1 text-red-500">
                ${cell.short_usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">钱包数量</p>
              <p className="text-xl font-bold mt-1">
                {cell.wallet_count}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
