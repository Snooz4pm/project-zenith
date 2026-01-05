/**
 * useRegimePolling hook - Stubbed for build compatibility
 * Polls for market regime data
 */
export type MarketType = 'crypto' | 'stock' | 'stocks' | 'forex';

export function useRegimePolling(marketType?: MarketType) {
  // Stubbed - returns minimal regime data
  return {
    regime: {
      label: 'NEUTRAL',
      confidence: 0,
      strength: 50,
      trend: 'CONSOLIDATION' as const,
    },
    chartData: [],
    isLive: false,
    loading: false,
    error: null,
  };
}
