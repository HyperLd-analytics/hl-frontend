export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';

const RAILWAY_URL = process.env.NEXT_PUBLIC_RAILWAY_URL || 'https://hl-backend-production-4aa1.up.railway.app';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${RAILWAY_URL}/api/v1/wallets/leaderboard${searchParams ? `?${searchParams}` : ''}`;

  const authHeader = request.headers.get('authorization');

  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { 'Authorization': authHeader } : {}),
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'failed to fetch' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Leaderboard proxy error:', error);
    return NextResponse.json({ error: 'failed to fetch' }, { status: 502 });
  }
}
