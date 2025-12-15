export type SignalType = 'STRONG_BUY' | 'BUY' | 'HOLD' | 'AVOID';

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
