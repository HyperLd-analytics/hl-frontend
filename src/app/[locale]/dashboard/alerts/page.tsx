"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApiQuery } from "@/hooks/use-api-query";
import { AlertRule, AlertHistoryResponse } from "@/types/dashboard";
import { PageError } from "@/components/common/page-error";
import { PageLoading } from "@/components/common/page-loading";
import { useApi } from "@/hooks/use-api";
import { useToast } from "@/components/providers/toast-provider";

const ALERT_TYPE_OPTIONS = [
  { value: "price_liquidation", label: "清算价格预警" },
  { value: "funding_rate", label: "资金费率预警" },
  { value: "wallet_trade", label: "钱包交易预警" },
  { value: "big_trade", label: "大额交易预警" },
];

const createAlertSchema = z.object({
  name: z.string().trim().max(100, "规则名称不能超过 100 个字符").optional(),
  alert_type: z.string().min(1, "请选择告警类型"),
  target: z.string().trim().min(1, "请输入监控目标").max(200, "监控目标不能超过 200 个字符"),
  condition: z.string().trim().min(4, "触发条件至少 4 个字符"),
  priority: z.coerce.number().min(1).max(3),
});

interface TelegramStatus {
  bound: boolean;
  username?: string;
  chatId?: number;
  verificationCode?: string;
  botUsername?: string;
}

