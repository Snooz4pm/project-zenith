/**
 * 0x Swap Execution with Affiliate Fees
 *
 * THIS IS THE REVENUE ENGINE.
 * Every swap generates fees automatically.
 *
 * Multi-chain support: Ethereum, Base, Arbitrum, Optimism, Polygon, BSC, Avalanche, Blast, Scroll
 */

import { getChainConfig, AFFILIATE_WALLET, AFFILIATE_FEE_BPS, AFFILIATE_FEE_TOKEN } from './chains';

export interface SwapQuoteRequest {
  chainId: number;
  sellToken: string; // Contract address
  buyToken: string; // Contract address
  sellAmount: string; // In wei/smallest unit
  takerAddress: string; // User's wallet address
  slippageBps?: number; // Default: 100 (1%)
}

export interface SwapQuote {
  // Tokens
  sellTokenAddress: string;
  buyTokenAddress: string;
  sellAmount: string;
  buyAmount: string;
  guaranteedBuyAmount: string; // After slippage

  // Pricing
  price: string; // Exchange rate
  estimatedPriceImpact: string; // Price impact %

  // Transaction data
  to: string; // 0x Exchange Proxy address
  data: string; // Calldata
  value: string; // ETH value for native swaps
  gasPrice: string;
  gas: string;

  // Fees (REVENUE)
  affiliateFee: {
    feeToken: string; // Token address
    feeAmount: string; // Amount in wei
    feeRecipient: string; // Your wallet
  } | null;

  // Metadata
  sources: { name: string; proportion: string }[]; // DEX sources
  allowanceTarget?: string; // For ERC20 approvals
}

/**
 * Get swap quote with affiliate fee from 0x API
 *
 * CRITICAL: This is how you make money.
 * The swapFeeRecipient receives a % of EVERY swap.
 */
export async function getSwapQuote(params: SwapQuoteRequest): Promise<SwapQuote | null> {
  const chain = getChainConfig(params.chainId);

  if (!chain) {
    throw new Error(`Unsupported chain ID: ${params.chainId}`);
  }

  if (!AFFILIATE_WALLET || AFFILIATE_WALLET === '0x0000000000000000000000000000000000000000') {
    console.error('⚠️ AFFILIATE_WALLET not set. You will NOT earn fees!');
  }

  try {
    const queryParams = new URLSearchParams({
      sellToken: params.sellToken,
      buyToken: params.buyToken,
      sellAmount: params.sellAmount,
      takerAddress: params.takerAddress,
      slippageBps: (params.slippageBps || 100).toString(), // Default 1%

      // ============ REVENUE PARAMETERS ============
      // These parameters enable affiliate fee monetization
      swapFeeRecipient: AFFILIATE_WALLET, // YOUR wallet
      swapFeeBps: AFFILIATE_FEE_BPS.toString(), // Fee amount (e.g., 40 = 0.4%)
      swapFeeToken: AFFILIATE_FEE_TOKEN, // Take fee in buyToken
      // ============================================
    });

    const apiUrl = `${chain.zeroExApiUrl}/swap/v1/quote?${queryParams}`;

    console.log(`[0x Swap] Fetching quote from ${chain.name}...`);

    const response = await fetch(apiUrl, {
      headers: {
        '0x-api-key': process.env.ZEROX_API_KEY || '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[0x API Error] ${response.status}:`, errorText);

      // Parse error for better UX
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.code === 100) {
          throw new Error('Validation failed: Check token addresses and amounts');
        } else if (errorData.code === 105) {
          throw new Error('No liquidity available for this token pair');
        } else {
          throw new Error(errorData.reason || 'Failed to get swap quote');
        }
      } catch (e) {
        throw new Error(`0x API error: ${response.status}`);
      }
    }

    const data = await response.json();

    // Extract affiliate fee info (if available)
    const affiliateFee = data.fees?.zeroExFee
      ? {
          feeToken: data.fees.zeroExFee.token,
          feeAmount: data.fees.zeroExFee.amount,
          feeRecipient: AFFILIATE_WALLET,
        }
      : null;

    const quote: SwapQuote = {
      sellTokenAddress: data.sellTokenAddress || params.sellToken,
      buyTokenAddress: data.buyTokenAddress || params.buyToken,
      sellAmount: data.sellAmount || params.sellAmount,
      buyAmount: data.buyAmount,
      guaranteedBuyAmount: data.guaranteedBuyAmount || data.buyAmount,

      price: data.price,
      estimatedPriceImpact: data.estimatedPriceImpact || '0',

      to: data.to,
      data: data.data,
      value: data.value || '0',
      gasPrice: data.gasPrice,
      gas: data.gas || data.estimatedGas || '300000',

      affiliateFee,

      sources: data.sources || [],
      allowanceTarget: data.allowanceTarget,
    };

    // Log revenue info
    if (affiliateFee) {
      console.log(`💰 Affiliate fee will be charged: ${affiliateFee.feeAmount} to ${affiliateFee.feeRecipient}`);
    }

    return quote;
  } catch (error: any) {
    console.error('[0x Swap] Error:', error.message);
    throw error;
  }
}

