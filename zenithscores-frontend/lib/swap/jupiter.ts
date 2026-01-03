/**
 * Jupiter Swap Integration (Solana)
 *
 * Handles quote fetching and transaction building for Solana swaps
 */

import { SwapQuoteRequest, SwapQuote, SwapTransaction } from './types';

const JUPITER_API_URL = 'https://quote-api.jup.ag/v6';
const JUPITER_API_KEY = process.env.JUPITER_API_KEY || '9734e999-cc55-46e5-ba68-f7def92483aa';
const PLATFORM_FEE_BPS = 100; // 1%
const SOLANA_FEE_WALLET = process.env.NEXT_PUBLIC_SOLANA_FEE_WALLET;

export async function getJupiterQuote(request: SwapQuoteRequest): Promise<SwapQuote> {
  const { sellToken, buyToken, amount, slippageBps = 50 } = request;

  console.log('[Jupiter] Getting quote:', { sellToken, buyToken, amount });

  try {
    const params = new URLSearchParams({
      inputMint: sellToken,
      outputMint: buyToken,
      amount: amount,
      slippageBps: slippageBps.toString(),
      ...(SOLANA_FEE_WALLET && {
        platformFeeBps: PLATFORM_FEE_BPS.toString(),
        feeAccount: SOLANA_FEE_WALLET,
      }),
    });

    const response = await fetch(`${JUPITER_API_URL}/quote?${params}`, {
      headers: {
        'Accept': 'application/json',
        ...(JUPITER_API_KEY && { 'X-API-Key': JUPITER_API_KEY }),
      },
    });

    if (!response.ok) {
      throw new Error(`Jupiter API error: ${response.status}`);
    }

    const quote = await response.json();

    console.log('[Jupiter] Quote received:', quote);

    // Calculate fee amount
    const feeAmount = SOLANA_FEE_WALLET
      ? (BigInt(quote.outAmount) * BigInt(PLATFORM_FEE_BPS)) / BigInt(10000)
      : BigInt(0);

    return {
      chainType: 'SOLANA',
      sellToken,
      buyToken,
      sellAmount: quote.inAmount,
      buyAmount: quote.outAmount,
      buyAmountMin: quote.otherAmountThreshold,
      priceImpact: quote.priceImpactPct || 0,
      route: quote.routePlan?.map((step: any) => step.swapInfo?.outputMint) || [],
      estimatedGas: '5000', // SOL lamports (hardcoded estimate)
      fee: {
        amount: feeAmount.toString(),
        token: buyToken,
        percentage: PLATFORM_FEE_BPS / 100,
      },
    };
  } catch (error: any) {
    console.error('[Jupiter] Quote error:', error);
    throw new Error(`Failed to get Jupiter quote: ${error.message}`);
  }
}

export async function buildJupiterTx(params: {
  quoteResponse: any;
  userPublicKey: string;
}): Promise<SwapTransaction> {
  const { quoteResponse, userPublicKey } = params;

  console.log('[Jupiter] Building transaction for:', userPublicKey);

  try {
    const response = await fetch(`${JUPITER_API_URL}/swap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(JUPITER_API_KEY && { 'X-API-Key': JUPITER_API_KEY }),
      },
      body: JSON.stringify({
        quoteResponse,
        userPublicKey,
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: 'auto',
      }),
    });

    if (!response.ok) {
      throw new Error(`Jupiter swap API error: ${response.status}`);
    }

    const { swapTransaction } = await response.json();

    console.log('[Jupiter] Transaction built successfully');

    return {
      chainType: 'SOLANA',
      data: swapTransaction, // Base64 serialized transaction
    };
  } catch (error: any) {
    console.error('[Jupiter] Transaction build error:', error);
    throw new Error(`Failed to build Jupiter transaction: ${error.message}`);
  }
}
