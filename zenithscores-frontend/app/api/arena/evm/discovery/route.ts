import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 21600; // 6 hours ISR cache

const EVM_CHAINS = ['ethereum', 'bsc', 'base', 'arbitrum', 'polygon'];

const CHAIN_META: Record<string, { chainId: string; name: string }> = {
  ethereum: { chainId: '1', name: 'Ethereum' },
  bsc: { chainId: '56', name: 'BNB Chain' },
  base: { chainId: '8453', name: 'Base' },
  arbitrum: { chainId: '42161', name: 'Arbitrum' },
  polygon: { chainId: '137', name: 'Polygon' }
};

/**
 * GET /api/arena/evm/discovery
 * 
 * EVM-ONLY token discovery
 * Source: DexScreener
 * Chains: Ethereum, BSC, Base, Arbitrum, Polygon
 * Cache: 6 hours
 * Returns: ALL tokens (no filtering)
 */
export async function GET() {
  const tokens: any[] = [];

  for (const chain of EVM_CHAINS) {
    try {
      const res = await fetch(`https://api.dexscreener.com/latest/dex/pairs/${chain}`, {
        next: { revalidate: 21600 }
      });

      if (res.ok) {
        const json = await res.json();
        const meta = CHAIN_META[chain];

        const chainTokens = (json.pairs ?? []).map((p: any) => ({
          chain,
          chainType: 'EVM',
          chainId: meta.chainId,
          networkName: meta.name,
          address: p.baseToken?.address,
          symbol: p.baseToken?.symbol || 'UNKNOWN',
          name: p.baseToken?.name || p.baseToken?.symbol || 'Unknown Token',
          logoURI: p.baseToken?.logoURI || p.info?.imageUrl || null,
          liquidityUsd: Number(p.liquidity?.usd ?? 0),
          volume24hUsd: Number(p.volume?.h24 ?? 0),
          priceUsd: Number(p.priceUsd ?? 0),
          source: 'DEXSCREENER'
        }));

        tokens.push(...chainTokens);
        console.log(`[EVM Discovery] ${chain}: ${chainTokens.length}`);
      }
    } catch (err) {
      console.error(`[EVM Discovery] ${chain} failed:`, err);
    }
  }

  // Dedupe by address+chainId
  const seen = new Set<string>();
  const unique = tokens.filter(t => {
    const key = `${t.chainId}:${t.address}`;
    if (!t.address || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by liquidity
  unique.sort((a, b) => b.liquidityUsd - a.liquidityUsd);

  console.log(`[EVM Discovery] Total: ${unique.length} unique tokens`);

  return NextResponse.json({
    success: true,
    tokens: unique,
    count: unique.length,
    engine: 'evm',
    cached: true
  });
}
