export type SignalType = 'STRONG_BUY' | 'BUY' | 'HOLD' | 'AVOID';

export interface ScoreBreakdown {
  momentum: number;      // 0-100, based on price change velocity
  volume: number;        // 0-100, based on volume vs average
  trend: number;         // 0-100, based on trend alignment
  risk: number;          // 0-100, volatility penalty (inverted)
  final: number;         // Weighted final score
}

export interface AssetData {
  symbol: string;
  priceChange24h: number;
  priceChange7d?: number;
  volume24h: number;
  avgVolume?: number;
  volatility?: number;
  marketCap?: number;
}

/**
 * Calculate Zenith Score with weighted factors
 * Momentum (35%) + Volume (25%) + Trend (25%) - Risk (15%)
 */
export function calculateZenithScore(asset: AssetData): ScoreBreakdown {
  // Momentum Score (based on 24h price change)
  // -10% = 0, 0% = 50, +10% = 100
  const momentumRaw = Math.min(100, Math.max(0, 50 + (asset.priceChange24h * 5)));

  // Volume Score (based on volume vs average)
  const avgVol = asset.avgVolume || asset.volume24h;
  const volumeRatio = asset.volume24h / avgVol;
  const volumeRaw = Math.min(100, Math.max(0, volumeRatio * 50));

  // Trend Score (7d alignment with 24h)
  let trendRaw = 50; // neutral default
  if (asset.priceChange7d !== undefined) {
    const sameDirection = (asset.priceChange24h >= 0) === (asset.priceChange7d >= 0);
    const strength = Math.abs(asset.priceChange7d);
    trendRaw = sameDirection ? Math.min(100, 50 + strength * 3) : Math.max(0, 50 - strength * 3);
  }

  // Risk Score (based on volatility - lower is better)
  const volatility = asset.volatility || Math.abs(asset.priceChange24h) * 2;
  const riskRaw = Math.min(100, Math.max(0, volatility * 5));

  // Weighted calculation
  const weights = {
    momentum: 0.35,
    volume: 0.25,
    trend: 0.25,
    risk: 0.15
  };

  const final = Math.round(
    momentumRaw * weights.momentum +
    volumeRaw * weights.volume +
    trendRaw * weights.trend -
    riskRaw * weights.risk
  );

  return {
    momentum: Math.round(momentumRaw),
    volume: Math.round(volumeRaw),
    trend: Math.round(trendRaw),
    risk: Math.round(riskRaw),
    final: Math.min(100, Math.max(0, final))
  };
}

/**
 * Quick score calculation (returns just the number)
 */
export function getQuickScore(priceChange: number, volume: number): number {
  const asset: AssetData = {
    symbol: 'TEMP',
    priceChange24h: priceChange,
    volume24h: volume
  };
  return calculateZenithScore(asset).final;
}

export const getZenithSignal = (score: number): { label: string; type: SignalType; bg: string; text: string } => {
  if (score >= 80) return { label: 'STRONG BULL', type: 'STRONG_BUY', bg: 'bg-score-bull-strong', text: 'text-score-bull-strong' };
  if (score >= 60) return { label: 'BULLISH', type: 'BUY', bg: 'bg-score-bull-mild', text: 'text-score-bull-mild' };
  if (score >= 40) return { label: 'NEUTRAL', type: 'HOLD', bg: 'bg-score-neutral', text: 'text-score-neutral' };
  if (score >= 20) return { label: 'BEARISH', type: 'AVOID', bg: 'bg-score-bear-mild', text: 'text-score-bear-mild' };
  return { label: 'STRONG BEAR', type: 'AVOID', bg: 'bg-score-bear-strong', text: 'text-score-bear-strong' };
};

export const getMockTagline = (score: number, change: number): string => {
  if (score >= 80) return "High momentum + strong volume surge.";
  if (score >= 60) return "Healthy accumulation phase detected.";
  if (score >= 40) return "Consolidating with mixed signals.";
  return "High volatility and sell pressure.";
};

export const generateInsight = (token: { symbol: string; zenith_score: number; price_change_24h: number; volume_24h: number }): string => {
  const { symbol, zenith_score, price_change_24h, volume_24h } = token;

  if (zenith_score >= 80) {
    if (volume_24h > 1000000) return `${symbol} is rated Strong Buy because trading volume is surging alongside price momentum.`;
    return `${symbol} is breaking out with a dominant Zenith Score, indicating aggressive accumulation.`;
  }
  if (zenith_score >= 60) {
    return `${symbol} shows healthy organic growth, outperforming the sector average today.`;
  }
  if (zenith_score >= 40) {
    return `${symbol} is in a consolidation zone; waiting for a clearer directional signal.`;
  }
  return `${symbol} is flagging risk signals due to declining momentum or sell pressure.`;
};

/**
 * Get score color classes
 */
export function getScoreColor(score: number): { bg: string; text: string; border: string } {
  if (score >= 80) return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' };
  if (score >= 60) return { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' };
  if (score >= 40) return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' };
  if (score >= 20) return { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' };
  return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' };
}
