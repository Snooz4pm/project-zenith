import { NextRequest, NextResponse } from 'next/server';
import { discoverTokens, searchToken } from '@/lib/arena/discovery';

/**
 * GET /api/arena/discovery
 *
 * Returns early/undiscovered tokens from DexScreener
 *
 * Query params:
 * - chainId?: string (filter by chain, e.g., "base", "ethereum")
 * - minChainPriority?: number (minimum chain priority score)
 * - search?: string (search for specific token)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const chainId = searchParams.get('chainId') || undefined;
    const minChainPriority = parseInt(searchParams.get('minChainPriority') || '0');
    const search = searchParams.get('search');

    let tokens;

    if (search) {
      // Search mode
      tokens = await searchToken(search);
    } else {
      // Discovery mode
      tokens = await discoverTokens({
        chainId,
        minChainPriority: minChainPriority > 0 ? minChainPriority : undefined,
      });
    }

    return NextResponse.json({
      success: true,
      tokens,
      count: tokens.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Discovery API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discovered tokens' },
      { status: 500 }
    );
  }
}
