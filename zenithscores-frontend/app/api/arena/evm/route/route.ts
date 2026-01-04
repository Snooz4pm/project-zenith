import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHAIN_ID_MAP: Record<string, number> = {
  ethereum: 1,
  polygon: 137,
  bsc: 56,
  arbitrum: 42161,
  base: 8453
};

/**
 * POST /api/arena/evm/route
 *
 * Generic EVM route checker using 0x API
 * Checks if ANY EVM token pair is swappable
 *
 * Body:
 *   - chain: Chain name (ethereum, arbitrum, base, polygon, bsc)
 *   - sellToken: From token address
 *   - buyToken: To token address
 *   - sellAmount: Amount in smallest units (wei)
 *
 * Returns:
 *   - executable: boolean (can 0x route this?)
 *   - quote: 0x quote object (if executable)
 */
export async function POST(req: Request) {
  try {
    const { chain, sellToken, buyToken, sellAmount } = await req.json();

    // Validate inputs
    if (!chain || !sellToken || !buyToken || !sellAmount) {
      return NextResponse.json({
        executable: false,
        error: 'Missing required fields'
      });
    }

    const chainId = CHAIN_ID_MAP[chain];
    if (!chainId) {
      return NextResponse.json({
        executable: false,
        error: 'Unsupported chain'
      });
    }

    // Ask 0x: "Can you route this swap?"
    const url =
      `https://api.0x.org/swap/v1/quote` +
      `?chainId=${chainId}` +
      `&sellToken=${sellToken}` +
      `&buyToken=${buyToken}` +
      `&sellAmount=${sellAmount}` +
      `&slippagePercentage=0.01`; // 1% slippage

    console.log('[0x Route] Checking route:', { chain, sellToken, buyToken, sellAmount });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    // Add API key if available
    if (process.env.ZEROX_API_KEY) {
      headers['0x-api-key'] = process.env.ZEROX_API_KEY;
    }

    const res = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(10000)
    });

    if (!res.ok) {
      console.error('[0x Route] HTTP error:', res.status);
      return NextResponse.json({
        executable: false,
        error: '0x API error'
      });
    }

    const data = await res.json();

    // 0x returns quote with 'to' field if swap is possible
    const hasRoute = Boolean(data?.to);

    console.log('[0x Route] Route found:', hasRoute);

    return NextResponse.json({
      executable: hasRoute,
      quote: hasRoute ? data : null,
      buyAmount: data?.buyAmount,
      sellAmount: data?.sellAmount,
      price: data?.price
    });

  } catch (err) {
    console.error('[0x Route] Fatal error:', err);
    return NextResponse.json({
      executable: false,
      error: String(err)
    });
  }
}
