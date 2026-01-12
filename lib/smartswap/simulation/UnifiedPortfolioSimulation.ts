/**
 * Unified Portfolio Simulation with Full Learning Validation (Pillars 1-10)
 *
 * Complete Integration:
 * - Pillar 1: Regime Detection
 * - Pillar 2: Prediction System (UP/DOWN/FLAT)
 * - Pillar 3: Asymmetric Scoring
 * - Pillar 4: Learning Saturation
 * - Pillar 5: Skill vs Opportunity
 * - Pillar 6: Baseline Comparison
 * - Pillar 7: Diversity Constraints
 * - Pillar 8: Reason Logging
 * - Pillar 9: Trust Gating
 * - Pillar 10: Compounding Funnel with FLAT Accountability & Behavioral Adaptation
 *
 * CHAOS TOKENS ONLY - All stablecoins excluded
 */

import { DecisionLog, DecisionIntent, SimulationReport, Position } from './types';
import {
    freezeUniverse,
    createFunnelState,
    predictFunnel,
    scoreFunnel,
    shouldContinueFunnel,
    getFunnelVerdict,
    getFlatStatistics,
    adaptBehavior,
    FunnelState,
    TokenCandidate,
    DirectionBias,
    CyclePenaltyProfile,
} from '@/lib/learning-validation/compoundingLoop';
import { evaluateTrust, TrustDecision, TrustLevel } from '@/lib/trust-engine/trustEvaluator';

// Multi-position portfolio
interface PortfolioPosition {
    token: string;
    mint: string;
    entryValueSOL: number;
    currentValueSOL: number;
    entryTime: number;
    lastUpdateTime: number;
    unrealizedPnL: number;
}

interface PortfolioAction {
    type: 'BUY' | 'SELL' | 'HOLD_ALL' | 'HESITATE';
    token?: string;
    mint?: string;
    allocationSOL?: number;
    intent: DecisionIntent;
}

// Learning state per cycle
interface CycleMetrics {
    cycle: number;
    regime: string;
    predictions: { up: number; down: number; flat: number };
    accuracy: number;
    survivors: number;
    eliminated: number;
    biases: DirectionBias;
    penaltyProfile?: CyclePenaltyProfile;
    flatStats: {
        total: number;
        correct: number;
        accuracy: number;
        cowardice: number;
    };
}

export interface UnifiedSimulationReport extends SimulationReport {
    // Funnel metrics
    funnelMetrics: {
        edgeValidated: boolean;
        totalCycles: number;
        validatedTokens: string[];
        stopReason?: string;
    };

    // Cycle-by-cycle learning
    cycleMetrics: CycleMetrics[];

    // Trust & discipline
    trustLevel: string;
    disciplineViolations: number;
    blockedBuys: number;
    authorizedBuys: number;
}

export class UnifiedPortfolioSimulation {
    private readonly START_SOL = 0.1;
    private readonly DURATION_MS = 30 * 60 * 1000; // 30 minutes max
    private readonly MIN_INTERVAL_MS = 12_000; // 12 seconds between actions

    private liquidSOL = this.START_SOL;
    private positions: Map<string, PortfolioPosition> = new Map();
    private totalFeesSOL = 0;
    private solPriceUSD = 150;

    private logs: DecisionLog[] = [];
    private penaltyScore = 0;
    private violations: string[] = [];
    private blockedBuys = 0;
    private authorizedBuys = 0;
    private lastActionAt = Date.now();

    // Learning validation state
    private funnelState: FunnelState | null = null;
    private trustDecision: TrustDecision | null = null;
    private cycleMetrics: CycleMetrics[] = [];
    private edgeValidated = false;
    private validatedTokens: string[] = [];

    private onProgress?: (log: DecisionLog, state: any) => void;
    private onFunnelEvent?: (type: string, data: any) => void;

