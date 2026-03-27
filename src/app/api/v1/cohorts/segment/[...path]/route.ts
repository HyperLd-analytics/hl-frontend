export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';

const RAILWAY_URL = process.env.NEXT_PUBLIC_RAILWAY_URL || 'https://hl-backend-production-4aa1.up.railway.app';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${RAILWAY_URL}/api/v1/cohorts/segment/${path}${searchParams ? `?${searchParams}` : ''}`;

  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'not found' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    // Mock fallback
    return NextResponse.json({
      wallets: [],
      stats: { walletCount: 0, totalVolume: 0, avgWinRate: 0, avgPnl: 0, totalAccountValue: 0, avgLeverage: 0 },
      pagination: { total: 0, limit: 50, offset: 0, hasMore: false },
    });
  }
}
