export type SignalType = 'STRONG_BUY' | 'BUY' | 'HOLD' | 'AVOID';

export const getZenithSignal = (score: number): { label: string; type: SignalType; color: string; bg: string; text: string } => {
  if (score >= 80) return { label: 'STRONG BUY', type: 'STRONG_BUY', color: '#4CAF50', bg: 'bg-[#4CAF50]', text: 'text-[#4CAF50]' };
  if (score >= 60) return { label: 'BUY', type: 'BUY', color: '#66BB6A', bg: 'bg-[#66BB6A]', text: 'text-[#66BB6A]' };
  if (score >= 40) return { label: 'HOLD', type: 'HOLD', color: '#FFEB3B', bg: 'bg-[#FFEB3B]', text: 'text-[#FFEB3B]' };
  return { label: 'AVOID', type: 'AVOID', color: '#F44336', bg: 'bg-[#F44336]', text: 'text-[#F44336]' };
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
        if (volume_24h > 1000000) return \\ is rated Strong Buy because trading volume is surging alongside price momentum.\;
        return \\ is breaking out with a dominant Zenith Score, indicating aggressive accumulation.\;
    }
    if (zenith_score >= 60) {
        return \\ shows healthy organic growth, outperforming the sector average today.\;
    }
    if (zenith_score >= 40) {
        return \\ is in a consolidation zone; waiting for a clearer directional signal.\;
    }
    return \\ is flagging risk signals due to declining momentum or sell pressure.\;
};
