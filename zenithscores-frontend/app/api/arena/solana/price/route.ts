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

    const url =
      `https://quote-api.jup.ag/v6/quote` +
      `?inputMint=${inputMint}` +
      `&outputMint=${outputMint}` +
      `&amount=${amount}` +
      `&onlyDirectRoutes=false` +
      `&slippageBps=50`;

    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      console.error("[Solana Price] Jupiter API error:", res.status);
      return NextResponse.json({ price: null });
    }

    const data = await res.json();

    // Calculate price from inAmount/outAmount
    if (data.inAmount && data.outAmount) {
      const price = Number(data.outAmount) / Number(data.inAmount);
      return NextResponse.json({ price });
    }

    return NextResponse.json({ price: null });
  } catch (err) {
    console.error("[Solana Price] Fatal error:", err);
    return NextResponse.json({ price: null });
  }
}
