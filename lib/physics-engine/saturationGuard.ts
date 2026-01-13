/**
 * Learning Saturation Guard - Pillar 4
 * 
 * Stops narrowing when learning plateaus.
 * Prevents overfitting by detecting when accuracy improvements stall.
 * 
 * Thresholds:
 * - Early cycles (1-2): Δ accuracy < 5% = stop
 * - Later cycles (3+): Δ accuracy < 2% = stop
 * - RANGE regime: Lower thresholds
 */

import { MarketRegime } from './types';

export interface SaturationCheck {
    shouldStop: boolean;
    reason: string;
    deltaAccuracy: number;
    threshold: number;
}

// Thresholds by cycle number
const EARLY_CYCLE_THRESHOLD = 0.05;  // 5% for cycles 1-2
const LATE_CYCLE_THRESHOLD = 0.02;   // 2% for cycles 3+
const RANGE_MULTIPLIER = 0.7;        // Lower thresholds in RANGE

/**
 * Check if learning has saturated
 */
export function checkSaturation(
    currentAccuracy: number,
    previousAccuracy: number,
    cycleNumber: number,
    regime: MarketRegime
): SaturationCheck {
    const deltaAccuracy = currentAccuracy - previousAccuracy;

    // Determine base threshold
    let threshold = cycleNumber <= 2 ? EARLY_CYCLE_THRESHOLD : LATE_CYCLE_THRESHOLD;

    // Adjust for RANGE regime (more tolerant)
    if (regime === 'RANGE') {
        threshold *= RANGE_MULTIPLIER;
    }

    // Check for negative progress (getting worse)
    if (deltaAccuracy < 0) {
        return {
            shouldStop: true,
            reason: `Accuracy DECREASED by ${Math.abs(deltaAccuracy * 100).toFixed(1)}% - learning is degrading`,
            deltaAccuracy,
            threshold,
        };
    }

    // Check for saturation (improvement below threshold)
    if (deltaAccuracy < threshold && cycleNumber > 1) {
        return {
            shouldStop: true,
            reason: `Accuracy improvement ${(deltaAccuracy * 100).toFixed(1)}% below threshold ${(threshold * 100).toFixed(1)}% - learning saturated`,
            deltaAccuracy,
            threshold,
        };
    }

    return {
        shouldStop: false,
        reason: `Continuing: Δ accuracy ${(deltaAccuracy * 100).toFixed(1)}% >= threshold ${(threshold * 100).toFixed(1)}%`,
        deltaAccuracy,
        threshold,
    };
}

/**
 * Check for early stop conditions (before first cycle completes)
 */
export function checkEarlyStop(
    accuracy: number,
    sampleSize: number
): { shouldStop: boolean; reason: string } {
    // Minimum sample size
    if (sampleSize < 10) {
        return {
            shouldStop: true,
            reason: `Insufficient sample size: ${sampleSize} < 10 minimum`,
        };
    }

    // Accuracy below random chance
    if (accuracy < 0.33) {
        return {
            shouldStop: true,
            reason: `Accuracy ${(accuracy * 100).toFixed(1)}% worse than random chance (33%)`,
        };
    }

    return {
        shouldStop: false,
        reason: 'Early checks passed',
    };
}

/**
 * Track learning curve for analysis
 */
export interface LearningCurve {
    cycleNumber: number;
    accuracy: number;
    deltaAccuracy: number;
    sampleSize: number;
    regime: MarketRegime;
}

export function analyzeLearningCurve(curves: LearningCurve[]): {
    isConverging: boolean;
    plateauCycle: number | null;
    bestAccuracy: number;
    trend: 'improving' | 'stable' | 'degrading';
} {
    if (curves.length < 2) {
        return {
            isConverging: false,
            plateauCycle: null,
            bestAccuracy: curves[0]?.accuracy || 0,
            trend: 'stable',
        };
    }

    const deltas = curves.map(c => c.deltaAccuracy);
    const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
    const recentDelta = deltas[deltas.length - 1];

    // Find best accuracy
    const bestAccuracy = Math.max(...curves.map(c => c.accuracy));

    // Detect plateau (3 consecutive low deltas)
    let plateauCycle: number | null = null;
    let consecutiveLow = 0;
    for (let i = 0; i < curves.length; i++) {
        if (curves[i].deltaAccuracy < 0.02) {
            consecutiveLow++;
            if (consecutiveLow >= 2 && plateauCycle === null) {
                plateauCycle = curves[i].cycleNumber;
            }
        } else {
            consecutiveLow = 0;
        }
    }

    // Determine trend
    let trend: 'improving' | 'stable' | 'degrading';
    if (avgDelta > 0.03) {
        trend = 'improving';
    } else if (avgDelta < -0.01) {
        trend = 'degrading';
    } else {
        trend = 'stable';
    }

    return {
        isConverging: plateauCycle !== null,
        plateauCycle,
        bestAccuracy,
        trend,
    };
}
