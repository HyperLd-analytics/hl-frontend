'use client';

import { useEffect, useState } from 'react';

interface CohortData {
  sizeCohort: string;
  pnlCohort: string;
  walletCount: number;
  totalLongSize: number;
  totalShortSize: number;
  netPosition: number;
  totalAccountValue: number;
  avgLeverage: number;
}

interface CohortHeatmapProps {
  symbol?: string;
  hours?: number;
}

export default function CohortHeatmap({ symbol, hours = 1 }: CohortHeatmapProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHeatmapData();
  }, [symbol, hours]);

  const fetchHeatmapData = async () => {
    try {
      const params = new URLSearchParams();
      if (symbol) params.append('symbol', symbol);
      params.append('hours', hours.toString());

      const response = await fetch(
        `/api/v1/cohorts/stats?${params.toString()}`
      );
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch heatmap data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse bg-gray-800 h-96 rounded-lg" />;
  }

  if (!data) {
    return <div className="text-gray-400">暂无数据</div>;
  }

  const getColorForValue = (value: number, max: number) => {
    const intensity = Math.min(value / max, 1);
    if (intensity === 0) return 'bg-gray-900';
    if (intensity < 0.2) return 'bg-blue-900/30';
    if (intensity < 0.4) return 'bg-blue-800/50';
    if (intensity < 0.6) return 'bg-blue-700/70';
    if (intensity < 0.8) return 'bg-blue-600/90';
    return 'bg-blue-500';
  };

  const maxValue = Math.max(
    ...data.heatmap.flat().map((cell: CohortData) =>
      Math.abs(cell.netPosition)
    )
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Cohort 仓位热图 {symbol && `- ${symbol}`}
        </h3>
        <div className="text-sm text-gray-400">
          总钱包: {data.totalStats.totalWallets} |
          净持仓: ${data.totalStats.netPosition.toFixed(0)}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-xs text-gray-400 border border-gray-700">
                Size / PNL
              </th>
              {data.pnlCohorts.map((pnl: string) => (
                <th key={pnl} className="p-2 text-xs text-gray-400 border border-gray-700">
                  {pnl}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.heatmap.map((row: CohortData[], rowIdx: number) => (
              <tr key={rowIdx}>
                <td className="p-2 text-xs font-medium border border-gray-700">
                  {data.sizeCohorts[rowIdx]}
                </td>
                {row.map((cell: CohortData, colIdx: number) => (
                  <td
                    key={colIdx}
                    className={`p-3 border border-gray-700 cursor-pointer hover:opacity-80 transition-opacity ${getColorForValue(
                      Math.abs(cell.netPosition),
                      maxValue
                    )}`}
                    title={`钱包数: ${cell.walletCount}\n多头: $${cell.totalLongSize.toFixed(0)}\n空头: $${cell.totalShortSize.toFixed(0)}\n净持仓: $${cell.netPosition.toFixed(0)}`}
                  >
                    <div className="text-xs text-center">
                      <div className="font-semibold">{cell.walletCount}</div>
                      <div className="text-gray-400 text-[10px]">
                        ${(cell.netPosition / 1000).toFixed(0)}K
                      </div>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
