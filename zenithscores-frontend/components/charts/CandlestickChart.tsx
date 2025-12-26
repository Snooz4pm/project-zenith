'use client';

/**
 * CandlestickChart - Wrapper for ZenithChart
 * 
 * This file re-exports ZenithChart as the default candlestick chart.
 * ZenithChart is our 100% custom canvas chart - no TradingView.
 */

import ZenithChart from './ZenithChart';
export type { default as ZenithChart } from './ZenithChart';

// Re-export ZenithChart as the default candlestick chart
export default ZenithChart;
