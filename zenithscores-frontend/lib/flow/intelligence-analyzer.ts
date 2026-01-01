// Intelligence Analyzer
// Rule-based transaction classification with institutional-tone summaries

import {
    TxType,
    TxClassification,
    NormalizedTx,
    TxAnalysisContext,
    FLOW_CONFIG
} from './flow-types';

// =============================================================================
// CLASSIFICATION ENGINE
// =============================================================================

export function classifyTransaction(
    tx: Omit<NormalizedTx, 'classification' | 'summary' | 'impact'>,
    context: TxAnalysisContext
): { classification: TxClassification; summary: string; impact: number } {

    const { sizeUsd, type, timestamp } = tx;
    const { recentTxs, avgSizeUsd, priceChange1h, buyCount5m, sellCount5m } = context;

    // Calculate base impact
    let impact = Math.min(100, Math.round((sizeUsd / Math.max(avgSizeUsd, 1000)) * 30));

    // Rule 1: WHALE_MOVE - Size > 10x average
    if (sizeUsd > avgSizeUsd * FLOW_CONFIG.WHALE_MULTIPLIER) {
        impact = Math.min(100, impact + 40);
        const summary = type === TxType.BUY
            ? `Large buyer entered — ${formatSize(sizeUsd)} position opened.`
            : `Significant exit — ${formatSize(sizeUsd)} liquidated.`;
        return { classification: TxClassification.WHALE_MOVE, summary, impact };
    }

    // Rule 2: BOT_LIKE - Multiple tx in short window (30s)
    const recentSameSide = recentTxs.filter(
        t => t.type === type &&
            timestamp - t.timestamp < FLOW_CONFIG.BOT_WINDOW_MS
    );
    if (recentSameSide.length >= FLOW_CONFIG.BOT_TX_THRESHOLD) {
        impact = Math.min(100, impact + 15);
        const summary = `Automated activity detected — ${recentSameSide.length + 1} ${type.toLowerCase()}s in 30s.`;
        return { classification: TxClassification.BOT_LIKE, summary, impact };
    }

    // Rule 3: SELL_PRESSURE - 3+ sells in 2 minutes
    if (type === TxType.SELL) {
        const recentSells = recentTxs.filter(
            t => t.type === TxType.SELL &&
                timestamp - t.timestamp < FLOW_CONFIG.SELL_PRESSURE_WINDOW_MS
        );
        if (recentSells.length >= FLOW_CONFIG.SELL_PRESSURE_COUNT - 1) {
            impact = Math.min(100, impact + 25);
            const summary = `Sell pressure increasing — ${recentSells.length + 1} sells in 2 minutes.`;
            return { classification: TxClassification.SELL_PRESSURE, summary, impact };
        }
    }

    // Rule 4: DIP_BUY - Buy after significant drop
    if (type === TxType.BUY && priceChange1h < FLOW_CONFIG.DIP_THRESHOLD) {
        impact = Math.min(100, impact + 20);
        const summary = `Dip buyer entered — accumulating after ${priceChange1h.toFixed(1)}% drop.`;
        return { classification: TxClassification.DIP_BUY, summary, impact };
    }

    // Rule 5: ACCUMULATION - Buy dominance
    if (type === TxType.BUY && buyCount5m > sellCount5m * 2) {
        impact = Math.min(100, impact + 10);
        const summary = `Accumulation phase — buy-side dominance detected.`;
        return { classification: TxClassification.ACCUMULATION, summary, impact };
    }

    // Rule 6: DISTRIBUTION - Sell dominance
    if (type === TxType.SELL && sellCount5m > buyCount5m * 2) {
        impact = Math.min(100, impact + 10);
        const summary = `Distribution phase — sell-side pressure building.`;
        return { classification: TxClassification.DISTRIBUTION, summary, impact };
    }

    // Default: NORMAL
    const summary = type === TxType.BUY
        ? `Standard buy order — ${formatSize(sizeUsd)} added.`
        : `Standard sell order — ${formatSize(sizeUsd)} removed.`;

    return { classification: TxClassification.NORMAL, summary, impact: Math.max(10, impact) };
}

// =============================================================================
// HELPERS
// =============================================================================

function formatSize(usd: number): string {
    if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`;
    if (usd >= 1_000) return `$${(usd / 1_000).toFixed(1)}k`;
    return `$${usd.toFixed(0)}`;
}

// =============================================================================
// BATCH ANALYSIS
// =============================================================================

export function analyzeTransactionBatch(
    txs: NormalizedTx[]
): { dominantFlow: 'BUY' | 'SELL' | 'NEUTRAL'; pressure: number } {
    if (txs.length === 0) return { dominantFlow: 'NEUTRAL', pressure: 0 };

    const buyVolume = txs
        .filter(t => t.type === TxType.BUY)
        .reduce((sum, t) => sum + t.sizeUsd, 0);

    const sellVolume = txs
        .filter(t => t.type === TxType.SELL)
        .reduce((sum, t) => sum + t.sizeUsd, 0);

    const total = buyVolume + sellVolume;
    if (total === 0) return { dominantFlow: 'NEUTRAL', pressure: 0 };

    const buyRatio = buyVolume / total;

    if (buyRatio > 0.6) return { dominantFlow: 'BUY', pressure: Math.round(buyRatio * 100) };
    if (buyRatio < 0.4) return { dominantFlow: 'SELL', pressure: Math.round((1 - buyRatio) * 100) };
    return { dominantFlow: 'NEUTRAL', pressure: 50 };
}
