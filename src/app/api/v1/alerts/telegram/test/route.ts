import { NextResponse } from 'next/server';

export async function POST() {
  // Mock sending test message
  return NextResponse.json({ success: true, message: 'Test message sent' });
}
