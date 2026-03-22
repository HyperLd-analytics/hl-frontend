import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  const address = params.address;
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '8');
  const side = searchParams.get('side') || 'all';

  // Mock wallet analysis data
  const mockPositions = [
    { symbol: 'BTC', side: 'long', size: 2.5, entryPrice: 48500, currentPrice: 51200, pnl: 6750 },
    { symbol: 'ETH', side: 'long', size: 15.3, entryPrice: 2850, currentPrice: 3120, pnl: 4131 },
    { symbol: 'SOL', side: 'short', size: 100, entryPrice: 125, currentPrice: 118, pnl: 700 },
    { symbol: 'ARB', side: 'long', size: 5000, entryPrice: 1.2, currentPrice: 1.35, pnl: 750 },
    { symbol: 'MATIC', side: 'short', size: 8000, entryPrice: 0.85, currentPrice: 0.78, pnl: 560 },
    { symbol: 'AVAX', side: 'long', size: 200, entryPrice: 35, currentPrice: 38.5, pnl: 700 },
    { symbol: 'LINK', side: 'long', size: 500, entryPrice: 14.5, currentPrice: 16.2, pnl: 850 },
    { symbol: 'UNI', side: 'short', size: 1000, entryPrice: 6.8, currentPrice: 6.2, pnl: 600 },
  ];

  // Filter by side
  const filteredPositions = side === 'all' 
    ? mockPositions 
    : mockPositions.filter(p => p.side === side);

  // Paginate
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedPositions = filteredPositions.slice(start, end);

  return NextResponse.json({
    address,
    tags: ['Smart Money', 'High Win Rate', 'Trend Follower'],
    pnl7d: 12450.30,
    pnl30d: 45678.90,
    positions: paginatedPositions,
    totalPositions: filteredPositions.length,
    pageSize,
    page
  });
}
