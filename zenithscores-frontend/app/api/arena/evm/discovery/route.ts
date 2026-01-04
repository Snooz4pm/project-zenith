import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 86400; // 24 hours ISR cache

// ════════════════════════════════════════════════════════
// LAYER 1: REGISTRY CONFIG (AUTHORITATIVE)
// ════════════════════════════════════════════════════════
const UNISWAP_LIST_URL = 'https://tokens.uniswap.org';

const CHAIN_MAP: Record<number, { chain: string; name: string; chainId: string }> = {
  1: { chain: 'ethereum', name: 'Ethereum', chainId: '1' },
  56: { chain: 'bsc', name: 'BNB Chain', chainId: '56' },
  8453: { chain: 'base', name: 'Base', chainId: '8453' },
  42161: { chain: 'arbitrum', name: 'Arbitrum', chainId: '42161' },
  137: { chain: 'polygon', name: 'Polygon', chainId: '137' }
};

/**
 * GET /api/arena/evm/discovery
 * 
 * EVM Token Registry (Layer 1)
 * Source: Uniswap Unified Token List
 * Coverage: High-quality, verified tokens across 5 major chains
 * Strategy: Registry-First (No fallback to raw indexers)
 */
export async function GET() {
  try {
    console.log('[EVM Registry] Fetching Uniswap Token List...');

    const res = await fetch(UNISWAP_LIST_URL, {
      next: { revalidate: 86400 }
    });

    if (!res.ok) {
      console.error('[EVM Registry] Failed to fetch list:', res.status);
      return NextResponse.json({ success: false, tokens: [], count: 0 });
    }

    const data = await res.json();
    const rawTokens = data.tokens || [];

    // Filter & Normalize
    const tokens = rawTokens
      .filter((t: any) => CHAIN_MAP[t.chainId])
      .map((t: any) => {
        const meta = CHAIN_MAP[t.chainId];
        return {
          chain: meta.chain,
          chainType: 'EVM',
          chainId: meta.chainId,
          networkName: meta.name,
          address: t.address,
          symbol: t.symbol,
          name: t.name,
          decimals: t.decimals,
          logoURI: t.logoURI,
          // L2 Enrichment data (missing in L1 registry)
          liquidityUsd: 0,
          volume24hUsd: 0,
          source: 'UNISWAP_REGISTRY'
        };
      });

    console.log(`[EVM Registry] Loaded ${tokens.length} verified tokens`);

    return NextResponse.json({
      success: true,
      tokens,
      count: tokens.length,
      engine: 'evm',
      cached: true
    });

  } catch (err) {
    console.error('[EVM Registry] Fatal error:', err);
    return NextResponse.json({
      success: false,
      tokens: [],
      error: String(err)
    });
  }
}
