/**
 * ZenithScore v2 - Market Intelligence Types
 * 
 * CORE RULE:
 * v1 decides WHAT is good (convictionScore from API)
 * v2 decides HOW to explain and explore it (regime, factors, scenarios)
 */

// ============================================
// CORE DATA TYPES
// ============================================

/**
 * Normalized OHLCV data - the ONLY format charts accept
 * All markets (crypto, stocks, forex) map to this structure
 */
export type OHLCV = {
    timestamp: number;      // Unix ms
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
};

/**
 * Market regime classification
 * IMPORTANT: Regime is DERIVED from OHLCV, NOT AUTHORITATIVE
 * It does NOT override or affect v1 conviction score
 */
export type RegimeType = 'trend' | 'range' | 'breakout' | 'breakdown' | 'chaos';

/**
 * Market type identifier
 */
export type MarketType = 'crypto' | 'stock' | 'forex';

/**
 * UI mode state - NOT navigation, just filtering/display
 */
export type MarketMode = 'all' | 'algorithm';

// ============================================
// ASSET & SCORE TYPES
// ============================================

/**
 * Normalized asset with v1 conviction score + v2 derived data
 */
export type Asset = {
    id: string;                 // BTC-USD, AAPL, EURUSD
    market: MarketType;
    symbol: string;
    name: string;

    // Price data
    price: number;
    change24h?: number;

    // v1 Score (from merged API - NEVER recompute this)
    convictionScore: number;

    // v2 Derived intelligence (computed from OHLCV)
    regime: RegimeType;
    liquidityScore: number;     // 0-100
    volatilityScore: number;    // 0-100

    // Metadata for sync protection
    dataTimestamp: number;      // Unix ms of last API update
};

/**
 * Factor value with explanation
 * Used to EXPLAIN v1 score, NOT to compute it
 */
export type FactorValue = {
    value: number;              // Raw value
    percentile: number;         // 0-100 vs historical
    interpretation: string;     // Human explanation
};

/**
 * Factor Explanation Model (NON-AUTHORITATIVE)
 * 
 * NOTE: This model does NOT compute the official convictionScore.
 * It is an explanatory decomposition to help users understand WHY
 * an asset may have received a high score from v1.
 */
export type FactorStack = {
    momentum: FactorValue;
    volatility: FactorValue;
    liquidity: FactorValue;
    trend: FactorValue;
};

// ============================================
// ALGORITHM RESULT TYPES
// ============================================

/**
 * Probabilistic scenario for outlook section
 */
export type Scenario = {
    id: 'bull' | 'base' | 'bear';
    probability: number;        // Must sum to 100 across all scenarios
    description: string;
    trigger: string;
    expectedBehavior: string;
    riskSignal: string;
};

/**
 * Trade expression logic (EDUCATIONAL framing)
 * Always uses "If one were to express this view..." language
 */
export type TradeLogic = {
    horizon: 'short' | 'medium' | 'long';

    entryZone: {
        min: number;
        max: number;
        reasoning: string;
    };

    invalidationLevel: {
        price: number;
        reasoning: string;
    };

    positionSizing: {
        riskPercent: number;      // e.g., 1-2%
        explanation: string;
    };
};

/**
 * Complete algorithm result for Deep Analysis page
 */
export type AlgorithmResult = {
    assetId: string;

    // v1 Score (from API - NEVER override)
    convictionScore: number;

    // v2 Derived (from OHLCV)
    regime: RegimeType;
    factors: FactorStack;

    // Analysis content
    scenarios: Scenario[];
    tradeLogic: TradeLogic;
    invalidationSignals: string[];

    // Metadata
    dataTimestamp: number;
};

// ============================================
// API RESPONSE TYPES
// ============================================

/**
 * Asset snapshot from adapter (combines v1 + v2)
 */
export type AssetSnapshot = Asset & {
    ohlcv: OHLCV[];             // Already aggregated by API
    factors: FactorStack;
};

/**
 * Algorithm pick for conviction mode
 */
export type AlgorithmPick = {
    asset: AssetSnapshot;
    scenarios: Scenario[];
    tradeLogic: TradeLogic;
    invalidations: string[];
};

// ============================================
// CHART TYPES
// ============================================

/**
 * Indicator overlay configuration
 */
export type IndicatorType = 'ema20' | 'ema50' | 'ema200' | 'vwap' | 'atr';

/**
 * Chart zone for highlighting entry/invalidation
 */
export type ChartZone = {
    type: 'entry' | 'invalidation' | 'target';
    priceMin: number;
    priceMax: number;
    label: string;
};

/**
 * Props for chart components - receive data only, no fetching
 */
export type ChartProps = {
    data: OHLCV[];
    regime?: RegimeType;
    indicators?: IndicatorType[];
    zones?: ChartZone[];
    className?: string;
};

// ============================================
// INCLUSION RULES
// ============================================

/**
 * Thresholds for Algorithm Picks inclusion
 * v1 score is primary, v2 adds additional filters
 */
export const ALGORITHM_THRESHOLDS = {
    minConvictionScore: 70,     // v1 decides this
    minLiquidityFactor: 0.4,    // v2 filter
    excludedRegimes: ['chaos'] as RegimeType[],
} as const;

/**
 * Check if asset qualifies for Algorithm Picks
 */
export function isAlgorithmPick(asset: Asset): boolean {
    return (
        asset.convictionScore >= ALGORITHM_THRESHOLDS.minConvictionScore &&
        asset.liquidityScore >= ALGORITHM_THRESHOLDS.minLiquidityFactor * 100 &&
        !ALGORITHM_THRESHOLDS.excludedRegimes.includes(asset.regime)
    );
}
