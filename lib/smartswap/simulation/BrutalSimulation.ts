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
    private solPriceUSD = 0; // Startup price

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

        // 0. Fetch initial SOL price for valuation
        await this.fetchSolPrice();

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

            const currentValSOL = this.getPortfolioValueSOL();

            const log: DecisionLog = {
                timestamp: now,
                action: intentDecision.action as any,
                fromToken: this.currentToken,
                toToken: intentDecision.action === 'SWAP' ? intentDecision.toToken : undefined,
                intent: intentDecision,
                executed: false,

                // Financials
                pnlSOL: 0,
                realizedPnlSOL: 0,
                unrealizedPnlSOL: 0,

                portfolioValueSOL: currentValSOL,
                portfolioValueUSD: currentValSOL * this.solPriceUSD,
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
                    log.unrealizedPnlUSD = log.unrealizedPnlSOL * this.solPriceUSD;
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
                        this.balanceSOL += netExitValue; // Add back to balance
                        this.currentToken = 'SOL';
                        this.position = null;

                        log.action = 'EXIT';
                        log.executed = true;

                        log.realizedPnlSOL = totalRealizedPnl;
                        log.pnlSOL = totalRealizedPnl;
                        log.realizedPnlUSD = totalRealizedPnl * this.solPriceUSD;

                        log.tradeValueSOL = exitValue;
                        log.tradeValueUSD = exitValue * this.solPriceUSD;
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
                        this.balanceSOL += netExitValue; // Add back to balance
                        this.position = null;
                        this.currentToken = 'SOL';
                    }

                    // Use allocation from intent, default to 100%
                    const allocPct = intentDecision.allocationPct || 100;

                    this.openPosition(toToken, entryCost, now, allocPct);

                    log.executed = true;
                    log.entryCostSOL = entryCost;
                    log.unrealizedPnlSOL = -entryCost; // Start at loss
                    log.unrealizedPnlUSD = -entryCost * this.solPriceUSD;

                    log.tradeValueSOL = this.position!.entryValueSOL; // Log purchase size
                    log.tradeValueUSD = this.position!.entryValueSOL * this.solPriceUSD;

                    this.currentToken = toToken;
                }
            } else if (intentDecision.action === 'HOLD') {
                if (this.position) {
                    this.simulatePriceMove();
                    log.unrealizedPnlSOL = this.position.tokenAmount - this.position.entryValueSOL;
                    log.unrealizedPnlUSD = log.unrealizedPnlSOL * this.solPriceUSD;
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
            log.portfolioValueUSD = log.portfolioValueSOL * this.solPriceUSD;
            log.realizedPnlSOL = this.realizedPnlSOL;
            log.realizedPnlUSD = this.realizedPnlSOL * this.solPriceUSD;

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

    private async fetchSolPrice() {
        try {
            const response = await fetch('https://api.jup.ag/price/v2?ids=So11111111111111111111111111111111111111112');
            const data = await response.json();
            this.solPriceUSD = parseFloat(data.data['So11111111111111111111111111111111111111112']?.price || '0');
            if (!this.solPriceUSD) {
                console.warn('Failed to fetch SOL price, default to 150');
                this.solPriceUSD = 150;
            }
        } catch (e) {
            console.error('Error fetching SOL price:', e);
            this.solPriceUSD = 150; // Fallback
        }
    }

    private openPosition(token: string, fees: number, now: number, allocationPct: number) {
        // Value conservation logic
        const solAvailable = this.balanceSOL;

        // Calculate spend based on allocation
        // Cap at 100% to prevent errors. Cap at 5% min to make it meaningful? No, let brain decide.
        const effectivePct = Math.min(Math.max(allocationPct, 1), 100);
        const solToSpend = solAvailable * (effectivePct / 100);

        const netValue = solToSpend - fees;

        if (netValue <= 0) {
            throw new Error(`Insufficient allocated funds. Available: ${solAvailable}, Alloc: ${effectivePct}%, Needed > ${fees}`);
        }

        this.position = {
            token,
            entryValueSOL: netValue,
            entryPrice: 1.0,
            tokenAmount: netValue, // 1:1 simulation value preservation
            openedAt: now,
        };

        // Subtract spent amount from balance (remaining SOL stays as cash)
        this.balanceSOL -= solToSpend;
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
        const currentVal = this.getPortfolioValueSOL();
        return {
            balanceSOL: currentVal, // Brain sees total value ?? NO. Brain should see LIQUID + POSITION
            // Fixing Brain Input to see breakdown
            liquidSOL: this.balanceSOL,
            positionValueSOL: this.position ? this.position.tokenAmount : 0,

            token: this.currentToken,
            hasPosition: !!this.position,
            penaltyScore: this.penaltyScore,
            totalValueSOL: currentVal,
            solPriceUSD: this.solPriceUSD,
            totalValueUSD: currentVal * this.solPriceUSD,
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
            solPriceUSD: this.solPriceUSD,
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
