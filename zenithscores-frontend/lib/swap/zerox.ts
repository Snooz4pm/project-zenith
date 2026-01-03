/**
 * 0x Protocol Integration (EVM Chains)
 *
 * Handles quote fetching and transaction building for EVM swaps
 */

import { SwapQuoteRequest, SwapQuote, SwapTransaction } from './types';
import { SUPPORTED_CHAINS } from '@/lib/arena/chains';

const AFFILIATE_WALLET = process.env.NEXT_PUBLIC_AFFILIATE_WALLET || '0x0000000000000000000000000000000000000000';
const AFFILIATE_FEE_BPS = 40; // 0.4%

/**
 * Get 0x API URL for chain
 */
function getZeroXApiUrl(chainId: number): string {
  const chain = SUPPORTED_CHAINS[chainId];
  if (!chain) {
    throw new Error(`Unsupported chain: ${chainId}`);
  }
  return chain.zeroExApiUrl;
}

/**
 * Detect chain ID from token address
 * In production, this should be passed explicitly
 */
function detectChainId(tokenAddress: string): number {
  // Simple heuristic: most EVM chains use 0x addresses
  // In production, chain should be explicit in request
  // For now, default to Base (8453) for arena tokens
  return 8453;
}

export async function getZeroXQuote(request: SwapQuoteRequest): Promise<SwapQuote> {
  const { sellToken, buyToken, amount, userAddress, slippageBps = 50 } = request;

  // Detect chain (in production, this should be explicit)
  const chainId = detectChainId(sellToken);
  const apiUrl = getZeroXApiUrl(chainId);

  console.log('[0x] Getting quote:', { chainId, sellToken, buyToken, amount });

  try {
    const params = new URLSearchParams({
      sellToken,
      buyToken,
      sellAmount: amount,
      taker: userAddress,
      slippagePercentage: (slippageBps / 100 / 100).toString(), // Convert bps to decimal
      affiliateAddress: AFFILIATE_WALLET,
      buyTokenPercentageFee: (AFFILIATE_FEE_BPS / 10000).toString(),
    });

    const response = await fetch(`${apiUrl}/swap/v1/quote?${params}`, {
      headers: {
        'Accept': 'application/json',
        '0x-api-key': process.env.ZEROX_API_KEY || '',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`0x API error: ${response.status} - ${error}`);
    }

    const quote = await response.json();

    console.log('[0x] Quote received:', quote);

    // Calculate fee amount
    const feeAmount = (BigInt(quote.buyAmount) * BigInt(AFFILIATE_FEE_BPS)) / BigInt(10000);

    return {
      chainType: 'EVM',
      sellToken,
      buyToken,
      sellAmount: quote.sellAmount,
      buyAmount: quote.buyAmount,
      buyAmountMin: quote.guaranteedPrice ?
        (BigInt(quote.buyAmount) * BigInt(10000 - slippageBps) / BigInt(10000)).toString() :
        quote.buyAmount,
      priceImpact: quote.estimatedPriceImpact ? parseFloat(quote.estimatedPriceImpact) : 0,
      route: quote.orders?.map((o: any) => o.fillData?.tokenAddressPath || []).flat() || [sellToken, buyToken],
      estimatedGas: quote.estimatedGas || '200000',
      fee: {
        amount: feeAmount.toString(),
        token: buyToken,
        percentage: AFFILIATE_FEE_BPS / 100,
      },
    };
  } catch (error: any) {
    console.error('[0x] Quote error:', error);
    throw new Error(`Failed to get 0x quote: ${error.message}`);
  }
}

export async function buildZeroXTx(params: {
  quote: SwapQuote;
  userAddress: string;
}): Promise<SwapTransaction> {
  const { quote, userAddress } = params;

  // Detect chain
  const chainId = detectChainId(quote.sellToken);
  const apiUrl = getZeroXApiUrl(chainId);

  console.log('[0x] Building transaction for:', userAddress);

  try {
    const queryParams = new URLSearchParams({
      sellToken: quote.sellToken,
      buyToken: quote.buyToken,
      sellAmount: quote.sellAmount,
      taker: userAddress,
      slippagePercentage: '0.5', // 0.5%
      affiliateAddress: AFFILIATE_WALLET,
      buyTokenPercentageFee: (AFFILIATE_FEE_BPS / 10000).toString(),
    });

    const response = await fetch(`${apiUrl}/swap/v1/quote?${queryParams}`, {
      headers: {
        'Accept': 'application/json',
        '0x-api-key': process.env.ZEROX_API_KEY || '',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`0x API error: ${response.status} - ${error}`);
    }

    const txData = await response.json();

    console.log('[0x] Transaction built successfully');

    return {
      chainType: 'EVM',
      data: txData.data,
      to: txData.to,
      value: txData.value,
      from: userAddress,
    };
  } catch (error: any) {
    console.error('[0x] Transaction build error:', error);
    throw new Error(`Failed to build 0x transaction: ${error.message}`);
  }
}
