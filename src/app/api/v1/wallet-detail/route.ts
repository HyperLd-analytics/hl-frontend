import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const walletId = searchParams.get("wallet_id");
    if (!walletId) {
      return NextResponse.json({ error: "wallet_id required" }, { status: 400 });
    }
    const res = await fetch(`${API_BASE}/api/v1/wallet-detail/${walletId}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`Backend error: ${res.status}`);
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ error: "Failed to fetch wallet detail" }, { status: 500 });
  }
}
