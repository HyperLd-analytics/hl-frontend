"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageError } from "@/components/common/page-error";
import { PageLoading } from "@/components/common/page-loading";
import { cn } from "@/lib/utils";
import { Star, Search, TrendingUp, TrendingDown, ExternalLink } from "lucide-react";

// Mock favorites data
const MOCK_FAVORITES = [
  {
    address: "0x28C6c06298d514Db089934071355E5743bf21d60",
    name: "Vitalik.eth",
    total_pnl: 2847291.45,
    win_rate: 72.4,
    bias: 0.68,
    bias_label: "Long",
    trades: 1247,
    avg_leverage: 2.3,
    last_active: "2 hours ago",
    avatar_color: "#8b5cf6",
  },
  {
    address: "0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503",
    name: "Arthur Hayes",
    total_pnl: -482193.22,
    win_rate: 51.2,
    bias: -0.34,
    bias_label: "Short",
    trades: 892,
    avg_leverage: 5.1,
    last_active: "15 minutes ago",
    avatar_color: "#ef4444",
  },
  {
    address: "0x21a31Ee1afC51d94C2eFcCAa2092aD1028285549",
    name: "Aave Finance",
    total_pnl: 1204837.88,
    win_rate: 68.9,
    bias: 0.15,
    bias_label: "Slight Long",
    trades: 543,
    avg_leverage: 1.8,
    last_active: "1 day ago",
    avatar_color: "#10b981",
  },
  {
    address: "0x4d5eB656aA29d5b5b0F5d6E5Ee7f2B3c8D9E0f1A",
    name: "Wintermute Trading",
    total_pnl: 3847291.12,
    win_rate: 63.7,
    bias: 0.82,
    bias_label: "Strong Long",
    trades: 2341,
    avg_leverage: 3.4,
    last_active: "5 minutes ago",
    avatar_color: "#f59e0b",
  },
  {
    address: "0x0a869d79a7052c7f1b55a8ebabbea3429f6d17a8",
    name: "Frog Nation",
    total_pnl: -182947.55,
    win_rate: 44.1,
    bias: -0.71,
    bias_label: "Strong Short",
    trades: 672,
    avg_leverage: 8.2,
    last_active: "3 hours ago",
    avatar_color: "#84cc16",
  },
];

function formatUSD(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(2)}`;
}

function formatAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

interface FavoriteWallet {
  address: string;
  name?: string;
  total_pnl: number;
  win_rate: number;
  bias: number;
  bias_label: string;
  trades: number;
  avg_leverage: number;
  last_active: string;
  avatar_color: string;
}

function FavoriteCard({ wallet, onRemove }: { wallet: FavoriteWallet; onRemove: (addr: string) => void }) {
  const isProfit = wallet.total_pnl >= 0;
  const isLong = wallet.bias > 0;

  return (
    <Card className="p-4 space-y-4 hover:border-primary/30 transition-all group">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: wallet.avatar_color }}
          >
            {wallet.name ? wallet.name[0].toUpperCase() : wallet.address.slice(2, 4).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-sm">{wallet.name ?? formatAddress(wallet.address)}</p>
            <p className="font-mono text-xs text-muted-foreground">{formatAddress(wallet.address)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Badge
            className={cn(
              "text-xs",
              isLong
                ? "bg-green-500/20 text-green-400 border-green-500/30"
                : wallet.bias < 0
                ? "bg-red-500/20 text-red-400 border-red-500/30"
                : "bg-gray-500/20 text-gray-400 border-gray-500/30"
            )}
          >
            {wallet.bias_label}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10"
            onClick={() => onRemove(wallet.address)}
          >
            <Star className="h-3.5 w-3.5 fill-current" />
          </Button>
        </div>
      </div>

      {/* PNL */}
      <div className="flex items-center gap-2">
        {isProfit ? (
          <TrendingUp className="h-4 w-4 text-green-400" />
        ) : (
          <TrendingDown className="h-4 w-4 text-red-400" />
        )}
        <span
          className={cn(
            "text-xl font-bold",
            isProfit ? "text-green-400" : "text-red-400"
          )}
        >
          {isProfit ? "+" : ""}{formatUSD(wallet.total_pnl)}
        </span>
        <span className="text-xs text-muted-foreground">总 PNL</span>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-muted/50 rounded-lg p-2 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">胜率</p>
          <p className="text-sm font-bold">{wallet.win_rate}%</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-2 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">平均杠杆</p>
          <p className="text-sm font-bold">{wallet.avg_leverage}x</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-2 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">交易数</p>
          <p className="text-sm font-bold">{wallet.trades.toLocaleString()}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t">
        <span className="text-xs text-muted-foreground">活跃 {wallet.last_active}</span>
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 opacity-0 group-hover:opacity-100 transition-opacity" asChild>
          <a href={`/dashboard/wallet/${wallet.address}`} target="_blank" rel="noopener noreferrer">
            查看详情 <ExternalLink className="h-3 w-3" />
          </a>
        </Button>
      </div>
    </Card>
  );
}

export default function FavoritesPage() {
  const t = useTranslations("dashboard");
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState<FavoriteWallet[]>(MOCK_FAVORITES);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  // In real app: useApiQuery("/favorites")

  const filtered = favorites.filter(
    (f) =>
      f.address.toLowerCase().includes(search.toLowerCase()) ||
      f.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleRemove = (addr: string) => {
    setFavorites((prev) => prev.filter((f) => f.address !== addr));
  };

  if (loading) return <PageLoading />;
  if (error) return <PageError message={error} onRetry={() => window.location.reload()} />;

  const totalPnl = favorites.reduce((s, f) => s + f.total_pnl, 0);
  const avgWinRate = favorites.length > 0
    ? favorites.reduce((s, f) => s + f.win_rate, 0) / favorites.length
    : 0;
  const avgBias = favorites.length > 0
    ? favorites.reduce((s, f) => s + f.bias, 0) / favorites.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">钱包收藏</h1>
          <p className="text-muted-foreground text-sm mt-1">
            关注的钱包，一目了然
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1">
          <Star className="h-3.5 w-3.5" />
          导出列表
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-muted-foreground text-xs mb-1">收藏数量</p>
          <p className="text-lg font-bold">{favorites.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-muted-foreground text-xs mb-1">总 PNL</p>
          <p className={cn("text-lg font-bold", totalPnl >= 0 ? "text-green-400" : "text-red-400")}>
            {totalPnl >= 0 ? "+" : ""}{formatUSD(totalPnl)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-muted-foreground text-xs mb-1">平均胜率</p>
          <p className="text-lg font-bold">{avgWinRate.toFixed(1)}%</p>
        </Card>
        <Card className="p-4">
          <p className="text-muted-foreground text-xs mb-1">平均 Bias</p>
          <p className={cn("text-lg font-bold", avgBias > 0 ? "text-green-400" : avgBias < 0 ? "text-red-400" : "text-gray-400")}>
            {avgBias > 0 ? "+" : ""}{(avgBias * 100).toFixed(1)}%
          </p>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜索钱包地址或名称..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Favorites Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((wallet) => (
            <FavoriteCard key={wallet.address} wallet={wallet} onRemove={handleRemove} />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center space-y-4">
          <Star className="h-12 w-12 text-muted-foreground mx-auto opacity-30" />
          <div>
            <p className="text-muted-foreground">
              {search ? "没有找到匹配的钱包" : "暂无收藏钱包"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {search ? "尝试其他搜索词" : "在钱包详情页点击 ⭐ 添加收藏"}
            </p>
          </div>
          {search && (
            <Button variant="outline" size="sm" onClick={() => setSearch("")}>
              清除搜索
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}
