import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/arena/solana/quote
 * 
 * Jupiter v6 Quote Proxy (SERVER-SIDE ONLY)
 * Prevents CORS issues and provides logging
 */
export async function GET(req: NextRequest) {
  console.log('[Solana Quote] Request received');

  try {
    const { searchParams } = new URL(req.url);

    const inputMint = searchParams.get('inputMint');
    const outputMint = searchParams.get('outputMint');
    const amount = searchParams.get('amount');
    const slippageBps = searchParams.get('slippageBps') || '50';

    // Validation
    if (!inputMint || !outputMint || !amount) {
      console.error('[Solana Quote] Missing params:', { inputMint, outputMint, amount });
      return Response.json(
        { error: 'Missing required parameters: inputMint, outputMint, amount' },
        { status: 400 }
      );
    }

    // Build Jupiter URL
    const jupiterUrl = new URLSearchParams({
      inputMint,
      outputMint,
      amount,
      slippageBps,
    });

    const fullUrl = `https://quote-api.jup.ag/v6/quote?${jupiterUrl.toString()}`;
    console.log('[Solana Quote] Calling Jupiter:', fullUrl);

    const res = await fetch(fullUrl, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    console.log('[Solana Quote] Jupiter response status:', res.status);

    if (!res.ok) {
      const text = await res.text();
      console.error('[Solana Quote] Jupiter error:', text);
      return Response.json(
        { error: 'Jupiter quote failed', details: text },
        { status: res.status }
      );
    }

    const data = await res.json();
    console.log('[Solana Quote] Success - route found');

    return Response.json(data);

  } catch (e: any) {
    console.error('[Solana Quote] Error:', e);
    return Response.json(
      { error: 'Internal server error', message: e.message },
      { status: 500 }
    );
  }
}
