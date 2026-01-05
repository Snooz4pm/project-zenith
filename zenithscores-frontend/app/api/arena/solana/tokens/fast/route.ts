/**
 * GET /api/arena/solana/tokens/fast
 * 
 * Optimized endpoint for sub-200ms initial load
 * 
 * Strategy:
 * - Returns immediately with cached/verified tokens
 * - Triggers background refresh if stale
 * - Client can poll for fresh data
 */

import { NextResponse } from 'next/server';
import { getFastTokenResponse, triggerBackgroundRefresh } from '@/lib/solana/fast-discovery';
import { quickRiskCheck } from '@/lib/solana/anti-rug';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 50)));
    const search = searchParams.get('search') ?? undefined;
    const includeRisk = searchParams.get('includeRisk') === 'true';

    // Get fast response
    const { tokens, source, stale } = await getFastTokenResponse({ limit, search });

    // Trigger background refresh if stale
    if (stale) {
      triggerBackgroundRefresh();
    }

    // Optionally add risk analysis
    let responseTokens = tokens;
    if (includeRisk) {
      responseTokens = tokens.map(t => ({
        ...t,
        risk: quickRiskCheck(t),
      }));
    }

    const elapsed = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      tokens: responseTokens,
      meta: {
        source,
        stale,
        count: responseTokens.length,
        elapsed: `${elapsed}ms`,
      },
    });
  } catch (err: any) {
    console.error('[Fast Tokens API] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
