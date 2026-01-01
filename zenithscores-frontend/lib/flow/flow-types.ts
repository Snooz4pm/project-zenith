// Flow System Types
// Live market transaction intelligence & flow regime detection

// =============================================================================
// ENUMS
// =============================================================================

export enum TxType {
    BUY = 'BUY',
    SELL = 'SELL'
}

export enum TxClassification {
    WHALE_MOVE = 'WHALE_MOVE',
    NEW_WALLET = 'NEW_WALLET',
    BOT_LIKE = 'BOT_LIKE',
    DIP_BUY = 'DIP_BUY',
    SELL_PRESSURE = 'SELL_PRESSURE',
    ACCUMULATION = 'ACCUMULATION',
    DISTRIBUTION = 'DISTRIBUTION',
    NORMAL = 'NORMAL'
}

export enum FlowRegime {
    QUIET = 'QUIET',
    ACTIVE = 'ACTIVE',
    FRENZY = 'FRENZY'
}

// =============================================================================
// TRANSACTION TYPES
// =============================================================================

export interface NormalizedTx {
    id: string;
    timestamp: number;
    type: TxType;
    sizeUsd: number;
    chainId: string;
    pairSymbol: string;
    classification: TxClassification;
    summary: string;
    impact: number; // 0-100
}

export interface TxAnalysisContext {
    recentTxs: NormalizedTx[];
    avgSizeUsd: number;
    priceChange1h: number;
    priceChange24h: number;
    buyCount5m: number;
    sellCount5m: number;
}

// =============================================================================
// FLOW REGIME TYPES
// =============================================================================

export interface FlowMetrics {
    txFrequency: number;      // tx per minute
    avgSize: number;          // avg USD size
    buyRatio: number;         // 0-1, buy dominance
    velocity: number;         // rate of change
    whaleActivity: boolean;   // whale detected
}

export interface FlowState {
    regime: FlowRegime;
    metrics: FlowMetrics;
    lastUpdate: number;
    regimeHistory: { regime: FlowRegime; timestamp: number }[];
}

// =============================================================================
// FLOW EVENT TYPES (for Market Log)
// =============================================================================

export interface FlowEvent {
    timestamp: number;
    type: 'FLOW' | 'FLOW_REGIME' | 'WHALE_ALERT' | 'PRESSURE';
    message: string;
}

// =============================================================================
// HOOK RETURN TYPE
// =============================================================================

export interface FlowSystemState {
    transactions: NormalizedTx[];
    regime: FlowRegime;
    metrics: FlowMetrics;
    flowEvents: FlowEvent[];
    isPolling: boolean;
    error: string | null;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

export const FLOW_CONFIG = {
    POLL_INTERVAL_MS: 4000,
    MAX_TRANSACTIONS: 50,
    ROLLING_WINDOW_MS: 60000,

    // Classification thresholds
    WHALE_MULTIPLIER: 10,      // 10x avg = whale
    BOT_WINDOW_MS: 30000,      // 30s for bot detection
    BOT_TX_THRESHOLD: 3,       // 3+ tx in 30s = bot
    SELL_PRESSURE_COUNT: 3,    // 3+ sells in 2min
    SELL_PRESSURE_WINDOW_MS: 120000,
    DIP_THRESHOLD: -5,         // -5% = dip

    // Regime thresholds
    QUIET_TX_PER_MIN: 5,
    FRENZY_TX_PER_MIN: 20

} as const;
