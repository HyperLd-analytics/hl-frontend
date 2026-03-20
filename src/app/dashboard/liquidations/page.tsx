"use client";

import { Card } from "@/components/ui/card";
import { useApiQuery } from "@/hooks/use-api-query";
import { LiquidationHeatmapResponse } from "@/types/dashboard";
import { PageError } from "@/components/common/page-error";
import { PageLoading } from "@/components/common/page-loading";
import { LiquidationHeatChart } from "@/components/charts/liquidation-heat-chart";

export default function LiquidationsPage() {
  const { data, loading, error, refetch } = useApiQuery<LiquidationHeatmapResponse>("/liquidations/heatmap", {
    debounceMs: 120,
    staleTimeMs: 5_000,
    pollingIntervalMs: 15_000
  });

  if (loading && !data) return <PageLoading />;
  if (error && !data) return <PageError message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">清算热图</h1>
      <Card>
        <LiquidationHeatChart
          data={
            data?.points?.length
              ? data.points
              : [
                  { priceBand: "0-1%", intensity: 0 },
                  { priceBand: "1-2%", intensity: 0 },
                  { priceBand: "2-3%", intensity: 0 },
                  { priceBand: "3-4%", intensity: 0 }
                ]
          }
        />
      </Card>
    </div>
  );
}
