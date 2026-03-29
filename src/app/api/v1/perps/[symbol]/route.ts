import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const authHeader = request.headers.get("authorization");
    const symbol = params.symbol;
    const res = await fetch(`${API_BASE}/api/v1/perps/${symbol}`, {
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Backend error: ${res.status}`);
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ error: "Failed to fetch perp detail" }, { status: 500 });
  }
}
