import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 86400; // 24 hours ISR cache (Strict User Rule)

// ════════════════════════════════════════════════════════
// TIER-1 TOKEN LISTS (TRUSTED SOURCES)
// ════════════════════════════════════════════════════════
const TOKEN_LISTS = [
  'https://tokens.uniswap.org',
  'https://tokens.coingecko.com/uniswap/all.json',
  'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/tokenlist.json',
  'https://tokens.pancakeswap.finance/pancakeswap-extended.json',
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
 */
export async function GET() {
  const startTime = Date.now();
  console.log('[EVM Discovery] START');

  try {
    // 1. Fetch all lists in parallel with timeout
    console.log('[EVM Discovery] Fetching', TOKEN_LISTS.length, 'token lists...');

    const results = await Promise.allSettled(
      TOKEN_LISTS.map(async (url) => {
        try {
          console.log('[EVM Discovery] Fetching:', url);
          const res = await fetch(url, {
            next: { revalidate: 43200 },
            signal: AbortSignal.timeout(15000) // 15s timeout per list
          });

          if (!res.ok) {
            console.warn(`[EVM Discovery] HTTP ${res.status} for ${url}`);
            throw new Error(`HTTP ${res.status}`);
          }

          const contentType = res.headers.get('content-type');
          if (!contentType?.includes('application/json')) {
            console.warn(`[EVM Discovery] Non-JSON response from ${url}`);
            throw new Error('Non-JSON response');
          }

          const data = await res.json();
          const tokens = data.tokens || [];
          console.log(`[EVM Discovery] Fetched ${tokens.length} tokens from ${url}`);
          return tokens;
        } catch (err) {
          console.error(`[EVM Discovery] Failed ${url}:`, String(err));
          return []; // Fail safe - continue with other lists
        }
      })
    );

    // 2. Flatten and deduplicate
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

            // First writer wins (deduplication)
            if (!tokenMap.has(key)) {
              tokenMap.set(key, t);
            }
          }
        }
      }
    });

    console.log(`[EVM Discovery] Deduped: ${tokenMap.size} unique from ${totalFetched} total`);

    // 3. Normalize to DiscoveredToken
    const finalTokens = Array.from(tokenMap.values()).map(t => {
      const meta = CHAIN_MAP[t.chainId];
      return {
        chain: meta.chain,
        chainType: 'EVM',
        chainId: meta.chainId,
        networkName: meta.name,
        address: t.address,
        symbol: t.symbol || 'UNKNOWN',
        name: t.name || 'Unknown Token',
        decimals: t.decimals || 18,
        logoURI: t.logoURI,
        liquidityUsd: 0, // Registry only
        volume24hUsd: 0, // Registry only
        source: 'DEXSCREENER'
      };
    });

    const duration = Date.now() - startTime;
    console.log(`[EVM Discovery] SUCCESS: ${finalTokens.length} tokens in ${duration}ms`);

    return NextResponse.json({
      meta: {
        total: finalTokens.length,
        chains: ['ethereum', 'bsc', 'base', 'arbitrum', 'polygon'],
        timestamp: Date.now(),
        cached: true,
        duration
      },
      tokens: finalTokens
    });

  } catch (err) {
    console.error('[EVM DISCOVERY ERROR]', err);
    // CRITICAL: Return 200 with empty tokens instead of 500
    return NextResponse.json({
      meta: {
        total: 0,
        chains: [],
        timestamp: Date.now(),
        error: String(err)
      },
      tokens: []
    }, { status: 200 });
  }
}
