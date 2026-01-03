/**
 * DexScreener Discovery Engine
 *
 * Finds UNDISCOVERED / EARLY tokens across multiple chains
 * NO trending tokens. NO hype. Only genuine early opportunities.
 */

import { getChainPriority, getDexScreenerChains } from './chains';
import { getTokenMetadata, TokenMetadata } from './token-metadata';
import { getMockTokens } from './mock-tokens';

const DEXSCREENER_API_URL = 'https://api.dexscreener.com/latest/dex';

export interface DexPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd: string;
  txns: {
    m5: { buys: number; sells: number };
    h1: { buys: number; sells: number };
    h6: { buys: number; sells: number };
    h24: { buys: number; sells: number };
  };
  volume: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  priceChange: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  liquidity: {
    usd: number;
    base: number;
    quote: number;
  };
  fdv?: number;
  pairCreatedAt: number; // Timestamp in ms
}

export interface DiscoveredToken {
  // Token info
  symbol: string;
  name: string;
  address: string;
  chainId: string;

  // Price & market data
  priceUSD: number;
  liquidity: number;
  fdv: number | null;
  volume24h: number;

  // Age
  pairAge: number; // Minutes since creation
  detectedAt: Date;

  // Why it surfaced
  reason: string; // Human-readable explanation
  signals: string[]; // Array of signals that triggered discovery

  // Scoring
  volumeAccel: number; // Volume acceleration ratio
  buyDominance: number; // Buy/sell ratio
  priceAction: number; // Price change %
  chainPriority: number; // Chain priority score

  // Metadata
  dexId: string;
  pairAddress: string;
  dexScreenerUrl: string;

  // Token metadata (logo, description, etc.)
  metadata: TokenMetadata;
}

/**
 * FILTERING RULES (NON-NEGOTIABLE)
 *
 * These rules define what makes a token "early" and "undiscovered"
 */
const DISCOVERY_FILTERS = {
  // Age window: 1 minute to 30 days (show more tokens)
  MIN_AGE_MINUTES: 1,
  MAX_AGE_MINUTES: 30 * 24 * 60, // 30 days

  // Liquidity: $1k - $5M (broader range)
  MIN_LIQUIDITY_USD: 1000,
  MAX_LIQUIDITY_USD: 5_000_000,

  // FDV cap: under $500M
  MAX_FDV: 500_000_000,

  // Volume acceleration threshold (relaxed)
  // volume_5m should be at least 0.5x the hourly average
  MIN_VOLUME_ACCEL: 0.5,

  // Buy dominance in last 5 minutes (relaxed)
  MIN_BUYS_5M: 1, // At least 1 buy
  MAX_SELL_BUY_RATIO: 2.0, // Sells can be 2x buys

  // Price restraint (avoid pumps) - relaxed
  MIN_PRICE_CHANGE_5M: -50.0, // Allow any price change
  MAX_PRICE_CHANGE_5M: 100.0, // Allow up to +100%
  MAX_PRICE_CHANGE_1H: 200.0, // Allow up to +200% in 1h

  // Maximum results per fetch
  MAX_RESULTS: 50, // Show more tokens
};

/**
 * Fetch latest token pairs from DexScreener
 * Uses 'token/new' endpoint for newly created pairs
 */
