export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

const RAILWAY_URL = process.env.NEXT_PUBLIC_RAILWAY_URL || "https://hl-backend-production-4aa1.up.railway.app";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const addresses = searchParams.get("addresses") || "";

    const url = new URL(`${RAILWAY_URL}/api/v1/wallets/compare`);
    url.searchParams.set("addresses", addresses);

    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) throw new Error(`Backend error: ${res.status}`);
    return NextResponse.json(await res.json());
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch comparison data" }, { status: 500 });
  }
}
