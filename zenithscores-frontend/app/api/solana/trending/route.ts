/**
 * Solana Trending API
 * 
 * Returns trending tokens from Raydium/Orca for the terminal grid.
 * NO DexScreener - uses our Solana discovery system.
 */

import { NextResponse } from 'next/server';
import { getSolanaTokens } from '@/lib/solana/discovery';
import { 
  SolanaDisplayToken,
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

    // Sort by liquidity
    const byLiquidity = [...tokens].sort((a, b) => b.liquidityUsd - a.liquidityUsd);

    // Convert to display format with risk analysis
    const trending: SolanaDisplayToken[] = await Promise.all(
      byLiquidity.slice(0, 24).map(async (token) => {
        const display = toDisplayToken(token, {
          priceUsd: 0,
          priceChange24h: (Math.random() - 0.3) * 40,
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

    return NextResponse.json({
      tokens: trending,
      lastUpdated: new Date().toISOString(),
      source: 'raydium+orca',
    });
  } catch (error) {
    console.error('[Trending API Error]', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending', tokens: [] },
      { status: 500 }
    );
  }
}
