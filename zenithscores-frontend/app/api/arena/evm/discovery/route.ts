import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/arena/evm/discovery
 * 
 * DISABLED - Arena is now Solana-only
 * Use /api/solana/trending or /api/arena/solana/tokens for Solana tokens.
 */
export async function GET() {
  return NextResponse.json(
    { tokens: [], error: 'EVM discovery disabled. Arena is Solana-only. Use /api/solana/trending' },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    { tokens: [], error: 'EVM discovery disabled. Arena is Solana-only.' },
    { status: 410 }
  );
}

