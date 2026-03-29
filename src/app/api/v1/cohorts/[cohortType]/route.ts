export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

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
    const authHeader = request.headers.get("authorization");
    const { cohortType } = await params;
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") ?? "10";
    const sortBy = searchParams.get("sortBy") ?? "pnl";
    const backendCohort = COHORT_MAP[cohortType] ?? cohortType.toLowerCase();

    const res = await fetch(
      `${API_BASE}/api/v1/cohorts/segment/${backendCohort}?limit=${limit}&sort_by=${sortBy}`,
      {
        headers: {
          "Content-Type": "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return NextResponse.json({ wallets: [], stats: {} });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`GET /api/v1/cohorts/[cohortType] error:`, error);
    return NextResponse.json({ wallets: [], stats: {} });
  }
}
