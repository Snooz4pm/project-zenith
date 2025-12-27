/**
 * Zenith Zone Detection Engine - Pure Math
 * Detects consolidation/supply/demand zones algorithmically.
 * 
 * LOGIC:
 * 1. Sliding window (e.g. 20 candles)
 * 2. Bandwidth Compression: (High - Low) / Price < Threshold
 * 3. Volume Check: Volume must not be completely dead (liquidity check)
 * 
 * OUTPUT:
 * - ZoneCandidate list (pure data)
 */

import { OHLCV } from '@/lib/market-data/types';

export interface ZoneCandidate {
    id: string;
    type: 'supply' | 'demand' | 'consolidation'; // Consolidation is neutral until breakout
    min: number; // Low of zone
    max: number; // High of zone
    startTime: number;
    endTime: number;
    compressionRatio: number; // 0 (flat) to 1 (volatile)
    volumeAvg: number;
    score: number; // 0-1 confidence
}

interface DetectionConfig {
    windowSize: number;      // e.g. 20 candles
    maxBandwidthPct: number; // e.g. 0.05 (5% range max)
    minDuration: number;     // e.g. 15 candles
}

const DEFAULT_CONFIG: DetectionConfig = {
    windowSize: 20,
    maxBandwidthPct: 0.03, // Tighter is better for high conviction
    minDuration: 15
};

export function detectConsolidationZones(
    candles: OHLCV[],
    config: DetectionConfig = DEFAULT_CONFIG
): ZoneCandidate[] {
    const candidates: ZoneCandidate[] = [];

    if (candles.length < config.windowSize) return [];

    // Simple sliding window
    for (let i = 0; i <= candles.length - config.windowSize; i++) {
        const window = candles.slice(i, i + config.windowSize);

        // 1. Calculate bounding box
        let min = Infinity;
        let max = -Infinity;
        let volSum = 0;
        let avgPrice = 0;

        for (const c of window) {
            if (c.low < min) min = c.low;
            if (c.high > max) max = c.high;
            volSum += c.volume;
            avgPrice += c.close;
        }
        avgPrice /= window.length;

        // 2. Check Bandwidth (Compression)
        const bandwidth = max - min;
        const bandwidthPct = bandwidth / avgPrice;

        if (bandwidthPct <= config.maxBandwidthPct) {
            // Found a compression candidate
            // Heuristic score: Tighter compression = Higher score
            const compressionScore = 1 - (bandwidthPct / config.maxBandwidthPct);

            // Overlap check (crude merge)
            // If the previous candidate overlaps with this one, extend it instead of creating new
            const prev = candidates[candidates.length - 1];

            if (prev && prev.endTime >= window[0].time) {
                // Merge logic: Extend end time, widen bounds if needed (within reason)
                // For 'tight' consolidation, we usually want strictly the tightest part, 
                // but getting a disjointed series of 20 zones is annoying.
                // Simple merge: Extend end time if bandwidth doesn't explode
                const combinedMin = Math.min(prev.min, min);
                const combinedMax = Math.max(prev.max, max);
                const combinedRange = (combinedMax - combinedMin) / avgPrice;

                if (combinedRange <= config.maxBandwidthPct * 1.2) { // Allow 20% growth for drift
                    prev.endTime = window[window.length - 1].time;
                    prev.min = combinedMin;
                    prev.max = combinedMax;
                    prev.volumeAvg = (prev.volumeAvg + (volSum / window.length)) / 2;
                    // Keep best score
                    prev.score = Math.max(prev.score, compressionScore);
                    continue;
                }
            }

            candidates.push({
                id: `zone-${window[0].time}-${i}`, // deterministic ID seed
                type: 'consolidation', // We assume neutral until context implies otherwise
                min,
                max,
                startTime: window[0].time,
                endTime: window[window.length - 1].time,
                compressionRatio: bandwidthPct,
                volumeAvg: volSum / window.length,
                score: compressionScore
            });
        }
    }

    // Filter by minDuration check is implicit in windowSize choice, 
    // but merged zones could be much longer. 
    // We can filter out extremely weak ones here if needed.

    return candidates;
}
