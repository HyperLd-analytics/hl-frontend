"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApi } from "@/hooks/use-api";

const plans = [
  {
    name: "Free",
    price: "$0/月",
    feature: "基础链上数据浏览",
    planKey: "free"
  },
  {
    name: "Pro",
    price: "$29/月",
    feature: "排行榜 + 钱包深度分析 + 告警",
    planKey: "pro"
  },
  {
    name: "Alpha",
    price: "$99/月",
    feature: "多账户协作 + API 高配额 + AI 分析",
    planKey: "alpha"
  }
];

export default function PricingPage() {
  const { request, loading } = useApi();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscribe = async (planKey: string) => {
    if (planKey === "free") {
      return;
    }

    setLoadingPlan(planKey);
    try {
      const res = await request<{ paymentUrl: string }>({
        path: "/payments/create-charge",
        method: "POST",
        body: JSON.stringify({ plan: planKey })
      });

      // 跳转到 Coinbase 托管的支付页面
      window.location.href = res.paymentUrl;
    } catch (err) {
      console.error("Failed to create payment:", err);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold">定价方案</h1>
      <p className="mt-2 text-muted-foreground">选择适合您的订阅计划，支持加密货币支付</p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.name} className="space-y-3">
            <h2 className="text-xl font-semibold">{plan.name}</h2>
            <p className="text-2xl font-bold">{plan.price}</p>
            <p className="text-sm text-muted-foreground">{plan.feature}</p>
            <Button
              className="w-full"
              onClick={() => handleSubscribe(plan.planKey)}
              disabled={loading || loadingPlan === plan.planKey || plan.planKey === "free"}
            >
              {loadingPlan === plan.planKey ? "处理中..." : plan.planKey === "free" ? "当前计划" : "订阅"}
            </Button>
          </Card>
        ))}
      </div>
      <div className="mt-8 rounded-lg border border-border bg-card p-6">
        <h3 className="text-lg font-semibold">支付说明</h3>
        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
          <li>• 支持 USDC、ETH、BTC 等多种加密货币支付</li>
          <li>• 由 Coinbase Commerce 提供安全的支付处理</li>
          <li>• 订阅周期为 30 天，到期后需要续订</li>
          <li>• 支付成功后，权限将立即生效</li>
        </ul>
      </div>
    </main>
  );
}
