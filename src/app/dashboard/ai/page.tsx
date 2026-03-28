"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApiQuery } from "@/hooks/use-api-query";
import { PageLoading } from "@/components/common/page-loading";
import { PageError } from "@/components/common/page-error";
import { apiFetch } from "@/lib/api";
import { Brain, Users, Wallet, TrendingUp, Clock, Info, Loader2, Lock } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type CohortAnalysis = {
  symbol: string | null;
  analysis: string;
  insights?: string[];
  recommendations?: string[];
  dataPoints?: number;
  timestamp?: string;
  error?: string;
};

type WalletAnalysis = {
  address: string;
  analysis: string;
  walletData?: {
    sizeCohort: string;
    pnlCohort: string;
    score: number;
  };
  error?: string;
};

type MarketReport = {
  report: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shortAddr(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "刚刚";
  if (min < 60) return `${min} 分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小时前`;
  return `${Math.floor(hr / 24)} 天前`;
}

// ─── Cohort Analysis Section ───────────────────────────────────────────────────

function CohortAnalysisSection() {
  const { data, loading, error, refetch } = useApiQuery<CohortAnalysis>("/ai-analysis/cohort-analysis");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Cohort 市场分析</h3>
        </div>
        <div className="flex items-center gap-2">
          {data?.timestamp && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeAgo(data.timestamp)}
            </span>
          )}
          {data?.dataPoints && (
            <Badge variant="outline" className="text-xs">{data.dataPoints} 个数据点</Badge>
          )}
        </div>
      </div>

      {loading && !data ? (
        <PageLoading />
      ) : error && !data ? (
        <PageError message={error.message} onRetry={refetch} />
      ) : data?.error && !data.analysis ? (
        <PageError message={data.error} onRetry={refetch} />
      ) : data?.analysis ? (
        <Card className="p-4 border-border/50 bg-muted/30">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{data.analysis}</p>
          </div>
          {data.recommendations && data.recommendations.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">交易建议</h4>
              <ul className="space-y-1">
                {data.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground gap-3">
          <Info className="h-6 w-6 opacity-40" />
          <p>暂无 Cohort 分析数据</p>
        </div>
      )}
    </div>
  );
}

// ─── Wallet Analysis Section ───────────────────────────────────────────────────

function WalletAnalysisSection() {
  const [input, setInput] = useState("");
  const [address, setAddress] = useState("");

  const path = address ? `/ai-analysis/wallet-analysis/${encodeURIComponent(address)}` : null;
  const { data, loading, error, refetch } = useApiQuery<WalletAnalysis>(path);

  const handleAnalyze = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setAddress(trimmed);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Wallet className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">钱包行为 AI 分析</h3>
      </div>

      <div className="flex gap-2">
        <input
          className="flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 text-sm font-mono"
          placeholder="输入钱包地址进行 AI 分析"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
        />
        <Button size="sm" className="h-9" onClick={handleAnalyze} disabled={!input.trim()}>
          <Brain className="h-4 w-4 mr-1" />
          分析
        </Button>
      </div>

      {address && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>AI 分析缓存 10 分钟</span>
          <span className="ml-2 font-mono">{shortAddr(address)}</span>
        </div>
      )}

      {loading && !data ? (
        <PageLoading />
      ) : error && !data ? (
        <PageError message={error.message} onRetry={refetch} />
      ) : data?.error && !data.analysis ? (
        <PageError message={data.error} onRetry={refetch} />
      ) : data?.analysis ? (
        <Card className="p-4 border-border/50 bg-muted/30">
          {data.walletData && (
            <div className="flex flex-wrap gap-2 mb-3">
              {data.walletData.sizeCohort && (
                <Badge variant="outline" className="text-xs">{data.walletData.sizeCohort}</Badge>
              )}
              {data.walletData.pnlCohort && (
                <Badge variant="outline" className="text-xs">{data.walletData.pnlCohort}</Badge>
              )}
              {data.walletData.score != null && (
                <Badge variant="outline" className="text-xs">评分 {data.walletData.score}</Badge>
              )}
            </div>
          )}
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{data.analysis}</p>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

// ─── Market Report Section (Pro+) ────────────────────────────────────────────

function MarketReportSection() {
  const [summary, setSummary] = useState("BTC 近期走势强劲，突破 100000 美元阻力位，合约持仓量上升，市场情绪偏多。");
  const [manualLoading, setManualLoading] = useState(false);
  const [manualData, setManualData] = useState<MarketReport | null>(null);
  const [manualError, setManualError] = useState<string | null>(null);

  const handleGenerateReport = async () => {
    if (!summary.trim()) return;
    setManualLoading(true);
    setManualError(null);
    setManualData(null);
    try {
      const result = await apiFetch<MarketReport>({
        path: `/ai/report?market_summary=${encodeURIComponent(summary)}`,
      });
      setManualData(result);
    } catch (err: unknown) {
      setManualError(err instanceof Error ? err.message : "生成失败");
    } finally {
      setManualLoading(false);
    }
  };

  // Show upgrade prompt if 403
  if (manualError?.includes("无权限") || manualError?.includes("403")) {
    return (
      <Card className="p-6 border-border/50 text-center space-y-3">
        <Lock className="h-8 w-8 mx-auto text-muted-foreground opacity-50" />
        <h3 className="font-medium">需要 Pro 订阅</h3>
        <p className="text-sm text-muted-foreground">
          AI 市场报告功能需要 Pro 或更高版本订阅
        </p>
        <Button size="sm" asChild>
          <a href="/dashboard/billing">升级订阅</a>
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">AI 市场分析报告</h3>
        <Badge variant="outline" className="text-xs ml-auto">Pro+</Badge>
      </div>

      <Card className="p-4 border-border/50 space-y-3">
        <label className="text-xs text-muted-foreground">市场概况摘要</label>
        <textarea
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none"
          rows={3}
          placeholder="输入市场概况，AI 将生成结构化分析报告"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />
        <Button
          size="sm"
          onClick={handleGenerateReport}
          disabled={!summary.trim() || manualLoading}
        >
          {manualLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              生成中…
            </>
          ) : (
            <>
              <Brain className="h-4 w-4 mr-1" />
              生成报告
            </>
          )}
        </Button>
      </Card>

      {manualError && (
        <PageError message={manualError} onRetry={handleGenerateReport} />
      )}

      {manualData?.report && (
        <Card className="p-4 border-border/50 bg-muted/30">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{manualData.report}</p>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type TabKey = "cohort" | "wallet" | "report";

const TABS: { key: TabKey; label: string; icon: React.ElementType; badge?: string }[] = [
  { key: "cohort", label: "市场 Cohort 分析", icon: Users },
  { key: "wallet", label: "钱包 AI 分析", icon: Wallet },
  { key: "report", label: "AI 市场报告", icon: TrendingUp, badge: "Pro+" },
];

export default function AIPage() {
  const [tab, setTab] = useState<TabKey>("cohort");

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="h-6 w-6" />
          AI 智能分析
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          基于 Claude AI 的市场洞察 · Cohort 分布分析 · 钱包行为分析 · 结构化市场报告
        </p>
      </div>

      {/* Tab nav */}
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
              {t.badge && (
                <Badge variant="secondary" className="text-xs ml-1">{t.badge}</Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <Card className="p-4 border-border/50">
        {tab === "cohort" && <CohortAnalysisSection />}
        {tab === "wallet" && <WalletAnalysisSection />}
        {tab === "report" && <MarketReportSection />}
      </Card>
    </div>
  );
}
