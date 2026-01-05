/**
 * Solana Flow API
 * 
 * Returns hot tokens, meme flow, and new pairs from Raydium/Orca.
 * NO DexScreener - uses our Solana discovery system.
 */

import { NextResponse } from 'next/server';
import { getSolanaTokens } from '@/lib/solana/discovery';
import { 
  SolanaFlowData, 
  toDisplayToken, 
  isMemeToken 
} from '@/lib/solana/display-types';
import { analyzeTokenRisk } from '@/lib/solana/anti-rug';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Get tokens from Raydium + Orca
    const tokens = await getSolanaTokens();

    // Sort by liquidity for hot tokens
    const byLiquidity = [...tokens].sort((a, b) => b.liquidityUsd - a.liquidityUsd);

    // Convert to display format with risk analysis
    const displayTokens = await Promise.all(
      byLiquidity.slice(0, 50).map(async (token) => {
        const display = toDisplayToken(token, {
          priceUsd: 0, // Will be filled by Jupiter quote on frontend
          priceChange24h: (Math.random() - 0.3) * 40, // Simulated until we have price feed
          volume24hUsd: token.liquidityUsd * (0.1 + Math.random() * 0.3),
        });

        // Add risk analysis
        const risk = analyzeTokenRisk(token);
        display.riskLevel = risk.riskLevel;
        display.safetyScore = risk.safetyScore;
        display.isMeme = isMemeToken(token);
        display.isHot = token.liquidityUsd > 100000;

        return display;
      })
    );

    // Categorize tokens
    const hotNow = displayTokens
      .filter(t => t.isHot && t.safetyScore && t.safetyScore >= 50)
      .slice(0, 8);

    const memeFlow = displayTokens
      .filter(t => t.isMeme)
      .slice(0, 8);

    const newPairs = displayTokens
      .filter(t => t.liquidityUsd < 50000 && t.liquidityUsd > 5000)
      .slice(0, 8);

    const flowData: SolanaFlowData = {
      hotNow,
      memeFlow,
      newPairs,
    };

    return NextResponse.json(flowData);
  } catch (error) {
    console.error('[Flow API Error]', error);
    return NextResponse.json(
      { error: 'Failed to fetch flow data', hotNow: [], memeFlow: [], newPairs: [] },
      { status: 500 }
    );
  }
}
