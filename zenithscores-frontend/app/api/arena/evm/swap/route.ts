import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/arena/evm/swap
 *
 * Execute an EVM swap using 0x
 *
 * Body:
 *   - quote: 0x quote from /route endpoint
 *   - userAddress: User's EVM wallet address
 *
 * Returns:
 *   - transaction: Ready-to-sign transaction object
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { quote, userAddress } = body;

    if (!quote || !userAddress) {
      return NextResponse.json(
        { error: 'Missing quote or userAddress' },
        { status: 400 }
      );
    }

    console.log('[0x Swap] Building transaction for:', userAddress);

    // 0x quote already contains the transaction data
    // We just need to add the user's address as 'from'
    const transaction = {
      to: quote.to,
      data: quote.data,
      value: quote.value || '0',
      gas: quote.gas,
      gasPrice: quote.gasPrice,
      from: userAddress
    };

    console.log('[0x Swap] Transaction built successfully');

    return NextResponse.json({
      transaction,
      buyAmount: quote.buyAmount,
      sellAmount: quote.sellAmount,
      price: quote.price
    });

  } catch (err) {
    console.error('[0x Swap] Fatal error:', err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
