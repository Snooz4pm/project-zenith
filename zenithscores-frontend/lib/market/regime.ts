/**
 * REGIME_COLORS - Centralized color system for market visualization
 * Used across all market pages for visual coherence
 */

export const REGIME_COLORS = {
    trend: '#22c55e',      // calm green
    breakout: '#3b82f6',   // confident blue  
    range: '#f59e0b',      // amber
    chaos: '#a855f7',      // violet
    breakdown: '#ef4444'   // red
} as const;

export type Regime = keyof typeof REGIME_COLORS;
export type Volatility = 'low' | 'medium' | 'high';

/**
 * Derive regime from price change
 * Simple heuristic for now - can be enhanced with more data
 */
export function deriveRegime(changePct: number): Regime {
    if (Math.abs(changePct) < 0.5) return 'range';
    if (changePct >= 3) return 'breakout';
    if (changePct <= -3) return 'breakdown';
    if (changePct > 0) return 'trend';
    return 'chaos';
}

/**
 * Derive volatility from change magnitude
 */
export function deriveVolatility(changePct: number): Volatility {
    const absChange = Math.abs(changePct);
    if (absChange < 1) return 'low';
    if (absChange < 3) return 'medium';
    return 'high';
}

/**
 * Derive confidence score (placeholder - enhance with real intelligence)
 */
export function deriveConfidence(changePct: number, volume?: number): number {
    // Placeholder: 50-90 based on momentum
    const base = 55;
    const momentum = Math.min(Math.abs(changePct) * 5, 30);
    return Math.round(base + momentum);
}

/**
 * Get regime label for display
 */
export function getRegimeLabel(regime: Regime): string {
    switch (regime) {
        case 'trend': return 'Trending';
        case 'breakout': return 'Breakout';
        case 'breakdown': return 'Breakdown';
        case 'range': return 'Ranging';
        case 'chaos': return 'Uncertain';
    }
}

/**
 * Get bias label from regime
 */
export function getBias(regime: Regime): 'Bullish' | 'Bearish' | 'Neutral' {
    if (regime === 'trend' || regime === 'breakout') return 'Bullish';
    if (regime === 'breakdown') return 'Bearish';
    return 'Neutral';
}
