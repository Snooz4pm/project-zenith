import { NextResponse } from 'next/server';

/**
 * DISABLED - EVM Swap Quote API
 * 
 * Arena is now Solana-only. Use Jupiter API directly.
 */
export async function GET() {
  return NextResponse.json(
    { error: 'EVM swap disabled. Arena is Solana-only. Use Jupiter.' },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: 'EVM swap disabled. Arena is Solana-only. Use Jupiter.' },
    { status: 410 }
  );
}
