import { useState, useEffect, useCallback } from 'react';
import { RegimeData } from '@/lib/regimes';
import { calculateCryptoRegime, generateMockCryptoMetrics } from '@/lib/regimes/crypto';
import { calculateForexRegime, generateMockForexMetrics } from '@/lib/regimes/forex';
import { calculateStocksRegime, generateMockStocksMetrics } from '@/lib/regimes/stocks';
import { smoothTransition } from '@/lib/regimes';

export type MarketType = 'crypto' | 'forex' | 'stocks';

interface UseRegimePollingResult {
  regime: RegimeData;
  chartData: number[];
  isLive: boolean;
}

/**
 * Polls market data and calculates regime strength
 * Updates every 30-60 seconds with smooth transitions
 */
export function useRegimePolling(marketType: MarketType): UseRegimePollingResult {
  const [regime, setRegime] = useState<RegimeData>({
    type: 'ranging',
    strength: 50,
    label: 'Loading...',
  });
  const [chartData, setChartData] = useState<number[]>([]);
  const [isLive, setIsLive] = useState(true);

  const fetchAndCalculateRegime = useCallback(() => {
    let newRegime: RegimeData;

    // Calculate regime based on market type
    switch (marketType) {
      case 'crypto':
        const cryptoMetrics = generateMockCryptoMetrics();
        newRegime = calculateCryptoRegime(cryptoMetrics);
        break;
      case 'forex':
        const forexMetrics = generateMockForexMetrics();
        newRegime = calculateForexRegime(forexMetrics);
        break;
      case 'stocks':
        const stocksMetrics = generateMockStocksMetrics();
        newRegime = calculateStocksRegime(stocksMetrics);
        break;
      default:
        newRegime = { type: 'ranging', strength: 50, label: 'Unknown' };
    }

    setRegime(newRegime);

    // Smooth transition to new strength value
    setChartData((prev) => smoothTransition(prev, newRegime.strength));
  }, [marketType]);

  // Initial load
  useEffect(() => {
    // Generate initial data
    const initialData = Array.from({ length: 30 }, () => 50 + (Math.random() - 0.5) * 20);
    setChartData(initialData);
    fetchAndCalculateRegime();
  }, []);

  // Polling effect
  useEffect(() => {
    // Random interval between 30-60 seconds
    const interval = 30000 + Math.random() * 30000;

    const timer = setInterval(() => {
      setIsLive(true);
      fetchAndCalculateRegime();

      // Flash "Live" indicator
      setTimeout(() => setIsLive(false), 2000);
    }, interval);

    return () => clearInterval(timer);
  }, [fetchAndCalculateRegime]);

  // When market type changes, smooth transition
  useEffect(() => {
    fetchAndCalculateRegime();
  }, [marketType, fetchAndCalculateRegime]);

  return { regime, chartData, isLive };
}
