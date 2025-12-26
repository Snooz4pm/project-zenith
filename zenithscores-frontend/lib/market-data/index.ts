/**
 * Market Data Module - Main Export
 */

// Types
export * from './types';

// Normalizer utilities  
export {
    normalizeFinnhubCandles,
    normalizeDexScreenerToQuote,
    normalizeAlphaVantageDaily,
    normalizeAlphaVantageIntraday,
    normalizeAlphaVantageForex,
    generateSyntheticOHLCV,
    cleanOHLCV,
    fillOHLCVGaps,
} from './normalizer';

// Resolver - THE entry point
export {
    getOHLCV,
    fetchMarketData,
    detectAssetType,
} from './resolver';
