import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '10');

  // Mock data
  const mockWallets = [
    {
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      roi: 245.8,
      winRate: 68.5,
      totalTrades: 342,
      pnl: 125430.50,
      avgHoldTime: '4.2h',
      lastActive: '2024-03-23T10:30:00Z'
    },
    {
      address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
      roi: 198.3,
      winRate: 72.1,
      totalTrades: 289,
      pnl: 98765.20,
      avgHoldTime: '6.8h',
      lastActive: '2024-03-23T09:15:00Z'
    },
    {
      address: '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t',
      roi: 187.5,
      winRate: 65.3,
      totalTrades: 412,
      pnl: 87654.30,
      avgHoldTime: '3.5h',
      lastActive: '2024-03-23T11:45:00Z'
    },
    {
      address: '0x9876543210abcdef9876543210abcdef98765432',
      roi: 156.2,
      winRate: 61.8,
      totalTrades: 523,
      pnl: 76543.10,
      avgHoldTime: '5.1h',
      lastActive: '2024-03-23T08:20:00Z'
    },
    {
      address: '0xabcdef1234567890abcdef1234567890abcdef12',
      roi: 142.7,
      winRate: 58.9,
      totalTrades: 378,
      pnl: 65432.90,
      avgHoldTime: '7.3h',
      lastActive: '2024-03-22T23:50:00Z'
    }
  ];

  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedData = mockWallets.slice(start, end);

  return NextResponse.json({
    items: paginatedData.map(w => ({
      address: w.address,
      roi: w.roi,
      winRate: w.winRate,
      trades: w.totalTrades
    })),
    total: mockWallets.length,
    pageSize: pageSize,
    page: page
  });
}

