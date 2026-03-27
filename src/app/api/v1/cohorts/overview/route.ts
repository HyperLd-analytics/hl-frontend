import { NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Frontend CohortOverview needs each cohort to have: walletCount, avgPnl, avgWinRate, avgLeverage, totalAccountValue, topWallets
// Backend /overview returns: totalWallets, pnlCohortDistribution (just counts)
// Backend /stats returns per-cohort aggregated stats
// We need to fetch both and merge

export async function GET() {
  try {
    // Fetch overview + stats in parallel
    const [overviewRes, statsRes] = await Promise.all([
      fetch(`${API_BASE}/api/v1/cohorts/overview`, { cache: 'no-store' }),
      fetch(`${API_BASE}/api/v1/cohorts/stats`, { cache: 'no-store' }),
    ]);

    if (!overviewRes.ok || !statsRes.ok) {
      throw new Error('Backend unavailable');
    }

    const overviewData = await overviewRes.json();
    const statsData = await statsRes.json();

    // Build CohortOverview from backend data
    const result = {
      totalTracked: overviewData.totalWallets ?? 0,
      totalAccountValue: overviewData.totalAccountValue ?? 0,
      totalVolume30d: overviewData.totalVolume30d ?? 0,
      // Map backend stats data to cohort keys
      MONEY_PRINTER: {
        walletCount: statsData.MONEY_PRINTER?.walletCount ?? 0,
        totalAccountValue: statsData.MONEY_PRINTER?.totalAccountValue ?? 0,
        avgPnl: statsData.MONEY_PRINTER?.avgPnl ?? 0,
        avgWinRate: statsData.MONEY_PRINTER?.avgWinRate ?? 0,
        avgLeverage: statsData.MONEY_PRINTER?.avgLeverage ?? 0,
        topWallets: [],
      },
      PROFIT: {
        walletCount: statsData.PROFIT?.walletCount ?? 0,
        totalAccountValue: statsData.PROFIT?.totalAccountValue ?? 0,
        avgPnl: statsData.PROFIT?.avgPnl ?? 0,
        avgWinRate: statsData.PROFIT?.avgWinRate ?? 0,
        avgLeverage: statsData.PROFIT?.avgLeverage ?? 0,
        topWallets: [],
      },
      BREAK_EVEN: {
        walletCount: statsData.BREAK_EVEN?.walletCount ?? 0,
        totalAccountValue: statsData.BREAK_EVEN?.totalAccountValue ?? 0,
        avgPnl: statsData.BREAK_EVEN?.avgPnl ?? 0,
        avgWinRate: statsData.BREAK_EVEN?.avgWinRate ?? 0,
        avgLeverage: statsData.BREAK_EVEN?.avgLeverage ?? 0,
        topWallets: [],
      },
      REKT: {
        walletCount: statsData.REKT?.walletCount ?? 0,
        totalAccountValue: statsData.REKT?.totalAccountValue ?? 0,
        avgPnl: statsData.REKT?.avgPnl ?? 0,
        avgWinRate: statsData.REKT?.avgWinRate ?? 0,
        avgLeverage: statsData.REKT?.avgLeverage ?? 0,
        topWallets: [],
      },
      GIGA_REKT: {
        walletCount: statsData.GIGA_REKT?.walletCount ?? 0,
        totalAccountValue: statsData.GIGA_REKT?.totalAccountValue ?? 0,
        avgPnl: statsData.GIGA_REKT?.avgPnl ?? 0,
        avgWinRate: statsData.GIGA_REKT?.avgWinRate ?? 0,
        avgLeverage: statsData.GIGA_REKT?.avgLeverage ?? 0,
        topWallets: [],
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Cohorts overview API error:', error);
    return NextResponse.json({
      totalTracked: 0,
      totalAccountValue: 0,
      totalVolume30d: 0,
      MONEY_PRINTER: { walletCount: 0, totalAccountValue: 0, avgPnl: 0, avgWinRate: 0, avgLeverage: 0, topWallets: [] },
      PROFIT: { walletCount: 0, totalAccountValue: 0, avgPnl: 0, avgWinRate: 0, avgLeverage: 0, topWallets: [] },
      BREAK_EVEN: { walletCount: 0, totalAccountValue: 0, avgPnl: 0, avgWinRate: 0, avgLeverage: 0, topWallets: [] },
      REKT: { walletCount: 0, totalAccountValue: 0, avgPnl: 0, avgWinRate: 0, avgLeverage: 0, topWallets: [] },
      GIGA_REKT: { walletCount: 0, totalAccountValue: 0, avgPnl: 0, avgWinRate: 0, avgLeverage: 0, topWallets: [] },
    });
  }
}
