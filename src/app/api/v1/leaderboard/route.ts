import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "7d";
    const limit = searchParams.get("limit") || "50";

    const url = new URL(`${API_BASE}/api/v1/leaderboard`);
    url.searchParams.set("period", period);
    url.searchParams.set("limit", limit);

    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) throw new Error(`Backend error: ${res.status}`);
    return NextResponse.json(await res.json());
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
