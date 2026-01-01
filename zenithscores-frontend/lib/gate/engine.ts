
import { DisciplineState, GateViolation } from '@prisma/client';

export type GateLevel = 'beginner' | 'pro' | 'expert';
export type GateStatus = 'open' | 'warning' | 'locked';

export interface GateContext {
    marketRegime: 'calm' | 'volatile' | 'chaos';
    recentLosses: number;
    tradesLastHour: number;
    assetSwitchesLast2Min: number;
    sessionDurationMinutes: number;
}

export interface GateDecision {
    status: GateStatus;
    action: 'none' | 'warn' | 'soft_lock' | 'hard_lock';
    message?: string;
    violationType?: string;
    lockDuration?: number; // seconds
    readinessIndex?: number; // 0-100
    recommendations?: string[];
    sizeReduction?: number; // percentage to reduce
}

/**
 * TRADE READINESS INDEX
 * 0-100 score indicating how safe it is to trade right now.
 * Higher = safer to trade.
 */
export function calculateReadinessIndex(ctx: GateContext): number {
    let score = 100;

    // Regime penalties
    if (ctx.marketRegime === 'chaos') score -= 40;
    else if (ctx.marketRegime === 'volatile') score -= 20;

    // Asset switching penalty (rapid switching = emotional trading)
    if (ctx.assetSwitchesLast2Min > 5) score -= 30;
    else if (ctx.assetSwitchesLast2Min > 3) score -= 15;
    else if (ctx.assetSwitchesLast2Min > 1) score -= 5;

    // Trade frequency penalty
    if (ctx.tradesLastHour > 5) score -= 25;
    else if (ctx.tradesLastHour > 3) score -= 10;

    // Recent losses penalty
    if (ctx.recentLosses > 2) score -= 25;
    else if (ctx.recentLosses > 0) score -= 10;

    // Session duration bonus (longer = more settled)
    if (ctx.sessionDurationMinutes > 30) score += 5;
    if (ctx.sessionDurationMinutes > 60) score += 5;

    return Math.max(0, Math.min(100, score));
}

/**
 * Generate recommendations based on context
 */
export function generateRecommendations(ctx: GateContext, readiness: number): { recommendations: string[], sizeReduction: number } {
    const recommendations: string[] = [];
    let sizeReduction = 0;

    if (ctx.marketRegime === 'chaos') {
        recommendations.push('Market in CHAOS mode - reduce position size');
        sizeReduction = Math.max(sizeReduction, 50);
    } else if (ctx.marketRegime === 'volatile') {
        recommendations.push('Elevated volatility - consider smaller size');
        sizeReduction = Math.max(sizeReduction, 25);
    }

    if (ctx.assetSwitchesLast2Min > 3) {
        recommendations.push(`Slow down - ${ctx.assetSwitchesLast2Min} switches in 2 min`);
        sizeReduction = Math.max(sizeReduction, 30);
    }

    if (ctx.recentLosses > 1) {
        recommendations.push(`${ctx.recentLosses} recent losses - pause recommended`);
        sizeReduction = Math.max(sizeReduction, 40);
    }

    if (readiness < 50) {
        const pauseMinutes = Math.ceil((50 - readiness) / 5);
        recommendations.push(`Pause ${pauseMinutes} minutes before trading`);
    }

    return { recommendations, sizeReduction };
}

/**
 * STRATEGY: Beginner (Protector)
 * Strict rules, hard locks.
 */
export function evaluateBeginnerGate(ctx: GateContext): GateDecision {
    const readinessIndex = calculateReadinessIndex(ctx);
    const { recommendations, sizeReduction } = generateRecommendations(ctx, readinessIndex);

    // Rule 1: Max 5 asset switches in 2 mins
    if (ctx.assetSwitchesLast2Min > 5) {
        return {
            status: 'locked',
            action: 'hard_lock',
            violationType: 'rapid_switching',
            message: 'Asset Switching Violation: >5 switches in 2m. Focus required.',
            lockDuration: 600, // 10 mins
            readinessIndex,
            recommendations,
            sizeReduction
        };
    }

    // Rule 2: Chaos Regime Protection
    if (ctx.marketRegime === 'chaos') {
        return {
            status: 'warning',
            action: 'warn',
            message: 'Market is in CHAOS mode. Reduce size by 50% recommended.',
            readinessIndex,
            recommendations,
            sizeReduction: 50
        };
    }

    // Rule 3: Low readiness warning
    if (readinessIndex < 50) {
        return {
            status: 'warning',
            action: 'warn',
            message: 'Trade readiness is low. Consider pausing.',
            readinessIndex,
            recommendations,
            sizeReduction
        };
    }

    return {
        status: 'open',
        action: 'none',
        readinessIndex,
        recommendations: recommendations.length > 0 ? recommendations : undefined,
        sizeReduction: sizeReduction > 0 ? sizeReduction : undefined
    };
}

/**
 * STRATEGY: Pro (Partner)
 * Advisory, soft locks.
 */
export function evaluateProGate(ctx: GateContext): GateDecision {
    const readinessIndex = calculateReadinessIndex(ctx);
    const { recommendations, sizeReduction } = generateRecommendations(ctx, readinessIndex);

    // Pro allows more switching, but warns
    if (ctx.assetSwitchesLast2Min > 8) {
        return {
            status: 'warning',
            action: 'warn',
            violationType: 'rapid_switching',
            message: 'High frequency switching detected. Are you tilting?',
            readinessIndex,
            recommendations,
            sizeReduction
        };
    }

    // Pro Revenge Trading Check
    if (ctx.recentLosses > 2 && ctx.marketRegime === 'volatile') {
        return {
            status: 'locked',
            action: 'soft_lock',
            violationType: 'revenge_trading',
            message: 'Loss streak in volatility. 5m reset recommended.',
            lockDuration: 300, // 5 mins
            readinessIndex,
            recommendations,
            sizeReduction
        };
    }

    return {
        status: 'open',
        action: 'none',
        readinessIndex,
        recommendations: recommendations.length > 0 ? recommendations : undefined,
        sizeReduction: sizeReduction > 0 ? sizeReduction : undefined
    };
}

/**
 * STRATEGY: Expert (Governor)
 * Silent mostly, only intervenes on anomalies.
 */
export function evaluateExpertGate(ctx: GateContext): GateDecision {
    const readinessIndex = calculateReadinessIndex(ctx);
    const { recommendations, sizeReduction } = generateRecommendations(ctx, readinessIndex);

    // Only extreme anomalies
    if (ctx.assetSwitchesLast2Min > 20) {
        return {
            status: 'locked',
            action: 'hard_lock',
            violationType: 'tilt_detected',
            message: 'Extreme behavior anomaly. Algo-lock engaged.',
            lockDuration: 900, // 15 mins
            readinessIndex,
            recommendations,
            sizeReduction
        };
    }

    return {
        status: 'open',
        action: 'none',
        readinessIndex,
        recommendations: recommendations.length > 0 ? recommendations : undefined,
        sizeReduction: sizeReduction > 0 ? sizeReduction : undefined
    };
}

export function evaluateGate(level: string, ctx: GateContext): GateDecision {
    switch (level) {
        case 'pro': return evaluateProGate(ctx);
        case 'expert': return evaluateExpertGate(ctx);
        case 'beginner': default: return evaluateBeginnerGate(ctx);
    }
}

