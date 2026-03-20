export type DashboardOverview = {
  totalPnl: number;
  trackedWallets: number;
  activeAlerts: number;
  liquidationRiskIndex: number;
  pnlTrend?: Array<{ date: string; value: number }>;
};

export type LeaderboardItem = {
  address: string;
  roi: number;
  winRate: number;
  trades: number;
};

export type LeaderboardResponse = {
  items: LeaderboardItem[];
  page?: number;
  pageSize?: number;
  total?: number;
};

export type WalletAnalysis = {
  address: string;
  tags: string[];
  pnl7d: number;
  pnl30d: number;
  positions: Array<{ symbol: string; side: "long" | "short"; size: number }>;
  page?: number;
  pageSize?: number;
  totalPositions?: number;
};

export type LiquidationHeatmapPoint = {
  priceBand: string;
  intensity: number;
};

export type LiquidationHeatmapResponse = {
  points: LiquidationHeatmapPoint[];
};

export type AlertRule = {
  id: string;
  name: string;
  enabled: boolean;
  condition: string;
};

export type AlertsResponse = {
  rules: AlertRule[];
};
