export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

const RAILWAY_URL = process.env.NEXT_PUBLIC_RAILWAY_URL || "https://hl-backend-production-4aa1.up.railway.app";

const COHORT_MAP: Record<string, string> = {
  MONEY_PRINTER: "money_printer",
  PROFIT: "profit",
  BREAK_EVEN: "break_even",
  REKT: "rekt",
  GIGA_REKT: "giga_rekt",
};

export async function GET() {
  try {
    const cohortKeys = Object.keys(COHORT_MAP);
    const backendCohorts = Object.values(COHORT_MAP);

    const [overviewRes, ...cohortResults] = await Promise.all([
      fetch(`${RAILWAY_URL}/api/v1/cohorts/overview`, { cache: "no-store" }),
      ...backendCohorts.flatMap((cohort) => [
        fetch(`${RAILWAY_URL}/api/v1/cohorts/segment/${cohort}/stats`, { cache: "no-store" }),
        fetch(`${RAILWAY_URL}/api/v1/cohorts/segment/${cohort}?limit=5&sort_by=pnl`, { cache: "no-store" }),
      ]),
    ]);

    if (!overviewRes.ok) {
      const text = await overviewRes.text().catch(() => "");
      throw new Error(`Overview error ${overviewRes.status}: ${text}`);
    }

    const overview = await overviewRes.json();

    const result: Record<string, unknown> = {
      totalTracked: overview.totalWallets ?? 0,
      totalAccountValue: overview.marketStats?.totalAccountValue ?? 0,
      totalVolume30d: 0,
    };

    let totalVolume30d = 0;

    for (let i = 0; i < cohortKeys.length; i++) {
      const key = cohortKeys[i];
      const statsRes = cohortResults[i * 2];
      const walletsRes = cohortResults[i * 2 + 1];
      let stats: Record<string, unknown> = {};
      let topWallets: unknown[] = [];

      if (statsRes.ok) {
        stats = await statsRes.json();
        totalVolume30d += Number(stats.totalVolume ?? 0);
      }

      if (walletsRes.ok) {
        const walletsData = await walletsRes.json();
        topWallets = (walletsData.wallets ?? []).map((w: Record<string, unknown>) => ({
          address: w.address,
          totalPnl: w.totalPnl,
          volume30d: w.volume30d,
          winRate: w.winRate,
        }));
      }

      result[key] = {
        walletCount: stats.walletCount ?? 0,
        totalVolume: stats.totalVolume ?? 0,
        avgWinRate: stats.avgWinRate ?? 0,
        avgPnl: stats.avgPnl ?? 0,
        totalAccountValue: stats.totalAccountValue ?? 0,
        avgLeverage: stats.avgLeverage ?? 0,
        sizeDistribution: stats.sizeDistribution ?? {},
        topWallets,
      };
    }

    result.totalVolume30d = totalVolume30d;

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/v1/cohorts/overview error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
