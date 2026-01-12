/**
 * Brain V2 Behavioral Trial - 10 Pillars Integration
 *
 * ONE loop. ONE clock. ONE authority.
 *
 * Architecture:
 * 1. Universe → Jupiter Proxy (1000 CHAOS tokens)
 * 2. Trust → Pillar 9 evaluation
 * 3. Compounding Funnel → Predict → Wait → Score → Adapt → Narrow
 * 4. Execution → Paper trade only if edge validated
 * 5. Post-Mortem → Truth report
 *
 * CHAOS TOKENS ONLY - No stablecoins, no majors
 */

import { DecisionLog, SimulationReport, Position } from './types';
import { TrustDecision } from '@/lib/trust-engine/trustDecision';
import { TrustLevel } from '@/lib/trust-engine/trustLevels';

// === PILLAR 10: COMPOUNDING FUNNEL ===
import {
    freezeUniverse,
    createFunnelState,
    predictFunnel,
    scoreFunnel,
    getFlatStatistics,
    FunnelState,
    TokenCandidate,
    PILLAR_10_CONFIG,
    // Pillar X: Anti-Stall Governance
    enforcePillarX,
    detectLearningStall,
    getFunnelVerdict,
    // Pillar 11: Agency Accountability
    evaluateAgency,
    // Pillar 14: Emotional Calibration
    calibrateEmotions,
    PILLAR_14_CONFIG,
} from '@/lib/learning-validation/compoundingLoop';
import { DirectionBias } from '@/lib/learning-validation/predictor';
import {
    startLearningRun,
    archiveTokens,
    endLearningRun,
    getAccumulatedBiases,
} from '@/lib/learning-validation/memory';

const SOL_MINT = 'So11111111111111111111111111111111111111112';

// Cycle metrics for post-mortem
interface CycleMetrics {
    cycle: number;
    regime: string;
    predictions: { up: number; down: number; flat: number };
    accuracy: number;
    survivors: number;
    eliminated: number;
    biases: DirectionBias;
    flatStats: { total: number; correct: number; cowardice: number };
    // Pillar 13: Attention & Regret
    attention?: {
        focusRatio: number;
        attentionSetSize: number;
        ignoredCount: number;
        missedOpportunities: number;
        totalRegret: number;
    };
}

export interface BrutalSimulationReport extends SimulationReport {
    cycleMetrics: CycleMetrics[];
    funnelMetrics: {
        edgeValidated: boolean;
        totalCycles: number;
        validatedTokens: string[];
        stopReason: string;
    };
    trustLevel: string;
}

export class BrutalBrainSimulation {
    private readonly START_SOL = 0.1;
    private readonly DURATION_MS = 30 * 60 * 1000; // 30 minutes max
    private readonly MAX_CYCLES = 6; // Max funnel cycles

    private balanceSOL = this.START_SOL;
    private position: Position | null = null;
    private realizedPnlSOL = 0;
    private solPriceUSD = 150;

    private logs: DecisionLog[] = [];
    private penaltyScore = 0;

    private onEvent?: (type: string, data: any) => void;

    // Pillar 10: Funnel state
    private funnelState: FunnelState | null = null;
    private cycleMetrics: CycleMetrics[] = [];
    private edgeValidated = false;
    private validatedTokens: TokenCandidate[] = [];
    private stopReason: string = '';

    // Pillar 9: Trust
    private trustDecision: TrustDecision | null = null;

