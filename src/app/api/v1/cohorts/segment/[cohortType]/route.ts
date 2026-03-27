export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

const RAILWAY_URL = process.env.NEXT_PUBLIC_RAILWAY_URL || "https://hl-backend-production-4aa1.up.railway.app";

// Map frontend cohort labels (uppercase) to backend pnl_cohort values (lowercase)
const COHORT_MAP: Record<string, string> = {
  MONEY_PRINTER: "money_printer",
  PROFIT: "profit",
  BREAK_EVEN: "break_even",
  REKT: "rekt",
  GIGA_REKT: "giga_rekt",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cohortType: string }> }
) {
  try {
    const { cohortType } = await params;
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") ?? "10";
    const sortBy = searchParams.get("sortBy") ?? "pnl";

    // Convert frontend cohort label to backend pnl_cohort value
    const backendCohort = COHORT_MAP[cohortType] ?? cohortType.toLowerCase();

    const res = await fetch(
      `${RAILWAY_URL}/api/v1/cohorts/segment/${backendCohort}?limit=${limit}&sort_by=${sortBy}`,
      { headers: { "Content-Type": "application/json" }, cache: "no-store" }
    );

    if (!res.ok) {
      return NextResponse.json({ wallets: [], stats: {} });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`GET /api/v1/cohorts/segment/[cohortType] error:`, error);
    return NextResponse.json({ wallets: [], stats: {} });
  }
}
