import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pnlCohort = searchParams.get("pnlCohort") || "PROFIT";
  const limit = searchParams.get("limit") || "5";
  const sortBy = searchParams.get("sortBy") || "totalPnl";

  try {
    const backendUrl = `${API_BASE}/api/v1/cohorts/segment/${pnlCohort}?limit=${limit}&sortBy=${sortBy}`;
    const res = await fetch(backendUrl, { cache: "no-store" });

    if (!res.ok) {
      throw new Error(`Backend error: ${res.status}`);
    }

    const data = await res.json();

    // Return just the top wallets array from the segment response
    const wallets = (data.wallets ?? []).map((w: {
      address: string;
      totalPnl: number;
      volume30d: number;
      winRate: number;
      roi?: number;
      trades?: number;
      lastActive?: string;
      accountValue?: number;
    }) => ({
      address: w.address,
      totalPnl: w.totalPnl ?? 0,
      volume30d: w.volume30d ?? 0,
      winRate: w.winRate ?? 0,
      roi: w.roi ?? 0,
      trades: w.trades ?? 0,
      lastActive: w.lastActive,
      accountValue: w.accountValue ?? 0,
    }));

    return NextResponse.json({ wallets });
  } catch (error) {
    console.error("Top wallets API error:", error);
    return NextResponse.json({ wallets: [] });
  }
}
