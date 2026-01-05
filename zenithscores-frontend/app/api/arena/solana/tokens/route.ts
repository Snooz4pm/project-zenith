/**
 * GET /api/arena/solana/tokens
 * 
 * Production-grade Solana token discovery API
 * 
 * Query params:
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 50, max: 100)
 *   - minLiquidity: Minimum liquidity in USD (default: 1000)
 *   - source: 'raydium' | 'orca' | 'all' (default: 'all')
 *   - search: Search by symbol/name/mint
 *   - onlySwappable: Only show Jupiter-validated tokens (default: true)
 */

import { NextResponse } from 'next/server';
import { getFilteredSolanaTokens } from '@/lib/solana/discovery';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 50)));
    const minLiquidity = Number(searchParams.get('minLiquidity') ?? 1000);
    const source = (searchParams.get('source') ?? 'all') as 'raydium' | 'orca' | 'all';
    const search = searchParams.get('search') ?? undefined;
    const onlySwappable = searchParams.get('onlySwappable') !== 'false';

    console.log('[Solana Tokens API] Request:', {
      page,
      limit,
      minLiquidity,
      source,
      search,
      onlySwappable,
    });

    const result = await getFilteredSolanaTokens({
      page,
      limit,
      minLiquidity,
      source,
      search,
      onlySwappable,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    console.error('[Solana Tokens API] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
