import { NextRequest, NextResponse } from 'next/server';
import { fetchAllCanonicalTokens, fetchCanonicalTokensByChain } from '@/lib/discovery/canonical-lists';
import { enrichTokens } from '@/lib/discovery/enrichment';
import { ChainId } from '@/lib/discovery/normalize';

/**
 * GET /api/tokens
 *
 * PHASE 2 IMPLEMENTATION - TWO-LAYER DISCOVERY SYSTEM
 *
 * Layer 1: Canonical Token Lists (ALWAYS WORKS)
 * - Solana: Jupiter token list
 * - EVM: Top tokens per chain
 *
 * Layer 2: DexScreener Enrichment (OPTIONAL)
 * - Adds prices, volume, liquidity
 * - If fails, tokens still exist (just no market data)
 *
 * This ensures arena NEVER looks empty
 *
 * Query params:
 * - limit?: number (default: 100)
 * - chainId?: string (filter by chain)
 * - mode?: 'all' | 'hot' | 'new' (default: 'all')
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const chainId = searchParams.get('chainId') as ChainId | undefined;
    const mode = searchParams.get('mode') || 'all';

    console.log('[API /tokens] PHASE 2 - Two-layer discovery');
    console.log('[API /tokens] Params:', { limit, chainId, mode });

    // LAYER 1: Fetch canonical tokens (ALWAYS WORKS)
    let canonicalTokens = chainId
      ? await fetchCanonicalTokensByChain(chainId)
      : await fetchAllCanonicalTokens();

    console.log(`[API /tokens] Layer 1: ${canonicalTokens.length} canonical tokens`);

    if (canonicalTokens.length === 0) {
      console.warn('[API /tokens] Layer 1 failed - no canonical tokens found');
      return NextResponse.json({
        success: true,
        tokens: [],
        count: 0,
        source: 'Canonical Lists (Empty)',
        timestamp: new Date().toISOString(),
      });
    }

    // LAYER 2: Enrich with DexScreener (OPTIONAL - tokens exist even if this fails)
    let enrichedTokens = await enrichTokens(canonicalTokens, limit);

    console.log(`[API /tokens] Layer 2: ${enrichedTokens.length} enriched tokens`);

    // Filter by mode
    if (mode === 'hot') {
      enrichedTokens = enrichedTokens
        .filter(t => t.volume24h > 50000)
        .sort((a, b) => b.volume24h - a.volume24h);
    } else if (mode === 'new') {
      enrichedTokens = enrichedTokens
        .filter(t => t.liquidityUsd > 0 && t.liquidityUsd < 50000)
        .sort((a, b) => a.liquidityUsd - b.liquidityUsd);
    }

    // Apply limit
    const finalTokens = enrichedTokens.slice(0, limit);

    console.log(`[API /tokens] Returning ${finalTokens.length} tokens (mode: ${mode})`);

    return NextResponse.json({
      success: true,
      tokens: finalTokens,
      count: finalTokens.length,
      source: 'Canonical Lists + DexScreener Enrichment (Phase 2)',
      mode,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[API /tokens] Error:', error);

    // CRITICAL: Even on error, return empty array (not HTTP 500)
    // This prevents arena from showing error state
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch tokens',
      tokens: [],
      count: 0,
      source: 'Error Fallback',
      timestamp: new Date().toISOString(),
    });
  }
}
