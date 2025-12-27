/**
 * Scenario & Levels Engine
 * logic to generate "Upside 35%", "Entry Zone", "Invalidation"
 */

import { MinimalCandle, calculateATR, calculateEMA, calculateBB } from '@/lib/chart/calculations';
import { calculateFactors, FactorScores } from './calculator';

export interface ScenarioProbabilities {
    upside: number;
    unclear: number;
    downside: number;
}

export interface KeyLevels {
    entryZone: { min: number; max: number };
    invalidation: { price: number; reason: string };
    target: { price: number; reason: string };
}

export function generateScenarios(data: MinimalCandle[]): ScenarioProbabilities {
    const { momentum, trend, volatility } = calculateFactors(data);

    // Base probabilities
    let upside = 33;
    let unclear = 34;
    let downside = 33;

    // Trend Influence
    if (trend > 60) {
        upside += 15;
        downside -= 10;
        unclear -= 5;
    } else if (trend < 40) {
        downside += 15;
        upside -= 10;
        unclear -= 5;
    } else {
        unclear += 10; // Range bound
        upside -= 5;
        downside -= 5;
    }

    // Momentum Influence
    if (momentum > 70) {
        upside += 5; // Might be overbought, but momentum persists
    } else if (momentum < 30) {
        downside += 5; // Oversold
    }

    // Volatility Uncertainty
    if (volatility > 80) {
        unclear += 10; // High chaos
        upside -= 5;
        downside -= 5;
    }

    // Normalize to 100%
    const total = upside + unclear + downside;

    return {
        upside: Math.round((upside / total) * 100),
        unclear: Math.round((unclear / total) * 100),
        downside: Math.round((downside / total) * 100),
    };
}

export function generateKeyLevels(data: MinimalCandle[]): KeyLevels {
    const currentPrice = data[data.length - 1].close;
    const atr = calculateATR(data, 14);
    const currentAtr = atr[atr.length - 1] || (currentPrice * 0.02);
    const ema20 = calculateEMA(data, 20);
    const e20 = ema20[ema20.length - 1];

    // Simple Logic for Entry Zone: Pullback to EMA20 +/- 0.5 ATR
    const entryMin = e20 - (currentAtr * 0.2);
    const entryMax = e20 + (currentAtr * 0.2);

    // Invalidation: Below recent swing low or 2 ATR away
    // Using simple 2x ATR stop for now
    const invalidationPrice = currentPrice - (2 * currentAtr);

    return {
        entryZone: {
            min: entryMin,
            max: entryMax
        },
        invalidation: {
            price: invalidationPrice,
            reason: "2x ATR Violation"
        },
        target: {
            price: currentPrice + (3 * currentAtr),
            reason: "3R Extension"
        }
    };
}