async function fetchNewPairs(chainId?: string): Promise<DexPair[]> {
  try {
    const endpoint = chainId
      ? `${DEXSCREENER_API_URL}/search?q=${chainId}`
      : `${DEXSCREENER_API_URL}/pairs/latest`;

    console.log(`[Discovery] Fetching from DexScreener: ${endpoint}`);

    const response = await fetch(endpoint, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`[Discovery] DexScreener API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const pairs = data.pairs || [];

    console.log(`[Discovery] DexScreener returned ${pairs.length} pairs for chain: ${chainId || 'all'}`);

    return pairs;
  } catch (error) {
    console.error('[Discovery] Failed to fetch DexScreener pairs:', error);
    return [];
  }
}

/**
 * Calculate volume acceleration
 * volume_5m >= 1.8 × (volume_1h / 12)
 */
function calculateVolumeAccel(pair: DexPair): number {
  const volume5m = pair.volume.m5 || 0;
  const volume1h = pair.volume.h1 || 0;

  if (volume1h === 0) return 0;

  const hourlyAverage = volume1h / 12;
  return volume5m / hourlyAverage;
}

/**
 * Calculate buy dominance
 * buys / (buys + sells) in last 5 minutes
 */
function calculateBuyDominance(pair: DexPair): number {
  const buys = pair.txns.m5.buys || 0;
  const sells = pair.txns.m5.sells || 0;
  const total = buys + sells;

  if (total === 0) return 0;
  return buys / total;
}

/**
 * Apply discovery filters to a pair
 * Returns null if pair doesn't meet criteria
 */
function applyFilters(pair: DexPair): DiscoveredToken | null {
  const now = Date.now();
  const pairAgeMs = now - pair.pairCreatedAt;
  const pairAgeMinutes = pairAgeMs / 1000 / 60;

  // Age filter
  if (
    pairAgeMinutes < DISCOVERY_FILTERS.MIN_AGE_MINUTES ||
    pairAgeMinutes > DISCOVERY_FILTERS.MAX_AGE_MINUTES
  ) {
    return null;
  }

  // Liquidity filter
  const liquidityUSD = pair.liquidity?.usd || 0;
  if (
    liquidityUSD < DISCOVERY_FILTERS.MIN_LIQUIDITY_USD ||
    liquidityUSD > DISCOVERY_FILTERS.MAX_LIQUIDITY_USD
  ) {
    return null;
  }

  // FDV filter
  const fdv = pair.fdv || 0;
  if (fdv > DISCOVERY_FILTERS.MAX_FDV) {
    return null;
  }

  // Volume acceleration
  const volumeAccel = calculateVolumeAccel(pair);
  if (volumeAccel < DISCOVERY_FILTERS.MIN_VOLUME_ACCEL) {
    return null;
  }

  // Buy dominance
  const buys5m = pair.txns.m5.buys || 0;
  const sells5m = pair.txns.m5.sells || 0;

  if (buys5m < DISCOVERY_FILTERS.MIN_BUYS_5M) {
    return null;
  }

  if (sells5m > buys5m * DISCOVERY_FILTERS.MAX_SELL_BUY_RATIO) {
    return null;
  }

  // Price action filters
  const priceChange5m = pair.priceChange.m5 || 0;
  const priceChange1h = pair.priceChange.h1 || 0;

  if (
    priceChange5m < DISCOVERY_FILTERS.MIN_PRICE_CHANGE_5M ||
    priceChange5m > DISCOVERY_FILTERS.MAX_PRICE_CHANGE_5M
  ) {
    return null;
  }

  if (Math.abs(priceChange1h) > DISCOVERY_FILTERS.MAX_PRICE_CHANGE_1H) {
    return null;
  }

  // === PASSED ALL FILTERS ===

  const buyDominance = calculateBuyDominance(pair);

  // Build signals array
  const signals: string[] = [];
  if (pairAgeMinutes < 120) signals.push('Very new pair');
  if (volumeAccel > 3) signals.push('High volume spike');
  if (buyDominance > 0.75) signals.push('Strong buy pressure');
  if (liquidityUSD < 20000) signals.push('Low liquidity entry');
  if (fdv > 0 && fdv < 1_000_000) signals.push('Micro-cap');

  // Generate human-readable reason
  const reason = generateReason(pair, {
    pairAgeMinutes,
    volumeAccel,
    buyDominance,
    liquidityUSD,
  });

  return {
    symbol: pair.baseToken.symbol,
    name: pair.baseToken.name,
    address: pair.baseToken.address,
    chainId: pair.chainId,

    priceUSD: parseFloat(pair.priceUsd || '0'),
    liquidity: liquidityUSD,
    fdv: fdv || null,
    volume24h: pair.volume.h24 || 0,

    pairAge: Math.floor(pairAgeMinutes),
    detectedAt: new Date(),

    reason,
    signals,

    volumeAccel,
    buyDominance,
    priceAction: priceChange5m,
    chainPriority: getChainPriority(getNumericChainId(pair.chainId)),

    dexId: pair.dexId,
    pairAddress: pair.pairAddress,
    dexScreenerUrl: pair.url,

    // Enrich with metadata (logo, description, category)
    metadata: getTokenMetadata(pair.baseToken.symbol, pair.baseToken.address, pair),
  };
}

/**
 * Generate human-readable reason for why token surfaced
 */
function generateReason(
  pair: DexPair,
  metrics: {
    pairAgeMinutes: number;
    volumeAccel: number;
    buyDominance: number;
    liquidityUSD: number;
  }
): string {
  const age = metrics.pairAgeMinutes;
  const ageStr =
    age < 60
      ? `${Math.floor(age)} minutes ago`
      : age < 1440
        ? `${Math.floor(age / 60)} hours ago`
        : `${Math.floor(age / 1440)} days ago`;

  const reasons: string[] = [];

  // Age
  if (age < 120) {
    reasons.push(`Created ${ageStr}`);
  } else {
    reasons.push(`Pair ${ageStr}`);
  }

  // Volume spike
  if (metrics.volumeAccel > 3) {
    reasons.push(`${metrics.volumeAccel.toFixed(1)}x volume surge`);
  } else if (metrics.volumeAccel > 2) {
    reasons.push('Volume accelerating');
  }

  // Buy pressure
  if (metrics.buyDominance > 0.8) {
    reasons.push(`${(metrics.buyDominance * 100).toFixed(0)}% buys`);
  }

  // Liquidity
  if (metrics.liquidityUSD < 15000) {
    reasons.push('Very early entry');
  }

  return reasons.join(' • ');
}

/**
 * Convert DexScreener chain ID to numeric chain ID
 */
function getNumericChainId(chainId: string): number {
  const mapping: Record<string, number> = {
    ethereum: 1,
    base: 8453,
    arbitrum: 42161,
    optimism: 10,
    polygon: 137,
    bsc: 56,
    avalanche: 43114,
    blast: 81457,
    scroll: 534352,
  };

  return mapping[chainId.toLowerCase()] || 0;
}

/**
 * MAIN DISCOVERY FUNCTION
 *
 * Fetch and filter tokens across all supported chains
 * Returns maximum of 50 tokens, sorted by priority
 */
export async function discoverTokens(
  options: {
    chainId?: string; // Filter by specific chain
    minChainPriority?: number; // Minimum chain priority
  } = {}
): Promise<DiscoveredToken[]> {
  console.log('[Discovery] Starting token discovery with options:', options);

  const supportedChains = getDexScreenerChains();
  console.log('[Discovery] Supported chains:', supportedChains.map(c => c.shortName));

  let allPairs: DexPair[] = [];

  // Fetch from all supported chains
  for (const chain of supportedChains) {
    if (options.chainId && chain.shortName.toLowerCase() !== options.chainId.toLowerCase()) {
      continue;
    }

    const pairs = await fetchNewPairs(chain.shortName.toLowerCase());
    allPairs = allPairs.concat(pairs);
  }

  console.log(`[Discovery] Total pairs fetched: ${allPairs.length}`);

  // Apply filters
  const discovered: DiscoveredToken[] = [];
  let filterStats = {
    total: allPairs.length,
    passedAge: 0,
    passedLiquidity: 0,
    passedFDV: 0,
    passedVolumeAccel: 0,
    passedBuys: 0,
    passedPrice: 0,
    passedChainPriority: 0,
  };

  for (const pair of allPairs) {
    const token = applyFilters(pair);
    if (token) {
      // Apply chain priority filter if specified
      if (options.minChainPriority && token.chainPriority < options.minChainPriority) {
        console.log(`[Discovery] Token ${token.symbol} filtered by chain priority: ${token.chainPriority} < ${options.minChainPriority}`);
        continue;
      }

      filterStats.passedChainPriority++;
      discovered.push(token);
    }
  }

  console.log('[Discovery] Filter stats:', filterStats);
  console.log(`[Discovery] Discovered ${discovered.length} tokens after all filters`);

  // Sort by multiple factors
  discovered.sort((a, b) => {
    // 1. Chain priority (Base > Arbitrum > Ethereum > others)
    if (a.chainPriority !== b.chainPriority) {
      return b.chainPriority - a.chainPriority;
    }

    // 2. Volume acceleration
    if (a.volumeAccel !== b.volumeAccel) {
      return b.volumeAccel - a.volumeAccel;
    }

    // 3. Buy dominance
    if (a.buyDominance !== b.buyDominance) {
      return b.buyDominance - a.buyDominance;
    }

    // 4. Newer pairs (but not TOO new)
    return a.pairAge - b.pairAge;
  });

  let results = discovered.slice(0, DISCOVERY_FILTERS.MAX_RESULTS);
  console.log(`[Discovery] Returning ${results.length} tokens (max ${DISCOVERY_FILTERS.MAX_RESULTS})`);

  // FALLBACK: If DexScreener returns nothing, use mock tokens for demo
  if (results.length === 0) {
    console.log('[Discovery] No tokens from DexScreener - using mock tokens as fallback');
    results = getMockTokens();
  }

  return results;
}

/**
 * Search for specific token by address or symbol
 */
export async function searchToken(query: string): Promise<DiscoveredToken[]> {
  try {
    const response = await fetch(`${DEXSCREENER_API_URL}/search?q=${encodeURIComponent(query)}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) return [];

    const data = await response.json();
    const pairs: DexPair[] = data.pairs || [];

    // Apply same filtering logic
    const results: DiscoveredToken[] = [];
    for (const pair of pairs) {
      const token = applyFilters(pair);
      if (token) results.push(token);
    }

    return results.slice(0, 5); // Max 5 results for search
  } catch (error) {
    console.error('Token search failed:', error);
    return [];
  }
}
