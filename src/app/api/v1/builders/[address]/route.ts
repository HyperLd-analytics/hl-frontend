import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization");
    const { address } = await params;
    const { searchParams } = new URL(request.url);
    const days = searchParams.get("days") || "30";

    const res = await fetch(
      `${API_BASE}/api/v1/builders/${address}?days=${days}`,
      {
        headers: {
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        cache: "no-store",
      }
    );
    if (!res.ok) throw new Error(`Backend error: ${res.status}`);
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ error: "Failed to fetch builder detail" }, { status: 500 });
  }
}
