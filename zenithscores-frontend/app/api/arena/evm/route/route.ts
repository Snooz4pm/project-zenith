import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * EVM Route Check - DISABLED
 * Arena is now Solana-only. Use Jupiter API instead.
 */

export async function POST() {
  return NextResponse.json(
    { executable: false, error: 'EVM trading disabled. Arena is Solana-only.' },
    { status: 410 }
  );
}

export async function GET() {
  return NextResponse.json(
    { executable: false, error: 'EVM trading disabled. Arena is Solana-only.' },
    { status: 410 }
  );
}
