import { NextResponse } from 'next/server';

/**
 * DEPRECATED - DexScreener Flow API
 * 
 * This route is disabled. Use /api/solana/flow instead.
 * Arena, Flow, Signals, Terminal are now Solana-only.
 */
export async function GET() {
  return NextResponse.json(
    {
      error: 'DexScreener flow disabled',
      message: 'Use /api/solana/flow for Solana tokens',
      hotNow: [],
      memeFlow: [],
      tradeSetups: [],
    },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: 'DexScreener flow disabled. Use /api/solana/flow' },
    { status: 410 }
  );
}
