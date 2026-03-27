export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

const RAILWAY_URL = process.env.NEXT_PUBLIC_RAILWAY_URL || "https://hl-backend-production-4aa1.up.railway.app";

export async function GET() {
  try {
    const res = await fetch(`${RAILWAY_URL}/api/v1/analytics/overview`, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Backend error ${res.status}: ${text}`);
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/v1/analytics/overview error:", error);
    return NextResponse.json(
      { overview: null, recent_signals: [], top_wallets: [], top_positions: [] },
      { status: 500 }
    );
  }
}
