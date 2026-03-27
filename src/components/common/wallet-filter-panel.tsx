"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApi } from "@/hooks/use-api";
import {
  SIZE_COHORTS,
  PNL_COHORTS,
  SORT_OPTIONS,
  SavedFilter,
  WalletFilter,
} from "@/types/wallet";

type Props = {
  filters: WalletFilter;
  onFiltersChange: (f: WalletFilter) => void;
  savedFilters: SavedFilter[];
  onSavedFiltersChange: () => void;
};

export function WalletFilterPanel({
  filters,
  onFiltersChange,
  savedFilters,
  onSavedFiltersChange,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [savingName, setSavingName] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);
  const { request, loading } = useApi();

  const update = (partial: Partial<WalletFilter>) =>
    onFiltersChange({ ...filters, ...partial });

  const applySaved = (sf: SavedFilter) => onFiltersChange(sf.filters);

  const handleSave = async () => {
    if (!savingName.trim()) return;
    try {
      await request<SavedFilter>({
        path: "/saved-filters",
        method: "POST",
        body: JSON.stringify({
          name: savingName.trim(),
          filter_type: "cohort_leaderboard",
          filters,
          is_default: false,
        }),
      });
      setShowSaveInput(false);
      setSavingName("");
      onSavedFiltersChange();
    } catch {
      // error handled by useApi
    }
  };

  const defaultFilter = savedFilters.find((f) => f.is_default);

  return (
    <div className="space-y-2">
      {/* 工具栏：快捷筛选 + 展开按钮 */}
      <Card className="flex flex-wrap items-center gap-2 p-3">
        {/* 排序 */}
        <select
          className="h-9 rounded-md border border-border bg-background px-2 text-sm"
          value={filters.sortBy}
          onChange={(e) => update({ sortBy: e.target.value })}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {/* 升序/降序 */}
        <Button
          size="sm"
          variant={filters.sortDir === "asc" ? "default" : "outline"}
          onClick={() => update({ sortDir: filters.sortDir === "asc" ? "desc" : "asc" })}
        >
          {filters.sortDir === "asc" ? "↑ 升序" : "↓ 降序"}
        </Button>

        {/* Size Cohort */}
        <select
          className="h-9 rounded-md border border-border bg-background px-2 text-sm"
          value={filters.sizeCohort ?? ""}
          onChange={(e) => update({ sizeCohort: e.target.value || undefined })}
        >
          {SIZE_COHORTS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        {/* PnL Cohort */}
        <select
          className="h-9 rounded-md border border-border bg-background px-2 text-sm"
          value={filters.pnlCohort ?? ""}
          onChange={(e) => update({ pnlCohort: e.target.value || undefined })}
        >
          {PNL_COHORTS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        {/* 保存按钮 */}
        {showSaveInput ? (
          <div className="flex items-center gap-1">
            <input
              className="h-9 w-36 rounded-md border border-border bg-background px-2 text-sm"
              placeholder="筛选器名称"
              value={savingName}
              onChange={(e) => setSavingName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
            <Button size="sm" onClick={handleSave} disabled={loading}>
              保存
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowSaveInput(false)}>
              取消
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowSaveInput(true)}
          >
            保存筛选
          </Button>
        )}

        {/* 已保存筛选器 */}
        {savedFilters.length > 0 && (
          <div className="ml-auto flex items-center gap-1">
            {defaultFilter && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => applySaved(defaultFilter)}
              >
                {defaultFilter.name}
              </Button>
            )}
            {savedFilters
              .filter((f) => !f.is_default)
              .slice(0, 2)
              .map((sf) => (
                <Button
                  key={sf.id}
                  size="sm"
                  variant="ghost"
                  className="text-xs"
                  onClick={() => applySaved(sf)}
                >
                  {sf.name}
                </Button>
              ))}
          </div>
        )}

        {/* 展开/收起 */}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setExpanded((v) => !v)}
          className="ml-auto"
        >
          {expanded ? "收起" : "更多筛选"}
        </Button>
      </Card>

      {/* 展开区域：详细范围筛选 */}
      {expanded && (
        <Card className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Score 范围 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">评分范围</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
                placeholder="最小"
                value={filters.minScore ?? ""}
                onChange={(e) =>
                  update({ minScore: e.target.value ? Number(e.target.value) : undefined })
                }
              />
              <span className="text-muted-foreground">-</span>
              <input
                type="number"
                className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
                placeholder="最大"
                value={filters.maxScore ?? ""}
                onChange={(e) =>
                  update({ maxScore: e.target.value ? Number(e.target.value) : undefined })
                }
              />
            </div>
          </div>

          {/* PnL 范围 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">PnL 范围 ($)</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
                placeholder="最小"
                value={filters.minPnl ?? ""}
                onChange={(e) =>
                  update({ minPnl: e.target.value ? Number(e.target.value) : undefined })
                }
              />
              <span className="text-muted-foreground">-</span>
              <input
                type="number"
                className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
                placeholder="最大"
                value={filters.maxPnl ?? ""}
                onChange={(e) =>
                  update({ maxPnl: e.target.value ? Number(e.target.value) : undefined })
                }
              />
            </div>
          </div>

          {/* 胜率范围 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">胜率范围 (%)</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                max={100}
                className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
                placeholder="最小"
                value={filters.minWinRate ?? ""}
                onChange={(e) =>
                  update({
                    minWinRate: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
              <span className="text-muted-foreground">-</span>
              <input
                type="number"
                min={0}
                max={100}
                className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
                placeholder="最大"
                value={filters.maxWinRate ?? ""}
                onChange={(e) =>
                  update({
                    maxWinRate: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </div>
          </div>

          {/* 30天交易量范围 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">30天交易量 ($)</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
                placeholder="最小"
                value={filters.minVolume ?? ""}
                onChange={(e) =>
                  update({
                    minVolume: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
              <span className="text-muted-foreground">-</span>
              <input
                type="number"
                className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
                placeholder="最大"
                value={filters.maxVolume ?? ""}
                onChange={(e) =>
                  update({
                    maxVolume: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </div>
          </div>

          {/* 重置按钮 */}
          <div className="sm:col-span-2 lg:col-span-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onFiltersChange({
                  sortBy: "score",
                  sortDir: "desc",
                  search: filters.search,
                })
              }
            >
              重置筛选
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