    /**
     * Run unified simulation with full learning validation
     */
    async run(
        onProgress?: (log: DecisionLog, state: any) => void,
        onFunnelEvent?: (type: string, data: any) => void
    ): Promise<UnifiedSimulationReport> {
        this.onProgress = onProgress;
        this.onFunnelEvent = onFunnelEvent;

        await this.fetchSolPrice();

        const start = Date.now();

        // ====================================================================
        // PHASE 1: PILLAR 10 COMPOUNDING FUNNEL (CHAOS TOKENS ONLY)
        // ====================================================================

        this.emitFunnelEvent('PHASE', { phase: 'FUNNEL', message: 'Starting Pillar 10 Compounding Funnel...' });

        // Freeze universe (CHAOS only, stablecoins excluded)
        this.emitFunnelEvent('FREEZING_UNIVERSE', { targetTokens: 1000 });
        const universe = await freezeUniverse(1000);
        this.emitFunnelEvent('UNIVERSE_FROZEN', { tokenCount: universe.length, tokenClass: 'CHAOS_ONLY' });

        // Create funnel state
        this.funnelState = createFunnelState(universe);
        this.emitFunnelEvent('FUNNEL_CREATED', { initialTokens: universe.length });

        // Run compounding cycles (with real 5-min waits, but capped for demo)
        while (shouldContinueFunnel(this.funnelState) && this.cycleMetrics.length < 6) {
            const cycleNum = this.funnelState.cycle + 1;
            this.emitFunnelEvent('CYCLE_START', { cycle: cycleNum, tokens: this.funnelState.tokens.length });

            // Predict with behavioral adaptation
            const directionalCheck = predictFunnel(this.funnelState, (type, data) => {
                this.emitFunnelEvent(type, data);
            });

            // Track predictions
            const preds = Array.from(this.funnelState.predictions.values());
            const predictionBreakdown = {
                up: preds.filter(p => p === 'UP').length,
                down: preds.filter(p => p === 'DOWN').length,
                flat: preds.filter(p => p === 'FLAT').length,
            };

            this.emitFunnelEvent('PREDICTIONS_MADE', predictionBreakdown);

            // Check directional commitment (Pillar 10.1 + 10.2)
            if (!directionalCheck.valid) {
                this.emitFunnelEvent('STOP_NO_EDGE', {
                    reason: directionalCheck.reason,
                    violation: directionalCheck.violationType,
                });
                break;
            }

            // Wait (capped at 30s for demo, would be 5 min in production)
            const waitMs = Math.min(5 * 60 * 1000, 30_000);
            this.emitFunnelEvent('WAITING', { seconds: Math.floor(waitMs / 1000) });
            await new Promise(resolve => setTimeout(resolve, waitMs));

            // Score predictions (Pillar 10.3 + 10.4)
            this.emitFunnelEvent('SCORING', { tokens: this.funnelState.tokens.length });
            const result = await scoreFunnel(this.funnelState, (type, data) => {
                this.emitFunnelEvent(type, data);
            });

            // Track cycle metrics
            const flatStats = getFlatStatistics(this.funnelState.predictionStorage);
            this.cycleMetrics.push({
                cycle: result.cycle,
                regime: result.regime,
                predictions: predictionBreakdown,
                accuracy: result.accuracy,
                survivors: result.tokensAfter,
                eliminated: result.eliminated.length,
                biases: this.funnelState.biases,
                penaltyProfile: this.funnelState.lastPenaltyProfile,
                flatStats: {
                    total: flatStats.totalFlat,
                    correct: flatStats.correctFlat,
                    accuracy: flatStats.flatAccuracy,
                    cowardice: flatStats.cowardiceScore,
                },
            });

            this.emitFunnelEvent('CYCLE_COMPLETE', {
                cycle: result.cycle,
                accuracy: (result.accuracy * 100).toFixed(1) + '%',
                survivors: result.tokensAfter,
            });

            if (this.funnelState.funnelComplete || this.funnelState.funnelCollapsed) {
                break;
            }
        }

        // Get funnel verdict
        const verdict = getFunnelVerdict(this.funnelState);
        this.edgeValidated = verdict.shouldExecute;
        this.validatedTokens = verdict.candidates.map(c => c.symbol);

        this.emitFunnelEvent('FUNNEL_COMPLETE', {
            edgeValidated: this.edgeValidated,
            validatedTokens: this.validatedTokens,
            stopReason: verdict.reason,
        });

        // ====================================================================
        // PHASE 2: TRUST EVALUATION (PILLAR 9)
        // ====================================================================

        this.emitFunnelEvent('TRUST_EVALUATION', {});
        this.trustDecision = await evaluateTrust();
        this.emitFunnelEvent('TRUST_DECISION', {
            level: TrustLevel[this.trustDecision.trustLevel],
            executionType: this.trustDecision.executionType,
            maxTrades: this.trustDecision.maxTradesAllowed,
        });

        // ====================================================================
        // PHASE 3: PORTFOLIO SIMULATION (If edge validated + trust allows)
        // ====================================================================

        if (!this.edgeValidated || this.trustDecision.executionType === 'NONE') {
            this.emitFunnelEvent('EXECUTION_BLOCKED', {
                reason: !this.edgeValidated ? 'Edge not validated' : 'Trust level too low',
            });

            // NO TRADE = PASS (discipline maintained)
            return this.report('PASS', `NO TRADE: ${verdict.reason}`);
        }

        // Execute portfolio simulation with validated tokens
        this.emitFunnelEvent('PHASE', { phase: 'EXECUTION', message: 'Running portfolio simulation...' });

        while (Date.now() - start < this.DURATION_MS) {
            const now = Date.now();

            if (now - this.lastActionAt < this.MIN_INTERVAL_MS) {
                await this.sleep(500);
                continue;
            }

            // Brain makes decision (only on validated tokens)
            const action = this.brainDecision();

            await this.executeAction(action, now);
            this.lastActionAt = now;

            if (this.penaltyScore > 30) break;

            await this.sleep(200);
        }

        return this.report(this.violations.length === 0 ? 'PASS' : 'FAIL', 'Simulation complete');
    }

