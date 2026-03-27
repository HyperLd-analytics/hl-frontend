import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  const address = params.address;
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${API_BASE}/api/v1/wallets/${address}${searchParams ? `?${searchParams}` : ''}`;

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
    // Fallback to mock data if backend is unavailable
    return NextResponse.json({
      address,
      tags: ['Smart Money', 'High Win Rate', 'Trend Follower'],
      pnl7d: 12450.30,
      pnl30d: 45678.90,
      positions: [
        { symbol: 'BTC', side: 'long', size: 2.5, entryPrice: 48500, currentPrice: 51200, pnl: 6750 },
        { symbol: 'ETH', side: 'long', size: 15.3, entryPrice: 2850, currentPrice: 3120, pnl: 4131 },
        { symbol: 'SOL', side: 'short', size: 100, entryPrice: 125, currentPrice: 118, pnl: 700 },
      ],
      totalPositions: 3,
      pageSize: 8,
      page: 1,
    });
  }
}
