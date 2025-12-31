/**
 * useLivePulse Hook
 * Generates and manages Live Pulse signals from OHLCV data
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import type { OHLCV } from '@/lib/market-data/types';
import type { PulseSignal, PulseConfig } from '@/lib/pulse/types';
import { generatePulseSignals } from '@/lib/pulse/detectors';

interface UseLivePulseOptions extends PulseConfig {
  candles?: OHLCV[];
  enabled?: boolean;
}

export function useLivePulse(options: UseLivePulseOptions = {}) {
  const {
    candles = [],
    enabled = true,
    maxSignals = 10,
    refreshInterval = 120000, // 2 minutes
    enableAutoExpiry = true
  } = options;

  const [signals, setSignals] = useState<PulseSignal[]>([]);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  // Generate signals from candles
  const generateSignals = useMemo(() => {
    if (!enabled || candles.length === 0) return [];

    const detected = generatePulseSignals(candles);

    // Limit to maxSignals
    return detected.slice(0, maxSignals);
  }, [candles, enabled, maxSignals, lastUpdate]);

  // Update signals
  useEffect(() => {
    if (generateSignals.length > 0) {
      setSignals(prev => {
        // Merge new signals with existing ones, removing duplicates
        const merged = [...generateSignals];
        const newIds = new Set(generateSignals.map(s => s.id));

        // Keep existing signals that aren't duplicated
        prev.forEach(existingSignal => {
          if (!newIds.has(existingSignal.id)) {
            merged.push(existingSignal);
          }
        });

        // Sort by timestamp (newest first)
        return merged
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, maxSignals);
      });
    }
  }, [generateSignals, maxSignals]);

  // Auto-refresh signals
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      setLastUpdate(Date.now());
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [enabled, refreshInterval]);

  // Auto-expiry cleanup
  useEffect(() => {
    if (!enableAutoExpiry) return;

    const cleanup = setInterval(() => {
      const now = Date.now();
      setSignals(prev =>
        prev.filter(s => (now - s.timestamp) / 1000 < s.ttl)
      );
    }, 30000); // Check every 30 seconds

    return () => clearInterval(cleanup);
  }, [enableAutoExpiry]);

  // Filter active signals
  const activeSignals = useMemo(() => {
    if (!enableAutoExpiry) return signals;

    const now = Date.now();
    return signals.filter(s => (now - s.timestamp) / 1000 < s.ttl);
  }, [signals, enableAutoExpiry]);

  return {
    signals: activeSignals,
    isEnabled: enabled,
    lastUpdate,
    refresh: () => setLastUpdate(Date.now())
  };
}
