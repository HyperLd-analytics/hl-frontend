import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function GET() {
  try {
    const [statsRes, overviewRes] = await Promise.all([
      fetch(`${API_BASE}/api/v1/cohorts/stats`, { cache: "no-store" }),
      fetch(`${API_BASE}/api/v1/cohorts/overview`, { cache: "no-store" }),
    ]);

    if (!statsRes.ok) {
      const text = await statsRes.text().catch(() => "");
      throw new Error(`Stats error ${statsRes.status}: ${text}`);
    }
    if (!overviewRes.ok) {
      const text = await overviewRes.text().catch(() => "");
      throw new Error(`Overview error ${overviewRes.status}: ${text}`);
    }

    const [stats, overview]: [Record<string, unknown>, Record<string, unknown>] =
      await Promise.all([statsRes.json(), overviewRes.json()]);

    // Merge: cohort keys from stats + overview
    const cohorts = ["MONEY_PRINTER", "PROFIT", "BREAK_EVEN", "REKT", "GIGA_REKT"];
    const merged: Record<string, Record<string, unknown>> = {};

    for (const cohort of cohorts) {
      merged[cohort] = {
        ...(stats[cohort] as Record<string, unknown>),
        ...(overview[cohort] as Record<string, unknown>),
      };
    }

    return NextResponse.json(merged);
  } catch (error) {
    console.error("GET /api/v1/cohorts/overview error:", error);
    return NextResponse.json({}, { status: 500 });
  }
}
