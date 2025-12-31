
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
}

/**
 * STRATEGY: Beginner (Protector)
 * Strict rules, hard locks.
 */
export function evaluateBeginnerGate(ctx: GateContext): GateDecision {
    // Rule 1: Max 5 asset switches in 2 mins
    if (ctx.assetSwitchesLast2Min > 5) {
        return {
            status: 'locked',
            action: 'hard_lock',
            violationType: 'rapid_switching',
            message: 'Asset Switching Violation: >5 switches in 2m. Focus required.',
            lockDuration: 600 // 10 mins
        };
    }

    // Rule 2: Max 3 trades per hour
    // if (ctx.tradesLastHour > 3) { ... } (Commented out for MVP leniency)

    // Rule 3: Chaos Regime Protection
    if (ctx.marketRegime === 'chaos') {
        return {
            status: 'warning',
            action: 'warn',
            message: 'Market is in CHAOS mode. Reduce size by 50% recommended.'
        };
    }

    return { status: 'open', action: 'none' };
}

/**
 * STRATEGY: Pro (Partner)
 * Advisory, soft locks.
 */
export function evaluateProGate(ctx: GateContext): GateDecision {
    // Pro allows more switching, but warns
    if (ctx.assetSwitchesLast2Min > 8) {
        return {
            status: 'warning',
            action: 'warn',
            violationType: 'rapid_switching',
            message: 'High frequency switching detected. Are you tilting?'
        };
    }

    // Pro Revenge Trading Check
    if (ctx.recentLosses > 2 && ctx.marketRegime === 'volatile') {
        return {
            status: 'locked',
            action: 'soft_lock',
            violationType: 'revenge_trading',
            message: 'Loss streak in volatility. 5m reset recommended.',
            lockDuration: 300 // 5 mins
        };
    }

    return { status: 'open', action: 'none' };
}

/**
 * STRATEGY: Expert (Governor)
 * Silent mostly, only intervenes on anomalies.
 */
export function evaluateExpertGate(ctx: GateContext): GateDecision {
    // Only extreme anomalies
    if (ctx.assetSwitchesLast2Min > 20) {
        return {
            status: 'locked',
            action: 'hard_lock',
            violationType: 'tilt_detected',
            message: 'Extreme behavior anomaly. Algo-lock engaged.',
            lockDuration: 900 // 15 mins
        };
    }

    return { status: 'open', action: 'none' };
}

export function evaluateGate(level: string, ctx: GateContext): GateDecision {
    switch (level) {
        case 'pro': return evaluateProGate(ctx);
        case 'expert': return evaluateExpertGate(ctx);
        case 'beginner': default: return evaluateBeginnerGate(ctx);
    }
}
