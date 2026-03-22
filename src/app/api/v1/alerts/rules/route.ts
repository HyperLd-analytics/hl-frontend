import { NextRequest, NextResponse } from 'next/server';

// Mock alert rules storage
let mockRules = [
  {
    id: '1',
    name: 'BTC 价格波动',
    condition: '5m 波动 > 3%',
    enabled: true,
    createdAt: '2024-03-20T10:00:00Z'
  },
  {
    id: '2',
    name: 'ETH 大额清算',
    condition: '单笔清算 > $100k',
    enabled: true,
    createdAt: '2024-03-20T11:00:00Z'
  },
  {
    id: '3',
    name: 'Smart Money 异动',
    condition: '持仓变化 > 20%',
    enabled: false,
    createdAt: '2024-03-20T12:00:00Z'
  }
];

export async function GET() {
  return NextResponse.json({
    rules: mockRules
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const newRule = {
    id: String(Date.now()),
    name: body.name,
    condition: body.condition,
    enabled: true,
    createdAt: new Date().toISOString()
  };
  mockRules.push(newRule);
  return NextResponse.json(newRule);
}
