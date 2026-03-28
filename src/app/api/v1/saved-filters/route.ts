export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

const RAILWAY_URL = process.env.NEXT_PUBLIC_RAILWAY_URL || "https://hl-backend-production-4aa1.up.railway.app";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${RAILWAY_URL}/api/v1/saved-filters/${searchParams ? `?${searchParams}` : ""}`;
  const authHeader = request.headers.get("authorization");

  try {
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { "Authorization": authHeader } : {}),
      },
      cache: "no-store",
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Saved filters proxy error:", error);
    return NextResponse.json({ message: "failed to fetch" }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  const url = `${RAILWAY_URL}/api/v1/saved-filters/`;
  const authHeader = request.headers.get("authorization");
  const body = await request.text();

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { "Authorization": authHeader } : {}),
      },
      body,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Saved filters POST proxy error:", error);
    return NextResponse.json({ message: "failed to create filter" }, { status: 502 });
  }
}
