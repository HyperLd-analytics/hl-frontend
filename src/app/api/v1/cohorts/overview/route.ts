import { NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export async function GET() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/cohorts/overview`, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error('Backend unavailable');
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    // Mock data fallback
    return NextResponse.json({
      totalPnl: 125430.50,
      trackedWallets: 42,
      activeAlerts: 7,
      liquidationRiskIndex: 3.2,
      pnlTrend: [
        { date: '2024-03-18', value: 12340 },
        { date: '2024-03-19', value: 15230 },
        { date: '2024-03-20', value: 13890 },
        { date: '2024-03-21', value: 18450 },
        { date: '2024-03-22', value: 16720 },
        { date: '2024-03-23', value: 19340 },
        { date: '2024-03-24', value: 21560 },
      ],
    });
  }
}
