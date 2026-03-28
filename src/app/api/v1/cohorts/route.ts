import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const url = `${API_BASE}/api/v1/cohorts`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Backend error: ${res.status}`);
    return NextResponse.json(await res.json());
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch cohorts" }, { status: 500 });
  }
}
