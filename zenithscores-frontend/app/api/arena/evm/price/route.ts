import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/arena/evm/price
 *
 * DISABLED - Arena is now Solana-only
 * Use Jupiter for Solana token prices.
 */
export async function POST() {
  return NextResponse.json(
    { price: null, error: 'EVM pricing disabled. Arena is Solana-only.' },
    { status: 410 }
  );
}

export async function GET() {
  return NextResponse.json(
    { price: null, error: 'EVM pricing disabled. Arena is Solana-only.' },
    { status: 410 }
  );
}