function PriorityBadge({ priority, t }: { priority: number; t: ReturnType<typeof useTranslations> }) {
  const labels = [t("priorityLow"), t("priorityMedium"), t("priorityHigh")];
  const colors = [
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  ];
  const idx = Math.min(Math.max(priority - 1, 0), 2);
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors[idx]}`}>
      {labels[idx]}
    </span>
  );
}

export default function AlertsPage() {
  const t = useTranslations("alerts");
  const tCommon = useTranslations("common");
  const { request, loading: actionLoading } = useApi();
  const { pushToast } = useToast();

  // Form state
  const [name, setName] = useState("");
  const [alertType, setAlertType] = useState("price_liquidation");
  const [target, setTarget] = useState("");
  const [condition, setCondition] = useState("");
  const [priority, setPriority] = useState(1);

  // Telegram
  const [telegramStatus, setTelegramStatus] = useState<TelegramStatus | null>(null);
  const [loadingTelegram, setLoadingTelegram] = useState(false);

  // Active tab: "rules" | "history"
  const [activeTab, setActiveTab] = useState<"rules" | "history">("rules");
  // Expanded alert for history
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);
  const [history, setHistory] = useState<AlertHistoryResponse | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const { data: alerts, loading, error, refetch } = useApiQuery<AlertRule[]>("/alerts", {
    staleTimeMs: 10_000,
    pollingIntervalMs: 15_000,
  });

  // Fetch Telegram status
  useEffect(() => {
    const fetchTelegramStatus = async () => {
      try {
        const status = await request<TelegramStatus>({
          path: "/alerts/telegram/status",
          method: "GET",
        });
        setTelegramStatus(status);
      } catch (err) {
        console.error("Failed to fetch Telegram status:", err);
      }
    };
    fetchTelegramStatus();
  }, [request]);

  const onCreateRule = async () => {
    const parsed = createAlertSchema.safeParse({
      name: name || undefined,
      alert_type: alertType,
      target,
      condition,
      priority,
    });
    if (!parsed.success) {
      pushToast(parsed.error.issues[0]?.message ?? "请输入有效的规则参数", "error");
      return;
    }

    let conditionObj: Record<string, unknown>;
    try {
      conditionObj = JSON.parse(parsed.data.condition);
    } catch {
      pushToast("触发条件必须是合法的 JSON 格式", "error");
      return;
    }

    try {
      await request({
        path: "/alerts",
        method: "POST",
        body: JSON.stringify({
          name: parsed.data.name ?? null,
          alert_type: parsed.data.alert_type,
          target: parsed.data.target,
          condition: conditionObj,
          channel: "telegram",
          priority: parsed.data.priority,
        }),
      });
      setName("");
      setTarget("");
      setCondition("");
      setPriority(1);
      pushToast("告警规则已创建");
      await refetch();
    } catch (e) {
      pushToast((e as Error).message || "创建失败", "error");
    }
  };

  const onToggleRule = async (id: string, isActive: boolean) => {
    try {
      await request({
        path: `/alerts/${id}`,
        method: "PATCH",
        body: JSON.stringify({ is_active: !isActive }),
      });
      pushToast(isActive ? "规则已停用" : "规则已启用");
      await refetch();
    } catch (e) {
      pushToast((e as Error).message || "操作失败", "error");
    }
  };

  const onUpdatePriority = async (id: string, newPriority: number) => {
    try {
      await request({
        path: `/alerts/${id}`,
        method: "PATCH",
        body: JSON.stringify({ priority: newPriority }),
      });
      pushToast("优先级已更新");
      await refetch();
    } catch (e) {
      pushToast((e as Error).message || "更新失败", "error");
    }
  };

  const onDeleteRule = async (id: string) => {
    try {
      await request({
        path: `/alerts/${id}`,
        method: "DELETE",
      });
      pushToast("规则已删除");
      await refetch();
    } catch (e) {
      pushToast((e as Error).message || "删除失败", "error");
    }
  };

  const onToggleHistory = async (alertId: string) => {
    if (expandedAlertId === alertId) {
      setExpandedAlertId(null);
      setHistory(null);
      return;
    }
    setExpandedAlertId(alertId);
    setLoadingHistory(true);
    try {
      const data = await request<AlertHistoryResponse>({
        path: `/alerts/${alertId}/history`,
        method: "GET",
      });
      setHistory(data);
    } catch (e) {
      pushToast((e as Error).message || "获取历史记录失败", "error");
      setExpandedAlertId(null);
    } finally {
      setLoadingHistory(false);
    }
  };

  const onTestTelegram = async () => {
    setLoadingTelegram(true);
    try {
      await request({
        path: "/alerts/telegram/test",
        method: "POST",
      });
      pushToast("测试消息已发送到 Telegram");
    } catch (e) {
      pushToast((e as Error).message || "发送失败", "error");
    } finally {
      setLoadingTelegram(false);
    }
  };

  const onUnbindTelegram = async () => {
    setLoadingTelegram(true);
    try {
      await request({
        path: "/alerts/telegram/unbind",
        method: "DELETE",
      });
      pushToast("Telegram 账号已解绑");
      const status = await request<TelegramStatus>({
        path: "/alerts/telegram/status",
        method: "GET",
      });
      setTelegramStatus(status);
    } catch (e) {
      pushToast((e as Error).message || "解绑失败", "error");
    } finally {
      setLoadingTelegram(false);
    }
  };

  if (loading && !alerts) return <PageLoading />;
  if (error && !alerts) return <PageError message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <div className="flex gap-1 rounded-lg border border-border bg-muted p-1">
          <button
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === "rules"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("rules")}
          >
            告警规则
          </button>
          <button
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === "history"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("history")}
          >
            {t("history")}
          </button>
        </div>
      </div>

      {/* Telegram 绑定卡片 */}
      <Card className="space-y-3">
        <h2 className="font-medium">Telegram 通知</h2>
        {telegramStatus?.bound ? (
          <div className="space-y-3">
            <div className="rounded-md border border-green-500/20 bg-green-500/10 p-3">
              <p className="text-sm text-green-600 dark:text-green-400">
                ✅ 已绑定 Telegram 账号
                {telegramStatus.username && ` (@${telegramStatus.username})`}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={onTestTelegram} disabled={loadingTelegram}>
                发送测试消息
              </Button>
              <Button size="sm" variant="outline" onClick={onUnbindTelegram} disabled={loadingTelegram}>
                解绑账号
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              绑定 Telegram 账号后，您将通过 Telegram 接收告警通知
            </p>
            {telegramStatus?.verificationCode && (
              <div className="rounded-md border border-border bg-muted p-4 space-y-2">
                <p className="text-sm font-medium">绑定步骤：</p>
                <ol className="space-y-1 list-decimal list-inside text-sm text-muted-foreground">
                  <li>
                    在 Telegram 中搜索并打开 Bot：
                    <code className="bg-background px-1 py-0.5 rounded ml-1">
                      @{telegramStatus.botUsername || "YourBot"}
                    </code>
                  </li>
                  <li>点击「Start」按钮启动对话</li>
                  <li>发送以下验证码：</li>
                </ol>
                <div className="flex items-center gap-2 mt-2">
                  <code className="flex-1 bg-background px-3 py-2 rounded text-lg font-mono tracking-wider">
                    {telegramStatus.verificationCode}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(telegramStatus.verificationCode!);
                      pushToast("验证码已复制");
                    }}
                  >
                    复制
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">验证码有效期：10分钟</p>
              </div>
            )}
          </div>
        )}
      </Card>

      {activeTab === "rules" ? (
        <>
          {/* 创建规则表单 */}
          <Card className="space-y-3">
            <h2 className="font-medium">新建告警规则</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">规则名称（可选）</label>
                <input
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                  placeholder="例如：BTC 清算预警"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">告警类型</label>
                <select
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                  value={alertType}
                  onChange={(e) => setAlertType(e.target.value)}
                >
                  {ALERT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">监控目标</label>
                <input
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                  placeholder="例如：BTC/USDT 或 0x..."
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">优先级</label>
                <select
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                >
                  {PRIORITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">触发条件（JSON）</label>
              <textarea
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono"
                placeholder={'{"threshold": 0.03, "direction": "above"}'}
                rows={3}
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
              />
            </div>
            <Button onClick={onCreateRule} disabled={actionLoading}>
              新建规则
            </Button>
          </Card>

          {/* 规则列表 */}
          <div className="space-y-2">
            {(alerts ?? []).length === 0 ? (
              <Card className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground">暂无告警规则</p>
                <p className="mt-1 text-sm text-muted-foreground">创建第一条告警规则开始监控</p>
              </Card>
            ) : (
              (alerts ?? []).map((rule) => (
                <Card key={rule.id} className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate">{rule.name || rule.target}</p>
                        <PriorityBadge priority={rule.priority} t={t} />
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${
                            rule.is_active
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                              : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                          }`}
                        >
                          {rule.is_active ? "已启用" : "已停用"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {rule.alert_type} · {rule.target}
                      </p>
                      <p className="mt-1 text-xs font-mono text-muted-foreground">
                        {JSON.stringify(rule.condition)}
                      </p>
                      {rule.last_triggered && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          最近触发：{new Date(rule.last_triggered).toLocaleString("zh-CN")}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionLoading}
                        onClick={() => onToggleRule(rule.id, rule.is_active)}
                      >
                        {rule.is_active ? "停用" : "启用"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionLoading}
                        onClick={() => onToggleHistory(rule.id)}
                      >
                        {expandedAlertId === rule.id ? "收起" : "历史"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionLoading}
                        onClick={() => onDeleteRule(rule.id)}
                      >
                        删除
                      </Button>
                    </div>
                  </div>

                  {/* 历史记录展开区 */}
                  {expandedAlertId === rule.id && (
                    <div className="border-t border-border pt-3">
                      {loadingHistory ? (
                        <p className="text-sm text-muted-foreground py-2">加载中...</p>
                      ) : history && history.history.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">
                            触发历史（共 {history.total} 条）
                          </p>
                          {history.history.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-start justify-between gap-3 rounded-md border border-border bg-muted/50 p-2"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm truncate">{item.message}</p>
                                {item.payload && (
                                  <p className="mt-0.5 text-xs font-mono text-muted-foreground truncate">
                                    {JSON.stringify(item.payload)}
                                  </p>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground flex-shrink-0">
                                {new Date(item.triggeredAt).toLocaleString("zh-CN")}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground py-2">暂无触发记录</p>
                      )}
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        </>
      ) : (
        /* 历史总览 */
        <AlertHistoryOverview alerts={alerts ?? []} request={request} pushToast={pushToast} t={t} tCommon={tCommon} />
      )}
    </div>
  );
}

// 触发历史总览组件
function AlertHistoryOverview({
  alerts,
  request,
  pushToast,
  t,
}: {
  alerts: AlertRule[];
  request: ReturnType<typeof useApi>["request"];
  pushToast: ReturnType<typeof useToast>["pushToast"];
  t: ReturnType<typeof useTranslations>;
  tCommon: ReturnType<typeof useTranslations>;
}) {
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [history, setHistory] = useState<AlertHistoryResponse | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const onSelectAlert = async (alertId: string) => {
    if (selectedAlertId === alertId) {
      setSelectedAlertId(null);
      setHistory(null);
      return;
    }
    setSelectedAlertId(alertId);
    setLoadingHistory(true);
    try {
      const data = await request<AlertHistoryResponse>({
        path: `/alerts/${alertId}/history`,
        method: "GET",
      });
      setHistory(data);
    } catch (e) {
      pushToast((e as Error).message || "获取历史记录失败", "error");
    } finally {
      setLoadingHistory(false);
    }
  };

  if (alerts.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">{t("noAlerts")}</p>
      </Card>
    );
  }

  return (
    <Card className="space-y-3">
      <h2 className="font-medium">{t("history")}</h2>
      <div className="space-y-1">
        {alerts.map((alert) => (
          <div key={alert.id}>
            <button
              className={`w-full flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                selectedAlertId === alert.id
                  ? "border-primary/30 bg-primary/5"
                  : "border-border hover:bg-muted/50"
              }`}
              onClick={() => onSelectAlert(alert.id)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="truncate font-medium">{alert.name || alert.target}</span>
                <PriorityBadge priority={alert.priority} t={t} />
              </div>
              <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                {selectedAlertId === alert.id ? "▲ 收起" : "▼ 查看"}
              </span>
            </button>

            {selectedAlertId === alert.id && (
              <div className="mt-1 space-y-1 pl-2">
                {loadingHistory ? (
                  <p className="py-3 text-center text-sm text-muted-foreground">加载中...</p>
                ) : history && history.history.length > 0 ? (
                  history.history.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-3 rounded-md border border-border bg-muted/30 p-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{item.message}</p>
                        {item.payload && (
                          <p className="mt-0.5 text-xs font-mono text-muted-foreground truncate">
                            {JSON.stringify(item.payload)}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {new Date(item.triggeredAt).toLocaleString("zh-CN")}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="py-3 text-center text-sm text-muted-foreground">暂无触发记录</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
