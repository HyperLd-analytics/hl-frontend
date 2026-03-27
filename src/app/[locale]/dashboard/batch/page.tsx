"use client";

import { useState, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApi } from "@/hooks/use-api";
import { useToast } from "@/components/providers/toast-provider";
import { PageLoading } from "@/components/common/page-loading";
import { PageError } from "@/components/common/page-error";
import { useApiQuery } from "@/hooks/use-api-query";
import { Trash2, Plus, AlertTriangle, CheckCircle2, XCircle, Download, Search } from "lucide-react";

type WalletItem = {
  address: string;
  score: number | null;
  total_pnl: number | null;
  win_rate: number | null;
  label: string;
};

type WalletsResponse = {
  items: WalletItem[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  };
};

type ResultItem = {
  address?: string;
  id?: string;
  reason?: string;
  error?: string;
};

export default function BatchPage() {
  const t = useTranslations("batch");
  const locale = useLocale();
  const { request, loading } = useApi();
  const { pushToast } = useToast();
  const [activeTab, setActiveTab] = useState<"wallets" | "alerts" | "export">("wallets");
  const [textInput, setTextInput] = useState("");
  const [selectedAddresses, setSelectedAddresses] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<{ added?: ResultItem[]; skipped?: ResultItem[]; deleted?: number; created?: ResultItem[]; errors?: ResultItem[] } | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const { data: wallets, loading: walletsLoading, error: walletsError, refetch } = useApiQuery<WalletsResponse>(
    `/wallets/leaderboard?page=${page}&page_size=50`,
    { enabled: activeTab === "wallets" || activeTab === "export" }
  );

  const parseAddresses = (text: string): string[] => {
    return text
      .split(/[\n,;]+/)
      .map((a) => a.trim().toLowerCase())
      .filter((a) => a.length === 42 && a.startsWith("0x"));
  };

  const handleTextChange = (text: string) => {
    setTextInput(text);
    const addresses = parseAddresses(text);
    setSelectedAddresses(new Set(addresses));
  };

  const handleToggleAddress = (address: string) => {
    const next = new Set(selectedAddresses);
    if (next.has(address)) {
      next.delete(address);
    } else {
      next.add(address);
    }
    setSelectedAddresses(next);
  };

  const handleTrackWallets = async () => {
    if (selectedAddresses.size === 0) {
      pushToast("请输入或选择钱包地址", "error");
      return;
    }
    setBatchLoading(true);
    setResults(null);
    try {
      const res = await request<{ added: ResultItem[]; skipped: ResultItem[]; total_added: number }>({
        path: "/batch/wallets/track",
        method: "POST",
        body: JSON.stringify({ addresses: Array.from(selectedAddresses) }),
      });
      setResults({ added: res.added, skipped: res.skipped });
      pushToast(`成功添加 ${res.total_added} 个钱包`);
      setSelectedAddresses(new Set());
      setTextInput("");
    } catch (e) {
      pushToast((e as Error).message, "error");
    } finally {
      setBatchLoading(false);
    }
  };

  const handleUntrackWallets = async () => {
    if (selectedAddresses.size === 0) {
      pushToast("请选择要取消追踪的钱包", "error");
      return;
    }
    setBatchLoading(true);
    setResults(null);
    try {
      const res = await request<{ deleted: number; addresses: string[] }>({
        path: "/batch/wallets/batch",
        method: "DELETE",
        body: JSON.stringify({ addresses: Array.from(selectedAddresses) }),
      });
      setResults({ deleted: res.deleted });
      pushToast(`已取消追踪 ${res.deleted} 个钱包`);
      setSelectedAddresses(new Set());
      refetch();
    } catch (e) {
      pushToast((e as Error).message, "error");
    } finally {
      setBatchLoading(false);
    }
  };

  const handleBatchExport = async () => {
    if (selectedAddresses.size === 0) {
      pushToast("请选择要导出的钱包", "error");
      return;
    }
    // Redirect to export CSV with selected addresses
    const addressesParam = Array.from(selectedAddresses).join(",");
    window.open(`/${locale}/api/v1/exports/csv?addresses=${addressesParam}`, "_blank");
  };

  const filteredWallets = wallets?.items.filter((w) =>
    w.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (w.label && w.label.toLowerCase().includes(searchQuery.toLowerCase()))
  ) ?? [];

  const tabs = [
    { key: "wallets" as const, label: t("manageWallets") },
    { key: "alerts" as const, label: t("manageAlerts") },
    { key: "export" as const, label: t("batchExport") },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>

      {/* 标签切换 */}
      <div className="flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`flex-1 pb-3 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => { setActiveTab(tab.key); setResults(null); setTextInput(""); setSelectedAddresses(new Set()); }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 批量追踪钱包 */}
      {activeTab === "wallets" && (
        <div className="space-y-4">
          <Card className="p-4 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">{t("inputAddresses")}</label>
              <textarea
                className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm"
                rows={4}
                placeholder={t("addressesPlaceholder")}
                value={textInput}
                onChange={(e) => handleTextChange(e.target.value)}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {t("found")}: {selectedAddresses.size} 个有效地址（支持换行、逗号、分号分隔）
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleTrackWallets} disabled={batchLoading || selectedAddresses.size === 0}>
                <Plus className="mr-1 h-4 w-4" />
                {t("track")}
              </Button>
              <Button variant="destructive" onClick={handleUntrackWallets} disabled={batchLoading || selectedAddresses.size === 0}>
                <Trash2 className="mr-1 h-4 w-4" />
                {t("untrack")}
              </Button>
            </div>
          </Card>

          {/* 从列表选择 */}
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{t("selectFromList")}</h3>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-7 w-64"
                  placeholder={t("searchWallets")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {walletsLoading ? (
                <p className="text-sm text-muted-foreground py-4 text-center">{t("loading")}</p>
              ) : filteredWallets.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">{t("noWallets")}</p>
              ) : (
                filteredWallets.map((wallet) => (
                  <label
                    key={wallet.address}
                    className="flex items-center gap-3 rounded px-2 py-1.5 hover:bg-muted cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={selectedAddresses.has(wallet.address)}
                      onChange={() => handleToggleAddress(wallet.address)}
                    />
                    <span className="font-mono text-xs">{wallet.address}</span>
                    {wallet.label && (
                      <span className="text-xs text-muted-foreground truncate">
                        {wallet.label}
                      </span>
                    )}
                  </label>
                ))
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("selected")}: {selectedAddresses.size}
            </p>
          </Card>
        </div>
      )}

      {/* 批量导出 */}
      {activeTab === "export" && (
        <div className="space-y-4">
          <Card className="p-4 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">{t("inputAddresses")}</label>
              <textarea
                className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm"
                rows={4}
                placeholder={t("addressesPlaceholder")}
                value={textInput}
                onChange={(e) => handleTextChange(e.target.value)}
              />
            </div>
            <Button onClick={handleBatchExport} disabled={selectedAddresses.size === 0}>
              <Download className="mr-1 h-4 w-4" />
              {t("exportCsv")} ({selectedAddresses.size} 个钱包)
            </Button>
          </Card>
        </div>
      )}

      {/* 批量告警（占位，待后续完善） */}
      {activeTab === "alerts" && (
        <Card className="p-6 text-center text-muted-foreground">
          <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
          <p>{t("comingSoon")}</p>
          <p className="text-xs mt-1">{t("alertsDesc")}</p>
        </Card>
      )}

      {/* 结果展示 */}
      {results && (
        <Card className="p-4 space-y-3">
          <h3 className="font-medium">{t("results")}</h3>
          {results.added && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-sm font-medium text-green-500">
                <CheckCircle2 className="h-4 w-4" />
                {t("addedSuccessfully")} ({results.added.length})
              </div>
              {results.added.slice(0, 5).map((item) => (
                <p key={item.address} className="text-xs font-mono text-muted-foreground ml-5">
                  {item.address}
                </p>
              ))}
              {results.added.length > 5 && (
                <p className="text-xs text-muted-foreground ml-5">... +{results.added.length - 5} more</p>
              )}
            </div>
          )}
          {results.skipped && results.skipped.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-sm font-medium text-yellow-500">
                <AlertTriangle className="h-4 w-4" />
                {t("skipped")} ({results.skipped.length})
              </div>
              {results.skipped.slice(0, 5).map((item) => (
                <p key={item.address} className="text-xs font-mono text-muted-foreground ml-5">
                  {item.address} — {item.reason}
                </p>
              ))}
            </div>
          )}
          {results.deleted !== undefined && (
            <div className="flex items-center gap-1 text-sm font-medium text-red-500">
              <XCircle className="h-4 w-4" />
              {t("deletedCount", { count: results.deleted })}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
