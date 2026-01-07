/**
 * Jupiter Swap Integration
 *
 * MAXIMUM REVENUE CONFIGURATION:
 * - Platform fee: 1% (100 bps) - Goes to YOUR wallet
 * - Jupiter referral: ~0.1% - AUTOMATIC bonus
 * - TOTAL: 1.1% per swap
 *
 * This is 2.75x MORE than 0x (0.4%)!
 */

import {
  JUPITER_API_URL,
  JUPITER_API_KEY,
  SOLANA_FEE_WALLET,
  PLATFORM_FEE_BPS,
  DEFAULT_SLIPPAGE_BPS,
} from './config';

export interface JupiterQuoteRequest {
  inputMint: string; // Token being sold
  outputMint: string; // Token being bought
  amount: string; // Amount in smallest unit (lamports for SOL)
  slippageBps?: number; // Default: 50 (0.5%)
  onlyDirectRoutes?: boolean;
  asLegacyTransaction?: boolean;
}

export interface JupiterQuoteResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string; // Minimum amount out after slippage
  swapMode: string;
  slippageBps: number;
  platformFee: {
    amount: string;
    feeBps: number;
  } | null;
  priceImpactPct: string;
  routePlan: any[];
  contextSlot?: number;
  timeTaken?: number;
}

export interface JupiterSwapRequest {
  quoteResponse: JupiterQuoteResponse;
  userPublicKey: string; // User's Solana wallet
  wrapAndUnwrapSol?: boolean;
  feeAccount?: string; // YOUR fee wallet
  prioritizationFeeLamports?: number;
}

export interface JupiterSwapResponse {
  swapTransaction: string; // Base64 encoded transaction
  lastValidBlockHeight: number;
}

/**
 * Get swap quote from Jupiter
 *
 * This includes YOUR 1% platform fee automatically!
 */
