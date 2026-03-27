export type WalletItem = {
  chain: string;
  address: string;
  score: number;
  label: string;
  win_rate: number;
  total_pnl: number;
  volume_30d_usd?: number;
  trade_count_30d?: number;
  lifetime_trade_count?: number;
  size_cohort?: string;
  pnl_cohort?: string;
  account_value?: number;
  last_active?: string;
};

export type WalletFilter = {
  sortBy: string;
  sortDir: string;
  minScore?: number;
  maxScore?: number;
  minPnl?: number;
  maxPnl?: number;
  minWinRate?: number;
  maxWinRate?: number;
  minVolume?: number;
  maxVolume?: number;
  sizeCohort?: string;
  pnlCohort?: string;
  label?: string;
  search?: string;
};

export type SavedFilter = {
  id: string;
  user_id: string;
  name: string;
  filter_type: string;
  filters: WalletFilter;
  is_default: boolean;
  created_at: string;
};

export type WalletLeaderboardResponse = {
  items: WalletItem[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  };
  filters: WalletFilter;
};

export const SIZE_COHORTS = [
  { value: "", label: "全部" },
  { value: "shrimp", label: "Shrimp (< $1K)" },
  { value: "crab", label: "Crab ($1K - $10K)" },
  { value: "fish", label: "Fish ($10K - $50K)" },
  { value: "dolphin", label: "Dolphin ($50K - $250K)" },
  { value: "shark", label: "Shark ($250K - $1M)" },
  { value: "whale", label: "Whale ($1M - $5M)" },
  { value: "leviathan", label: "Leviathan (> $5M)" },
];

export const PNL_COHORTS = [
  { value: "", label: "全部" },
  { value: "giga_rekt", label: "Giga Rekt (< -50%)" },
  { value: "rekt", label: "Rekt (-50% ~ -10%)" },
  { value: "break_even", label: "Break Even (-10% ~ +10%)" },
  { value: "profit", label: "Profit (+10% ~ +100%)" },
  { value: "money_printer", label: "Money Printer (> +100%)" },
];

export const SORT_OPTIONS = [
  { value: "score", label: "综合评分" },
  { value: "total_pnl", label: "累计 PnL" },
  { value: "win_rate", label: "胜率" },
  { value: "volume_30d", label: "30天交易量" },
  { value: "lifetime_trade_count", label: "累计交易次数" },
];

export const SIZE_COHORT_LABELS: Record<string, string> = {
  shrimp: "🦐",
  crab: "🦀",
  fish: "🐟",
  dolphin: "🐬",
  shark: "🦈",
  whale: "🐋",
  leviathan: "🐙",
};
