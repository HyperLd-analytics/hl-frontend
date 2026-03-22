"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApiQuery } from "@/hooks/use-api-query";
import { AlertsResponse } from "@/types/dashboard";
import { PageError } from "@/components/common/page-error";
import { PageLoading } from "@/components/common/page-loading";
import { useApi } from "@/hooks/use-api";
import { useToast } from "@/components/providers/toast-provider";

const createAlertSchema = z.object({
  name: z.string().trim().min(2, "规则名称至少 2 个字符").max(50, "规则名称不能超过 50 个字符"),
  condition: z.string().trim().min(4, "触发条件至少 4 个字符").max(200, "触发条件不能超过 200 个字符")
});

interface TelegramStatus {
  bound: boolean;
  username?: string;
  chatId?: number;
  verificationCode?: string;
  botUsername?: string;
}

export default function AlertsPage() {
  const { request, loading: actionLoading } = useApi();
  const { pushToast } = useToast();
  const [name, setName] = useState("");
  const [condition, setCondition] = useState("");
  const [telegramStatus, setTelegramStatus] = useState<TelegramStatus | null>(null);
  const [loadingTelegram, setLoadingTelegram] = useState(false);

  const { data, loading, error, refetch } = useApiQuery<AlertsResponse>("/alerts/rules", {
    staleTimeMs: 10_000,
    pollingIntervalMs: 15_000
  });

  // 获取 Telegram 绑定状态
  useEffect(() => {
    const fetchTelegramStatus = async () => {
      try {
        const status = await request<TelegramStatus>({
          path: "/alerts/telegram/status",
          method: "GET"
        });
        setTelegramStatus(status);
      } catch (err) {
        console.error("Failed to fetch Telegram status:", err);
      }
    };
    fetchTelegramStatus();
  }, [request]);

  const onCreateRule = async () => {
    const parsed = createAlertSchema.safeParse({ name, condition });
    if (!parsed.success) {
      pushToast(parsed.error.issues[0]?.message ?? "请输入有效的规则参数", "error");
      return;
    }
    try {
      await request({
        path: "/alerts/rules",
        method: "POST",
        body: JSON.stringify(parsed.data)
      });
      setName("");
      setCondition("");
      pushToast("告警规则已创建");
      await refetch();
    } catch (e) {
      pushToast((e as Error).message || "创建失败", "error");
    }
  };

  const onToggleRule = async (id: string, enabled: boolean) => {
    try {
      await request({
        path: `/alerts/rules/${id}`,
        method: "PATCH",
        body: JSON.stringify({ enabled: !enabled })
      });
      pushToast(enabled ? "规则已停用" : "规则已启用");
      await refetch();
    } catch (e) {
      pushToast((e as Error).message || "操作失败", "error");
    }
  };

  const onDeleteRule = async (id: string) => {
    try {
      await request({
        path: `/alerts/rules/${id}`,
        method: "DELETE"
      });
      pushToast("规则已删除");
      await refetch();
    } catch (e) {
      pushToast((e as Error).message || "删除失败", "error");
    }
  };

  const onTestTelegram = async () => {
    setLoadingTelegram(true);
    try {
      await request({
        path: "/alerts/telegram/test",
        method: "POST"
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
        method: "DELETE"
      });
      pushToast("Telegram 账号已解绑");
      // 重新获取状态
      const status = await request<TelegramStatus>({
        path: "/alerts/telegram/status",
        method: "GET"
      });
      setTelegramStatus(status);
    } catch (e) {
      pushToast((e as Error).message || "解绑失败", "error");
    } finally {
      setLoadingTelegram(false);
    }
  };

  if (loading && !data) return <PageLoading />;
  if (error && !data) return <PageError message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">告警配置</h1>

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
              <Button
                size="sm"
                variant="outline"
                onClick={onTestTelegram}
                disabled={loadingTelegram}
              >
                发送测试消息
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onUnbindTelegram}
                disabled={loadingTelegram}
              >
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
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>在 Telegram 中搜索并打开 Bot：<code className="bg-background px-1 py-0.5 rounded">@{telegramStatus.botUsername || "YourBot"}</code></li>
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
                <p className="text-xs text-muted-foreground mt-2">
                  验证码有效期：10分钟
                </p>
              </div>
            )}
          </div>
        )}
      </Card>

      <Card className="space-y-3">
        <h2 className="font-medium">新建规则</h2>
        <input
          className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
          placeholder="规则名称（例如 BTC 价格波动）"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
          placeholder="触发条件（例如 5m 波动 > 3%）"
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
        />
        <Button onClick={onCreateRule} disabled={actionLoading}>
          新建规则
        </Button>
      </Card>
      <Card className="space-y-3">
        {(data?.rules ?? []).map((rule) => (
          <div key={rule.id} className="rounded-md border border-border p-3">
            <div className="flex items-center justify-between">
              <p className="font-medium">{rule.name}</p>
              <span className="text-xs text-muted-foreground">{rule.enabled ? "已启用" : "已停用"}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{rule.condition}</p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="outline" disabled={actionLoading} onClick={() => onToggleRule(rule.id, rule.enabled)}>
                {rule.enabled ? "停用" : "启用"}
              </Button>
              <Button size="sm" variant="outline" disabled={actionLoading} onClick={() => onDeleteRule(rule.id)}>
                删除
              </Button>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
