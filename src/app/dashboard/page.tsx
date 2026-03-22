"use client";

import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";
import { useApiQuery } from "@/hooks/use-api-query";
import { PageError } from "@/components/common/page-error";
import { PageLoading } from "@/components/common/page-loading";
import { DashboardOverview } from "@/types/dashboard";

const PnlTrendChart = dynamic(
  () => import("@/components/charts/pnl-trend-chart").then((mod) => mod.PnlTrendChart),
  { ssr: false }
);

export default function DashboardPage() {
  const { data, loading, error, refetch } = useApiQuery<DashboardOverview>("/cohorts/overview", {
    debounceMs: 120
  });

  if (loading && !data) return <PageLoading />;
  if (error && !data) return <PageError message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>总 PnL：{data?.totalPnl ?? 0}</Card>
        <Card>追踪钱包数：{data?.trackedWallets ?? 0}</Card>
        <Card>活跃告警数：{data?.activeAlerts ?? 0}</Card>
        <Card>清算风险指数：{data?.liquidationRiskIndex ?? 0}</Card>
      </div>
      <Card>
        <h2 className="mb-3 text-base font-medium">PnL 趋势</h2>
        <PnlTrendChart
          data={
            data?.pnlTrend?.length
              ? data.pnlTrend
              : [
                  { date: "Mon", value: 0 },
                  { date: "Tue", value: 0 },
                  { date: "Wed", value: 0 },
                  { date: "Thu", value: 0 },
                  { date: "Fri", value: 0 }
                ]
          }
        />
      </Card>
    </div>
  );
}
