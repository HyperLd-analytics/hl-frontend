"use client";

import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import { useApiQuery } from "@/hooks/use-api-query";
import { PageLoading } from "@/components/common/page-loading";
import { PageError } from "@/components/common/page-error";
import {
  Plus, Trash2, Edit2, Zap, GitFork, BarChart3,
  CheckCircle2, XCircle, ChevronDown, ChevronUp, Copy,
  Play, RotateCcw, Calculator,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CustomMetric {
  id: number;
  name: string;
  description: string | null;
  formula: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface MetricTemplate {
  id: string;
  name: string;
  description: string;
  formula: string;
  category: string;
}

interface MetricResult {
  address: string;
  values: Record<string, number>;
  rank?: number;
}

interface CalculateResponse {
  mode: string;
  results: MetricResult[];
  applied_metrics: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shortAddr(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function fmt(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(2)}K`;
  return v.toFixed(4);
}

// ─── Template Modal ────────────────────────────────────────────────────────────

const TEMPLATE_CATEGORIES: Record<string, string> = {
  composite: "综合",
  momentum: "动量",
  whale: "鲸鱼",
  profitability: "盈利",
  efficiency: "效率",
  activity: "活跃度",
  performance: "近期表现",
  consistency: "一致性",
};

function TemplateModal({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (template: MetricTemplate) => void;
}) {
  const { data: templates, loading } = useApiQuery<MetricTemplate[]>(
    "/custom-metrics/templates",
    {}
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <Card className="w-full max-w-2xl border-border/50 p-6 shadow-xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold">选择指标模板</h2>
            <p className="text-xs text-muted-foreground mt-1">从预置模板快速创建指标</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
        </div>

        {loading ? (
          <PageLoading />
        ) : (
          <div className="space-y-2">
            {templates?.map((t) => (
              <div
                key={t.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => { onSelect(t); onClose(); }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{t.name}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {TEMPLATE_CATEGORIES[t.category] ?? t.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{t.description}</p>
                  <code className="text-[11px] text-primary font-mono mt-1 block">
                    {t.formula}
                  </code>
                </div>
                <GitFork className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
              </div>
            ))}
          </div>
        )}

        <Button variant="outline" className="w-full mt-4" onClick={onClose}>
          取消
        </Button>
      </Card>
    </div>
  );
}

// ─── Create/Edit Modal ─────────────────────────────────────────────────────────

function MetricModal({
  initial,
  onClose,
  onSaved,
}: {
  initial?: CustomMetric;
  onClose: () => void;
  onSaved: (metric: CustomMetric) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [formula, setFormula] = useState(initial?.formula ?? "");
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!name.trim()) { setError("请输入指标名称"); return; }
    if (!formula.trim()) { setError("请输入公式"); return; }
    setLoading(true);
    setError("");
    try {
      const payload = { name: name.trim(), description, formula: formula.trim(), is_active: isActive };
      let res: CustomMetric;
      if (initial) {
        res = await apiFetch<CustomMetric>({
          path: `/custom-metrics/${initial.id}`,
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        res = await apiFetch<CustomMetric>({
          path: "/custom-metrics/",
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      onSaved(res);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <Card className="w-full max-w-lg border-border/50 p-6 shadow-xl">
        <h2 className="text-lg font-semibold mb-4">
          {initial ? "编辑指标" : "新建自定义指标"}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">指标名称 *</label>
            <Input
              placeholder="例如：我的综合评分"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={64}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">描述（可选）</label>
            <Input
              placeholder="简要描述这个指标的用途"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              公式 * <span className="text-muted-foreground/60">（示例：win_rate * 100 + score）</span>
            </label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
              placeholder="win_rate * 100 + score"
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              maxLength={500}
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              可用字段：score, win_rate, total_pnl, volume_30d, trade_count_30d,
              lifetime_trade_count, avg_position_size, max_leverage, account_value
            </p>
            <p className="text-[10px] text-muted-foreground">
              函数：abs, min, max, round, sqrt, log, exp, pow
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="accent-primary"
            />
            启用此指标
          </label>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="flex gap-2 mt-6">
          <Button className="flex-1" onClick={handleSave} disabled={loading}>
            {loading ? <RotateCcw className="h-4 w-4 animate-spin" /> : null}
            {loading ? "保存中..." : "保存"}
          </Button>
          <Button variant="outline" onClick={onClose}>取消</Button>
        </div>
      </Card>
    </div>
  );
}

// ─── Metric Card ────────────────────────────────────────────────────────────────

function MetricCard({
  metric,
  onEdit,
  onDelete,
  onClone,
}: {
  metric: CustomMetric;
  onEdit: (m: CustomMetric) => void;
  onDelete: (id: number) => void;
  onClone: (id: number) => void;
}) {
  return (
    <Card className="p-4 border-border/50 hover:border-border transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`mt-0.5 p-1.5 rounded-md shrink-0 ${metric.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
            <Zap className="h-3.5 w-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-medium text-sm">{metric.name}</h4>
              {metric.is_active ? (
                <span className="inline-flex items-center gap-1 text-[10px] text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded">
                  <CheckCircle2 className="h-2.5 w-2.5" /> 启用
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  <XCircle className="h-2.5 w-2.5" /> 停用
                </span>
              )}
            </div>
            {metric.description && (
              <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
            )}
            <code className="text-[11px] font-mono text-primary/80 mt-1 block">
              {metric.formula}
            </code>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onClone(metric.id)}
            title="从模板克隆"
          >
            <GitFork className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onEdit(metric)}
            title="编辑"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:text-red-500"
            onClick={() => onDelete(metric.id)}
            title="删除"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<CustomMetric[]>([]);
  const [templates, setTemplates] = useState<MetricTemplate[]>([]);
  const [calcResults, setCalcResults] = useState<CalculateResponse | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcError, setCalcError] = useState("");
  const [mode, setMode] = useState<"single" | "batch" | "leaderboard">("leaderboard");
  const [addressInput, setAddressInput] = useState("");
  const [addresses, setAddresses] = useState<string[]>([]);
  const [customFormula, setCustomFormula] = useState("");
  const [showTemplate, setShowTemplate] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editingMetric, setEditingMetric] = useState<CustomMetric | undefined>();

  // Load user's metrics
  const fetchMetrics = useCallback(async () => {
    try {
      const res = await apiFetch<CustomMetric[]>({ path: "/custom-metrics/" });
      setMetrics(res ?? []);
    } catch { /* ignore */ }
  }, []);

  // Load templates
  const fetchTemplates = useCallback(async () => {
    try {
      const res = await apiFetch<MetricTemplate[]>({ path: "/custom-metrics/templates" });
      setTemplates(res ?? []);
    } catch { /* ignore */ }
  }, []);

  useState(() => {
    fetchMetrics();
    fetchTemplates();
  });

  // Auto-run calculation when metrics change (leaderboard mode)
  useState(() => {
    if (metrics.filter((m) => m.is_active).length > 0 && mode === "leaderboard") {
      runCalculation();
    }
  });

  const runCalculation = async () => {
    if (metrics.filter((m) => m.is_active).length === 0 && !customFormula) {
      setCalcError("请先创建或启用至少一个指标");
      return;
    }
    setCalcLoading(true);
    setCalcError("");
    try {
      const payload: Record<string, unknown> = { mode, formula: customFormula || undefined };
      if (mode === "single") {
        payload.address = addressInput.trim();
      } else if (mode === "batch") {
        payload.addresses = addresses;
      }
      const res = await apiFetch<CalculateResponse>({
        path: "/custom-metrics/calculate",
        method: "POST",
        body: JSON.stringify(payload),
      });
      setCalcResults(res);
    } catch (e) {
      setCalcError((e as Error).message);
    } finally {
      setCalcLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除此指标？")) return;
    try {
      await apiFetch({ path: `/custom-metrics/${id}`, method: "DELETE" });
      setMetrics((prev) => prev.filter((m) => m.id !== id));
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleClone = async (id: number) => {
    try {
      const m = metrics.find((m) => m.id === id);
      if (!m) return;
      const payload = { name: `${m.name}（副本）`, description: m.description, formula: m.formula, is_active: true };
      const res = await apiFetch<CustomMetric>({
        path: "/custom-metrics/",
        method: "POST",
        body: JSON.stringify(payload),
      });
      setMetrics((prev) => [res, ...prev]);
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleSaved = (metric: CustomMetric) => {
    setMetrics((prev) => {
      const idx = prev.findIndex((m) => m.id === metric.id);
      if (idx >= 0) {
        return prev.map((m) => (m.id === metric.id ? metric : m));
      }
      return [metric, ...prev];
    });
    setShowCreate(false);
    setEditingMetric(undefined);
  };

  const handleTemplateSelect = (template: MetricTemplate) => {
    setEditingMetric({
      id: 0,
      name: template.name,
      description: template.description,
      formula: template.formula,
      is_active: true,
      sort_order: 0,
      created_at: "",
      updated_at: "",
    });
    setShowCreate(true);
  };

  const addAddress = () => {
    const trimmed = addressInput.trim().replace(/,/g, "").split(/\s+/).filter(Boolean);
    setAddresses((prev) => [...prev, ...trimmed].slice(0, 20));
    setAddressInput("");
  };

  const activeMetrics = metrics.filter((m) => m.is_active);
  const appliedMetricNames = calcResults
    ? calcResults.applied_metrics.map((id) => {
        const m = metrics.find((m) => String(m.id) === id);
        if (!m) {
          const t = templates.find((t) => t.id === id);
          return t?.name ?? id;
        }
        return m.name;
      })
    : [];

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calculator className="h-6 w-6" />
            自定义指标
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            创建个性化公式，自定义评分维度，生成专属排行榜
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-9" onClick={() => setShowTemplate(true)}>
            <GitFork className="h-4 w-4 mr-1" /> 从模板创建
          </Button>
          <Button size="sm" className="h-9" onClick={() => { setEditingMetric(undefined); setShowCreate(true); }}>
            <Plus className="h-4 w-4 mr-1" /> 新建指标
          </Button>
        </div>
      </div>

      {/* Metric List */}
      <div>
        <h3 className="text-sm font-medium mb-3">我的指标（{metrics.length}）</h3>
        {metrics.length === 0 ? (
          <Card className="p-8 text-center border-border/50">
            <Zap className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">还没有创建任何指标</p>
            <div className="flex gap-2 justify-center mt-3">
              <Button variant="outline" size="sm" onClick={() => setShowTemplate(true)}>
                从模板创建
              </Button>
              <Button size="sm" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4 mr-1" /> 自定义公式
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {metrics.map((m) => (
              <MetricCard
                key={m.id}
                metric={m}
                onEdit={(metric) => { setEditingMetric(metric); setShowCreate(true); }}
                onDelete={handleDelete}
                onClone={handleClone}
              />
            ))}
          </div>
        )}
      </div>

      {/* Calculator */}
      <div>
        <h3 className="text-sm font-medium mb-3">指标计算</h3>
        <Card className="p-4 border-border/50 space-y-4">
          {/* Mode tabs */}
          <div className="flex border-b border-border">
            {[
              { key: "leaderboard" as const, label: "全量排行榜" },
              { key: "single" as const, label: "单个地址" },
              { key: "batch" as const, label: "批量地址" },
            ].map((t) => (
              <button
                key={t.key}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  mode === t.key ? "border-b-2 border-primary text-primary" : "text-muted-foreground"
                }`}
                onClick={() => setMode(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Address inputs */}
          {mode === "single" && (
            <div className="flex gap-2">
              <Input
                className="font-mono text-sm"
                placeholder="0x... 输入钱包地址"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addAddress()}
              />
              <Button size="sm" onClick={addAddress}>添加</Button>
            </div>
          )}

          {mode === "batch" && (
            <>
              <div className="flex gap-2">
                <Input
                  className="font-mono text-sm"
                  placeholder="输入地址（空格分隔，最多 20 个）"
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addAddress()}
                />
                <Button size="sm" onClick={addAddress}>添加</Button>
              </div>
              {addresses.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {addresses.map((a) => (
                    <Badge key={a} variant="outline" className="font-mono text-xs gap-1">
                      {shortAddr(a)}
                      <button
                        className="ml-1 hover:text-red-400"
                        onClick={() => setAddresses((p) => p.filter((x) => x !== a))}
                      >×</button>
                    </Badge>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Custom formula overlay */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              附加自定义公式（可选，不保存）
            </label>
            <Input
              className="font-mono text-sm"
              placeholder="例如：score * 2 + win_rate"
              value={customFormula}
              onChange={(e) => setCustomFormula(e.target.value)}
            />
          </div>

          <Button
            className="w-full"
            onClick={runCalculation}
            disabled={calcLoading || (activeMetrics.length === 0 && !customFormula)}
          >
            {calcLoading ? (
              <RotateCcw className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Play className="h-4 w-4 mr-1" />
            )}
            {calcLoading ? "计算中..." : "运行计算"}
          </Button>

          {calcError && (
            <p className="text-xs text-red-500 text-center">{calcError}</p>
          )}
        </Card>
      </div>

      {/* Results Table */}
      {calcResults && calcResults.results.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">
              计算结果 <span className="text-muted-foreground font-normal">（{calcResults.results.length} 个钱包）</span>
            </h3>
            <div className="flex flex-wrap gap-1">
              {appliedMetricNames.map((name, i) => (
                <Badge key={i} variant="outline" className="text-[10px]">{name}</Badge>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-3 py-2 text-left text-xs text-muted-foreground font-medium w-10">#</th>
                    <th className="px-3 py-2 text-left text-xs text-muted-foreground font-medium">地址</th>
                    {appliedMetricNames.map((name, i) => (
                      <th key={i} className="px-3 py-2 text-right text-xs text-muted-foreground font-medium">
                        {name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {calcResults.results.map((row) => (
                    <tr key={row.address} className="border-t border-border/50 hover:bg-muted/20">
                      <td className="px-3 py-2 text-muted-foreground text-xs">
                        {row.rank ?? "—"}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">{shortAddr(row.address)}</td>
                      {calcResults.applied_metrics.map((mid, i) => (
                        <td key={i} className="px-3 py-2 text-right font-mono text-xs">
                          {fmt(row.values[mid] ?? 0)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {calcResults && calcResults.results.length === 0 && !calcLoading && (
        <Card className="p-6 text-center border-border/50">
          <p className="text-sm text-muted-foreground">没有找到匹配的钱包数据</p>
        </Card>
      )}

      {/* Modals */}
      {showTemplate && (
        <TemplateModal
          onClose={() => setShowTemplate(false)}
          onSelect={handleTemplateSelect}
        />
      )}

      {(showCreate || editingMetric) && (
        <MetricModal
          initial={editingMetric}
          onClose={() => { setShowCreate(false); setEditingMetric(undefined); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
