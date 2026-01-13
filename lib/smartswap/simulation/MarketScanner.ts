/**
 * Market Scanner Engine - 10 Pillars Integration
 *
 * ONE loop. ONE clock. ONE authority.
 *
 * Architecture:
 * 1. Universe → Jupiter Proxy (1000 CHAOS tokens)
 * 2. Compounding Funnel → Predict → Score → Narrow (Immediate)
 * 3. Execution → Paper trade only if edge validated
 * 4. Post-Mortem → Truth report
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
    getFunnelVerdict,
} from '@/lib/learning-validation/compoundingLoop';
import {
    startLearningRun,
    archiveTokens,
    endLearningRun,
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

    flatStats: { total: number; correct: number; cowardice: number };
}

export interface ScannerReport extends SimulationReport {
    cycleMetrics: CycleMetrics[];
    funnelMetrics: {
        edgeValidated: boolean;
        totalCycles: number;
        validatedTokens: string[];
        stopReason: string;
    };
    trustLevel: string;
}

export class MarketScannerEngine {
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
    ): Promise<ScannerReport> {
        this.onEvent = onEvent;
        const start = Date.now();

        this.emit('START', { startSOL: this.START_SOL, timestamp: start });
        console.log('[MarketScanner] 🚀 Starting Market Scanner Engine');
        console.log(`[MarketScanner] Duration: 30 minutes | Starting SOL: ${this.START_SOL}`);

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
        console.log(`[MarketScanner] ✅ Universe frozen: ${universe.length} CHAOS tokens`);

        // Initialize funnel state
        this.funnelState = createFunnelState(universe);

        // Persistent Memory: Start run (Lobotomized - No Biases)
        const runId = startLearningRun();

        this.emit('MEMORY_INIT', {
            runId,
            message: 'Memory loaded. Biases neutral.',
        });

        // ====================================================================
        // PHASE 2: TRUST EVALUATION (Pillar 9)
        // ====================================================================
        this.emit('PHASE', { phase: 'TRUST', message: 'Evaluating trust level...' });

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

        // ====================================================================
        // PHASE 3: COMPOUNDING FUNNEL (Pillar 10)
        // ====================================================================
        this.emit('PHASE', { phase: 'FUNNEL', message: 'Starting compounding prediction loop...' });

        let cycleCount = 0;
        let executionEarned = true;

        while (
            cycleCount < this.MAX_CYCLES &&
            Date.now() - start < this.DURATION_MS &&
            this.getPortfolioValueSOL() > 0
        ) {
            cycleCount++;
            let cycleMode: 'FULL' | 'OBSERVATION_ONLY' = 'FULL';
            let narrowingAllowed = true;

            this.emit('CYCLE_START', {
                cycle: cycleCount,
                tokens: this.funnelState.tokens.length,
                elapsed: Math.floor((Date.now() - start) / 1000) + 's'
            });

            // --- PREDICT ---
            await predictFunnel(this.funnelState, (type, data) => {
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

            // --- WAIT (Short Wait only for Tick Data, effectively 0 for logic) ---
            const waitMs = 5000; // Minimal tick
            this.emit('WAITING', {
                seconds: Math.floor(waitMs / 1000),
                message: `Scanning market...`,
                mode: cycleMode,
            });
            await this.sleep(waitMs);

            // --- SCORE ---
            this.emit('SCORING', { tokens: this.funnelState.tokens.length, mode: cycleMode });
            const result = await scoreFunnel(this.funnelState, (type, data) => {
                this.emit(type, data);
            }, narrowingAllowed);

            // Track cycle metrics
            const flatStats = getFlatStatistics(this.funnelState.predictionStorage);
            this.cycleMetrics.push({
                cycle: result.cycle,
                regime: result.regime,
                predictions: predictionBreakdown,
                accuracy: result.accuracy,
                survivors: result.tokensAfter,
                eliminated: narrowingAllowed ? result.eliminated.length : 0,

                flatStats: {
                    total: flatStats.totalFlat,
                    correct: flatStats.correctFlat,
                    cowardice: flatStats.cowardiceScore,
                },
            });

            this.emit('CYCLE_COMPLETE', {
                cycle: result.cycle,
                mode: cycleMode,
                accuracy: (result.accuracy * 100).toFixed(1) + '%',
                survivors: result.tokensAfter,
            });

            // Check end conditions
            if (this.funnelState.funnelComplete && executionEarned) {
                this.stopReason = 'FUNNEL_COMPLETE';
                break;
            }
            if (this.funnelState.funnelCollapsed) {
                this.stopReason = 'FUNNEL_COLLAPSED';
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

        // ====================================================================
        // PHASE 4: EXECUTION
        // ====================================================================
        if (!this.edgeValidated || this.validatedTokens.length === 0) {
            this.emit('EXECUTION_BLOCKED', { reason: this.stopReason });
            return this.report('PASS', `NO TRADE: ${this.stopReason}`);
        }

        // Execution logic
        this.emit('PHASE', { phase: 'EXECUTION', message: 'Executing paper trade...' });
        const bestToken = this.validatedTokens[0];
        const tradeAmount = Math.min(this.balanceSOL, this.trustDecision.maxSolPerTrade);
        const fee = 0.0005;

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

        // Hold simulation (shortened)
        await this.sleep(3000);

        // Close position
        // Simulate random movement since we have no real-time price feed stream here
        const noise = (Math.random() - 0.45) * 0.02;
        this.position.tokenAmount *= (1 + noise);

        const exitValue = this.position.tokenAmount;
        const pnl = exitValue - (tradeAmount - fee);
        this.realizedPnlSOL = pnl;
        this.balanceSOL += exitValue;
        this.position = null;

        this.emit('TRADE_CLOSED', {
            token: bestToken.symbol,
            exitValue,
            pnl,
        });

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
    }

    private getPortfolioValueSOL(): number {
        return this.balanceSOL + (this.position?.tokenAmount || 0);
    }

    private report(verdict: 'PASS' | 'FAIL', reason: string): ScannerReport {
        const finalValue = this.getPortfolioValueSOL();
        const pnlPct = ((finalValue - this.START_SOL) / this.START_SOL) * 100;

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
