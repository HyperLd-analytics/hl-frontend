"use client";

import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import {
  CreditCard, CheckCircle2, XCircle, Clock,
  ArrowRight, RefreshCw, AlertCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SubscriptionPlan {
  name: string;
  displayName: string;
  priceMonthly: number;
  features: Record<string, boolean>;
}

interface Subscription {
  hasSubscription: boolean;
  plan: SubscriptionPlan | null;
  status: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  paymentMethod: string | null;
  cancelledAt: string | null;
}

interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  externalId: string | null;
  txHash: string | null;
  createdAt: string;
}

interface PaymentsResponse {
  items: PaymentRecord[];
}

const PLANS = [
  { name: "free", displayName: "Free", price: 0, color: "bg-muted" },
  { name: "pro", displayName: "Pro", price: 29, color: "bg-indigo-500" },
  { name: "alpha", displayName: "Alpha", price: 99, color: "bg-amber-500" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function fmtUSD(amount: number, currency = "USD"): string {
  return `$${amount.toFixed(2)} ${currency}`;
}

function statusColor(status: string): string {
  if (status === "completed" || status === "active") return "text-green-500 bg-green-500/10";
  if (status === "pending" || status === "processing") return "text-yellow-500 bg-yellow-500/10";
  if (status === "failed" || status === "cancelled") return "text-red-500 bg-red-500/10";
  return "text-muted-foreground bg-muted";
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    completed: "已完成",
    active: "已激活",
    pending: "处理中",
    processing: "处理中",
    failed: "失败",
    cancelled: "已取消",
    refunded: "已退款",
  };
  return map[status] ?? status;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribeLoading, setSubscribeLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [subRes, payRes] = await Promise.all([
        apiFetch<Subscription>({ path: "/subscriptions/me" }),
        apiFetch<PaymentsResponse>({ path: "/subscriptions/payments" }),
      ]);
      setSub(subRes);
      setPayments(payRes.items ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useState(() => {
    fetchData();
  });

  const handleSubscribe = async (planName: string) => {
    if (planName === "free") return;
    setSubscribeLoading(planName);
    try {
      const res = await apiFetch<{ paymentUrl: string }>({
        path: "/payments/create-charge",
        method: "POST",
        body: JSON.stringify({ plan: planName }),
      });
      window.location.href = res.paymentUrl;
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSubscribeLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm("确定要取消订阅吗？取消后您的订阅将在当前周期结束后失效。")) return;
    try {
      await apiFetch({
        path: "/subscriptions/cancel",
        method: "POST",
      });
      fetchData();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const currentPlan = sub?.plan;
  const currentPlanMeta = PLANS.find((p) => p.name === currentPlan?.name);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CreditCard className="h-6 w-6" />
          订阅与账单
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          管理您的订阅计划与支付记录
        </p>
      </div>

      {/* Current Plan */}
      <Card className="p-5 border-border/50">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold mb-1">当前计划</h2>
            {loading ? (
              <div className="h-6 w-24 bg-muted rounded animate-pulse mt-2" />
            ) : sub?.hasSubscription && currentPlan ? (
              <div className="flex items-center gap-3 mt-2">
                <span className={`text-2xl font-bold ${currentPlanMeta?.name === "alpha" ? "text-amber-500" : currentPlanMeta?.name === "pro" ? "text-indigo-500" : "text-muted-foreground"}`}>
                  {currentPlan.displayName}
                </span>
                <Badge className={statusColor(sub.status ?? "")}>
                  {statusLabel(sub.status ?? "")}
                </Badge>
              </div>
            ) : (
              <span className="text-muted-foreground mt-2 block">暂无订阅</span>
            )}
          </div>

          {currentPlan && currentPlan.priceMonthly > 0 && (
            <div className="text-right">
              <p className="text-2xl font-bold">
                ${currentPlan.priceMonthly}
                <span className="text-sm font-normal text-muted-foreground">/月</span>
              </p>
              {sub?.currentPeriodEnd && (
                <p className="text-xs text-muted-foreground mt-1">
                  下次扣款：{fmtDate(sub.currentPeriodEnd)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Subscription Details */}
        {sub?.hasSubscription && sub.plan && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">订阅开始</p>
                <p>{fmtDate(sub.currentPeriodStart)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">当前周期结束</p>
                <p>{fmtDate(sub.currentPeriodEnd)}</p>
              </div>
              {sub.paymentMethod && (
                <div>
                  <p className="text-muted-foreground text-xs">支付方式</p>
                  <p className="capitalize">{sub.paymentMethod}</p>
                </div>
              )}
              {sub.cancelledAt && (
                <div>
                  <p className="text-muted-foreground text-xs">取消时间</p>
                  <p className="text-yellow-500">{fmtDate(sub.cancelledAt)} 到期</p>
                </div>
              )}
            </div>

            {sub.status !== "cancelled" && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4 text-orange-500 border-orange-500/30 hover:bg-orange-500/10"
                onClick={handleCancel}
              >
                取消订阅
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Plan Selection */}
      <div>
        <h2 className="font-semibold mb-3">变更计划</h2>
        <div className="grid grid-cols-3 gap-3">
          {PLANS.map((plan) => (
            <Card
              key={plan.name}
              className={`p-4 border-2 transition-colors ${
                currentPlan?.name === plan.name
                  ? "border-primary"
                  : "border-border/50 hover:border-border"
              }`}
            >
              <div className="mb-3">
                <span className={`text-lg font-bold ${plan.name === "alpha" ? "text-amber-500" : plan.name === "pro" ? "text-indigo-500" : "text-muted-foreground"}`}>
                  {plan.displayName}
                </span>
                <p className="text-2xl font-bold mt-1">
                  {plan.price === 0 ? "免费" : `$${plan.price}/月`}
                </p>
              </div>

              {currentPlan?.name === plan.name ? (
                <div className="flex items-center gap-1 text-green-500 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  当前计划
                </div>
              ) : plan.price === 0 ? (
                <Button variant="outline" size="sm" className="w-full" disabled>
                  免费计划
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant={currentPlan && plan.price > (currentPlan.priceMonthly ?? 0) ? "default" : "outline"}
                  className="w-full"
                  onClick={() => handleSubscribe(plan.name)}
                  disabled={!!subscribeLoading}
                >
                  {subscribeLoading === plan.name ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : currentPlan && plan.price < (currentPlan.priceMonthly ?? 0) ? (
                    "降级"
                  ) : (
                    <>
                      升级 <ArrowRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Payment History */}
      <div>
        <h2 className="font-semibold mb-3">支付记录</h2>
        {payments.length === 0 && !loading ? (
          <Card className="p-6 text-center border-border/50">
            <CreditCard className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">暂无支付记录</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {payments.map((pay) => (
              <Card key={pay.id} className="p-3 border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-sm">
                    <p className="font-medium">{fmtUSD(pay.amount, pay.currency)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(pay.createdAt).toLocaleDateString("zh-CN")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs ${statusColor(pay.status)}`}>
                    {statusLabel(pay.status)}
                  </Badge>
                  {pay.txHash && (
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {pay.txHash.slice(0, 8)}…{pay.txHash.slice(-6)}
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