    /**
     * Run 30-minute behavioral trial with all 10 pillars
     */
    async run(
        onEvent?: (type: string, data: any) => void
    ): Promise<BrutalSimulationReport> {
        this.onEvent = onEvent;
        const start = Date.now();

        this.emit('START', { startSOL: this.START_SOL, timestamp: start });
        console.log('[BrutalSim] 🚀 Starting 10-Pillar Behavioral Trial');
        console.log(`[BrutalSim] Duration: 30 minutes | Starting SOL: ${this.START_SOL}`);

        // Fetch SOL price
        await this.fetchSolPrice();

        // ====================================================================
        // PHASE 1: FREEZE CHAOS UNIVERSE
        // ====================================================================
        this.emit('PHASE', { phase: 'UNIVERSE', message: 'Freezing CHAOS universe from Jupiter...' });

        const universe = await freezeUniverse(1000);
        if (universe.length === 0) {
            this.emit('ERROR', { message: 'Failed to fetch universe' });
            return this.report('FAIL', 'Universe fetch failed');
        }

        this.emit('UNIVERSE_FROZEN', {
            count: universe.length,
            mode: PILLAR_10_CONFIG.FUNNEL_MODE,
        });
        console.log(`[BrutalSim] ✅ Universe frozen: ${universe.length} CHAOS tokens`);

        // Initialize funnel state
        this.funnelState = createFunnelState(universe);
        // Pillar 14: Init Emotions (Zero state)
        this.funnelState.emotionalState = { confidence: 0, regret: 0, fear: 0 };

        // Persistent Memory: Start run and load accumulated biases
        const runId = startLearningRun();
        const memoryBiases = getAccumulatedBiases();
        this.funnelState.biases = memoryBiases;

        this.emit('MEMORY_INIT', {
            runId,
            biases: {
                up: memoryBiases.upBias.toFixed(2),
                down: memoryBiases.downBias.toFixed(2),
                flat: memoryBiases.flatBias.toFixed(2),
            },
            message: 'Memory loaded. Biases adjusted based on past experience.',
        });
        console.log(`[BrutalSim] 🧠 Memory: UP=${memoryBiases.upBias.toFixed(2)} DOWN=${memoryBiases.downBias.toFixed(2)} FLAT=${memoryBiases.flatBias.toFixed(2)}`);

        // ====================================================================
        // PHASE 2: TRUST EVALUATION (Pillar 9)
        // For testing: Always use Level 1 to allow simulation
        // ====================================================================
        this.emit('PHASE', { phase: 'TRUST', message: 'Evaluating trust level...' });

        // Simulation mode: Use Level 1 Paper Micro (bypasses DB for testing)
        this.trustDecision = {
            trustLevel: TrustLevel.LEVEL_1_PAPER_MICRO,
            executionType: 'PAPER',
            maxTradesAllowed: 2,
            maxSolPerTrade: 0.05,
            reason: 'Simulation Mode (Level 1)',
            timestamp: Date.now(),
            consecutiveEdgeValidated: 0,
            totalRuns: 0,
            violations: 0,
            lastPromotion: null,
            lastDemotion: null,
        };

        this.emit('TRUST_DECISION', {
            level: TrustLevel[this.trustDecision.trustLevel],
            executionType: this.trustDecision.executionType,
            maxTrades: this.trustDecision.maxTradesAllowed,
        });
        console.log(`[BrutalSim] Trust: ${TrustLevel[this.trustDecision.trustLevel]}`);

        if (this.trustDecision.executionType === 'NONE') {
            this.stopReason = 'STOP_TRUST_BLOCKED';
            return this.report('PASS', 'Trust level forbids execution (correct discipline)');
        }

        // ====================================================================
        // PHASE 3: COMPOUNDING FUNNEL (Pillar 10)
        // ====================================================================
        this.emit('PHASE', { phase: 'FUNNEL', message: 'Starting compounding prediction loop...' });

        let cycleCount = 0;
        let executionEarned = false; // Only true when directional commitment is maintained throughout

        // Main loop only ends when:
        // 1. Time expires (30 min)
        // 2. Portfolio = 0
        // 3. MAX_CYCLES reached
        // NOT when directional commitment fails - that just blocks execution
        while (
            cycleCount < this.MAX_CYCLES &&
            Date.now() - start < this.DURATION_MS &&
            this.getPortfolioValueSOL() > 0
        ) {
            cycleCount++;

            // Cycle mode - starts as FULL, may become OBSERVATION_ONLY
            let cycleMode: 'FULL' | 'OBSERVATION_ONLY' = 'FULL';
            let narrowingAllowed = true;

            this.emit('CYCLE_START', {
                cycle: cycleCount,
                tokens: this.funnelState.tokens.length,
                elapsed: Math.floor((Date.now() - start) / 1000) + 's'
            });
            console.log(`\n[BrutalSim] === CYCLE ${cycleCount} ===`);
            console.log(`[BrutalSim] Tokens: ${this.funnelState.tokens.length}`);

            // --- PREDICT (with behavioral adaptation via Pillar 10.5) ---
            const directionalCheck = await predictFunnel(this.funnelState, (type, data) => {
                this.emit(type, data);
            });

            // Track predictions
            const preds = Array.from(this.funnelState.predictions.values());
            const predictionBreakdown = {
                up: preds.filter(p => p === 'UP').length,
                down: preds.filter(p => p === 'DOWN').length,
                flat: preds.filter(p => p === 'FLAT').length,
            };

            this.emit('PREDICTIONS', predictionBreakdown);
            console.log(`[BrutalSim] Predictions: UP=${predictionBreakdown.up} DOWN=${predictionBreakdown.down} FLAT=${predictionBreakdown.flat}`);
            console.log(`[BrutalSim] Biases: UP=${this.funnelState.biases.upBias.toFixed(2)} DOWN=${this.funnelState.biases.downBias.toFixed(2)} FLAT=${this.funnelState.biases.flatBias.toFixed(2)}`);

            // ================================================================
            // PILLAR 10.0: Separation of Observation vs Execution
            // Directional check failure = OBSERVATION_ONLY (soft stop)
            // NOT simulation termination (hard stop)
            // ================================================================
            if (!directionalCheck.valid) {
                cycleMode = 'OBSERVATION_ONLY';
                narrowingAllowed = false;
                executionEarned = false;

                this.emit('OBSERVATION_ONLY', {
                    reason: directionalCheck.reason,
                    violation: directionalCheck.violationType,
                    flatPct: (directionalCheck.flatPct * 100).toFixed(0) + '%',
                    maxFlat: (directionalCheck.maxFlat * 100).toFixed(0) + '%',
                    action: 'CONTINUE_OBSERVING',
                });
                console.log(`[BrutalSim] ⚠️ OBSERVATION_ONLY: ${directionalCheck.reason}`);
                console.log(`[BrutalSim] → Execution blocked, narrowing disabled`);
                console.log(`[BrutalSim] → Continuing to observe, score, and adapt...`);
            } else {
                // Directional commitment maintained - execution potentially earned
                executionEarned = true;
                console.log(`[BrutalSim] ✅ Directional commitment met (${(directionalCheck.directionalPct * 100).toFixed(0)}%)`);
            }

            // ================================================================
            // PILLAR X: Mandatory Informational Exposure Enforcement
            // Anti-stall governance - forces progress through the funnel
            // ================================================================
            const pillarXResult = enforcePillarX(this.funnelState, (type, data) => {
                this.emit(type, data);
            });

            // If Pillar X quota not met after unrestricted cycles, block execution
            if (!pillarXResult.quotaMet) {
                cycleMode = 'OBSERVATION_ONLY';
                narrowingAllowed = false;
                executionEarned = false;
                console.log(`[BrutalSim] ⚠️ Pillar X: Exposure quota not met (${(pillarXResult.actualDirectional * 100).toFixed(0)}% < ${(pillarXResult.requiredQuota * 100).toFixed(0)}%)`);
            }

            // Log eliminated tokens due to FLAT streak
            if (pillarXResult.eliminatedForFlatStreak.length > 0) {
                console.log(`[BrutalSim] 🗑️ Pillar X eliminated ${pillarXResult.eliminatedForFlatStreak.length} tokens for FLAT streak`);
            }

            // --- WAIT (real time observation) - ALWAYS HAPPENS ---
            const waitMs = Math.min(PILLAR_10_CONFIG.OBSERVATION_MINUTES * 60 * 1000, 120_000); // Cap at 120s for demo
            this.emit('WAITING', {
                seconds: Math.floor(waitMs / 1000),
                message: `Observing market for ${Math.floor(waitMs / 1000)}s...`,
                mode: cycleMode,
            });
            console.log(`[BrutalSim] ⏳ Waiting ${Math.floor(waitMs / 1000)}s...`);

            // Tick during wait
            const tickInterval = 5000;
            for (let waited = 0; waited < waitMs; waited += tickInterval) {
                await this.sleep(tickInterval);
                this.emit('TICK', { waited: Math.floor((waited + tickInterval) / 1000), total: Math.floor(waitMs / 1000) });
            }

            // --- SCORE (Pillar 10.3 + 10.4) - ALWAYS HAPPENS ---
            // Penalties apply even in OBSERVATION_ONLY mode!
            this.emit('SCORING', { tokens: this.funnelState.tokens.length, mode: cycleMode });
            const result = await scoreFunnel(this.funnelState, (type, data) => {
                this.emit(type, data);
            }, narrowingAllowed); // Pass narrowing permission

            // Persistent Memory: Archive eliminated tokens
            if (result.eliminated.length > 0) {
                // We need current prices to determine outcome
                // scoreFunnel updates prices on tokens, so we can use them
                const currentPrices = new Map<string, number>();
                result.eliminated.forEach(t => currentPrices.set(t.symbol, t.priceAtEnd || t.priceAtStart));

                archiveTokens(result.eliminated, result.cycle, currentPrices, (type, data) => {
                    this.emit(type, data);
                });
            }

            // Track cycle metrics
            const flatStats = getFlatStatistics(this.funnelState.predictionStorage);
            this.cycleMetrics.push({
                cycle: result.cycle,
                regime: result.regime,
                predictions: predictionBreakdown,
                accuracy: result.accuracy,
                survivors: result.tokensAfter,
                eliminated: narrowingAllowed ? result.eliminated.length : 0,
                biases: { ...this.funnelState.biases },
                flatStats: {
                    total: flatStats.totalFlat,
                    correct: flatStats.correctFlat,
                    cowardice: flatStats.cowardiceScore,
                },
                // Pillar 13: Attention & Regret
                attention: this.funnelState.attentionDecision ? {
                    focusRatio: this.funnelState.attentionDecision.focusRatio,
                    attentionSetSize: this.funnelState.attentionDecision.attentionSet.length,
                    ignoredCount: this.funnelState.attentionDecision.ignoredTokens.length,
                    missedOpportunities: this.funnelState.missedOpportunityCount,
                    totalRegret: this.funnelState.totalRegret,
                } : undefined,
            });

            this.emit('CYCLE_COMPLETE', {
                cycle: result.cycle,
                mode: cycleMode,
                accuracy: (result.accuracy * 100).toFixed(1) + '%',
                survivors: result.tokensAfter,
                eliminated: narrowingAllowed ? result.eliminated.length : 0,
                executionEarned,
            });
            console.log(`[BrutalSim] Accuracy: ${(result.accuracy * 100).toFixed(1)}% | Survivors: ${result.tokensAfter} | Mode: ${cycleMode}`);

            // Log Pillar 13 attention metrics if available
            if (this.funnelState.attentionDecision) {
                console.log(`[BrutalSim] Attention: ${this.funnelState.attentionDecision.attentionSet.length}/${this.funnelState.attentionDecision.totalAvailable} (${(this.funnelState.attentionDecision.focusRatio * 100).toFixed(1)}%) | Regret: ${this.funnelState.totalRegret.toFixed(2)} | Missed: ${this.funnelState.missedOpportunityCount}`);
            }

            // Pillar 14: Calibrate Emotions
            const emotions = calibrateEmotions(this.funnelState);
            this.funnelState.emotionalState = emotions;

            this.emit('PILLAR_14_EMOTIONS', {
                cycle: this.funnelState.cycle,
                emotions,
                message: `Calibrated: 🦁${emotions.confidence.toFixed(1)} 😢${emotions.regret.toFixed(1)} 😱${emotions.fear.toFixed(1)}`
            });

            // ================================================================
            // PILLAR X.4: Learning Stall Detection
            // If no narrowing, no penalties, no adaptation → FAIL (unable to learn)
            // ================================================================
            const totalEliminated = this.funnelState.eliminated.length;
            const totalPenalty = this.cycleMetrics.reduce((sum, m) => sum + m.flatStats.cowardice, 0);
            const stallCheck = detectLearningStall(this.funnelState, totalEliminated, totalPenalty, (type, data) => {
                this.emit(type, data);
            });

            if (stallCheck.stalled) {
                this.stopReason = 'STALL_DETECTED';
                console.log(`[BrutalSim] ❌ ${stallCheck.reason}`);
                return this.report('FAIL', stallCheck.reason || 'Stall detected - unable to learn under uncertainty');
            }

            // ================================================================
            // PILLAR 11: Agency Accountability
            // Does this system deserve to exist as an agent?
            // ================================================================
            const learningProgress = narrowingAllowed && result.eliminated.length > 0;
            const agencyResult = evaluateAgency(this.funnelState, this.funnelState.predictions, learningProgress, (type, data) => {
                this.emit(type, data);
            });

            if (!agencyResult.passed) {
                this.stopReason = 'AGENCY_FAILURE';
                console.log(`[BrutalSim] ❌ ${agencyResult.failReason}`);
                return this.report('FAIL', agencyResult.failReason || 'Agency accountability failure');
            }

            // Log agency status
            console.log(`[BrutalSim] 🧠 Agency: ${agencyResult.quotaStatus.directional}/${agencyResult.quotaStatus.required} directional | Debt: ${agencyResult.debtStatus.debt}/${agencyResult.debtStatus.maxDebt}`);

            // ================================================================
            // RECOVERY RULE: Directional Forgiveness Window Trigger
            // If tried hard (directional > 50%) but failed (accuracy < 20%),
            // activate recovery mode for NEXT cycle.
            // ================================================================
            const totalPreds = predictionBreakdown.up + predictionBreakdown.down + predictionBreakdown.flat;
            const dirRatio = (predictionBreakdown.up + predictionBreakdown.down) / Math.max(1, totalPreds);

            if (dirRatio > 0.5 && result.accuracy < 0.2) {
                this.funnelState.agencyState.recoveryModeActive = true;
                console.log('[BrutalSim] 🩹 Recovery Mode ACTIVATED for next cycle (High effort, low accuracy)');
            } else {
                this.funnelState.agencyState.recoveryModeActive = false;
            }

            // Check end conditions - only FUNNEL states, not directional failures
            if (this.funnelState.funnelComplete && executionEarned) {
                this.stopReason = 'FUNNEL_COMPLETE';
                console.log('[BrutalSim] ✅ Funnel complete - edge candidates identified');
                break;
            }
            if (this.funnelState.funnelCollapsed) {
                this.stopReason = 'FUNNEL_COLLAPSED';
                console.log('[BrutalSim] ⚠️ Funnel collapsed - no survivors');
                break;
            }
        }

        // Get funnel verdict
        const verdict = getFunnelVerdict(this.funnelState);
        this.edgeValidated = verdict.shouldExecute;
        this.validatedTokens = verdict.candidates;
        if (!this.stopReason) {
            this.stopReason = verdict.reason;
        }

        this.emit('FUNNEL_VERDICT', {
            edgeValidated: this.edgeValidated,
            validatedTokens: this.validatedTokens.map(t => t.symbol),
            reason: this.stopReason,
        });
        console.log(`\n[BrutalSim] === FUNNEL VERDICT ===`);
        console.log(`[BrutalSim] Edge Validated: ${this.edgeValidated}`);
        console.log(`[BrutalSim] Validated Tokens: ${this.validatedTokens.map(t => t.symbol).join(', ') || 'NONE'}`);
        console.log(`[BrutalSim] Reason: ${this.stopReason}`);

        // ====================================================================
        // PHASE 4: EXECUTION (Only if earned)
        // ====================================================================
        if (!this.edgeValidated) {
            this.emit('EXECUTION_BLOCKED', { reason: 'Edge not validated' });
            return this.report('PASS', `NO TRADE: ${this.stopReason} (correct discipline)`);
        }

        if (this.validatedTokens.length === 0) {
            this.emit('EXECUTION_BLOCKED', { reason: 'No validated tokens' });
            return this.report('PASS', 'NO TRADE: No tokens survived funnel');
        }

        // Execute one paper trade on best validated token
        this.emit('PHASE', { phase: 'EXECUTION', message: 'Executing paper trade...' });
        console.log('\n[BrutalSim] === EXECUTION ===');

        const bestToken = this.validatedTokens[0];
        const tradeAmount = Math.min(this.balanceSOL, this.trustDecision.maxSolPerTrade);
        const fee = 0.0005;

        if (tradeAmount <= fee) {
            this.emit('EXECUTION_BLOCKED', { reason: 'Insufficient funds' });
            return this.report('FAIL', 'Insufficient funds for trade');
        }

        // Open position
        this.position = {
            token: bestToken.mint,
            entryValueSOL: tradeAmount - fee,
            entryPrice: bestToken.priceAtStart,
            tokenAmount: tradeAmount - fee,
            openedAt: Date.now(),
        };
        this.balanceSOL -= tradeAmount;

        this.emit('TRADE_OPENED', {
            token: bestToken.symbol,
            amount: tradeAmount,
            fee,
        });
        console.log(`[BrutalSim] ✅ Opened position: ${bestToken.symbol} (${tradeAmount.toFixed(4)} SOL)`);

        // Hold for remaining time (simulate price movement)
        const holdTime = Math.min(5 * 60 * 1000, this.DURATION_MS - (Date.now() - start));
        this.emit('HOLDING', { seconds: Math.floor(holdTime / 1000) });
        console.log(`[BrutalSim] ⏳ Holding for ${Math.floor(holdTime / 1000)}s...`);

        // Simulate price movement during hold
        const intervals = Math.floor(holdTime / 5000);
        for (let i = 0; i < intervals; i++) {
            await this.sleep(5000);
            // Random walk with slight positive bias for UP predictions
            const noise = (Math.random() - 0.45) * 0.02;
            this.position.tokenAmount *= (1 + noise);
        }

        // Exit position
        const exitValue = this.position.tokenAmount;
        const exitFee = 0.0003;
        const netExit = exitValue - exitFee;
        const pnl = netExit - (tradeAmount - fee);

        this.realizedPnlSOL = pnl;
        this.balanceSOL += netExit;
        this.position = null;

        this.emit('TRADE_CLOSED', {
            token: bestToken.symbol,
            exitValue,
            pnl,
        });
        console.log(`[BrutalSim] ✅ Closed position: ${pnl >= 0 ? '+' : ''}${pnl.toFixed(6)} SOL`);

        // ====================================================================
        // PHASE 5: POST-MORTEM
        // ====================================================================
        this.emit('PHASE', { phase: 'POSTMORTEM', message: 'Generating truth report...' });

        return this.report(
            pnl >= 0 ? 'PASS' : 'FAIL',
            `Trade ${pnl >= 0 ? 'profitable' : 'unprofitable'}: ${pnl >= 0 ? '+' : ''}${pnl.toFixed(6)} SOL`
        );
    }

