import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_CHAINS = new Set([
  "ethereum",
  "arbitrum",
  "base",
  "polygon",
  "bsc"
]);

const CHAIN_IDS: Record<string, string> = {
  ethereum: "1",
  bsc: "56",
  base: "8453",
  arbitrum: "42161",
  polygon: "137"
};

const NETWORK_NAMES: Record<string, string> = {
  ethereum: "Ethereum",
  bsc: "BNB Chain",
  base: "Base",
  arbitrum: "Arbitrum",
  polygon: "Polygon"
};

/**
 * GET /api/arena/evm/discovery
 * 
 * EVM discovery via DexScreener with relaxed constraints
 * - 6h ISR cache
 * - Handles inconsistent chainId formats
 * - Filters AFTER mapping
 */
export async function GET() {
  try {
    const res = await fetch(
      "https://api.dexscreener.com/latest/dex/search?q=ETH",
      { next: { revalidate: 21600 } } // 6h cache
    );

    if (!res.ok) {
      return NextResponse.json({
        success: true, // Soft fail
        tokens: [],
        count: 0,
        engine: "evm",
        cached: true
      });
    }

    const data = await res.json();

    const tokens = (data.pairs ?? [])
      .map((p: any) => {
        // Normalize chain ID (DexScreener usually returns string names like "ethereum", not numbers)
        const chain = (p.chainId || p.chain || "").toLowerCase();

        // Strict filter but checked AFTER normalization
        if (!ALLOWED_CHAINS.has(chain)) return null;

        return {
          chain,                                  // "ethereum"
          chainType: 'EVM',
          chainId: CHAIN_IDS[chain] || "1",       // "1"
          networkName: NETWORK_NAMES[chain] || chain,
          address: p.baseToken?.address,
          symbol: p.baseToken?.symbol || "UNKNOWN",
          name: p.baseToken?.name || "Unknown Token",
          logoURI: p.baseToken?.logoURI || p.info?.imageUrl || null,
          liquidityUsd: Number(p.liquidity?.usd ?? 0),
          volume24hUsd: Number(p.volume?.h24 ?? 0),
          priceUsd: Number(p.priceUsd ?? 0),
          source: 'DEXSCREENER',
          dexId: p.dexId,
          pairAddress: p.pairAddress
        };
      })
      .filter((t: any) => t !== null && t.address && t.symbol);

    // Sort by liquidity
    tokens.sort((a: any, b: any) => b.liquidityUsd - a.liquidityUsd);

    console.log(`[EVM Discovery] Found ${tokens.length} valid tokens`);

    return NextResponse.json({
      success: true,
      tokens,
      count: tokens.length,
      engine: "evm",
      cached: true
    });

  } catch (err) {
    console.error('[EVM Discovery] Error:', err);
    return NextResponse.json({
      success: true, // Soft fail
      tokens: [],
      count: 0,
      engine: "evm",
      cached: true
    });
  }
}
