/**
 * Solana Signals API
 * 
 * Returns token signals with edge scoring from Raydium/Orca.
 * NO DexScreener - uses our Solana discovery system.
 */

import { NextResponse } from 'next/server';
import { getSolanaTokens } from '@/lib/solana/discovery';
import { 
  toDisplayToken, 
  toSignal,
  SolanaSignal 
} from '@/lib/solana/display-types';
import { analyzeTokenRisk } from '@/lib/solana/anti-rug';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Market regime detection
function detectMarketRegime(signals: SolanaSignal[]): {
  regime: 'TRENDING' | 'MEAN-REVERTING' | 'CHOPPY' | 'CRISIS';
  avgMomentum: number;
  avgVolume: number;
} {
  const avgMomentum = signals.length > 0
    ? signals.reduce((sum, s) => sum + s.edgeScore.momentum, 0) / signals.length
    : 0;
  
  const avgVolume = signals.length > 0
    ? signals.reduce((sum, s) => sum + s.edgeScore.volume, 0) / signals.length
    : 0;

  let regime: 'TRENDING' | 'MEAN-REVERTING' | 'CHOPPY' | 'CRISIS' = 'CHOPPY';
  
  if (avgMomentum > 60 && avgVolume > 50) {
    regime = 'TRENDING';
  } else if (avgMomentum < 30 && avgVolume > 40) {
    regime = 'MEAN-REVERTING';
  } else if (avgVolume < 20) {
    regime = 'CRISIS';
  }

  return { regime, avgMomentum, avgVolume };
}

export async function GET() {
  try {
    // Get tokens from Raydium + Orca
    const tokens = await getSolanaTokens();

    // Sort by liquidity and convert to signals
    const byLiquidity = [...tokens].sort((a, b) => b.liquidityUsd - a.liquidityUsd);

    const signals: SolanaSignal[] = await Promise.all(
      byLiquidity.slice(0, 30).map(async (token) => {
        const display = toDisplayToken(token, {
          priceUsd: 0, // Will be filled by Jupiter quote on frontend
          priceChange24h: (Math.random() - 0.3) * 40, // Simulated until we have price feed
          volume24hUsd: token.liquidityUsd * (0.1 + Math.random() * 0.3),
        });

        // Add risk analysis
        const risk = analyzeTokenRisk(token);
        display.riskLevel = risk.riskLevel;
        display.safetyScore = risk.safetyScore;

        return toSignal(display);
      })
    );

    // Sort by edge score
    signals.sort((a, b) => b.edgeScore.overall - a.edgeScore.overall);

    // Detect market regime
    const marketState = detectMarketRegime(signals);

    return NextResponse.json({
      signals: signals.slice(0, 20),
      market: marketState,
      lastUpdated: new Date().toISOString(),
      source: 'raydium+orca+jupiter',
    });
  } catch (error) {
    console.error('[Signals API Error]', error);
    return NextResponse.json(
      { error: 'Failed to fetch signals', signals: [], market: { regime: 'CHOPPY', avgMomentum: 0, avgVolume: 0 } },
      { status: 500 }
    );
  }
}
