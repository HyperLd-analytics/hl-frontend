export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = new URL(`${API_BASE}/api/v1/analytics/overview`);
    // Forward all query params
    searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });
    const res = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(url.searchParams)),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Backend error: ${res.status}`);
    return NextResponse.json(await res.json());
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
