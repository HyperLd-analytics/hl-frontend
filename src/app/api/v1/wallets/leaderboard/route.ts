export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${API_BASE}/api/v1/cohorts/leaderboard${searchParams ? `?${searchParams}` : ''}`;

  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'failed to fetch' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    // Fallback mock data
    return NextResponse.json({
      items: [
        { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', roi: 245.8, winRate: 68.5, trades: 342 },
        { address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', roi: 198.3, winRate: 72.1, trades: 289 },
      ],
      total: 2,
      pageSize: 10,
      page: 1,
    });
  }
}
