"use client";

import { useState } from "react";
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

export default function AlertsPage() {
  const { request, loading: actionLoading } = useApi();
  const { pushToast } = useToast();
  const [name, setName] = useState("");
  const [condition, setCondition] = useState("");
  const { data, loading, error, refetch } = useApiQuery<AlertsResponse>("/alerts/rules", {
    staleTimeMs: 10_000,
    pollingIntervalMs: 15_000
  });

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

  if (loading && !data) return <PageLoading />;
  if (error && !data) return <PageError message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">告警配置</h1>
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