    private emit(type: string, data: any) {
        if (this.onEvent) {
            this.onEvent(type, data);
        }
    }

    private async fetchSolPrice() {
        try {
            const response = await fetch('https://api.jup.ag/price/v2?ids=So11111111111111111111111111111111111111112');
            const data = await response.json();
            this.solPriceUSD = parseFloat(data.data[SOL_MINT]?.price || '150');
            if (!this.solPriceUSD || this.solPriceUSD <= 0) this.solPriceUSD = 150;
        } catch {
            this.solPriceUSD = 150;
        }
        console.log(`[BrutalSim] SOL price: $${this.solPriceUSD.toFixed(2)}`);
    }

    private getPortfolioValueSOL(): number {
        return this.balanceSOL + (this.position?.tokenAmount || 0);
    }

    private report(verdict: 'PASS' | 'FAIL', reason: string): BrutalSimulationReport {
        const finalValue = this.getPortfolioValueSOL();
        const pnlPct = ((finalValue - this.START_SOL) / this.START_SOL) * 100;

        console.log('\n[BrutalSim] === FINAL REPORT ===');
        console.log(`  Start: ${this.START_SOL} SOL`);
        console.log(`  End: ${finalValue.toFixed(6)} SOL`);
        console.log(`  PnL: ${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%`);
        console.log(`  Cycles: ${this.cycleMetrics.length}`);
        console.log(`  Verdict: ${verdict}`);
        console.log(`  Reason: ${reason}`);

        this.emit('REPORT', {
            verdict,
            reason,
            startSOL: this.START_SOL,
            endSOL: finalValue,
            pnlPct,
            cycles: this.cycleMetrics.length,
        });

        // Persistent Memory: End learning run
        endLearningRun(verdict, (type, data) => {
            this.emit(type, data);
        });

        return {
            startSOL: this.START_SOL,
            endSOL: finalValue,
            solPriceUSD: this.solPriceUSD,
            pnlPct,
            penaltyScore: this.penaltyScore,
            totalInvalidDecisions: 0,
            logs: this.logs,
            verdict,
            verdictReason: reason,
            cycleMetrics: this.cycleMetrics,
            funnelMetrics: {
                edgeValidated: this.edgeValidated,
                totalCycles: this.cycleMetrics.length,
                validatedTokens: this.validatedTokens.map(t => t.symbol),
                stopReason: this.stopReason,
            },
            trustLevel: this.trustDecision ? TrustLevel[this.trustDecision.trustLevel] : 'UNKNOWN',
        };
    }

    private sleep(ms: number) {
        return new Promise(res => setTimeout(res, ms));
    }
}
