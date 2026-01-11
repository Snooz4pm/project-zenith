/**
 * Brutal Brain Simulation Engine
 * 
 * 30-minute run with real-time logging
 * Position-based financial realism.
 */

import { DecisionLog, DecisionIntent, SimulationReport, Position } from './types';
import { evaluateDecision } from './evaluateDecision';

export class BrutalBrainSimulation {
    private readonly START_SOL = 0.2;
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

        // Initial invariant check
        this.assertConservation();

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
                pnlSOL: 0, // Legacy
                realizedPnlSOL: 0,
                unrealizedPnlSOL: 0,
                portfolioValueSOL: this.getPortfolioValueSOL(),
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
                        const exitValue = this.position.tokenAmount; // Using current market value
                        const tradePnl = exitValue - this.position.entryValueSOL;

                        // Banking profit (minus exit fees)
                        const exitFee = 0.0003;
                        const netExitValue = exitValue - exitFee;

                        // Realized PnL includes the exit fee drop
                        const totalRealizedPnl = netExitValue - this.position.entryValueSOL;

                        this.realizedPnlSOL += totalRealizedPnl;
                        this.balanceSOL = netExitValue;
                        this.currentToken = 'SOL';
                        this.position = null;

                        log.action = 'EXIT';
                        log.executed = true;
                        log.realizedPnlSOL = totalRealizedPnl;
                        log.pnlSOL = totalRealizedPnl;
                        log.tradeValueSOL = exitValue; // Log exit size
                    }
                } else {
                    // OPENING OR FLIPPING POSITION
                    const entryCost = 0.0005; // Fees + Slippage

                    // HANDLE FLIP: If already in position, close it first
                    if (this.position) {
                        const exitValue = this.position.tokenAmount;
                        const exitFee = 0.0003;
                        const netExitValue = exitValue - exitFee;
                        const totalRealizedPnl = netExitValue - this.position.entryValueSOL;

                        this.realizedPnlSOL += totalRealizedPnl;
                        this.balanceSOL = netExitValue;
                        this.position = null;
                        this.currentToken = 'SOL';
                        // Implicit close - we don't log a separate EXIT event, 
                        // as the SWAP action from A -> B implies selling A.
                    }

                    this.openPosition(toToken, entryCost, now);

                    log.executed = true;
                    log.entryCostSOL = entryCost;
                    log.unrealizedPnlSOL = -entryCost; // Start at loss
                    log.tradeValueSOL = this.position!.entryValueSOL; // Log purchase size
                    this.currentToken = toToken;
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

            // Post-Action Safety Check
            this.assertConservation();

            // State sync
            log.portfolioValueSOL = this.getPortfolioValueSOL();
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

    private openPosition(token: string, fees: number, now: number) {
        // Here is where value conservation happens.
        // We take SOL, subtract fees, and move the rest into the position.
        const solToSpend = this.balanceSOL;
        const netValue = solToSpend - fees;

        if (netValue <= 0) {
            // Safety check: if fees eat everything, we can't open.
            throw new Error(`Insufficient funds to open position. Needed > ${fees}, had ${solToSpend}`);
        }

        this.position = {
            token,
            entryValueSOL: netValue,
            entryPrice: 1.0,
            tokenAmount: netValue, // 1:1 simulation value preservation
            openedAt: now,
        };

        this.balanceSOL = 0;
    }

    private simulatePriceMove() {
        if (!this.position) return;
        const noise = (Math.random() - 0.48) * 0.02; // Slight positive bias if brain follows trend
        this.position.tokenAmount *= (1 + noise);
    }

    // SINGLE SOURCE OF TRUTH
    private getPortfolioValueSOL(): number {
        if (this.position) {
            return this.balanceSOL + this.position.tokenAmount;
        }
        return this.balanceSOL;
    }

    private assertConservation() {
        const val = this.getPortfolioValueSOL();
        if (val <= 0 || isNaN(val)) {
            throw new Error(`CRITICAL: Portfolio value conservation failed. Value: ${val}`);
        }
    }

    private getState() {
        return {
            balanceSOL: this.getPortfolioValueSOL(), // Brain sees total value
            token: this.currentToken,
            hasPosition: !!this.position,
            penaltyScore: this.penaltyScore,
            totalValueSOL: this.getPortfolioValueSOL(),
        };
    }

    private report(): SimulationReport {
        const finalValue = this.getPortfolioValueSOL();
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
