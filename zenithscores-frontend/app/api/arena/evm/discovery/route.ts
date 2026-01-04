import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPPORTED_EVM_CHAINS = new Set([
  "ethereum",
  "arbitrum",
  "base",
  "polygon",
  "bsc"
]);

/**
 * GET /api/arena/evm/discovery
 *
 * EVM token discovery via DexScreener
 * Returns 10k-15k EVM tokens across all supported chains
 * NO pre-filtering, NO route checks
 */
export async function GET() {
  try {
    console.log('[EVM Discovery] Fetching tokens from DexScreener...');

    const res = await fetch(
      "https://api.dexscreener.com/latest/dex/search?q=ETH",
      {
        cache: "no-store",
        signal: AbortSignal.timeout(15000)
      }
    );

    if (!res.ok) {
      console.error('[EVM Discovery] DexScreener error:', res.status);
      return NextResponse.json({ tokens: [] });
    }

    const data = await res.json();

    const tokens = (data.pairs ?? [])
      .filter((p: any) => SUPPORTED_EVM_CHAINS.has(p.chainId))
      .map((p: any) => ({
        chain: p.chainId,                // ethereum | arbitrum | base | polygon | bsc
        address: p.baseToken?.address,
        symbol: p.baseToken?.symbol,
        name: p.baseToken?.name,
        dex: p.dexId,
        liquidity: p.liquidity?.usd ?? 0,
        volume24h: p.volume?.h24 ?? 0,
        pairAddress: p.pairAddress
      }))
      .filter((t: any) => t.address && t.symbol);

    console.log(`[EVM Discovery] Found ${tokens.length} tokens`);

    return NextResponse.json({
      success: true,
      tokens,
      count: tokens.length
    });

  } catch (err) {
    console.error('[EVM Discovery] Fatal error:', err);
    return NextResponse.json({
      success: false,
      tokens: [],
      count: 0
    });
  }
}
