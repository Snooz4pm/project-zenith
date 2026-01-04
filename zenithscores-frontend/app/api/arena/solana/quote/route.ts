import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Well-known Solana token mints
 */
const KNOWN_MINTS: Record<string, string> = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
};

/**
 * GET /api/arena/solana/quote
 *
 * Jupiter v6 Quote Proxy (SERVER-SIDE ONLY)
 * Hardened version with explicit proxy handling
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const inputMint = searchParams.get('inputMint');
    const outputMint = searchParams.get('outputMint');
    const amount = searchParams.get('amount');
    const slippageBps = searchParams.get('slippageBps') ?? '50';

    if (!inputMint || !outputMint || !amount) {
      return Response.json(
        { error: 'Missing params' },
        { status: 400 }
      );
    }

    const PROXY = process.env.JUPITER_PROXY_URL;
    if (!PROXY) {
      return Response.json(
        { error: 'Proxy not configured' },
        { status: 500 }
      );
    }

    const url = new URL(`${PROXY}/quote`);
    url.searchParams.set('inputMint', inputMint);
    url.searchParams.set('outputMint', outputMint);
    url.searchParams.set('amount', amount);
    url.searchParams.set('slippageBps', slippageBps ?? '50');
    url.searchParams.set('swapMode', 'ExactIn');

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('[Solana Quote] Proxy error:', text);
      return Response.json(
        { error: 'Jupiter proxy failed', detail: text },
        { status: 500 }
      );
    }

    const data = await res.json();
    return Response.json(data);

  } catch (err) {
    console.error('[Solana Quote] Fatal:', err);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/arena/solana/quote
 *
 * Alternative POST handler for SwapDrawer compatibility
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { inputMint, outputMint, amount } = body;

    if (!inputMint || !outputMint || !amount) {
      return NextResponse.json({
        executable: false,
        error: 'Missing required fields: inputMint, outputMint, amount'
      }, { status: 400 });
    }

    // Use Railway proxy in production, direct Jupiter API in local dev
    const JUPITER_API = process.env.JUPITER_PROXY_URL || 'https://quote-api.jup.ag/v6';

    // Build Jupiter URL with swapMode
    const url =
      `${JUPITER_API}/quote` +
      `?inputMint=${inputMint}` +
      `&outputMint=${outputMint}` +
      `&amount=${amount}` +
      `&slippageBps=50` +
      `&swapMode=ExactIn`;

    console.log('[Solana Quote POST] Calling Jupiter:', url);

    const res = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      console.error('[Solana Quote POST] Jupiter HTTP error:', res.status);
      return NextResponse.json({
        executable: false,
        error: 'Jupiter API error',
        status: 'HTTP_ERROR'
      });
    }

    const json = await res.json();

    // DEBUG LOG (User requirement)
    console.log('[JUPITER RAW]', {
      hasData: !!json,
      hasInAmount: !!json.inAmount,
      hasOutAmount: !!json.outAmount,
      error: json.error,
      routePlan: json.routePlan ? 'exists' : 'missing',
    });

    // Check if we have a valid route
    const hasRoute = json.inAmount && json.outAmount && json.routePlan;

    if (!hasRoute) {
      console.log('[Solana Quote POST] NO_ROUTE - valid state');
      return NextResponse.json({
        executable: false,
        quote: null,
        status: 'NO_ROUTE',
        reason: 'No routes available. Try a larger amount or different token pair.'
      });
    }

    console.log('[Solana Quote POST] SUCCESS - route found');
    return NextResponse.json({
      executable: true,
      quote: json,
      inAmount: json.inAmount,
      outAmount: json.outAmount,
      priceImpactPct: json.priceImpactPct,
      status: 'OK'
    });

  } catch (err: any) {
    console.error('[Solana Quote POST] Fatal error:', err);
    return NextResponse.json({
      executable: false,
      error: err.message || 'Internal server error',
      status: 'ERROR'
    }, { status: 500 });
  }
}