    private brainDecision(): PortfolioAction {
        const state = this.getState();

        // If no positions and have liquid SOL, try to buy validated token
        if (this.positions.size === 0 && this.liquidSOL > 0.02 && this.validatedTokens.length > 0) {
            const token = this.validatedTokens[Math.floor(Math.random() * this.validatedTokens.length)];

            return {
                type: 'BUY',
                token,
                allocationSOL: Math.min(0.03, this.liquidSOL * 0.3),
                intent: {
                    thesis: `Opening position in validated CHAOS token ${token}`,
                    confidence: 0.7,
                    horizon: '5-15min',
                    risk: 'LOW',
                },
            };
        }

        // Exit losses
        for (const [token, pos] of this.positions) {
            if (pos.unrealizedPnL < -0.005) {
                return {
                    type: 'SELL',
                    token,
                    intent: {
                        thesis: `Cutting loss on ${token}: ${pos.unrealizedPnL.toFixed(6)} SOL`,
                        confidence: 0.9,
                        horizon: 'IMMEDIATE',
                        risk: 'MEDIUM',
                    },
                };
            }
        }

        // Take profits
        for (const [token, pos] of this.positions) {
            if (pos.unrealizedPnL > 0.01) {
                return {
                    type: 'SELL',
                    token,
                    intent: {
                        thesis: `Taking profit on ${token}: +${pos.unrealizedPnL.toFixed(6)} SOL`,
                        confidence: 0.9,
                        horizon: 'IMMEDIATE',
                        risk: 'LOW',
                    },
                };
            }
        }

        // Hold
        if (this.positions.size > 0) {
            return {
                type: 'HOLD_ALL',
                intent: {
                    thesis: `Holding ${this.positions.size} positions`,
                    confidence: 0.8,
                    horizon: 'SHORT',
                    risk: 'LOW',
                },
            };
        }

        return {
            type: 'HESITATE',
            intent: {
                thesis: 'Awaiting opportunity',
                confidence: 0.5,
                horizon: 'SHORT',
                risk: 'NONE',
            },
        };
    }

