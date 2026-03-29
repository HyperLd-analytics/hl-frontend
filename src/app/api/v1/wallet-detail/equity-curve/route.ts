import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletId = searchParams.get("wallet_id");
    const granularity = searchParams.get("granularity") || "day";
    const days = searchParams.get("days") || "90";
    if (!walletId) {
      return NextResponse.json({ error: "wallet_id required" }, { status: 400 });
    }
    const res = await fetch(
      `${API_BASE}/api/v1/wallet-detail/${walletId}/equity-curve?granularity=${granularity}&days=${days}`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`Backend error: ${res.status}`);
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ error: "Failed to fetch equity curve" }, { status: 500 });
  }
}
