import { NextResponse } from 'next/server';

export async function GET() {
  // Mock data for development when backend is unavailable
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
    ]
  });
}
