export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

const RAILWAY_URL = process.env.NEXT_PUBLIC_RAILWAY_URL || "https://hl-backend-production-4aa1.up.railway.app";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authHeader = request.headers.get("authorization");
  const cookieHeader = request.headers.get("cookie");
  const body = await request.text();
  const url = `${RAILWAY_URL}/api/v1/alerts/${id}`;

  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { "Authorization": authHeader } : {}),
        ...(cookieHeader ? { "Cookie": cookieHeader } : {}),
      },
      body,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error(`PATCH /api/v1/alerts/${id} error:`, error);
    return NextResponse.json({ message: "Proxy error" }, { status: 502 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authHeader = request.headers.get("authorization");
  const cookieHeader = request.headers.get("cookie");
  const url = `${RAILWAY_URL}/api/v1/alerts/${id}`;

  try {
    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        ...(authHeader ? { "Authorization": authHeader } : {}),
        ...(cookieHeader ? { "Cookie": cookieHeader } : {}),
      },
    });
    return NextResponse.json({ success: res.ok }, { status: res.status });
  } catch (error) {
    console.error(`DELETE /api/v1/alerts/${id} error:`, error);
    return NextResponse.json({ message: "Proxy error" }, { status: 502 });
  }
}
