/**
 * Professional Chart Engine - Type Definitions
 *
 * Core principle: Trust > Beauty
 * - Always show real data
 * - Always show delays
 * - Never fake smoothness
 */

export type ChartMode = 'candlestick' | 'line';

export type DataSource = 'dexscreener' | 'alphavantage' | 'finnhub';

export type DataStatus = 'live' | 'delayed' | 'paused' | 'error';

/**
 * Normalized OHLC data point
 * All data sources normalize to this format
 */
export interface OHLCPoint {
  timestamp: number; // Unix timestamp (ms)
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

/**
 * Chart data with metadata
 */
export interface ChartData {
  symbol: string;
  data: OHLCPoint[];
  lastUpdate: number; // When we last received data
  source: DataSource;
  interval: string; // e.g., '1m', '5m', '1h'
}

/**
 * Data freshness information
 */
export interface DataFreshness {
  status: DataStatus;
  delaySeconds: number; // How old is the latest data point
  lastPollTime: number; // When we last attempted to fetch
  nextPollTime: number; // When we'll poll again
}

/**
 * Chart configuration
 */
export interface ChartConfig {
  mode: ChartMode;
  windowSize: number; // Number of candles to show
  showVolume: boolean;
  showGrid: boolean;
  autoScroll: boolean; // Keep NOW visible
}
