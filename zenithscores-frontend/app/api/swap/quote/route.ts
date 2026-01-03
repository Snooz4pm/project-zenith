import { NextResponse } from 'next/server';
import { getJupiterQuote } from '@/lib/swap/jupiter';
import { getZeroXQuote } from '@/lib/swap/zerox';
import { SwapQuoteRequest } from '@/lib/swap/types';

/**
 * Unified Swap Quote API
 *
 * Auto-routes to Jupiter (Solana) or 0x (EVM) based on chainType
 *
 * Body:
 * {
 *   chainType: "SOLANA" | "EVM",
 *   sellToken: string,
 *   buyToken: string,
 *   amount: string,
 *   userAddress: string,
 *   slippageBps?: number
 * }
 */
export async function POST(req: Request) {
  try {
    const body: SwapQuoteRequest = await req.json();

    console.log('[Swap Quote API] Request:', body);

    // Validate request
    if (!body.chainType || !body.sellToken || !body.buyToken || !body.amount || !body.userAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: chainType, sellToken, buyToken, amount, userAddress' },
        { status: 400 }
      );
    }

    // Route to correct provider
    if (body.chainType === 'SOLANA') {
      const quote = await getJupiterQuote(body);
      console.log('[Swap Quote API] Jupiter quote:', quote);
      return NextResponse.json(quote);
    }

    if (body.chainType === 'EVM') {
      const quote = await getZeroXQuote(body);
      console.log('[Swap Quote API] 0x quote:', quote);
      return NextResponse.json(quote);
    }

    return NextResponse.json(
      { error: `Unsupported chain type: ${body.chainType}` },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[Swap Quote API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get swap quote' },
      { status: 500 }
    );
  }
}
