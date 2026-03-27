'use client';

import { useState } from 'react';
import CohortHeatmap from '@/components/charts/CohortHeatmap';
import LiquidationHeatmap from '@/components/charts/LiquidationHeatmap';

export default function HeatmapPage() {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [selectedLiqSymbol, setSelectedLiqSymbol] = useState<string>('BTC');

  const symbols = ['BTC', 'ETH', 'SOL', 'ARB', 'OP', 'MATIC'];

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">市场热图</h1>
        <p className="text-gray-400">
          实时查看 Cohort 仓位分布和清算热图
        </p>
      </div>

      {/* Cohort 仓位热图 */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="mb-4 flex items-center gap-4">
          <label className="text-sm text-gray-400">选择标的:</label>
          <select
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
          >
            <option value="">全市场</option>
            {symbols.map((symbol) => (
              <option key={symbol} value={symbol}>
                {symbol}
              </option>
            ))}
          </select>
        </div>

        <CohortHeatmap symbol={selectedSymbol || undefined} hours={1} />
      </div>

      {/* 清算热图 */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="mb-4 flex items-center gap-4">
          <label className="text-sm text-gray-400">选择标的:</label>
          <select
            value={selectedLiqSymbol}
            onChange={(e) => setSelectedLiqSymbol(e.target.value)}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
          >
            {symbols.map((symbol) => (
              <option key={symbol} value={symbol}>
                {symbol}
              </option>
            ))}
          </select>
        </div>

        <LiquidationHeatmap symbol={selectedLiqSymbol} priceRange={0.2} />
      </div>

      {/* AI 分析 */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">AI 市场分析</h3>
        <AIAnalysis symbol={selectedSymbol || undefined} />
      </div>
    </div>
  );
}

function AIAnalysis({ symbol }: { symbol?: string }) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (symbol) params.append('symbol', symbol);

      const response = await fetch(
        `/api/v1/ai-analysis/cohort-analysis?${params.toString()}`
      );
      const result = await response.json();
      setAnalysis(result);
    } catch (error) {
      console.error('Failed to fetch AI analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={fetchAnalysis}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
      >
        {loading ? '分析中...' : '生成 AI 分析'}
      </button>

      {analysis && (
        <div className="bg-gray-900 rounded-lg p-4">
          <pre className="text-sm text-gray-300 whitespace-pre-wrap">
            {analysis.analysis}
          </pre>
          {analysis.timestamp && (
            <div className="text-xs text-gray-500 mt-4">
              数据时间: {new Date(analysis.timestamp).toLocaleString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
