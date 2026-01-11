/**
 * Hard Reality Simulator
 * 
 * Brutally realistic trading simulation that's HARDER than mainnet.
 * If the brain survives this, it might work in production.
 * 
 * Core Philosophy: The brain must prove it knows when NOT to trade.
 */

export interface RealityConstants {
    // Network fees (Solana mainnet)
    NETWORK_FEE_SOL: number;
    PRIORITY_FEE_SOL: {
        NORMAL: number;
        AGGRESSIVE: number;
        MEV_WAR: number;
    };

    // Quote degradation (latency + MEV + drift)
    QUOTE_DEGRADATION: {
        MIN: number;
        MAX: number;
        MEAN: number;
    };

    // Time constraints
    MIN_ACTION_INTERVAL: number; // milliseconds
    QUOTE_VALIDITY: number;
    BLOCK_TIME_VARIANCE: number;

    // Risk limits (HARD STOPS)
    MAX_DRAWDOWN: number;
    MAX_CAPITAL_EXPOSURE: number;
    MAX_FEE_RATIO: number;
    MAX_BAD_DECISIONS: number;
}

export const REALITY: RealityConstants = {
    NETWORK_FEE_SOL: 0.00015,
    PRIORITY_FEE_SOL: {
        NORMAL: 0.0002,
        AGGRESSIVE: 0.0004,
        MEV_WAR: 0.0008,
    },
    QUOTE_DEGRADATION: {
        MIN: 0.002,  // 0.2% best case
        MAX: 0.015,  // 1.5% worst case
        MEAN: 0.006, // 0.6% average
    },
    MIN_ACTION_INTERVAL: 12000, // 12 seconds
    QUOTE_VALIDITY: 5000,
    BLOCK_TIME_VARIANCE: 500,
    MAX_DRAWDOWN: 0.07,          // 7% loss = auto exit
    MAX_CAPITAL_EXPOSURE: 0.6,   // 60% max per trade
    MAX_FEE_RATIO: 0.4,          // 40% fees of profit = stop
    MAX_BAD_DECISIONS: 5,
};

export interface SimulatorMetrics {
    tradesAttempted: number;
    tradesRejected: number;
    tradesExecuted: number;
    badDecisionAttempts: number;
    forcedExits: number;
    quoteFailures: number;
    totalFeesPaidSOL: number;
    maxDrawdown: number;
    capitalExposedAtPeak: number;
    worstSingleTrade: {
        loss: number;
        token: string;
        reason: string;
    };
}

export interface SimulatorState {
    currentSOL: number;
    currentToken: string;
    currentTokenAmount: number;
    positionOpenTime: number;
    lastActionTime: number;
    actionsLast5Min: number;
    consecutiveRejects: number;
    inDrawdown: boolean;
    simulationFailed: boolean;
    simulationStarted: number;
    peakValue: number;
    startValue: number;
    grossProfit: number;
}

export interface SwapResult {
    executed: boolean;
    reason?: string;
    amountOut?: number;
    feesPaid: number;
    newAmount: number;
    profit?: number;
    notes?: string[];
}

export interface HoldResult {
    executed: boolean;
    reason?: string;
    profit: number;
    drawdown: number;
    holdReturn?: number;
    stoppedEarly?: boolean;
    notes?: string[];
}

export interface BrutalReport {
    // Summary
    startValue: number;
    endValue: number;
    netProfit: number;
    netReturnPct: number;

    // Breakdown
    grossProfit: number;
    totalFeesPaid: number;
    netEdge: number;

    // Behavior
    tradesAttempted: number;
    tradesExecuted: number;
    tradesRejected: number;
    badDecisionAttempts: number;
    forcedExits: number;
    quoteFailures: number;
    avgExposurePct: number;

    // Quality
    weightedAccuracy: number;
    profitDensity: number;
    overconfidenceRate: number;
    maxDrawdownPct: number;
    worstTrade: {
        loss: number;
        token: string;
        reason: string;
    };

    // Verdict
    verdict: string;
    verdictReason: string;
    realityScore: number;
}

export class HardRealitySimulator {
    private metrics: SimulatorMetrics = {
        tradesAttempted: 0,
        tradesRejected: 0,
        tradesExecuted: 0,
        badDecisionAttempts: 0,
        forcedExits: 0,
        quoteFailures: 0,
        totalFeesPaidSOL: 0,
        maxDrawdown: 0,
        capitalExposedAtPeak: 0,
        worstSingleTrade: { loss: 0, token: '', reason: '' },
    };

