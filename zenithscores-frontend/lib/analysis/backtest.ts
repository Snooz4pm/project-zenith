
import { OHLCV } from '@/lib/market-data/types';
import { detectConsolidationZones, ZoneCandidate } from '@/lib/analysis/zoneDetection';

export interface BacktestResult {
    totalZones: number;
    respectRate: number; // 0-100% (Bounces / Interactions)
    invalidationRate: number; // 0-100% (Breaks / Interactions)
    avgBounceCount: number;
    score: number; // 0-100 Confidence Score
}

/**
 * Backtest Zone Reliability
 * Checks how often price respected detected zones in the past 1000 candles.
 */
export function backtestZoneReliability(data: OHLCV[]): BacktestResult {
    if (!data || data.length < 100) {
        return { totalZones: 0, respectRate: 0, invalidationRate: 0, avgBounceCount: 0, score: 50 };
    }

    // Limit lookback for performance
    const lookbackData = data.slice(-1000);
    const zones = detectConsolidationZones(lookbackData);

    let totalInteractions = 0;
    let successfulBounces = 0;
    let strictBreaks = 0;
    let totalBounces = 0;

    zones.forEach(zone => {
        // Find candles AFTER the zone formed
        const startIndex = lookbackData.findIndex(d => d.time > zone.endTime);
        if (startIndex === -1) return;

        let bounced = 0;
        let broken = false;

        for (let i = startIndex; i < lookbackData.length; i++) {
            const candle = lookbackData[i];

            // Check for Interaction (High/Low touches zone)
            const touching = (candle.low <= zone.max && candle.high >= zone.min);

            if (touching) {
                // Check for Break (Close outside)
                if (candle.close > zone.max * 1.001 || candle.close < zone.min * 0.999) {
                    strictBreaks++;
                    broken = true;
                    totalInteractions++;
                    break; // Zone invalidated, stop tracking
                } else {
                    // It's touching but closed inside or rejected -> Potential Bounce
                    // We need to see if it moves away. For simplicity, just count "touching without break" as respect for now,
                    // or better: count reaction candles.
                    bounced++;
                }
            }
        }

        if (!broken && bounced > 0) {
            successfulBounces++;
            totalInteractions++;
        }
        totalBounces += bounced;
    });

    if (totalInteractions === 0) {
        return { totalZones: zones.length, respectRate: 0, invalidationRate: 0, avgBounceCount: 0, score: 50 };
    }

    const respectRate = (successfulBounces / totalInteractions) * 100;
    const invalidationRate = (strictBreaks / totalInteractions) * 100;
    const avgBounceCount = totalBounces / zones.length;

    // Score: Higher respect rate is better.
    // Penalty for very low interaction count (sample size).
    const samplePenalty = Math.min(1, totalInteractions / 5);
    const score = respectRate * samplePenalty;

    return {
        totalZones: zones.length,
        respectRate,
        invalidationRate,
        avgBounceCount,
        score
    };
}
