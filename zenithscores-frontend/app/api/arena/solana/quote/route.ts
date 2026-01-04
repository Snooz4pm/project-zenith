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
 * Prevents CORS issues and provides validation
 */
export async function GET(req: NextRequest) {
  console.log('[Solana Quote] Request received');

  try {
    const { searchParams } = new URL(req.url);

    let inputMint = searchParams.get('inputMint');
    let outputMint = searchParams.get('outputMint');
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

    // Resolve symbol to mint if needed
    if (KNOWN_MINTS[inputMint.toUpperCase()]) {
      inputMint = KNOWN_MINTS[inputMint.toUpperCase()];
    }
    if (KNOWN_MINTS[outputMint.toUpperCase()]) {
      outputMint = KNOWN_MINTS[outputMint.toUpperCase()];
    }

    // Validate amount is integer (lamports)
    if (!/^\d+$/.test(amount)) {
      console.error('[Solana Quote] Invalid amount format:', amount);
      return Response.json(
        { error: 'amount must be a stringified integer (lamports)' },
        { status: 400 }
      );
    }

    // Validate mints are base58 addresses
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    if (!base58Regex.test(inputMint) || !base58Regex.test(outputMint)) {
      console.error('[Solana Quote] Invalid mint addresses:', { inputMint, outputMint });
      return Response.json(
        { error: 'Invalid Solana mint addresses' },
        { status: 400 }
      );
    }

    // Get Jupiter API URL from environment (CRITICAL for Vercel deployment)
    const JUPITER_API = process.env.JUPITER_QUOTE_API || 'https://quote-api.jup.ag/v6';

    if (!JUPITER_API) {
      console.error('[Solana Quote] JUPITER_QUOTE_API not configured');
      return Response.json(
        { error: 'Jupiter API not configured' },
        { status: 500 }
      );
    }

    // Build Jupiter URL with CRITICAL swapMode parameter
    const jupiterParams = new URLSearchParams({
      inputMint,
      outputMint,
      amount,
      slippageBps,
      swapMode: 'ExactIn', // CRITICAL: Jupiter v6 needs this
    });

    const fullUrl = `${JUPITER_API}/quote?${jupiterParams.toString()}`;
    console.log('[Solana Quote] Calling Jupiter:', fullUrl);

    const res = await fetch(fullUrl, {
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(15000), // 15s timeout
    });

    console.log('[Solana Quote] Jupiter response status:', res.status);

    // Log raw response
    const text = await res.text();

    if (!res.ok) {
      console.error('[Solana Quote] Jupiter HTTP error:', {
        status: res.status,
        response: text.substring(0, 500)
      });
      return Response.json(
        { error: 'Jupiter quote failed', details: text, status: res.status },
        { status: res.status }
      );
    }

    // Parse and validate
    try {
      const json = JSON.parse(text);

      // DEBUG LOG (User requirement - exact format)
      console.log('[JUPITER RAW]', {
        hasData: !!json,
        hasInAmount: !!json.inAmount,
        hasOutAmount: !!json.outAmount,
        error: json.error,
        routePlan: json.routePlan ? 'exists' : 'missing',
      });

      // Check if we have a valid quote
      if (json.inAmount && json.outAmount && json.routePlan) {
        console.log('[Solana Quote] SUCCESS - route found');
        return Response.json(json);
      }

      // NO ROUTE FOUND - This is VALID, not an error
      console.log('[Solana Quote] NO_ROUTE - valid state (amount too small or illiquid pair)');
      return Response.json({
        status: 'NO_ROUTE',
        reason: 'No routes available. Try a larger amount or different token pair.',
      });

    } catch (e) {
      console.error('[Solana Quote] Failed to parse Jupiter response:', text.substring(0, 500));
      return Response.json(
        { error: 'Invalid JSON response from Jupiter' },
        { status: 500 }
      );
    }

  } catch (e: any) {
    console.error('[Solana Quote] Error:', e);
    return Response.json(
      { error: 'Internal server error', message: e.message },
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

    // Get Jupiter API URL
    const JUPITER_API = process.env.JUPITER_QUOTE_API || 'https://quote-api.jup.ag/v6';

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
