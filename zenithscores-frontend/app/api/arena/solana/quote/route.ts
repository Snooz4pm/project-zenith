import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/arena/solana/quote
 *
 * Generic Jupiter quote checker - works for ANY token pair
 *
 * Body:
 *   - inputMint: From token address
 *   - outputMint: To token address
 *   - amount: Amount in smallest units (lamports)
 *
 * Returns:
 *   - executable: boolean (can Jupiter route this?)
 *   - quote: Jupiter quote object (if executable)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { inputMint, outputMint, amount } = body;

    // Validate inputs
    if (!inputMint || !outputMint || !amount) {
      return NextResponse.json({
        executable: false,
        error: 'Missing required fields'
      });
    }

    // Ask Jupiter: "Can you route this swap?"
    const url =
      `https://quote-api.jup.ag/v6/quote` +
      `?inputMint=${inputMint}` +
      `&outputMint=${outputMint}` +
      `&amount=${amount}` +
      `&onlyDirectRoutes=false` +
      `&slippageBps=50`; // 0.5% slippage

    console.log('[Jupiter Quote] Checking route:', { inputMint, outputMint, amount });

    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(10000)
    });

    if (!res.ok) {
      console.error('[Jupiter Quote] HTTP error:', res.status);
      return NextResponse.json({
        executable: false,
        error: 'Jupiter API error'
      });
    }

    const data = await res.json();

    // Jupiter returns routes if swap is possible
    const hasRoute = Boolean(data?.data?.length || data?.routePlan);
    const quote = data?.data?.[0] || data;

    console.log('[Jupiter Quote] Route found:', hasRoute);

    return NextResponse.json({
      executable: hasRoute,
      quote: hasRoute ? quote : null,
      inAmount: quote?.inAmount,
      outAmount: quote?.outAmount,
      priceImpactPct: quote?.priceImpactPct
    });

  } catch (err) {
    console.error('[Jupiter Quote] Fatal error:', err);
    return NextResponse.json({
      executable: false,
      error: String(err)
    });
  }
}
