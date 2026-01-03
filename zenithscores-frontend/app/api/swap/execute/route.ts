import { NextResponse } from 'next/server';
import { buildJupiterTx } from '@/lib/swap/jupiter';
import { buildZeroXTx } from '@/lib/swap/zerox';

/**
 * Unified Swap Execute API
 *
 * Builds transaction payload for user to sign
 * NO SIGNING, NO CUSTODY - returns transaction data only
 *
 * Body (Solana):
 * {
 *   chainType: "SOLANA",
 *   quoteResponse: object,
 *   userPublicKey: string
 * }
 *
 * Body (EVM):
 * {
 *   chainType: "EVM",
 *   quote: SwapQuote,
 *   userAddress: string
 * }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log('[Swap Execute API] Request:', body.chainType);

    if (body.chainType === 'SOLANA') {
      if (!body.quoteResponse || !body.userPublicKey) {
        return NextResponse.json(
          { error: 'Missing required fields: quoteResponse, userPublicKey' },
          { status: 400 }
        );
      }

      const tx = await buildJupiterTx({
        quoteResponse: body.quoteResponse,
        userPublicKey: body.userPublicKey,
      });

      console.log('[Swap Execute API] Solana transaction built');
      return NextResponse.json(tx);
    }

    if (body.chainType === 'EVM') {
      if (!body.quote || !body.userAddress) {
        return NextResponse.json(
          { error: 'Missing required fields: quote, userAddress' },
          { status: 400 }
        );
      }

      const tx = await buildZeroXTx({
        quote: body.quote,
        userAddress: body.userAddress,
      });

      console.log('[Swap Execute API] EVM transaction built');
      return NextResponse.json(tx);
    }

    return NextResponse.json(
      { error: `Unsupported chain type: ${body.chainType}` },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[Swap Execute API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to build swap transaction' },
      { status: 500 }
    );
  }
}
