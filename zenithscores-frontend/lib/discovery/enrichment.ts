import { GlobalToken, ChainId } from './normalize';

const DEXSCREENER_API_BASE = 'https://api.dexscreener.com/latest/dex/tokens/';

/**
 * Layer 2: Enrich Canonical Tokens with DexScreener Data
 *
 * Takes a list of canonical tokens (address/symbol known) and
 * fetches their live market data (price, liq, vol) from DexScreener.
 *
 * Chunking strategy is used to respect API limits (30 tokens per call).
 */
export async function enrichTokens(
  tokens: GlobalToken[],
  limit: number = 100
): Promise<GlobalToken[]> {
  // Take the top N tokens to enrich (to avoid spamming API with 1000s)
  const tokensToEnrich = tokens.slice(0, limit);
  const enrichedList: GlobalToken[] = [];

  // DexScreener endpoint supports multiple addresses comma-separated
  // Chunk into groups of 30
  const CHUNK_SIZE = 30;
  const chunks = [];

  for (let i = 0; i < tokensToEnrich.length; i += CHUNK_SIZE) {
    chunks.push(tokensToEnrich.slice(i, i + CHUNK_SIZE));
  }

  try {
    const results = await Promise.all(
      chunks.map(async (chunk) => {
        const addresses = chunk.map(t => t.address).join(',');
        const url = `${DEXSCREENER_API_BASE}${addresses}`;

        try {
          const res = await fetch(url);
          const data = await res.json();
          return { chunk, pairs: data.pairs || [] };
        } catch (e) {
          console.error('Enrichment chunk failed:', e);
          return { chunk, pairs: [] };
        }
      })
    );

    // Process results
    results.forEach(({ chunk, pairs }) => {
      chunk.forEach(originalToken => {
        // Find best pair for this token
        // DexScreener returns all pairs for these addresses
        // We need to match the address and pick the most liquid pair

        const tokenPairs = pairs.filter((p: any) =>
          p.baseToken.address.toLowerCase() === originalToken.address.toLowerCase() ||
          p.quoteToken.address.toLowerCase() === originalToken.address.toLowerCase()
        );

        if (tokenPairs.length === 0) {
          // No market data found, return original (dead/low liq token)
          // Or skip? User request says: "If fails, tokens still exist (just no market data)"
          enrichedList.push(originalToken);
          return;
        }

        // Sort by liquidity to find main pair
        tokenPairs.sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
        const bestPair = tokenPairs[0];

        const enriched: GlobalToken = {
          ...originalToken,
          priceUsd: parseFloat(bestPair.priceUsd || '0'),
          priceChange24h: bestPair.priceChange?.h24 || 0,
          liquidityUsd: bestPair.liquidity?.usd || 0,
          volume24h: bestPair.volume?.h24 || 0,
          dex: bestPair.dexId,
          logo: originalToken.logo || bestPair.info?.imageUrl,
          // Ensure name/symbol are canonical if missing from DS
        };

        enrichedList.push(enriched);
      });
    });

  } catch (e) {
    console.error('Enrichment failed completely:', e);
    // Fallback to originals if everything explodes
    return tokensToEnrich;
  }

  return enrichedList;
}
