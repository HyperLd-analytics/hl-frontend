"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Key,
  Trash2,
  Copy,
  CheckCircle2,
  XCircle,
  BarChart3,
  Eye,
  EyeOff,
  Zap,
  Clock,
  Shield,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ApiKeyItem {
  id: string;
  name: string;
  key_prefix: string;
  key_hint: string;
  usage_count: number;
  usage_limit: number | null;
  scopes: string | null;
  is_active: boolean;
  expires_at: string | null;
  last_used_at: string | null;
  created_at: string;
}

interface CreateKeyResponse {
  id: string;
  name: string;
  key: string; // only returned once!
  key_prefix: string;
  key_hint: string;
  usage_limit: number | null;
  expires_at: string | null;
  created_at: string;
}

interface UsageStats {
  total_keys: number;
  total_usage: number;
  active_keys: number;
  period_days: number;
  by_endpoint: Array<{ endpoint: string; count: number; avg_time_ms: number }>;
}

interface ApiKeysResponse {
  items: ApiKeyItem[];
}

// ─── Scope options ───────────────────────────────────────────────────────────

const SCOPE_OPTIONS = [
  { value: "wallets:read", label: "Read wallet data" },
  { value: "positions:read", label: "Read positions" },
  { value: "analytics:read", label: "Read analytics" },
  { value: "alerts:read", label: "Read alerts" },
  { value: "alerts:write", label: "Manage alerts" },
  { value: "cohorts:read", label: "Read market data" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function timeAgo(iso: string | null): string {
  if (!iso) return "从未使用";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "刚刚";
  if (mins < 60) return `${mins} 分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  return `${days} 天前`;
}

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

// ─── Create Modal ─────────────────────────────────────────────────────────────

function CreateModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (key: string, name: string) => void;
}) {
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<string[]>(["wallets:read"]);
  const [usageLimit, setUsageLimit] = useState("");
  const [expiresDays, setExpiresDays] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleScope = (v: string) => {
    setScopes((prev) =>
      prev.includes(v) ? prev.filter((s) => s !== v) : [...prev, v]
    );
  };

  const handleCreate = async () => {
    if (!name.trim()) { setError("请输入密钥名称"); return; }
    setLoading(true);
    setError("");
    try {
      const payload: Record<string, unknown> = { name: name.trim(), scopes };
      if (usageLimit) payload.usage_limit = parseInt(usageLimit);
      if (expiresDays) payload.expires_days = parseInt(expiresDays);
      const res = await apiFetch<CreateKeyResponse>({
        path: "/api-keys/",
        method: "POST",
        body: JSON.stringify(payload),
      });
      onCreated(res.key, res.name);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <Card className="w-full max-w-md border-border/50 p-6 shadow-xl">
        <h2 className="text-lg font-semibold mb-1">创建 API 密钥</h2>
        <p className="text-xs text-muted-foreground mb-5">
          完整密钥只显示一次，请妥善保存！
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">密钥名称 *</label>
            <Input
              placeholder="例如：生产环境密钥"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={64}
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">权限范围</label>
            <div className="grid grid-cols-2 gap-2">
              {SCOPE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 text-xs cursor-pointer p-2 rounded-md border border-border hover:border-primary/50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={scopes.includes(opt.value)}
                    onChange={() => toggleScope(opt.value)}
                    className="accent-primary"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">日用量上限</label>
              <Input
                type="number"
                placeholder="不限"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
                min={1}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">有效期（天）</label>
              <Input
                type="number"
                placeholder="永不过期"
                value={expiresDays}
                onChange={(e) => setExpiresDays(e.target.value)}
                min={1}
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="flex gap-2 mt-6">
          <Button className="flex-1" onClick={handleCreate} disabled={loading}>
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4 mr-1" />}
            {loading ? "创建中..." : "创建密钥"}
          </Button>
          <Button variant="outline" onClick={onClose}>取消</Button>
        </div>
      </Card>
    </div>
  );
}

// ─── Created Success Modal ────────────────────────────────────────────────────

function CreatedModal({
  apiKey,
  onClose,
}: {
  apiKey: { key: string; name: string };
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(apiKey.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <Card className="w-full max-w-lg border-border/50 p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <h2 className="text-lg font-semibold">密钥创建成功</h2>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-md p-3 mb-4">
          <p className="text-xs text-yellow-500 font-medium">
            ⚠️ 完整密钥只会显示这一次，请立即复制并妥善保存！
          </p>
        </div>

        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-1">密钥名称</p>
          <p className="text-sm font-medium">{apiKey.name}</p>
        </div>

        <div className="mb-6">
          <p className="text-xs text-muted-foreground mb-1">API 密钥（请复制）</p>
          <div className="flex gap-2">
            <Input
              value={apiKey.key}
              readOnly
              className="font-mono text-xs bg-muted"
            />
            <Button size="sm" variant="outline" onClick={copy}>
              {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-xs text-muted-foreground mb-2">使用示例（cURL）</p>
          <pre className="bg-muted rounded-md p-3 text-xs font-mono overflow-x-auto">
{`curl -H "X-API-Key: ${apiKey.key}" \\
  https://api.example.com/v1/wallets/leaderboard`}
          </pre>
        </div>

        <Button className="w-full" onClick={onClose}>我已保存，继续</Button>
      </Card>
    </div>
  );
}

// ─── Usage Modal ──────────────────────────────────────────────────────────────

function UsageModal({ stats, onClose }: { stats: UsageStats; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <Card className="w-full max-w-2xl border-border/50 p-6 shadow-xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">API 使用统计</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold">{stats.total_keys}</p>
            <p className="text-xs text-muted-foreground">总密钥数</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold">{stats.active_keys}</p>
            <p className="text-xs text-muted-foreground">活跃密钥</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold">{stats.total_usage.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">总调用次数</p>
          </div>
        </div>

        {/* Per-endpoint stats */}
        {stats.by_endpoint.length > 0 ? (
          <div>
            <p className="text-sm font-medium mb-3">最近 {stats.period_days} 天按端点统计</p>
            <div className="space-y-2">
              {stats.by_endpoint.map((row) => (
                <div
                  key={row.endpoint}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-md border border-border/30"
                >
                  <code className="text-xs font-mono">{row.endpoint}</code>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-muted-foreground">
                      {row.count.toLocaleString()} 次
                    </span>
                    <span className="text-muted-foreground">
                      {row.avg_time_ms}ms
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            暂无使用数据
          </p>
        )}

        <Button variant="outline" className="w-full mt-6" onClick={onClose}>
          关闭
        </Button>
      </Card>
    </div>
  );
}

// ─── Key Card ─────────────────────────────────────────────────────────────────

function KeyCard({
  item,
  onRevoke,
  onToggle,
}: {
  item: ApiKeyItem;
  onRevoke: (id: string) => void;
  onToggle: (id: string, active: boolean) => void;
}) {
  const expired = isExpired(item.expires_at);
  const usagePct =
    item.usage_limit && item.usage_count
      ? Math.min((item.usage_count / item.usage_limit) * 100, 100)
      : null;

  return (
    <Card className="p-4 border-border/50 hover:border-border transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`mt-0.5 p-1.5 rounded-md shrink-0 ${expired ? "bg-muted text-muted-foreground" : item.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
            <Key className="h-3.5 w-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-medium text-sm">{item.name}</h4>
              <Badge variant={expired ? "secondary" : item.is_active ? "default" : "outline"} className="text-[10px]">
                {expired ? "已过期" : item.is_active ? "活跃" : "已禁用"}
              </Badge>
              {item.scopes && (
                <Badge variant="outline" className="text-[10px]">
                  {item.scopes.split(",").length} 个权限
                </Badge>
              )}
            </div>
            <p className="text-xs font-mono text-muted-foreground mt-1">
              {item.key_prefix} <span className="opacity-40">●●●●●●●●</span> {item.key_hint}
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <BarChart3 className="h-3 w-3" />
                {item.usage_count.toLocaleString()}
                {item.usage_limit ? ` / ${item.usage_limit.toLocaleString()}` : ""} 次
              </span>
              {item.expires_at && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(item.expires_at)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                {timeAgo(item.last_used_at)}
              </span>
            </div>
            {usagePct !== null && (
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    usagePct > 90 ? "bg-red-500" : usagePct > 70 ? "bg-yellow-500" : "bg-primary"
                  }`}
                  style={{ width: `${usagePct}%` }}
                />
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onToggle(item.id, !item.is_active)}
            title={item.is_active ? "禁用密钥" : "启用密钥"}
          >
            {item.is_active ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-green-500" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:text-red-500"
            onClick={() => onRevoke(item.id)}
            title="吊销密钥"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createdKey, setCreatedKey] = useState<{ key: string; name: string } | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [search, setSearch] = useState("");

  const fetchKeys = useCallback(async () => {
    try {
      const res = await apiFetch<ApiKeysResponse>({ path: "/api-keys/" });
      setKeys(res.items ?? []);
    } catch {
      // ignore
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiFetch<UsageStats>({ path: "/api-keys/usage?days=30" });
      setStats(res);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchKeys(), fetchStats()]).finally(() => setLoading(false));
  }, [fetchKeys, fetchStats]);

  const handleRevoke = async (id: string) => {
    if (!confirm("确定要吊销此密钥吗？吊销后无法恢复。")) return;
    try {
      await apiFetch({ path: `/api-keys/${id}`, method: "DELETE" });
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleToggle = async (id: string, active: boolean) => {
    try {
      await apiFetch({
        path: `/api-keys/${id}`,
        method: "PATCH",
        body: JSON.stringify({ is_active: active }),
      });
      setKeys((prev) =>
        prev.map((k) => (k.id === id ? { ...k, is_active: active } : k))
      );
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleCreated = (key: string, name: string) => {
    setShowCreate(false);
    setCreatedKey({ key, name });
  };

  const filtered = keys.filter((k) =>
    k.name.toLowerCase().includes(search.toLowerCase()) ||
    k.key_prefix.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            API 开放平台
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            创建和管理 API 密钥，安全访问 Hyperliquid 数据
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-9" onClick={() => { fetchStats(); setShowStats(true); }}>
            <BarChart3 className="h-4 w-4 mr-1" /> 使用统计
          </Button>
          <Button size="sm" className="h-9" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1" /> 创建密钥
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      <Card className="p-4 border-primary/20 bg-primary/5">
        <div className="flex items-start gap-3">
          <ExternalLink className="h-4 w-4 mt-0.5 text-primary shrink-0" />
          <div className="text-sm">
            <p className="font-medium">通过 API 访问数据</p>
            <p className="text-xs text-muted-foreground mt-1">
              创建密钥后，在请求头中添加 <code className="bg-muted px-1 rounded">X-API-Key: hlk_xxx</code> 即可调用 API。
              完整文档请查看{" "}
              <a href="#" className="text-primary underline">API 文档</a>
            </p>
          </div>
        </div>
      </Card>

      {/* Summary Stats */}
      {!loading && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 border-border/50">
            <p className="text-xs text-muted-foreground">总密钥数</p>
            <p className="text-2xl font-bold mt-1">{keys.length}</p>
          </Card>
          <Card className="p-4 border-border/50">
            <p className="text-xs text-muted-foreground">活跃密钥</p>
            <p className="text-2xl font-bold mt-1 text-green-500">
              {keys.filter((k) => k.is_active && !isExpired(k.expires_at)).length}
            </p>
          </Card>
          <Card className="p-4 border-border/50">
            <p className="text-xs text-muted-foreground">总调用次数</p>
            <p className="text-2xl font-bold mt-1">
              {stats ? stats.total_usage.toLocaleString() : "—"}
            </p>
          </Card>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="搜索密钥名称..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-3 py-1 text-sm"
        />
        <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>

      {/* Key List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-sm text-muted-foreground">
            加载中...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Key className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {search ? "没有匹配的密钥" : "还没有创建任何 API 密钥"}
            </p>
            {!search && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setShowCreate(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                创建第一个密钥
              </Button>
            )}
          </div>
        ) : (
          filtered.map((item) => (
            <KeyCard
              key={item.id}
              item={item}
              onRevoke={handleRevoke}
              onToggle={handleToggle}
            />
          ))
        )}
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}

      {createdKey && (
        <CreatedModal
          apiKey={createdKey}
          onClose={() => {
            setCreatedKey(null);
            fetchKeys();
            fetchStats();
          }}
        />
      )}

      {showStats && stats && (
        <UsageModal stats={stats} onClose={() => setShowStats(false)} />
      )}
    </div>
  );
}
