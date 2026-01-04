import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 86400; // 24 hours ISR cache (Strict User Rule)

// ════════════════════════════════════════════════════════
// TIER-1 TOKEN LISTS (TRUSTED SOURCES)
// ════════════════════════════════════════════════════════
const TOKEN_LISTS = [
  'https://tokens.uniswap.org',
  'https://gateway.ipfs.io/ipns/tokens.uniswap.org',
  'https://tokens.coingecko.com/uniswap/all.json',
  'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/tokenlist.json',
  'https://raw.githubusercontent.com/compound-finance/token-list/master/compound.tokenlist.json',
  'https://raw.githubusercontent.com/sushiswap/list/master/lists/token-lists/default-token-list/tokens.json',
  // BSC Critical Lists
  'https://tokens.pancakeswap.finance/pancakeswap-extended.json',
  'https://tokens.pancakeswap.finance/pancakeswap-top-100.json'
];

interface ChainMeta {
  chain: string;
  name: string;
  chainId: string;
}

const CHAIN_MAP: Record<number, ChainMeta> = {
  1: { chain: 'ethereum', name: 'Ethereum', chainId: '1' },
  56: { chain: 'bsc', name: 'BNB Chain', chainId: '56' },
  8453: { chain: 'base', name: 'Base', chainId: '8453' },
  42161: { chain: 'arbitrum', name: 'Arbitrum', chainId: '42161' },
  137: { chain: 'polygon', name: 'Polygon', chainId: '137' }
};

/**
 * GET /api/arena/evm/discovery
 * 
 * EVM Token Registry (Aggregated Layer 1)
 * Merges multiple Tier-1 token lists to build a comprehensive registry.
 * Target: 20k-50k unique tokens.
 */
export async function GET() {
  const startTime = Date.now();
  console.log('[EVM Registry] Starting aggregation...');

  try {
    // 1. Fetch all lists in parallel
    const results = await Promise.allSettled(
      TOKEN_LISTS.map(async (url) => {
        try {
          const res = await fetch(url, { next: { revalidate: 43200 } });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          return data.tokens || [];
        } catch (err) {
          console.warn(`[EVM Registry] Failed to fetch ${url}:`, err);
          return []; // Fail safe
        }
      })
    );

    // 2. Flatten and Aggregation Map
    // Key: "chain:address" (lifecycle safe)
    const tokenMap = new Map<string, any>();
    let totalFetched = 0;

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        const tokens = result.value;
        totalFetched += tokens.length;

        for (const t of tokens) {
          const chainId = t.chainId;
          const address = t.address?.toLowerCase();

          // Only process supported chains & valid addresses
          if (CHAIN_MAP[chainId] && address) {
            const splitKey = CHAIN_MAP[chainId].chain;
            const key = `${splitKey}:${address}`;

            // Deduplicate: First writer wins (usually Uniswap as it's first in list)
            // Or overwrite if we want to merge metadata (simple: first wins for speed)
            if (!tokenMap.has(key)) {
              tokenMap.set(key, t);
            }
          }
        }
      }
    });

    // 3. Normalize to DiscoveredToken
    const finalTokens = Array.from(tokenMap.values()).map(t => {
      const meta = CHAIN_MAP[t.chainId];
      return {
        chain: meta.chain,
        chainType: 'EVM',
        chainId: meta.chainId,
        networkName: meta.name,
        address: t.address, // Keep original case or lowercase? Usually keep checksummed if from list, but efficient map used lowercase key.
        // We return t.address from source (usually checksummed)
        symbol: t.symbol,
        name: t.name,
        decimals: t.decimals,
        logoURI: t.logoURI,
        liquidityUsd: 0, // Registry only
        volume24hUsd: 0, // Registry only
        source: 'AGGREGATED_REGISTRY'
      };
    });

    const duration = Date.now() - startTime;
    console.log(`[EVM Registry] Aggregated ${finalTokens.length} unique tokens from ${totalFetched} raw entries in ${duration}ms`);

    return NextResponse.json({
      meta: {
        total: finalTokens.length,
        chains: ['ethereum', 'bsc', 'base', 'arbitrum', 'polygon'],
        timestamp: Date.now(),
        cached: true,
      },
      tokens: finalTokens
    });

  } catch (err) {
    console.error('[EVM Registry] Fatal error:', err);
    return NextResponse.json({
      meta: { total: 0, chains: [], error: String(err) },
      tokens: []
    });
  }
}
