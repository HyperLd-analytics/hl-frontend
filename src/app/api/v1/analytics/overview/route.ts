export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

const RAILWAY_URL = process.env.NEXT_PUBLIC_RAILWAY_URL || "https://hl-backend-production-4aa1.up.railway.app";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  try {
    const res = await fetch(`${RAILWAY_URL}/api/v1/analytics/overview`, {
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { "Authorization": authHeader } : {}),
      },
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("GET /api/v1/analytics/overview error:", error);
    return NextResponse.json(
      { message: "failed to fetch" },
      { status: 502 }
    );
  }
}
