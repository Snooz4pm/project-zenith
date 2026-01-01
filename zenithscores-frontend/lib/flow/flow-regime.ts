// Flow Regime Calculator
// Determines market activity state: QUIET | ACTIVE | FRENZY

import {
    FlowRegime,
    FlowMetrics,
    FlowState,
    FlowEvent,
    NormalizedTx,
    TxType,
    TxClassification,
    FLOW_CONFIG
} from './flow-types';

// =============================================================================
// REGIME CALCULATOR
// =============================================================================

export function calculateFlowRegime(
    transactions: NormalizedTx[],
    previousState: FlowState | null
): { state: FlowState; newEvents: FlowEvent[] } {
    const now = Date.now();
    const windowStart = now - FLOW_CONFIG.ROLLING_WINDOW_MS;
    const newEvents: FlowEvent[] = [];

    // Filter to rolling window
    const windowTxs = transactions.filter(t => t.timestamp > windowStart);

    // Calculate metrics
    const metrics = calculateMetrics(windowTxs, now);

    // Determine regime
    const regime = determineRegime(metrics);

    // Check for regime change
    if (previousState && previousState.regime !== regime) {
        newEvents.push({
            timestamp: now,
            type: 'FLOW_REGIME',
            message: `${previousState.regime} → ${regime}`
        });
    }

    // Check for whale activity
    const hasWhale = windowTxs.some(t => t.classification === TxClassification.WHALE_MOVE);
    if (hasWhale && (!previousState?.metrics.whaleActivity)) {
        newEvents.push({
            timestamp: now,
            type: 'WHALE_ALERT',
            message: 'Large participant detected in flow'
        });
    }

    // Check for pressure shift
    if (metrics.buyRatio > 0.7) {
        newEvents.push({
            timestamp: now,
            type: 'FLOW',
            message: 'Buy-side dominance detected'
        });
    } else if (metrics.buyRatio < 0.3) {
        newEvents.push({
            timestamp: now,
            type: 'PRESSURE',
            message: 'Sell pressure building'
        });
    }

    const state: FlowState = {
        regime,
        metrics,
        lastUpdate: now,
        regimeHistory: [
            ...(previousState?.regimeHistory || []).slice(-10),
            { regime, timestamp: now }
        ]
    };

    return { state, newEvents };
}

// =============================================================================
// METRICS CALCULATION
// =============================================================================

function calculateMetrics(txs: NormalizedTx[], now: number): FlowMetrics {
    if (txs.length === 0) {
        return {
            txFrequency: 0,
            avgSize: 0,
            buyRatio: 0.5,
            velocity: 0,
            whaleActivity: false
        };
    }

    // Transactions per minute
    const windowMinutes = FLOW_CONFIG.ROLLING_WINDOW_MS / 60000;
    const txFrequency = txs.length / windowMinutes;

    // Average size
    const avgSize = txs.reduce((sum, t) => sum + t.sizeUsd, 0) / txs.length;

    // Buy ratio
    const buys = txs.filter(t => t.type === TxType.BUY).length;
    const buyRatio = txs.length > 0 ? buys / txs.length : 0.5;

    // Velocity (tx in last 10s vs previous 10s)
    const last10s = txs.filter(t => now - t.timestamp < 10000).length;
    const prev10s = txs.filter(t => now - t.timestamp >= 10000 && now - t.timestamp < 20000).length;
    const velocity = prev10s > 0 ? (last10s - prev10s) / prev10s : 0;

    // Whale activity
    const whaleActivity = txs.some(t => t.classification === TxClassification.WHALE_MOVE);

    return {
        txFrequency,
        avgSize,
        buyRatio,
        velocity,
        whaleActivity
    };
}

// =============================================================================
// REGIME DETERMINATION
// =============================================================================

function determineRegime(metrics: FlowMetrics): FlowRegime {
    const { txFrequency, whaleActivity, velocity } = metrics;

    // FRENZY: High frequency OR whale involvement OR velocity spike
    if (
        txFrequency >= FLOW_CONFIG.FRENZY_TX_PER_MIN ||
        whaleActivity ||
        velocity > 1
    ) {
        return FlowRegime.FRENZY;
    }

    // QUIET: Low frequency
    if (txFrequency < FLOW_CONFIG.QUIET_TX_PER_MIN) {
        return FlowRegime.QUIET;
    }

    // ACTIVE: Everything else
    return FlowRegime.ACTIVE;
}

// =============================================================================
// REGIME DISPLAY HELPERS
// =============================================================================

export function getRegimeColor(regime: FlowRegime): string {
    switch (regime) {
        case FlowRegime.QUIET: return 'text-emerald-400';
        case FlowRegime.ACTIVE: return 'text-yellow-400';
        case FlowRegime.FRENZY: return 'text-red-400';
    }
}

export function getRegimeEmoji(regime: FlowRegime): string {
    switch (regime) {
        case FlowRegime.QUIET: return '🟢';
        case FlowRegime.ACTIVE: return '🟡';
        case FlowRegime.FRENZY: return '🔴';
    }
}

export function getRegimeBgColor(regime: FlowRegime): string {
    switch (regime) {
        case FlowRegime.QUIET: return 'bg-emerald-500/10';
        case FlowRegime.ACTIVE: return 'bg-yellow-500/10';
        case FlowRegime.FRENZY: return 'bg-red-500/10';
    }
}
