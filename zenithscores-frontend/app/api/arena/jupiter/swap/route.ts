import { NextRequest, NextResponse } from 'next/server';
import { getJupiterSwapTransaction } from '@/lib/solana/jupiter';

/**
 * Jupiter Swap Transaction API
 *
 * Returns a transaction ready to be signed and sent
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { quoteResponse, userPublicKey } = body;

    if (!quoteResponse || !userPublicKey) {
      return NextResponse.json(
        { error: 'Missing required parameters: quoteResponse, userPublicKey' },
        { status: 400 }
      );
    }

    const swap = await getJupiterSwapTransaction({
      quoteResponse,
      userPublicKey,
    });

    if (!swap) {
      return NextResponse.json(
        { error: 'Failed to create swap transaction' },
        { status: 500 }
      );
    }

    return NextResponse.json({ swap });
  } catch (error: any) {
    console.error('[Jupiter Swap API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create swap transaction' },
      { status: 500 }
    );
  }
}