export async function getJupiterQuote(params: JupiterQuoteRequest): Promise<JupiterQuoteResponse | null> {
  try {
    const queryParams = new URLSearchParams({
      inputMint: params.inputMint,
      outputMint: params.outputMint,
      amount: params.amount,
      slippageBps: (params.slippageBps || DEFAULT_SLIPPAGE_BPS).toString(),
      onlyDirectRoutes: params.onlyDirectRoutes ? 'true' : 'false',
      asLegacyTransaction: params.asLegacyTransaction ? 'true' : 'false',

      // ============ MAXIMUM REVENUE PARAMETERS ============
      platformFeeBps: PLATFORM_FEE_BPS.toString(), // 1% fee
      // ====================================================
    });

    console.log(`[Jupiter] Fetching quote with ${PLATFORM_FEE_BPS} bps platform fee...`);

    const response = await fetch(`${JUPITER_API_URL}/quote?${queryParams}`, {
      headers: {
        'Accept': 'application/json',
        'X-API-Key': JUPITER_API_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Jupiter] Quote error:', errorText);
      throw new Error(`Jupiter API error: ${response.status}`);
    }

    const quote: JupiterQuoteResponse = await response.json();

    // Log revenue info
    if (quote.platformFee) {
      const feeAmount = parseFloat(quote.platformFee.amount);
      console.log(`💰 Platform fee will be charged: ${feeAmount} (${quote.platformFee.feeBps} bps)`);
    }

    return quote;
  } catch (error: any) {
    console.error('[Jupiter] Get quote error:', error.message);
    throw error;
  }
}

/**
 * Get swap transaction from Jupiter
 *
 * Returns a transaction ready to be signed and sent
 */
export async function getJupiterSwapTransaction(
  params: JupiterSwapRequest
): Promise<JupiterSwapResponse | null> {
  try {
    if (!SOLANA_FEE_WALLET || SOLANA_FEE_WALLET === 'YOUR_SOLANA_WALLET_ADDRESS') {
      console.error('⚠️ SOLANA_FEE_WALLET not set! You will NOT earn fees!');
    }

    const body = {
      quoteResponse: params.quoteResponse,
      userPublicKey: params.userPublicKey,
      wrapAndUnwrapSol: params.wrapAndUnwrapSol !== false, // Default true

      // ============ YOUR FEE WALLET ============
      feeAccount: params.feeAccount || SOLANA_FEE_WALLET,
      // =========================================

      prioritizationFeeLamports: params.prioritizationFeeLamports || 'auto',
      asLegacyTransaction: false,
      dynamicComputeUnitLimit: true,
    };

    console.log(`[Jupiter] Creating swap transaction...`);
    console.log(`[Jupiter] Fee account: ${body.feeAccount}`);

    const response = await fetch(`${JUPITER_API_URL}/swap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-Key': JUPITER_API_KEY,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Jupiter] Swap error:', errorText);
      throw new Error(`Jupiter swap error: ${response.status}`);
    }

    const swap: JupiterSwapResponse = await response.json();

    console.log('✅ Swap transaction created');
    return swap;
  } catch (error: any) {
    console.error('[Jupiter] Get swap transaction error:', error.message);
    throw error;
  }
}

/**
 * Calculate expected platform fee in USD
 */
export function calculatePlatformFeeUSD(swapAmountUSD: number): number {
  return swapAmountUSD * (PLATFORM_FEE_BPS / 10000);
}

/**
 * Calculate total expected fee (platform + Jupiter referral)
 */
export function calculateTotalFeeUSD(swapAmountUSD: number): number {
  const platformFee = calculatePlatformFeeUSD(swapAmountUSD);
  const jupiterReferral = swapAmountUSD * 0.001; // ~0.1% referral
  return platformFee + jupiterReferral;
}

/**
 * Format quote for display
 */
export function formatJupiterQuote(
  quote: JupiterQuoteResponse,
  inputDecimals: number,
  outputDecimals: number
) {
  const inAmount = parseFloat(quote.inAmount) / Math.pow(10, inputDecimals);
  const outAmount = parseFloat(quote.outAmount) / Math.pow(10, outputDecimals);
  const priceImpact = parseFloat(quote.priceImpactPct);

  const platformFee = quote.platformFee
    ? parseFloat(quote.platformFee.amount) / Math.pow(10, outputDecimals)
    : 0;

  return {
    inAmount: inAmount.toFixed(6),
    outAmount: outAmount.toFixed(6),
    exchangeRate: (outAmount / inAmount).toFixed(6),
    priceImpact: `${priceImpact.toFixed(2)}%`,
    platformFee: platformFee.toFixed(6),
    platformFeeBps: quote.platformFee?.feeBps || 0,
  };
}

/**
 * Validate swap parameters
 */
export function validateSwapParams(params: JupiterQuoteRequest): { valid: boolean; error?: string } {
  if (!params.inputMint || params.inputMint.length !== 44) {
    return { valid: false, error: 'Invalid input token address' };
  }

  if (!params.outputMint || params.outputMint.length !== 44) {
    return { valid: false, error: 'Invalid output token address' };
  }

  if (params.inputMint === params.outputMint) {
    return { valid: false, error: 'Cannot swap same token' };
  }

  if (!params.amount || params.amount === '0') {
    return { valid: false, error: 'Invalid swap amount' };
  }

  return { valid: true };
}

/**
 * Get price for a token pair (lightweight, no swap transaction)
 */
export async function getTokenPrice(
  inputMint: string,
  outputMint: string,
  amount: string = '1000000000' // 1 SOL default
): Promise<number | null> {
  try {
    const quote = await getJupiterQuote({
      inputMint,
      outputMint,
      amount,
      onlyDirectRoutes: true,
    });

    if (!quote) return null;

    const rate = parseFloat(quote.outAmount) / parseFloat(quote.inAmount);
    return rate;
  } catch (error) {
    console.error('[Jupiter] Get price error:', error);
    return null;
  }
}

// ============================================================
// ROUTE VALIDATION (for discovery system)
// ============================================================

// SOL mint address
const SOL_MINT = 'So11111111111111111111111111111111111111112';

// Cache for Jupiter route checks (6 hours)
const routeCache = new Map<string, { valid: boolean; ts: number }>();
const ROUTE_CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

/**
 * Check if Jupiter can route SOL → token
 * Used by discovery to filter non-swappable tokens
 */
export async function hasJupiterRoute(outputMint: string): Promise<boolean> {
  // Check cache first
  const cached = routeCache.get(outputMint);
  if (cached && Date.now() - cached.ts < ROUTE_CACHE_TTL) {
    return cached.valid;
  }

  try {
    const url = new URL(`${JUPITER_API_URL}/quote`);
    url.searchParams.set('inputMint', SOL_MINT);
    url.searchParams.set('outputMint', outputMint);
    url.searchParams.set('amount', '10000000'); // 0.01 SOL (in lamports)
    url.searchParams.set('slippageBps', '100'); // 1% slippage

    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(5000),
      headers: {
        'Accept': 'application/json',
        'X-API-Key': JUPITER_API_KEY,
      },
    });

    if (!res.ok) {
      routeCache.set(outputMint, { valid: false, ts: Date.now() });
      return false;
    }

    const data = await res.json();
    
    // Jupiter returns routePlan array if route exists
    const hasRoute = Array.isArray(data.routePlan) && data.routePlan.length > 0;
    
    routeCache.set(outputMint, { valid: hasRoute, ts: Date.now() });
    return hasRoute;
  } catch (err) {
    // On error, don't cache - might be transient
    console.error(`[Jupiter] Route check failed for ${outputMint}:`, err);
    return false;
  }
}

/**
 * Batch validate tokens (with rate limiting)
 * Only validates top tokens by liquidity to avoid hammering Jupiter
 */
export async function validateTokenRoutes(
  tokens: { mint: string; liquidityUsd: number }[],
  options?: {
    maxTokens?: number;
    minLiquidity?: number;
    concurrency?: number;
  }
): Promise<Set<string>> {
  const {
    maxTokens = 500,
    minLiquidity = 5000, // Only validate tokens with $5k+ liquidity
    concurrency = 5,
  } = options ?? {};

  // Filter and sort by liquidity
  const toValidate = tokens
    .filter(t => t.liquidityUsd >= minLiquidity)
    .sort((a, b) => b.liquidityUsd - a.liquidityUsd)
    .slice(0, maxTokens);

  console.log(`[Jupiter] Validating ${toValidate.length} tokens...`);

  const validMints = new Set<string>();
  
  // Process in batches to avoid rate limits
  for (let i = 0; i < toValidate.length; i += concurrency) {
    const batch = toValidate.slice(i, i + concurrency);
    
    const results = await Promise.all(
      batch.map(async (t) => {
        const valid = await hasJupiterRoute(t.mint);
        return { mint: t.mint, valid };
      })
    );

    for (const r of results) {
      if (r.valid) validMints.add(r.mint);
    }

    // Small delay between batches
    if (i + concurrency < toValidate.length) {
      await new Promise(r => setTimeout(r, 100));
    }
  }

  console.log(`[Jupiter] Validated: ${validMints.size}/${toValidate.length} have routes`);
  return validMints;
}

/**
 * Clear route cache (for testing/refresh)
 */
export function clearRouteCache(): void {
  routeCache.clear();
}