    private state: SimulatorState;

    constructor(initialSOL: number) {
        this.state = {
            currentSOL: initialSOL,
            currentToken: 'SOL',
            currentTokenAmount: initialSOL,
            positionOpenTime: Date.now(),
            lastActionTime: Date.now(),
            actionsLast5Min: 0,
            consecutiveRejects: 0,
            inDrawdown: false,
            simulationFailed: false,
            simulationStarted: Date.now(),
            peakValue: initialSOL,
            startValue: initialSOL,
            grossProfit: 0,
        };
    }

    /**
     * Apply quote degradation (reality tax)
     */
    applyQuoteDegradation(idealOut: number, strategy: 'SAFE' | 'AGGRESSIVE'): number {
        const degradation = REALITY.QUOTE_DEGRADATION.MIN +
            Math.random() * (REALITY.QUOTE_DEGRADATION.MAX - REALITY.QUOTE_DEGRADATION.MIN);

        const strategyMultiplier = strategy === 'AGGRESSIVE' ? 1.3 : 1;
        const effectiveDegradation = degradation * strategyMultiplier;

        return idealOut * (1 - effectiveDegradation);
    }

    /**
     * Calculate brutal fees
     */
    calculateFees(strategy: 'SAFE' | 'AGGRESSIVE'): {
        networkFeeSOL: number;
        priorityFeeSOL: number;
        totalSOL: number;
    } {
        const networkFee = REALITY.NETWORK_FEE_SOL;
        let priorityFee = REALITY.PRIORITY_FEE_SOL.NORMAL;

        if (strategy === 'AGGRESSIVE') {
            priorityFee = REALITY.PRIORITY_FEE_SOL.AGGRESSIVE;
        }

        // 5% chance of MEV war
        if (Math.random() < 0.05) {
            priorityFee = REALITY.PRIORITY_FEE_SOL.MEV_WAR;
        }

        return {
            networkFeeSOL: networkFee,
            priorityFeeSOL: priorityFee,
            totalSOL: networkFee + priorityFee,
        };
    }

    /**
     * Apply slippage attack (MEV sandwich)
     */
    applySlippageAttack(amountOut: number, strategy: 'SAFE' | 'AGGRESSIVE'): number {
        // 15% chance of MEV sandwich
        if (Math.random() < 0.15) {
            const slippage = 0.01 + Math.random() * 0.02; // 1-3% extra
            const multiplier = strategy === 'AGGRESSIVE' ? 1.5 : 1;
            return amountOut * (1 - (slippage * multiplier));
        }
        return amountOut;
    }

    /**
     * Check cooldown
     */
    checkCooldown(): boolean {
        const timeSinceLast = Date.now() - this.state.lastActionTime;
        const networkVariance = Math.random() * REALITY.BLOCK_TIME_VARIANCE;
        const requiredCooldown = REALITY.MIN_ACTION_INTERVAL + networkVariance;

        return timeSinceLast >= requiredCooldown;
    }

    /**
     * Validate basic swap
     */
    validateBasicSwap(
        exposurePct: number,
        confidence: number
    ): { valid: boolean; reason?: string } {
        if (confidence < 0.55) {
            return { valid: false, reason: `Confidence too low: ${confidence.toFixed(2)}` };
        }

        if (exposurePct > REALITY.MAX_CAPITAL_EXPOSURE) {
            return {
                valid: false,
                reason: `Exposure ${(exposurePct * 100).toFixed(0)}% > ${REALITY.MAX_CAPITAL_EXPOSURE * 100}% max`
            };
        }

        if (this.state.actionsLast5Min > 8) {
            return { valid: false, reason: 'Overtrading detected (>8 actions/5min)' };
        }

        if (this.state.inDrawdown) {
            return { valid: false, reason: 'Cannot trade while in drawdown >5%' };
        }

        if (this.state.consecutiveRejects > 3) {
            return { valid: false, reason: 'Too many consecutive rejects (brain confused)' };
        }

        return { valid: true };
    }

