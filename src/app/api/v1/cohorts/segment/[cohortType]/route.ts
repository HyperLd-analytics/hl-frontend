import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ cohortType: string }> }
) {
  try {
    const { cohortType } = await params;
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") ?? "10";
    const sortBy = searchParams.get("sortBy") ?? "totalPnl";

    const res = await fetch(
      `${API_BASE}/api/v1/cohorts/${cohortType}?limit=${limit}&sortBy=${sortBy}`,
      { cache: "no-store" }
    );

    if (!res.ok) throw new Error(`Backend error: ${res.status}`);

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`GET /api/v1/cohorts/segment error:`, error);
    return NextResponse.json({ wallets: [], stats: {} }, { status: 500 });
  }
}
