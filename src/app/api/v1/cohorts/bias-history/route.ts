import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const { searchParams } = new URL(request.url);
    const cohortType = searchParams.get("cohort_type") || "size";
    const cohort = searchParams.get("cohort") || "ALL";
    const symbol = searchParams.get("symbol") || "ALL";
    const days = searchParams.get("days") || "14";

    const url = `${API_BASE}/api/v1/cohorts/bias-history?cohort_type=${cohortType}&cohort=${cohort}&symbol=${symbol}&days=${days}`;
    const res = await fetch(url, {
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Backend error: ${res.status}`);
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ error: "Failed to fetch bias history" }, { status: 500 });
  }
}
