import {
    calculateBB,
    calculateADX,
    calculateEMA,
    calculateRSI,
    calculateAnchoredVWAP,
    MinimalCandle
} from '@/lib/chart/calculations';
import { OHLCV, RegimeType } from '@/lib/types/market';

export interface MarketState {
    regime: RegimeType;
    bias: 'bullish' | 'bearish' | 'neutral';
    strength: number; // 0-100
    factors: {
        adx: number;
        bandwidthPercentile: number; // 0-100, relative to recent history
        rsi: number;
        priceRelativeToEma: number; // % distance from EMA 20
    };
    signals: {
        isSqueeze: boolean; // Ready to fire
        isBreakout: boolean; // Currently expanding
        isTrending: boolean;
    };
    levels: {
        anchors: {
            sessionVwap?: number;
            highVolVwap?: number;
        };
    };
}

const HISTORY_LOOKBACK = 50; // Minimum candles needed

export function analyzeMarketState(data: OHLCV[]): MarketState {
    if (!data || data.length < HISTORY_LOOKBACK) {
        return createNeutralState();
    }

    // 1. Calculate Indicators
    const bb = calculateBB(data, 20, 2);
    const adxArr = calculateADX(data, 14);
    const rsiArr = calculateRSI(data, 14);
    const ema20Arr = calculateEMA(data, 20);

    // Get latest values
    const idx = data.length - 1;
    const currentPrice = data[idx].close;
    const adx = adxArr[idx] || 0;
    const rsi = rsiArr[idx] || 50;
    const upper = bb.upper[idx] || currentPrice;
    const lower = bb.lower[idx] || currentPrice;
    const ema20 = ema20Arr[idx] || currentPrice;

    // 2. Calculate Bandwidth & Percentile
    const bandwidths: number[] = [];
    for (let i = data.length - 30; i < data.length; i++) {
        if (i < 0) continue;
        const u = bb.upper[i];
        const l = bb.lower[i];
        const m = bb.sma[i];
        if (u && l && m) {
            bandwidths.push((u - l) / m);
        }
    }
    const currentBandwidth = bandwidths[bandwidths.length - 1] || 0;
    const minBw = Math.min(...bandwidths);
    const maxBw = Math.max(...bandwidths);
    const bwPercentile = maxBw === minBw ? 50 : ((currentBandwidth - minBw) / (maxBw - minBw)) * 100;

    // --- ANCHORED LOGIC ---
    // 1. Session Anchor (Approx Start of Day UTC)
    const currentDayStart = new Date(data[idx].timestamp).setUTCHours(0, 0, 0, 0);
    const sessionIndex = data.findIndex(d => d.timestamp >= currentDayStart);
    let sessionVwap: number | undefined;
    if (sessionIndex !== -1) {
        const vwapSeries = calculateAnchoredVWAP(data, sessionIndex);
        sessionVwap = vwapSeries[idx];
    }

    // 2. High Vol Anchor (Max Vol in last 100)
    let maxVol = 0;
    let highVolIndex = -1;
    const volLookback = Math.max(0, idx - 100);
    for (let i = volLookback; i <= idx; i++) {
        if (data[i].volume > maxVol) {
            maxVol = data[i].volume;
            highVolIndex = i;
        }
    }
    let highVolVwap: number | undefined;
    if (highVolIndex !== -1) {
        const hvVwapSeries = calculateAnchoredVWAP(data, highVolIndex);
        highVolVwap = hvVwapSeries[idx];
    }

    // 3. Determine Regime
    let regime: RegimeType = 'chaos';

    // COMPRESSION -> Range
    if (bwPercentile < 15) { // Bottom 15% of recent volatility
        regime = 'range';
    }
    // EXPANSION -> Breakout/Breakdown
    else if (currentPrice > upper) {
        regime = 'breakout';
    }
    else if (currentPrice < lower) {
        regime = 'breakdown';
    }
    // TREND (ADX confirms strength of move)
    else if (adx > 25) {
        regime = 'trend';
    }
    // CHOP -> Chaos/Range (Middle of bands)
    else if (adx < 20) {
        regime = 'range'; // Or chaos/chop
    }

    // 4. Determine Bias
    let bias: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    if (regime === 'trend' || regime === 'breakout') {
        bias = 'bullish';
    } else if (regime === 'breakdown') {
        bias = 'bearish';
    } else {
        // In chop/compression, bias is weaker
        if (rsi > 55) bias = 'bullish';
        else if (rsi < 45) bias = 'bearish';
    }

    // 5. Calculate Strength (Confidence)
    let strength = 50;
    if (regime === 'trend') {
        strength = adx;
    } else if (regime === 'range') {
        strength = 100 - bwPercentile; // tighter = stronger potential
    } else if (regime === 'breakout' || regime === 'breakdown') {
        strength = 70 + (Math.abs(currentPrice - ema20) / currentPrice) * 1000;
    }

    return {
        regime,
        bias,
        strength: Math.min(100, Math.max(0, strength)),
        factors: {
            adx,
            bandwidthPercentile: bwPercentile,
            rsi,
            priceRelativeToEma: ((currentPrice - ema20) / ema20) * 100
        },
        signals: {
            isSqueeze: bwPercentile < 15,
            isBreakout: regime === 'breakout' || regime === 'breakdown',
            isTrending: adx > 25
        },
        levels: {
            anchors: {
                sessionVwap,
                highVolVwap
            }
        }
    };
}

function createNeutralState(): MarketState {
    return {
        regime: 'chaos',
        bias: 'neutral',
        strength: 0,
        factors: {
            adx: 0,
            bandwidthPercentile: 50,
            rsi: 50,
            priceRelativeToEma: 0
        },
        signals: {
            isSqueeze: false,
            isBreakout: false,
            isTrending: false
        },
        levels: {
            anchors: {}
        }
    };
}
