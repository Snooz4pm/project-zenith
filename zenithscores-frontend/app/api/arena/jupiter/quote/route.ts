import { NextRequest, NextResponse } from 'next/server';
import { getJupiterQuote } from '@/lib/solana/jupiter';

/**
 * Jupiter Quote API
 *
 * Get swap quote with 1% platform fee + 0.1% referral
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const inputMint = searchParams.get('inputMint');
    const outputMint = searchParams.get('outputMint');
    const amount = searchParams.get('amount');
    const slippageBps = searchParams.get('slippageBps');

    if (!inputMint || !outputMint || !amount) {
      return NextResponse.json(
        { error: 'Missing required parameters: inputMint, outputMint, amount' },
        { status: 400 }
      );
    }

    const quote = await getJupiterQuote({
      inputMint,
      outputMint,
      amount,
      slippageBps: slippageBps ? parseInt(slippageBps) : undefined,
    });

    if (!quote) {
      return NextResponse.json(
        { error: 'Failed to get quote from Jupiter' },
        { status: 500 }
      );
    }

    return NextResponse.json({ quote });
  } catch (error: any) {
    console.error('[Jupiter Quote API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get quote' },
      { status: 500 }
    );
  }
}
