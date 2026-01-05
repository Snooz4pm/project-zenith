/**
 * GET /api/arena/solana/risk
 * 
 * Analyze token risk
 */

import { NextResponse } from 'next/server';
import { analyzeTokenRisk, quickRiskCheck } from '@/lib/solana/anti-rug';
import { getSolanaTokens } from '@/lib/solana/discovery';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mint = searchParams.get('mint');
    const quick = searchParams.get('quick') === 'true';

    if (!mint) {
      return NextResponse.json(
        { success: false, error: 'Missing mint parameter' },
        { status: 400 }
      );
    }

    // Find token
    const tokens = await getSolanaTokens();
    const token = tokens.find(t => t.mint === mint);

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token not found' },
        { status: 404 }
      );
    }

    // Quick or full analysis
    if (quick) {
      const risk = quickRiskCheck(token);
      return NextResponse.json({
        success: true,
        mint: token.mint,
        symbol: token.symbol,
        ...risk,
      });
    }

    // Full analysis
    const analysis = analyzeTokenRisk(token);
    return NextResponse.json({
      success: true,
      ...analysis,
    });
  } catch (err: any) {
    console.error('[Risk API] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