    private async executeAction(action: PortfolioAction, now: number) {
        const log: DecisionLog = {
            timestamp: now,
            action: action.type === 'BUY' ? 'SWAP' : action.type === 'SELL' ? 'EXIT' : action.type,
            fromToken: action.type === 'SELL' ? action.token || 'UNKNOWN' : 'SOL',
            toToken: action.type === 'BUY' ? action.token : undefined,
            intent: action.intent,
            executed: false,
            pnlSOL: 0,
            realizedPnlSOL: 0,
            unrealizedPnlSOL: this.getTotalUnrealizedPnL(),
            portfolioValueSOL: this.getPortfolioValueSOL(),
            portfolioValueUSD: 0,
        };

        try {
            if (action.type === 'BUY') {
                // Authority check
                const authCheck = this.isBuyAllowed(action.token!);
                if (!authCheck.allowed) {
                    this.blockedBuys++;
                    this.violations.push(authCheck.reason);
                    this.penaltyScore += 5;
                    log.skippedReason = `BLOCKED: ${authCheck.reason}`;
                    log.evaluation = {
                        outcomeClass: 'BAD_DECISION_BAD_OUTCOME',
                        penaltyScore: 5,
                        explanation: `Authority violation: ${authCheck.reason}`,
                    };
                } else {
                    this.authorizedBuys++;
                    this.executeBuy(action, log);
                }
            } else if (action.type === 'SELL') {
                this.executeSell(action, log);
            } else if (action.type === 'HOLD_ALL') {
                this.executeHoldAll(log);
            }
        } catch (error: any) {
            log.executed = false;
            log.skippedReason = error.message;
            this.penaltyScore += 2;
        }

        log.portfolioValueSOL = this.getPortfolioValueSOL();
        log.portfolioValueUSD = log.portfolioValueSOL * this.solPriceUSD;
        log.unrealizedPnlSOL = this.getTotalUnrealizedPnL();

        this.logs.push(log);
        if (this.onProgress) this.onProgress(log, this.getState());
    }

    private isBuyAllowed(token: string): { allowed: boolean; reason: string } {
        // Must be edge validated
        if (!this.edgeValidated) {
            return { allowed: false, reason: 'Edge not validated by funnel' };
        }

        // Must be in validated list
        if (!this.validatedTokens.includes(token)) {
            return { allowed: false, reason: `Token ${token} not in validated list` };
        }

        // Must not exceed trust limits
        if (this.trustDecision && this.positions.size >= this.trustDecision.maxTradesAllowed) {
            return { allowed: false, reason: 'Trust position limit reached' };
        }

        return { allowed: true, reason: 'Authorized' };
    }

    private executeBuy(action: PortfolioAction, log: DecisionLog) {
        const allocSOL = Math.min(action.allocationSOL || 0, this.liquidSOL);
        if (allocSOL <= 0) throw new Error('Insufficient liquid SOL');

        const fee = allocSOL * 0.0025;
        const netValue = allocSOL - fee;

        this.liquidSOL -= allocSOL;
        this.totalFeesSOL += fee;

        this.positions.set(action.token!, {
            token: action.token!,
            mint: action.mint || '',
            entryValueSOL: netValue,
            currentValueSOL: netValue,
            entryTime: Date.now(),
            lastUpdateTime: Date.now(),
            unrealizedPnL: -fee,
        });

        log.executed = true;
        log.entryCostSOL = fee;
        log.tradeValueSOL = netValue;
        log.evaluation = {
            outcomeClass: 'POSITION_OPENED',
            penaltyScore: 0,
            explanation: `Opened ${action.token}: ${netValue.toFixed(6)} SOL`,
        };
    }

    private executeSell(action: PortfolioAction, log: DecisionLog) {
        const position = this.positions.get(action.token!);
        if (!position) throw new Error(`No position in ${action.token}`);

        const fee = position.currentValueSOL * 0.0015;
        const netProceeds = position.currentValueSOL - fee;
        const realizedPnL = netProceeds - position.entryValueSOL;

        this.totalFeesSOL += fee;
        this.liquidSOL += netProceeds;
        this.positions.delete(action.token!);

        log.executed = true;
        log.realizedPnlSOL = realizedPnL;
        log.pnlSOL = realizedPnL;
        log.tradeValueSOL = position.currentValueSOL;

        if (realizedPnL < 0) {
            const penalty = Math.min(5, Math.floor(Math.abs(realizedPnL) * 100));
            this.penaltyScore += penalty;
            log.evaluation = {
                outcomeClass: 'BAD_DECISION_BAD_OUTCOME',
                penaltyScore: penalty,
                explanation: `Loss: ${realizedPnL.toFixed(6)} SOL`,
            };
        } else {
            log.evaluation = {
                outcomeClass: 'GOOD_DECISION_GOOD_OUTCOME',
                penaltyScore: 0,
                explanation: `Profit: +${realizedPnL.toFixed(6)} SOL`,
            };
        }
    }

