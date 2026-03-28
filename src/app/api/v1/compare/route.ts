import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet_ids = searchParams.get("wallet_ids") || "";
    const metric = searchParams.get("metric") || "pnl";
    const period = searchParams.get("period") || "7d";

    const url = new URL(`${API_BASE}/api/v1/wallets/compare`);
    url.searchParams.set("wallet_ids", wallet_ids);
    url.searchParams.set("metric", metric);
    url.searchParams.set("period", period);

    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) throw new Error(`Backend error: ${res.status}`);
    return NextResponse.json(await res.json());
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch comparison data" }, { status: 500 });
  }
}
