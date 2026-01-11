/**
 * Brutal Brain Simulation Engine
 * 
 * 30-minute run with real-time logging
 * Position-based financial realism.
 */

import { DecisionLog, DecisionIntent, SimulationReport, Position } from './types';
import { evaluateDecision } from './evaluateDecision';

export class BrutalBrainSimulation {
    private readonly START_SOL = 0.1;
    private readonly DURATION_MS = 30 * 60 * 1000; // 30 minutes
    private readonly MIN_INTERVAL_MS = 12_000; // 12 seconds

    private balanceSOL = this.START_SOL;
    private currentToken = 'SOL';
    private position: Position | null = null;
    private realizedPnlSOL = 0;

    private logs: DecisionLog[] = [];
    private penaltyScore = 0;
    private consecutiveRejects = 0;

    private lastActionAt = Date.now();
    private onProgress?: (log: DecisionLog, state: any) => void;

    /**
     * Run simulation with real-time progress callback
     */
    async run(
        brain: (state: any) => DecisionIntent & { action: any; toToken?: string },
        onProgress?: (log: DecisionLog, state: any) => void
    ): Promise<SimulationReport> {
        this.onProgress = onProgress;
        const start = Date.now();

        while (Date.now() - start < this.DURATION_MS) {
            const now = Date.now();

            // Cooldown check
            if (now - this.lastActionAt < this.MIN_INTERVAL_MS) {
                await this.sleep(500);
                continue;
            }

            // Brain makes decision
            const intentDecision = brain(this.getState());

            const log: DecisionLog = {
                timestamp: now,
                action: intentDecision.action as any,
                fromToken: this.currentToken,
                toToken: intentDecision.action === 'SWAP' ? intentDecision.toToken : undefined,
                intent: intentDecision,
                executed: false,
                pnlSOL: 0,
                realizedPnlSOL: 0,
                unrealizedPnlSOL: 0,
                portfolioValueSOL: this.getTotalValueSOL(),
            };

            // ===== HARD GUARD: NO-OP SWAP PREVENTION =====
            if (
                intentDecision.action === 'SWAP' &&
                intentDecision.toToken === this.currentToken
            ) {
                log.executed = false;
                log.skippedReason = 'INVALID_SWAP_SAME_TOKEN';
                log.evaluation = {
                    outcomeClass: 'BAD_DECISION_BAD_OUTCOME',
                    penaltyScore: 5,
                    explanation: 'Swap proposed with identical from/to token (no-op)',
                };
                this.penaltyScore += 5;
                this.consecutiveRejects++;
                if (this.consecutiveRejects >= 3) {
                    this.penaltyScore += 10;
                    log.evaluation.explanation += ' | SPAM PENALTY (+10)';
                }
                this.logs.push(log);
                this.lastActionAt = now;
                if (this.onProgress) this.onProgress(log, this.getState());
                continue;
            }

            this.consecutiveRejects = 0;

            // ===== EXECUTION LOGIC =====
            if (intentDecision.action === 'HESITATE') {
                log.executed = false;
                // Still update unrealized if we have a position
                if (this.position) {
                    this.simulatePriceMove();
                    log.unrealizedPnlSOL = this.position.tokenAmount - this.position.entryValueSOL;
                }
            } else if (intentDecision.action === 'SWAP' || intentDecision.action === 'EXIT') {
                const toToken = intentDecision.toToken || 'SOL';

                if (toToken === 'SOL') {
                    // EXITING TO SOL
                    if (!this.position) {
                        log.executed = false;
                        log.skippedReason = 'INVALID_EXIT_NO_POSITION';
                        log.evaluation = {
                            outcomeClass: 'BAD_DECISION_BAD_OUTCOME',
                            penaltyScore: 2,
                            explanation: 'Tried to exit to SOL while already in SOL',
                        };
                    } else {
                        const exitValue = this.simulateExitValue(this.position);
                        const tradePnl = exitValue - this.position.entryValueSOL;

                        this.realizedPnlSOL += tradePnl;
                        this.balanceSOL = exitValue;
                        this.currentToken = 'SOL';
                        this.position = null;

                        log.action = 'EXIT';
                        log.executed = true;
                        log.realizedPnlSOL = tradePnl;
                        log.pnlSOL = tradePnl;
                    }
                } else {
                    // OPENING OR FLIPPING POSITION
                    const entryCost = 0.0005; // Fees + Slippage approx
                    const startVal = this.getTotalValueSOL();
                    const entryValue = startVal - entryCost;

                    this.position = {
                        token: toToken,
                        entryValueSOL: entryValue,
                        entryPrice: 1.0,
                        tokenAmount: entryValue,
                        openedAt: now,
                    };

                    this.balanceSOL = 0;
                    this.currentToken = toToken;

                    log.executed = true;
                    log.entryCostSOL = entryCost;
                    log.unrealizedPnlSOL = -entryCost; // Start at loss
                }
            } else if (intentDecision.action === 'HOLD') {
                if (this.position) {
                    this.simulatePriceMove();
                    log.unrealizedPnlSOL = this.position.tokenAmount - this.position.entryValueSOL;
                    log.executed = true;
                } else {
                    log.executed = false;
                    log.skippedReason = 'HOLDING_SOL_NO_OP';
                }
            }

            // State sync
            log.portfolioValueSOL = this.getTotalValueSOL();
            log.realizedPnlSOL = this.realizedPnlSOL;

            // EVALUATE
            const evaluation = evaluateDecision(log);
            log.evaluation = evaluation;
            this.penaltyScore += evaluation.penaltyScore;

            this.logs.push(log);
            this.lastActionAt = now;

            if (this.onProgress) this.onProgress(log, this.getState());

            if (this.penaltyScore > 25) break;

            await this.sleep(200);
        }

        return this.report();
    }

    private simulatePriceMove() {
        if (!this.position) return;
        const noise = (Math.random() - 0.48) * 0.02; // Slight positive bias if brain follows trend
        this.position.tokenAmount *= (1 + noise);
    }

    private getTotalValueSOL(): number {
        return this.balanceSOL + (this.position?.tokenAmount || 0);
    }

    private simulateExitValue(pos: Position): number {
        const exitFee = 0.0003;
        return pos.tokenAmount - exitFee;
    }

    private getState() {
        return {
            balanceSOL: this.balanceSOL,
            token: this.currentToken,
            hasPosition: !!this.position,
            penaltyScore: this.penaltyScore,
            totalValueSOL: this.getTotalValueSOL(),
        };
    }

    private report(): SimulationReport {
        const finalValue = this.getTotalValueSOL();
        const pnlPct = ((finalValue - this.START_SOL) / this.START_SOL) * 100;
        const totalInvalidDecisions = this.logs.filter(l => l.skippedReason === 'INVALID_SWAP_SAME_TOKEN').length;

        const passConditions = [
            pnlPct > 1,
            this.penaltyScore < 20,
            totalInvalidDecisions === 0,
        ];

        const verdict = passConditions.every(c => c) ? 'PASS' : 'FAIL';

        return {
            startSOL: this.START_SOL,
            endSOL: finalValue,
            pnlPct,
            penaltyScore: this.penaltyScore,
            totalInvalidDecisions,
            logs: this.logs,
            verdict,
            verdictReason: `PnL ${pnlPct.toFixed(2)}%, Penalty ${this.penaltyScore}, Invalid Swaps ${totalInvalidDecisions}`,
        };
    }

    private sleep(ms: number) {
        return new Promise(res => setTimeout(res, ms));
    }
}
