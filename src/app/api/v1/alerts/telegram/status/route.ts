import { NextResponse } from 'next/server';

// Mock Telegram binding status
let mockTelegramStatus = {
  bound: false,
  username: undefined,
  chatId: undefined,
  verificationCode: 'HL-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
  botUsername: 'HyperliquidLensBot'
};

export async function GET() {
  return NextResponse.json(mockTelegramStatus);
}