    private executeHoldAll(log: DecisionLog) {
        if (this.positions.size === 0) {
            log.executed = false;
            log.skippedReason = 'No positions to hold';
            return;
        }

        this.simulatePortfolioPriceMovement();
        log.executed = true;
        log.action = 'HOLD';
        log.evaluation = {
            outcomeClass: 'GOOD_DECISION_GOOD_OUTCOME',
            penaltyScore: 0,
            explanation: `Holding ${this.positions.size} positions`,
        };
    }

    private simulatePortfolioPriceMovement() {
        for (const pos of this.positions.values()) {
            const noise = (Math.random() - 0.48) * 0.02;
            pos.currentValueSOL *= (1 + noise);
            pos.unrealizedPnL = pos.currentValueSOL - pos.entryValueSOL;
            pos.lastUpdateTime = Date.now();
        }
    }

    private getPortfolioValueSOL(): number {
        let total = this.liquidSOL;
        for (const pos of this.positions.values()) {
            total += pos.currentValueSOL;
        }
        return total;
    }

    private getTotalUnrealizedPnL(): number {
        let total = 0;
        for (const pos of this.positions.values()) {
            total += pos.unrealizedPnL;
        }
        return total;
    }

    private getState() {
        const positions = Array.from(this.positions.values()).map(p => ({
            token: p.token,
            mint: p.mint,
            valueSOL: p.currentValueSOL,
            costBasis: p.entryValueSOL,
            unrealizedPnL: p.unrealizedPnL,
            ageSeconds: (Date.now() - p.entryTime) / 1000,
        }));

        return {
            liquidSOL: this.liquidSOL,
            positions,
            positionCount: this.positions.size,
            totalValueSOL: this.getPortfolioValueSOL(),
            unrealizedPnLSOL: this.getTotalUnrealizedPnL(),
            totalFeesSOL: this.totalFeesSOL,
            penaltyScore: this.penaltyScore,
            violations: this.violations.length,
            edgeValidated: this.edgeValidated,
            validatedTokens: this.validatedTokens,
        };
    }

    private report(verdict: 'PASS' | 'FAIL', reason: string): UnifiedSimulationReport {
        const finalValue = this.getPortfolioValueSOL();
        const pnlPct = ((finalValue - this.START_SOL) / this.START_SOL) * 100;

        return {
            startSOL: this.START_SOL,
            endSOL: finalValue,
            solPriceUSD: this.solPriceUSD,
            pnlPct,
            penaltyScore: this.penaltyScore,
            totalInvalidDecisions: this.logs.filter(l => l.skippedReason).length,
            logs: this.logs,
            verdict,
            verdictReason: reason,
            funnelMetrics: {
                edgeValidated: this.edgeValidated,
                totalCycles: this.cycleMetrics.length,
                validatedTokens: this.validatedTokens,
                stopReason: reason,
            },
            cycleMetrics: this.cycleMetrics,
            trustLevel: this.trustDecision ? TrustLevel[this.trustDecision.trustLevel] : 'UNKNOWN',
            disciplineViolations: this.violations.length,
            blockedBuys: this.blockedBuys,
            authorizedBuys: this.authorizedBuys,
        };
    }

    private emitFunnelEvent(type: string, data: any) {
        if (this.onFunnelEvent) {
            this.onFunnelEvent(type, data);
        }
    }

    private async fetchSolPrice() {
        try {
            const response = await fetch('https://api.jup.ag/price/v2?ids=So11111111111111111111111111111111111111112');
            const data = await response.json();
            this.solPriceUSD = parseFloat(data.data['So11111111111111111111111111111111111111112']?.price || '150');
            if (!this.solPriceUSD || this.solPriceUSD <= 0) {
                this.solPriceUSD = 150;
            }
        } catch {
            this.solPriceUSD = 150;
        }
    }

    private sleep(ms: number) {
        return new Promise(res => setTimeout(res, ms));
    }
}
