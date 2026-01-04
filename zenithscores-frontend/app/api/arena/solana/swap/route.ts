import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/arena/solana/swap
 *
 * Execute a Solana swap using Jupiter
 *
 * Body:
 *   - quote: Jupiter quote from /quote endpoint
 *   - userPublicKey: User's Solana wallet address
 *
 * Returns:
 *   - swapTransaction: Base64 serialized transaction
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { quote, userPublicKey } = body;

    if (!quote || !userPublicKey) {
      return NextResponse.json(
        { error: 'Missing quote or userPublicKey' },
        { status: 400 }
      );
    }

    console.log('[Jupiter Swap] Building transaction for:', userPublicKey);

    // Use env-based Jupiter URL (v6 is the stable production endpoint)
    const JUPITER_API = process.env.JUPITER_QUOTE_API || 'https://quote-api.jup.ag/v6';

    // Ask Jupiter to build the swap transaction
    const res = await fetch(`${JUPITER_API}/swap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quoteResponse: quote,
        userPublicKey,
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: "auto"
      })
    });

    if (!res.ok) {
      console.error('[Jupiter Swap] HTTP error:', res.status);
      return NextResponse.json(
        { error: 'Failed to build swap transaction' },
        { status: res.status }
      );
    }

    const data = await res.json();

    console.log('[Jupiter Swap] Transaction built successfully');

    return NextResponse.json({
      swapTransaction: data.swapTransaction,
      lastValidBlockHeight: data.lastValidBlockHeight
    });

  } catch (err) {
    console.error('[Jupiter Swap] Fatal error:', err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
