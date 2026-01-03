/**
 * DexScreener Enrichment Layer (PHASE 2)
 *
 * Takes canonical tokens and enriches them with:
 * - Real-time prices
 * - 24h volume
 * - Liquidity
 * - Hot/trending badges
 *
 * CRITICAL: If DexScreener fails, tokens still exist
 * They just don't have market data
 */

import { GlobalToken } from './normalize';

const DEXSCREENER_API_URL = 'https://api.dexscreener.com/latest/dex';

interface DexScreenerPair {
  chainId: string;
  dexId: string;
  pairAddress: string;
  baseToken: {
    address: string;
    symbol: string;
    name: string;
  };
  priceUsd?: string;
  liquidity?: {
    usd: number;
  };
  volume?: {
    h24: number;
  };
  priceChange?: {
    h24: number;
  };
  txns?: {
    h24?: { buys: number; sells: number };
    m5?: { buys: number; sells: number };
  };
}

interface DexScreenerResponse {
  pairs: DexScreenerPair[] | null;
}

/**
 * Fetch DexScreener data for a token address
 */
async function fetchDexScreenerData(address: string, chainId: string): Promise<DexScreenerPair | null> {
  try {
    const dexChainMap: Record<string, string> = {
      'solana': 'solana',
      '1': 'ethereum',
      '56': 'bsc',
      '8453': 'base',
      '42161': 'arbitrum',
      '10': 'optimism',
      '137': 'polygon',
      '43114': 'avalanche',
    };

    const dexChain = dexChainMap[chainId];
    if (!dexChain) return null;

    const response = await fetch(`${DEXSCREENER_API_URL}/tokens/${address}`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 60 }, // Cache for 1 minute
    });

    if (!response.ok) {
      console.warn(`[Enrichment] DexScreener error for ${address}: ${response.status}`);
      return null;
    }

    const data: DexScreenerResponse = await response.json();

    if (!data.pairs || data.pairs.length === 0) {
      return null;
    }

    // Find pair on correct chain with highest liquidity
    const chainPairs = data.pairs.filter(p => p.chainId.toLowerCase() === dexChain.toLowerCase());
    if (chainPairs.length === 0) return null;

    // Sort by liquidity and return top pair
    const topPair = chainPairs.sort((a, b) => {
      const liqA = a.liquidity?.usd || 0;
      const liqB = b.liquidity?.usd || 0;
      return liqB - liqA;
    })[0];

    return topPair;
  } catch (error) {
    console.warn(`[Enrichment] Failed to fetch DexScreener data for ${address}:`, error);
    return null;
  }
}

/**
 * Determine if token is "hot" based on DexScreener metrics
 */
function isHotToken(pair: DexScreenerPair): boolean {
  // Hot if high 24h volume or high recent trading activity
  const volume24h = pair.volume?.h24 || 0;
  const buys5m = pair.txns?.m5?.buys || 0;

  return volume24h > 50000 || buys5m > 5;
}

/**
 * Enrich a single canonical token with DexScreener data
 */
export async function enrichToken(token: GlobalToken): Promise<GlobalToken> {
  const dexData = await fetchDexScreenerData(token.address, token.chainId);

  if (!dexData) {
    // Token exists but no market data available
    return {
      ...token,
      liquidityUsd: 0,
      volume24h: 0,
      priceUsd: 0,
      priceChange24h: 0,
    };
  }

  return {
    ...token,
    liquidityUsd: dexData.liquidity?.usd || 0,
    volume24h: dexData.volume?.h24 || 0,
    priceUsd: parseFloat(dexData.priceUsd || '0'),
    priceChange24h: dexData.priceChange?.h24 || 0,
    dex: dexData.dexId || token.dex,
    // Add hot badge in metadata if needed
  };
}

/**
 * Enrich multiple tokens with DexScreener data (batched)
 *
 * IMPORTANT: This returns ALL tokens even if enrichment fails
 * Tokens without market data are still shown
 *
 * TIMEOUT PROTECTION:
 * - If enrichment takes > 8 seconds, return canonical tokens immediately
 * - This prevents slow API calls from blocking the UI
 */
export async function enrichTokens(tokens: GlobalToken[], limit: number = 100): Promise<GlobalToken[]> {
  console.log(`[Enrichment] Enriching ${tokens.length} tokens with DexScreener data...`);

  // Take top tokens for enrichment (limit API calls)
  const tokensToEnrich = tokens.slice(0, limit);

  try {
    // Timeout wrapper: 8 seconds max for enrichment
    const enrichmentPromise = enrichTokensInternal(tokensToEnrich);
    const timeoutPromise = new Promise<GlobalToken[]>((resolve) => {
      setTimeout(() => {
        console.warn('[Enrichment] Timeout after 8s - returning canonical tokens without enrichment');
        resolve(tokensToEnrich); // Return canonical tokens (no enrichment)
      }, 8000);
    });

    // Race between enrichment and timeout
    const enrichedTokens = await Promise.race([enrichmentPromise, timeoutPromise]);

    console.log(`[Enrichment] Returning ${enrichedTokens.length} tokens`);

    // Filter out tokens with $0 liquidity ONLY if we have enough tokens
    const liquidTokens = enrichedTokens.filter(t => t.liquidityUsd > 0);

    if (liquidTokens.length >= 20) {
      // We have enough liquid tokens, show only those
      return liquidTokens;
    } else {
      // Not enough liquid tokens, show all (even if liquidity = 0)
      console.log('[Enrichment] Low liquidity count, showing all tokens including non-liquid ones');
      return enrichedTokens;
    }
  } catch (error) {
    console.error('[Enrichment] Error during enrichment:', error);
    // Return canonical tokens even on error
    return tokensToEnrich;
  }
}

/**
 * Internal enrichment logic (no timeout)
 */
async function enrichTokensInternal(tokensToEnrich: GlobalToken[]): Promise<GlobalToken[]> {
  const BATCH_SIZE = 10;
  const enrichedTokens: GlobalToken[] = [];

  for (let i = 0; i < tokensToEnrich.length; i += BATCH_SIZE) {
    const batch = tokensToEnrich.slice(i, i + BATCH_SIZE);
    const enrichedBatch = await Promise.all(
      batch.map(token => enrichToken(token))
    );
    enrichedTokens.push(...enrichedBatch);
  }

  console.log(`[Enrichment] Enriched ${enrichedTokens.length}/${tokensToEnrich.length} tokens`);
  return enrichedTokens;
}

/**
 * Get "hot" tokens from enriched list
 * These are tokens with high volume or recent trading activity
 */
export function getHotTokens(enrichedTokens: GlobalToken[]): GlobalToken[] {
  return enrichedTokens
    .filter(token => token.volume24h > 50000 || token.liquidityUsd > 100000)
    .sort((a, b) => b.volume24h - a.volume24h);
}

/**
 * Get "new" tokens (recently listed)
 * For Phase 2, we'll use DexScreener's discovery endpoint
 */
export function getNewTokens(enrichedTokens: GlobalToken[]): GlobalToken[] {
  // For now, return tokens sorted by lowest liquidity (proxy for "new")
  return enrichedTokens
    .filter(token => token.liquidityUsd > 0 && token.liquidityUsd < 50000)
    .sort((a, b) => a.liquidityUsd - b.liquidityUsd);
}