/**
 * Get price quote (no transaction data)
 * Use this for displaying estimates without committing to a swap
 */
export async function getPriceQuote(params: SwapQuoteRequest): Promise<{
  price: string;
  buyAmount: string;
  estimatedGas: string;
} | null> {
  const chain = getChainConfig(params.chainId);

  if (!chain) {
    throw new Error(`Unsupported chain ID: ${params.chainId}`);
  }

  try {
    const queryParams = new URLSearchParams({
      sellToken: params.sellToken,
      buyToken: params.buyToken,
      sellAmount: params.sellAmount,
      slippageBps: (params.slippageBps || 100).toString(),

      // Include affiliate fee in price estimation
      swapFeeBps: AFFILIATE_FEE_BPS.toString(),
    });

    const apiUrl = `${chain.zeroExApiUrl}/swap/v1/price?${queryParams}`;

    const response = await fetch(apiUrl, {
      headers: {
        '0x-api-key': process.env.ZEROX_API_KEY || '',
      },
    });

    if (!response.ok) {
      console.error('[0x Price] API error:', response.status);
      return null;
    }

    const data = await response.json();

    return {
      price: data.price,
      buyAmount: data.buyAmount,
      estimatedGas: data.estimatedGas || '300000',
    };
  } catch (error) {
    console.error('[0x Price] Error:', error);
    return null;
  }
}

/**
 * Calculate USD value of swap with current prices
 */
export function calculateSwapUSD(
  sellAmount: string,
  sellTokenPriceUSD: number,
  sellTokenDecimals: number
): number {
  const amount = parseFloat(sellAmount) / Math.pow(10, sellTokenDecimals);
  return amount * sellTokenPriceUSD;
}

/**
 * Calculate expected affiliate fee in USD
 */
export function calculateAffiliateFeeUSD(swapAmountUSD: number): number {
  return swapAmountUSD * (AFFILIATE_FEE_BPS / 10000);
}

/**
 * Format swap quote for display
 */
export function formatSwapQuote(quote: SwapQuote, sellTokenDecimals: number, buyTokenDecimals: number) {
  const sellAmount = parseFloat(quote.sellAmount) / Math.pow(10, sellTokenDecimals);
  const buyAmount = parseFloat(quote.buyAmount) / Math.pow(10, buyTokenDecimals);

  const priceImpact = parseFloat(quote.estimatedPriceImpact) * 100;

  return {
    sellAmount: sellAmount.toFixed(6),
    buyAmount: buyAmount.toFixed(6),
    exchangeRate: `1 = ${parseFloat(quote.price).toFixed(6)}`,
    priceImpact: `${priceImpact.toFixed(2)}%`,
    estimatedGas: parseInt(quote.gas).toLocaleString(),
  };
}

/**
 * Validate swap parameters before executing
 */
export function validateSwapParams(params: SwapQuoteRequest): { valid: boolean; error?: string } {
  if (!params.takerAddress || params.takerAddress === '0x0000000000000000000000000000000000000000') {
    return { valid: false, error: 'Invalid wallet address' };
  }

  if (!params.sellToken || !params.buyToken) {
    return { valid: false, error: 'Invalid token addresses' };
  }

  if (params.sellToken.toLowerCase() === params.buyToken.toLowerCase()) {
    return { valid: false, error: 'Cannot swap same token' };
  }

  if (!params.sellAmount || params.sellAmount === '0') {
    return { valid: false, error: 'Invalid sell amount' };
  }

  const chain = getChainConfig(params.chainId);
  if (!chain) {
    return { valid: false, error: `Unsupported chain: ${params.chainId}` };
  }

  return { valid: true };
}
