import { NextRequest, NextResponse } from 'next/server';
import { getSwapQuote, validateSwapParams } from '@/lib/arena/swap';

/**
 * GET /api/arena/swap/quote
 *
 * Returns a 0x swap quote with affiliate fee included
 *
 * Query params:
 * - chainId: number
 * - sellToken: string (address)
 * - buyToken: string (address)
 * - sellAmount: string (wei)
 * - takerAddress: string (wallet)
 * - slippageBps?: number (default 100 = 1%)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const chainId = parseInt(searchParams.get('chainId') || '1');
    const sellToken = searchParams.get('sellToken');
    const buyToken = searchParams.get('buyToken');
    const sellAmount = searchParams.get('sellAmount');
    const takerAddress = searchParams.get('takerAddress');
    const slippageBps = parseInt(searchParams.get('slippageBps') || '100');

    if (!sellToken || !buyToken || !sellAmount || !takerAddress) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const params = {
      chainId,
      sellToken,
      buyToken,
      sellAmount,
      takerAddress,
      slippageBps,
    };

    // Validate params
    const validation = validateSwapParams(params);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Get quote from 0x
    const quote = await getSwapQuote(params);

    if (!quote) {
      return NextResponse.json(
        { error: 'Failed to get swap quote' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      quote,
      chainId,
    });
  } catch (error: any) {
    console.error('[Swap Quote API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