    /**
     * Check forced exit conditions
     */
    checkForcedExit(): void {
        const currentValue = this.getCurrentValue();
        const drawdown = this.state.peakValue > 0
            ? (this.state.peakValue - currentValue) / this.state.peakValue
            : 0;

        this.metrics.maxDrawdown = Math.max(this.metrics.maxDrawdown, drawdown);

        const feeRatio = this.state.grossProfit > 0
            ? this.metrics.totalFeesPaidSOL / this.state.grossProfit
            : 1;

        const exitConditions = [
            drawdown >= REALITY.MAX_DRAWDOWN,
            feeRatio >= REALITY.MAX_FEE_RATIO,
            this.metrics.badDecisionAttempts >= REALITY.MAX_BAD_DECISIONS,
            this.state.actionsLast5Min > 12,
        ];

        if (exitConditions.some(c => c)) {
            this.state.simulationFailed = true;
            this.metrics.forcedExits++;
        }
    }

    /**
     * Get current portfolio value in SOL
     */
    getCurrentValue(): number {
        // Simplified - would need price oracle
        return this.state.currentSOL;
    }

    /**
     * Get brutal report
     */
    getBrutalReport(): BrutalReport {
        const endValue = this.getCurrentValue();
        const netProfit = endValue - this.state.startValue;
        const netReturn = this.state.startValue > 0 ? netProfit / this.state.startValue : 0;

        const durationMinutes = (Date.now() - this.state.simulationStarted) / 60000;
        const avgExposure = this.metrics.capitalExposedAtPeak;
        const profitDensity = durationMinutes > 0 && avgExposure > 0
            ? netProfit / (avgExposure * durationMinutes)
            : 0;

        const totalDecisions = this.metrics.tradesAttempted + this.metrics.badDecisionAttempts;
        const weightedAccuracy = totalDecisions > 0
            ? (this.metrics.tradesExecuted - (this.metrics.badDecisionAttempts * 2)) / totalDecisions
            : 0;

        const overconfidenceRate = totalDecisions > 0
            ? this.metrics.badDecisionAttempts / totalDecisions
            : 0;

        // VERDICT
        const readyConditions = [
            netReturn >= 0.03,
            profitDensity > 0.001,
            this.metrics.totalFeesPaidSOL / Math.max(netProfit, 0.001) < 0.35,
            overconfidenceRate < 0.2,
            this.metrics.forcedExits === 0,
            this.metrics.maxDrawdown < 0.05,
        ];

        const allReady = readyConditions.every(c => c);
        const verdict = allReady
            ? '✅ READY FOR REAL EXECUTION (SMALL SIZE)'
            : '❌ NOT READY';

        const verdictReason = allReady
            ? 'Passed all reality checks'
            : 'Failed one or more conditions';

        return {
            startValue: this.state.startValue,
            endValue,
            netProfit,
            netReturnPct: netReturn * 100,
            grossProfit: this.state.grossProfit,
            totalFeesPaid: this.metrics.totalFeesPaidSOL,
            netEdge: netProfit - this.metrics.totalFeesPaidSOL,
            tradesAttempted: this.metrics.tradesAttempted,
            tradesExecuted: this.metrics.tradesExecuted,
            tradesRejected: this.metrics.tradesRejected,
            badDecisionAttempts: this.metrics.badDecisionAttempts,
            forcedExits: this.metrics.forcedExits,
            quoteFailures: this.metrics.quoteFailures,
            avgExposurePct: avgExposure * 100,
            weightedAccuracy,
            profitDensity,
            overconfidenceRate: overconfidenceRate * 100,
            maxDrawdownPct: this.metrics.maxDrawdown * 100,
            worstTrade: this.metrics.worstSingleTrade,
            verdict,
            verdictReason,
            realityScore: this.calculateRealityScore(),
        };
    }

    private calculateRealityScore(): number {
        let score = 100;

        score -= this.metrics.badDecisionAttempts * 5;
        score -= this.metrics.forcedExits * 20;
        score -= this.metrics.maxDrawdown * 500;
        score -= (this.metrics.totalFeesPaidSOL / this.getCurrentValue()) * 300;
        score -= this.state.consecutiveRejects * 3;

        if (this.metrics.tradesExecuted > 0 && this.metrics.badDecisionAttempts === 0) {
            score += 10;
        }

        if (this.getCurrentValue() > this.state.startValue * 1.05) {
            score += 15;
        }

        return Math.max(0, Math.min(100, Math.round(score)));
    }
}
