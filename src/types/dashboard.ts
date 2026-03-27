export type DashboardOverview = {
  totalPnl: number;
  trackedWallets: number;
  activeAlerts: number;
  liquidationRiskIndex: number;
  pnlTrend?: Array<{ date: string; value: number }>;
};

export type CohortWallet = {
  address: string;
  chain: string;
  score: number;
  label?: string;
  winRate: number;
  totalPnl: number;
  volume30d: number;
  tradeCount30d: number;
  accountValue: number;
  sizeCohort: string;
  pnlCohort: string;
  avgPositionSize: number;
  maxLeverage: number;
  lastActive?: string;
};

export type CohortStats = {
  walletCount: number;
  totalVolume: number;
  avgWinRate: number;
  avgPnl: number;
  totalAccountValue: number;
  avgLeverage: number;
  sizeDistribution?: Record<string, number>;
};

export type CohortSegmentResponse = {
  pnlCohort: string;
  wallets: CohortWallet[];
  stats: CohortStats;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  filters: Record<string, unknown>;
};

export type CohortStatsWithTopWallets = CohortStats & {
  topWallets?: Array<{ address: string; totalPnl: number; volume30d: number; winRate: number }>;
};

export type CohortOverview = {
  totalTracked?: number;
  totalAccountValue?: number;
  totalVolume30d?: number;
  MONEY_PRINTER?: CohortStatsWithTopWallets;
  PROFIT?: CohortStatsWithTopWallets;
  BREAK_EVEN?: CohortStatsWithTopWallets;
  REKT?: CohortStatsWithTopWallets;
  GIGA_REKT?: CohortStatsWithTopWallets;
  [key: string]: CohortStatsWithTopWallets | number | undefined;
};

export type LeaderboardItem = {
  address: string;
  roi: number;
  winRate: number;
  trades: number;
  // New fields
  holdPercentage?: number;
  pnl1h?: number;
  pnl24h?: number;
  pnl7d?: number;
  markets?: string[];
  lastActive?: string;
  isTopHolder?: boolean;
  // Raw fields from backend (snake_case)
  score?: number;
  total_pnl?: number;
  win_rate?: number;
  volume_30d_usd?: number;
  lifetime_trade_count?: number;
  size_cohort?: string;
  pnl_cohort?: string;
  account_value?: number;
  last_active?: string;
  is_top_holder?: boolean;
  pnl_1h?: number;
  pnl_24h?: number;
  pnl_7d?: number;
  hold_percentage?: number;
};

export type LeaderboardResponse = {
  items: LeaderboardItem[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  };
  filters: Record<string, unknown>;
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
  name: string | null;
  alert_type: string;
  target: string;
  condition: Record<string, unknown>;
  channel: string;
  priority: number;
  is_active: boolean;
  last_triggered: string | null;
  created_at: string;
};

export type AlertHistoryItem = {
  id: number;
  triggeredAt: string;
  message: string;
  payload: Record<string, unknown> | null;
};

export type AlertHistoryResponse = {
  alertId: string;
  alertName: string | null;
  history: AlertHistoryItem[];
  total: number;
};

export type AlertsResponse = AlertRule[];
