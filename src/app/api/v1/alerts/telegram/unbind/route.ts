import { NextResponse } from 'next/server';

export async function DELETE() {
  // Mock unbinding Telegram account
  return NextResponse.json({ success: true });
}
