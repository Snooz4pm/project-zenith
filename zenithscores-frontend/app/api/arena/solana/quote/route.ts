import { NextRequest } from 'next/server';

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

    // Build Jupiter URL
    const jupiterParams = new URLSearchParams({
      inputMint,
      outputMint,
      amount,
      slippageBps,
    });

    const fullUrl = `https://quote-api.jup.ag/v6/quote?${jupiterParams.toString()}`;
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
      console.error('[Solana Quote] Jupiter error response:', text);
      return Response.json(
        { error: 'Jupiter quote failed', details: text, status: res.status },
        { status: res.status }
      );
    }

    // Parse and return
    try {
      const data = JSON.parse(text);
      console.log('[Solana Quote] Success - route found');
      return Response.json(data);
    } catch (e) {
      console.error('[Solana Quote] Failed to parse Jupiter response:', text);
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
