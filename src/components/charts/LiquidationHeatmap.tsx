'use client';

import { useEffect, useState } from 'react';

interface LiquidationZone {
  priceLevel: number;
  longLiquidationSize: number;
  shortLiquidationSize: number;
  walletCount: number;
}

interface LiquidationHeatmapProps {
  symbol: string;
  currentPrice?: number;
  priceRange?: number;
}

export default function LiquidationHeatmap({
  symbol,
  currentPrice,
  priceRange = 0.2,
}: LiquidationHeatmapProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLiquidationData = async () => {
      try {
        const params = new URLSearchParams();
        if (currentPrice) params.append('current_price', currentPrice.toString());
        params.append('price_range', priceRange.toString());

        const response = await fetch(
          `/api/v1/liquidation-heatmap/heatmap/${symbol}?${params.toString()}`
        );
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Failed to fetch liquidation data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLiquidationData();
  }, [symbol, currentPrice, priceRange]);

  if (loading) {
    return <div className="animate-pulse bg-gray-800 h-96 rounded-lg" />;
  }

  if (!data || !data.zones || data.zones.length === 0) {
    return <div className="text-gray-400">暂无清算数据</div>;
  }

  const maxSize = Math.max(
    ...data.zones.map((z: LiquidationZone) =>
      Math.max(z.longLiquidationSize, z.shortLiquidationSize)
    )
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">清算热图 - {symbol}</h3>
        {data.currentPrice && (
          <div className="text-sm text-gray-400">
            当前价格: ${data.currentPrice.toFixed(2)}
          </div>
        )}
      </div>

      <div className="space-y-1">
        {data.zones.map((zone: LiquidationZone, idx: number) => {
          const longWidth = (zone.longLiquidationSize / maxSize) * 100;
          const shortWidth = (zone.shortLiquidationSize / maxSize) * 100;

          return (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <div className="w-20 text-right text-gray-400">
                ${zone.priceLevel.toFixed(2)}
              </div>

              <div className="flex-1 flex items-center gap-1">
                <div className="flex-1 flex justify-end">
                  <div
                    className="bg-red-500/70 h-6 rounded-l transition-all hover:bg-red-500"
                    style={{ width: `${shortWidth}%` }}
                    title={`空头清算: $${zone.shortLiquidationSize.toFixed(0)}`}
                  />
                </div>

                <div className="w-px h-8 bg-gray-600" />

                <div className="flex-1">
                  <div
                    className="bg-green-500/70 h-6 rounded-r transition-all hover:bg-green-500"
                    style={{ width: `${longWidth}%` }}
                    title={`多头清算: $${zone.longLiquidationSize.toFixed(0)}`}
                  />
                </div>
              </div>

              <div className="w-16 text-gray-400">
                {zone.walletCount} 个
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center gap-6 text-xs text-gray-400 pt-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500/70 rounded" />
          <span>空头清算</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500/70 rounded" />
          <span>多头清算</span>
        </div>
      </div>
    </div>
  );
}
