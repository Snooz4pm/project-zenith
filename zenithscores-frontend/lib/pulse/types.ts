/**
 * Live Pulse - Real-time market signal stream
 * Replaces static AI context with dynamic micro-events
 */

export type PulseCategory = 'strength' | 'weakness' | 'neutral' | 'structure' | 'meta';

export type PulseConfidence = 'high' | 'medium' | 'low';

export interface PulseSignal {
  id: string;
  timestamp: number;
  category: PulseCategory;
  message: string;
  confidence: PulseConfidence;
  ttl: number; // seconds until expires
  debug?: {
    formula: string;    // e.g. "Range(20) / AvgRange(40)"
    values: string;     // e.g. "12.5 / 30.0 = 0.41"
    threshold: string;  // e.g. "< 0.60"
  };
  data?: {
    // Supporting data for click interactions
    price?: number;
    level?: number;
    timeframe?: string;
    [key: string]: any;
  };
}

export interface PulseConfig {
  maxSignals?: number;      // Max signals to show (default: 10)
  refreshInterval?: number;  // Refresh interval in ms (default: 120000 = 2min)
  enableAutoExpiry?: boolean; // Auto-remove expired signals (default: true)
}
