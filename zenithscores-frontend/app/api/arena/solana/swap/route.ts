import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/arena/solana/swap
 *
 * Forward swap request to Railway Jupiter proxy
 * Body: { quoteResponse, userPublicKey, wrapAndUnwrapSol? }
 * Returns: { swapTransaction, lastValidBlockHeight }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const PROXY = process.env.JUPITER_PROXY_URL;
    if (!PROXY) {
      return NextResponse.json(
        { error: 'Proxy not configured' },
        { status: 500 }
      );
    }

    console.log('[Solana Swap] Forwarding to proxy:', PROXY);

    // Forward directly to Railway proxy - no modification
    const res = await fetch(`${PROXY}/swap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('[Solana Swap] Proxy error:', data);
      return NextResponse.json(data, { status: res.status });
    }

    console.log('[Solana Swap] Success - swapTransaction received');
    return NextResponse.json(data);

  } catch (err) {
    console.error('[Solana Swap] Fatal error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
