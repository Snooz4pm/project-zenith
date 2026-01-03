import { NextRequest, NextResponse } from 'next/server';
import { discoverTokens } from '@/lib/discovery';

/**
 * GET /api/tokens
 * 
 * Global token discovery endpoint
 * Returns tokens from ALL chains (Solana + EVM)
 * 
 * Query params:
 * - limit: number (default: 100, max: 200)
 * 
 * ❌ NO wallet logic
 * ❌ NO swap logic
 * ✅ Pure discovery
 */

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');

    // Fetch tokens from ALL chains
    const tokens = await discoverTokens(Math.min(limit, 200));

    console.log(`[API /tokens] Discovered ${tokens.length} tokens across all chains`);

    return NextResponse.json({
      success: true,
      tokens,
      count: tokens.length,
    });
  } catch (error: any) {
    console.error('[API /tokens] Error:', error);

    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to discover tokens',
      tokens: [],
    }, { status: 500 });
  }
}
