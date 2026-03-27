export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

const RAILWAY_URL = process.env.NEXT_PUBLIC_RAILWAY_URL || "https://hl-backend-production-4aa1.up.railway.app";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;
  const authHeader = request.headers.get("authorization");
  const cookieHeader = request.headers.get("cookie");
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${RAILWAY_URL}/api/v1/wallets/${address}${searchParams ? `?${searchParams}` : ""}`;

  try {
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { "Authorization": authHeader } : {}),
        ...(cookieHeader ? { "Cookie": cookieHeader } : {}),
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ error: "not found" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`GET /api/v1/wallets/${address} error:`, error);
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
}
