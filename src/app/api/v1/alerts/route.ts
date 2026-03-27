import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function GET() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/alerts`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Backend error: ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/v1/alerts error:", error);
    return NextResponse.json({ alerts: [], error: "Failed to fetch alerts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch(`${API_BASE}/api/v1/alerts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Backend error: ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("POST /api/v1/alerts error:", error);
    return NextResponse.json({ error: "Failed to create alert" }, { status: 500 });
  }
}
