import { NextResponse } from 'next/server';

const DEXSCREENER_API = 'https://api.dexscreener.com/latest/dex/search';

/**
 * Unified Token Discovery API
 *
 * Fetches tokens from DexScreener, normalizes data, filters by liquidity
 * Supports both SOLANA and EVM chains
 *
 * Query params:
 * - chain: 'solana' | 'evm' (default: 'solana')
 * - minLiquidity: number (default: 1000)
 * - maxLiquidity: number (default: 1_000_000_000)
 * - cursor: string | null
 * - limit: number (default: 20)
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const chain = searchParams.get('chain') ?? 'solana';
  const minLiquidity = Number(searchParams.get('minLiquidity') ?? 1000);
  const maxLiquidity = Number(searchParams.get('maxLiquidity') ?? 1_000_000_000);
  const cursor = searchParams.get('cursor');
  const limit = Number(searchParams.get('limit') ?? 20);

  // Query strategy: Use native token as search query
  const query = chain === 'solana' ? 'SOL' : 'ETH';

  console.log(`[Token API] Fetching ${chain} tokens, liquidity: $${minLiquidity}-$${maxLiquidity}`);

  try {
    const res = await fetch(`${DEXSCREENER_API}?q=${query}`, {
      next: { revalidate: 30 }, // Cache for 30 seconds
    });

    if (!res.ok) {
      console.error(`[Token API] DexScreener error: ${res.status}`);
      return NextResponse.json({ tokens: [], nextCursor: null });
    }

    const data = await res.json();

    // Normalize and filter tokens
    const normalized = (data.pairs || [])
      .filter((p: any) => p.liquidity?.usd && p.baseToken?.address)
      .map((p: any) => ({
        // Chain info
        chainId: p.chainId,
        chainType: chain === 'solana' ? 'SOLANA' : 'EVM',

        // Token info
        address: p.baseToken.address,
        symbol: p.baseToken.symbol,
        name: p.baseToken.name,

        // Market data
        liquidityUsd: p.liquidity.usd,
        volume24h: p.volume?.h24 ?? 0,
        priceUsd: p.priceUsd ?? null,
        priceChange24h: p.priceChange?.h24 ?? 0,

        // Metadata
        dexId: p.dexId,
        pairAddress: p.pairAddress,
        url: p.url,

        updatedAt: Date.now(),
      }))
      .filter(
        (t: any) =>
          t.liquidityUsd >= minLiquidity &&
          t.liquidityUsd <= maxLiquidity
      );

    console.log(`[Token API] Found ${normalized.length} tokens after filtering`);

    // Cursor-based pagination (simple, stable)
    const start = cursor ? Number(cursor) : 0;
    const end = start + limit;
    const page = normalized.slice(start, end);

    return NextResponse.json({
      tokens: page,
      nextCursor: end < normalized.length ? String(end) : null,
      total: normalized.length,
    });
  } catch (error: any) {
    console.error('[Token API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tokens', tokens: [], nextCursor: null },
      { status: 500 }
    );
  }
}
