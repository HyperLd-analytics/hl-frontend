"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("dashboard");
  const { data, loading, error, refetch } = useApiQuery<DashboardOverview>("/analytics/overview", {
    debounceMs: 120,
  });

  if (loading && !data) return <PageLoading />;
  if (error && !data) return <PageError message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>{t("totalPnl")}：{data?.totalPnl ?? 0}</Card>
        <Card>{t("trackedWallets")}：{data?.trackedWallets ?? 0}</Card>
        <Card>{t("activeAlerts")}：{data?.activeAlerts ?? 0}</Card>
        <Card>{t("liquidationRisk")}：{data?.liquidationRiskIndex ?? 0}</Card>
      </div>
      <Card>
        <h2 className="mb-3 text-base font-medium">{t("pnlTrend")}</h2>
        <PnlTrendChart
          data={
            data?.pnlTrend?.length
              ? data.pnlTrend
              : [
                  { date: "Mon", value: 0 },
                  { date: "Tue", value: 0 },
                  { date: "Wed", value: 0 },
                  { date: "Thu", value: 0 },
                  { date: "Fri", value: 0 },
                ]
          }
        />
      </Card>
    </div>
  );
}
