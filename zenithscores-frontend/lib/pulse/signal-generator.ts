import { OHLCV } from '@/lib/market-data/types';
import { PulseSignal } from './types';

/**
 * MATH CONSTANTS
 */
const WINDOW_RECENT = 20;
const WINDOW_PAST = 20; // past window size (offset by recent)
const COMPRESSION_THRESHOLD = 0.6;
const VOLUME_SPIKE_THRESHOLD = 2.0;
const LIQUIDITY_ZONE_THRESHOLD = 0.15;

/**
 * Generate Log-Style Market Signals
 */
export function generateMarketSignals(data: OHLCV[], currentRegime: string): PulseSignal[] {
    const signals: PulseSignal[] = [];
    if (!data || data.length < 50) return signals;

    // Use latest closed candle or current?
    // User says "Market Pulse", implies reactive.
    // data is typically sorted oldest -> newest (index 0 is old).
    // Let's assume data[data.length - 1] is latest.
    const n = data.length;
    const latest = data[n - 1];

    // 1. VOLATILITY COMPRESSION
    // range_recent = max(high[-20]) - min(low[-20])
    // range_past = max(high[-40:-20]) - min(low[-40:-20])
    const recentWindow = data.slice(n - WINDOW_RECENT);
    const pastWindow = data.slice(n - WINDOW_RECENT - WINDOW_PAST, n - WINDOW_RECENT);

    if (recentWindow.length === WINDOW_RECENT && pastWindow.length === WINDOW_PAST) {
        const rangeRecent = Math.max(...recentWindow.map(c => c.high)) - Math.min(...recentWindow.map(c => c.low));
        const rangePast = Math.max(...pastWindow.map(c => c.high)) - Math.min(...pastWindow.map(c => c.low));

        if (rangePast > 0) {
            const compressionRatio = rangeRecent / rangePast;
            if (compressionRatio < COMPRESSION_THRESHOLD) {
                const percent = Math.round((1 - compressionRatio) * 100);
                signals.push({
                    id: `vol-comp-${latest.time}`,
                    timestamp: latest.time * 1000,
                    category: 'structure',
                    message: `VOL_COMPRESSION — Range tightening detected (−${percent}%)`,
                    confidence: 'high',
                    ttl: 300 // 5 min
                });
            }
        }
    }

    // 2. RANGE MATURITY (Simplified: use recent 30 candles)
    // inside = count(close >= range_low && close <= range_high)
    // We need a defined range. Let's use the recent window high/low as "range".
    const rangeHigh = Math.max(...recentWindow.map(c => c.high));
    const rangeLow = Math.min(...recentWindow.map(c => c.low));
    const rangeWidth = rangeHigh - rangeLow;

    // Maturity logic: how many recent closes are "inside" the active range?
    // Actually, if we define range by the window itself, ALL are inside.
    // The user implies a *persisting* range.
    // Let's look at a slightly wider window (30) and check if they stay within the *recent* (20) bounds.
    const maturityWindow = data.slice(n - 30);
    if (maturityWindow.length === 30 && rangeWidth > 0) {
        const insideCount = maturityWindow.filter(c => c.close >= rangeLow && c.close <= rangeHigh).length;
        const maturity = insideCount / 30;

        if (maturity >= 0.8) {
            signals.push({
                id: `range-mat-${latest.time}`,
                timestamp: latest.time * 1000,
                category: 'meta',
                message: `RANGE_MATURITY — Price contained for ${insideCount}/30 candles`,
                confidence: 'medium',
                ttl: 300
            });
        }
    }

    // 3. FAILED BREAKOUT
    // attempt = high > range_high
    // failure = close < range_high
    // Check latest candle against the *previous* range (excluding latest).
    const prevWindow = data.slice(n - WINDOW_RECENT - 1, n - 1);
    if (prevWindow.length > 0) {
        const prevRangeHigh = Math.max(...prevWindow.map(c => c.high));
        const prevRangeLow = Math.min(...prevWindow.map(c => c.low));

        if (latest.high > prevRangeHigh && latest.close < prevRangeHigh) {
            signals.push({
                id: `false-break-up-${latest.time}`,
                timestamp: latest.time * 1000,
                category: 'weakness',
                message: `FALSE_BREAK — Upside breakout rejected at ${prevRangeHigh.toFixed(2)}`,
                confidence: 'medium',
                ttl: 120
            });
        }

        if (latest.low < prevRangeLow && latest.close > prevRangeLow) {
            signals.push({
                id: `false-break-down-${latest.time}`,
                timestamp: latest.time * 1000,
                category: 'strength',
                message: `FALSE_BREAK — Breakdown attempt absorbed at range low`,
                confidence: 'medium',
                ttl: 120
            });
        }

        // 5. LIQUIDITY BUILDUP (Range Edge)
        // distance = abs(close - range_low) / range_width
        if (rangeWidth > 0) {
            const distLow = Math.abs(latest.close - prevRangeLow) / rangeWidth;
            const distHigh = Math.abs(latest.close - prevRangeHigh) / rangeWidth;

            if (distLow < LIQUIDITY_ZONE_THRESHOLD) {
                signals.push({
                    id: `liq-low-${latest.time}`,
                    timestamp: latest.time * 1000,
                    category: 'neutral',
                    message: `LIQUIDITY_ZONE — Activity clustering near range low`,
                    confidence: 'low',
                    ttl: 300
                });
            } else if (distHigh < LIQUIDITY_ZONE_THRESHOLD) {
                signals.push({
                    id: `liq-high-${latest.time}`,
                    timestamp: latest.time * 1000,
                    category: 'neutral',
                    message: `LIQUIDITY_ZONE — Activity clustering near range high`,
                    confidence: 'low',
                    ttl: 300
                });
            }
        }
    }


    // 4. VOLUME SPIKE
    // avg_volume = mean(volume[-20])
    // spike_ratio = volume_current / avg_volume
    const avgVol = recentWindow.reduce((acc, c) => acc + c.volume, 0) / recentWindow.length;
    if (avgVol > 0) {
        const spikeRatio = latest.volume / avgVol;
        if (spikeRatio >= VOLUME_SPIKE_THRESHOLD) {
            signals.push({
                id: `vol-spike-${latest.time}`,
                timestamp: latest.time * 1000,
                category: 'meta',
                message: `VOLUME_SPIKE — Participation surge (${spikeRatio.toFixed(1)}× avg)`,
                confidence: 'medium',
                ttl: 180
            });
        }
    }

    // 6. REGIME CONFIRMATION
    // Logic: Just log the current regime every now and then? 
    // Or simpler: always return it as a "state" signal at the top, or push it if it changed (hard to track change without state).
    // Valid log: "REGIME_LOCK — Market remains in RANGE state"
    // We'll push it with a unique ID that updates every ~hour? Or just distinct ID per regime.
    // Let's make it always present as the "baseline".
    signals.push({
        id: `regime-${currentRegime}-${latest.time}`, // Updates each candle
        timestamp: latest.time * 1000,
        category: 'structure',
        message: `REGIME_LOCK — Market remains in ${currentRegime.toUpperCase()} state`,
        confidence: 'high',
        ttl: 600
    });

    return signals.sort((a, b) => b.timestamp - a.timestamp);
}
