import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/arena/solana/price
 *
 * Get normalized token price from Jupiter
 * Uses 1 SOL as baseline
 *
 * Body:
 *   - inputMint: Token to sell (e.g., SOL address)
 *   - outputMint: Token to buy (token mint address)
 *
 * Returns:
 *   - price: Normalized price
 */
export async function POST(req: Request) {
  try {
    const { inputMint, outputMint } = await req.json();

    if (!inputMint || !outputMint) {
      return NextResponse.json({ price: null });
    }

    // 1 SOL = 1,000,000,000 lamports
    const amount = "1000000000";

    // Use Railway proxy in production, direct Jupiter API in local dev
    const JUPITER_API = process.env.JUPITER_PROXY_URL || 'https://quote-api.jup.ag/v6';

    const url =
      `${JUPITER_API}/quote` +
      `?inputMint=${inputMint}` +
      `&outputMint=${outputMint}` +
      `&amount=${amount}` +
      `&onlyDirectRoutes=false` +
      `&slippageBps=50` +
      `&swapMode=ExactIn`; // CRITICAL: Jupiter v6 needs this

    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      console.error("[Solana Price] Jupiter API HTTP error:", res.status);
      return NextResponse.json({ price: null, status: 'HTTP_ERROR' });
    }

    const json = await res.json();

    // DEBUG LOG (User requirement)
    console.log('[JUPITER RAW]', {
      hasData: !!json,
      hasInAmount: !!json.inAmount,
      hasOutAmount: !!json.outAmount,
      error: json.error,
    });

    // Jupiter v6 returns quote object directly (not data array)
    if (json.inAmount && json.outAmount) {
      const price = Number(json.outAmount) / Number(json.inAmount);
      return NextResponse.json({ price, status: 'OK' });
    }

    // No route found - this is VALID, not an error
    console.log('[Solana Price] No route available (valid state)');
    return NextResponse.json({ price: null, status: 'NO_ROUTE' });
  } catch (err) {
    console.error("[Solana Price] Fatal error:", err);
    return NextResponse.json({ price: null });
  }
}
