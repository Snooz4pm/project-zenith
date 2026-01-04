import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const inputMintParam = searchParams.get('inputMint');
    const outputMintParam = searchParams.get('outputMint');
    const amountParam = searchParams.get('amount');
    const slippageBpsParam = searchParams.get('slippageBps') ?? '50';

    if (!inputMintParam || !outputMintParam || !amountParam) {
      return Response.json(
        { error: 'Missing parameters' },
        { status: 400 }
      );
    }

    // TypeScript now knows these are strings
    const inputMint: string = inputMintParam;
    const outputMint: string = outputMintParam;
    const amount: string = amountParam;
    const slippageBps: string = slippageBpsParam;

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
    url.searchParams.set('slippageBps', slippageBps);
    url.searchParams.set('swapMode', 'ExactIn');

    console.log('[Solana Quote] Proxy URL:', url.toString());

    const res = await fetch(url.toString(), { cache: 'no-store' });
    const text = await res.text();

    if (!res.ok) {
      console.error('[Solana Quote] Proxy error:', text);
      return Response.json(
        { error: 'Jupiter proxy error', detail: text },
        { status: 502 }
      );
    }

    return new Response(text, {
      headers: { 'content-type': 'application/json' },
    });

  } catch (err) {
    console.error('[Solana Quote] Fatal error:', err);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
