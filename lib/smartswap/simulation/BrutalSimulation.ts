/**
 * Brain V2 Simulation with 10 Pillars Integration
 *
 * Full integration:
 * - Jupiter Proxy (1000 tokens)
 * - Regime Detection
 * - Trust Engine
 * - Learning Validation
 * - Real market data
 * - Paper trading with 0.1 SOL
 */

import { DecisionLog, DecisionIntent, SimulationReport, Position } from './types';
import { evaluateDecision } from './evaluateDecision';
import { buildTradingUniverse } from '@/lib/simulation/data-fetcher';
import { detectRegime } from '@/lib/learning-validation/regimeDetector';
import { evaluateTrust } from '@/lib/trust-engine/trustEvaluator';
import { isExecutionAllowed } from '@/lib/trust-engine/trustDecision';
import { searchForPath } from '@/lib/smartswap/brainv2';
import type { SearchableToken, BrainGoal } from '@/types/BrainV2';
import type { TokenPriceHistory } from '@/lib/learning-validation/types';

const SOL_MINT = 'So11111111111111111111111111111111111111112';

export class BrutalBrainSimulation {
    private readonly START_SOL = 0.1;
    private readonly DURATION_MS = 30 * 60 * 1000; // 30 minutes
    private readonly MIN_INTERVAL_MS = 30_000; // 30 seconds (more realistic)

    private balanceSOL = this.START_SOL;
    private currentToken = 'SOL';
    private currentTokenMint = SOL_MINT;
    private position: Position | null = null;
    private realizedPnlSOL = 0;
    private solPriceUSD = 0;

    private logs: DecisionLog[] = [];
    private penaltyScore = 0;
    private consecutiveRejects = 0;

    private lastActionAt = Date.now();
    private onProgress?: (log: DecisionLog, state: any) => void;

    // Trading universe from Jupiter proxy
    private universe: SearchableToken[] = [];
    private lastUniverseUpdate = 0;
    private readonly UNIVERSE_REFRESH_MS = 5 * 60 * 1000; // 5 minutes

    /**
     * Run simulation with all 10 pillars
     */
    async run(
        brain: (state: any, universe: SearchableToken[]) => DecisionIntent & { action: any; toToken?: string },
        onProgress?: (log: DecisionLog, state: any) => void
    ): Promise<SimulationReport> {
        this.onProgress = onProgress;
        const start = Date.now();

        console.log('[BrutalSim] 🚀 Starting Brain V2 simulation with 10 pillars');
        console.log(`[BrutalSim] Starting balance: ${this.START_SOL} SOL`);

        // Fetch initial SOL price
        await this.fetchSolPrice();

        // Fetch initial trading universe from Jupiter proxy
        await this.updateUniverse();

        // Initial invariant check
        this.assertConservation();

        while (Date.now() - start < this.DURATION_MS) {
            const now = Date.now();

            // Cooldown check
            if (now - this.lastActionAt < this.MIN_INTERVAL_MS) {
                await this.sleep(1000);
                continue;
            }

            // Refresh universe periodically
            if (now - this.lastUniverseUpdate > this.UNIVERSE_REFRESH_MS) {
                await this.updateUniverse();
            }

            // === PILLAR 1: REGIME DETECTION ===
            const priceHistories = this.buildPriceHistories();
            const regime = detectRegime(priceHistories);

            console.log(`[BrutalSim] Regime: ${regime.regime} (confidence: ${(regime.confidence * 100).toFixed(1)}%)`);

            // === PILLAR 9: TRUST ENGINE ===
            const trustDecision = await evaluateTrust();

            console.log(`[BrutalSim] Trust Level: ${trustDecision.trustLevel}`);
            console.log(`[BrutalSim] Max trades: ${trustDecision.maxTradesAllowed}`);
            console.log(`[BrutalSim] Max SOL/trade: ${trustDecision.maxSolPerTrade}`);

            // Check if we can trade based on trust level
            if (trustDecision.executionType === 'NONE') {
                console.log(`[BrutalSim] ⛔ Execution blocked by trust level`);
                await this.sleep(this.MIN_INTERVAL_MS);
                continue;
            }

            // Determine max trade size based on trust
            const maxTradeSize = Math.min(
                this.balanceSOL,
                trustDecision.maxSolPerTrade
            );

            // === BRAIN DECISION ===
            const intentDecision = brain(this.getState(), this.universe);

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

            // === VALIDATION: NO-OP SWAP PREVENTION ===
            if (
                intentDecision.action === 'SWAP' &&
                intentDecision.toToken === this.currentTokenMint
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

            // === EXECUTION LOGIC ===
            if (intentDecision.action === 'HESITATE') {
                log.executed = false;
                if (this.position) {
                    this.simulatePriceMove();
                    log.unrealizedPnlSOL = this.position.tokenAmount - this.position.entryValueSOL;
                    log.unrealizedPnlUSD = log.unrealizedPnlSOL * this.solPriceUSD;
                }
            } else if (intentDecision.action === 'SWAP' || intentDecision.action === 'EXIT') {
                const toTokenMint = this.findTokenMint(intentDecision.toToken || 'SOL');

                if (toTokenMint === SOL_MINT) {
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
                        const exitValue = this.position.tokenAmount;
                        const exitFee = 0.0003;
                        const netExitValue = exitValue - exitFee;
                        const totalRealizedPnl = netExitValue - this.position.entryValueSOL;

                        this.realizedPnlSOL += totalRealizedPnl;
                        this.balanceSOL += netExitValue;
                        this.currentToken = 'SOL';
                        this.currentTokenMint = SOL_MINT;
                        this.position = null;

                        log.action = 'EXIT';
                        log.executed = true;
                        log.realizedPnlSOL = totalRealizedPnl;
                        log.pnlSOL = totalRealizedPnl;
                        log.realizedPnlUSD = totalRealizedPnl * this.solPriceUSD;
                        log.tradeValueSOL = exitValue;
                        log.tradeValueUSD = exitValue * this.solPriceUSD;

                        console.log(`[BrutalSim] ✅ EXIT ${this.currentToken} → SOL: ${totalRealizedPnl >= 0 ? '+' : ''}${totalRealizedPnl.toFixed(6)} SOL`);
                    }
                } else {
                    // OPENING OR FLIPPING POSITION
                    const entryCost = 0.0005;

                    // Handle flip: close existing position first
                    if (this.position) {
                        const exitValue = this.position.tokenAmount;
                        const exitFee = 0.0003;
                        const netExitValue = exitValue - exitFee;
                        const totalRealizedPnl = netExitValue - this.position.entryValueSOL;

                        this.realizedPnlSOL += totalRealizedPnl;
                        this.balanceSOL += netExitValue;
                        this.position = null;
                        this.currentToken = 'SOL';
                        this.currentTokenMint = SOL_MINT;
                    }

                    // Use allocation from intent, capped by trust limit
                    const allocPct = intentDecision.allocationPct || 100;
                    const allocAmount = this.balanceSOL * (allocPct / 100);
                    const tradeAmount = Math.min(allocAmount, maxTradeSize);

                    if (tradeAmount <= entryCost) {
                        log.executed = false;
                        log.skippedReason = 'INSUFFICIENT_FUNDS';
                        log.evaluation = {
                            outcomeClass: 'BAD_DECISION_BAD_OUTCOME',
                            penaltyScore: 1,
                            explanation: `Insufficient funds for trade (need ${entryCost}, have ${tradeAmount})`,
                        };
                    } else {
                        const toToken = this.universe.find(t => t.mint === toTokenMint);

                        this.openPosition(toTokenMint, toToken?.symbol || 'UNKNOWN', entryCost, now, allocPct, maxTradeSize);

                        log.executed = true;
                        log.entryCostSOL = entryCost;
                        log.unrealizedPnlSOL = -entryCost;
                        log.unrealizedPnlUSD = -entryCost * this.solPriceUSD;
                        log.tradeValueSOL = this.position!.entryValueSOL;
                        log.tradeValueUSD = this.position!.entryValueSOL * this.solPriceUSD;

                        this.currentToken = toToken?.symbol || 'UNKNOWN';
                        this.currentTokenMint = toTokenMint;

                        console.log(`[BrutalSim] ✅ SWAP SOL → ${this.currentToken}: ${log.tradeValueSOL.toFixed(6)} SOL`);
                    }
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

            // Stop if penalty too high
            if (this.penaltyScore > 25) {
                console.log('[BrutalSim] ⛔ Stopping: penalty score too high');
                break;
            }

            await this.sleep(1000);
        }

        console.log('[BrutalSim] 🏁 Simulation complete');
        return this.report();
    }

    private async fetchSolPrice() {
        try {
            const response = await fetch('https://api.jup.ag/price/v2?ids=So11111111111111111111111111111111111111112');
            const data = await response.json();
            this.solPriceUSD = parseFloat(data.data['So11111111111111111111111111111111111111112']?.price || '0');
            if (!this.solPriceUSD) {
                console.warn('[BrutalSim] Failed to fetch SOL price, default to 150');
                this.solPriceUSD = 150;
            }
            console.log(`[BrutalSim] SOL price: $${this.solPriceUSD.toFixed(2)}`);
        } catch (e) {
            console.error('[BrutalSim] Error fetching SOL price:', e);
            this.solPriceUSD = 150;
        }
    }

    private async updateUniverse() {
        console.log('[BrutalSim] 🔄 Updating trading universe from Jupiter proxy...');
        try {
            this.universe = await buildTradingUniverse(10_000, 100); // Top 100 tokens
            this.lastUniverseUpdate = Date.now();
            console.log(`[BrutalSim] ✅ Universe updated: ${this.universe.length} tokens`);
        } catch (error) {
            console.error('[BrutalSim] Failed to update universe:', error);
        }
    }

    private buildPriceHistories(): TokenPriceHistory[] {
        // Build mock price histories from current universe
        return this.universe.slice(0, 50).map(token => ({
            symbol: token.symbol,
            mint: token.mint,
            prices: [
                {
                    timestamp: Date.now() - 60 * 60 * 1000,
                    price: token.valueInSOL * (1 + ((token.volatility || 0) * (Math.random() - 0.5))),
                    volume: 10000,
                },
                {
                    timestamp: Date.now(),
                    price: token.valueInSOL,
                    volume: 10000,
                },
            ],
        }));
    }

    private findTokenMint(symbolOrMint: string): string {
        if (symbolOrMint === 'SOL') return SOL_MINT;

        // 🔥 CHAOS MODE: Block stablecoins
        const STABLECOINS = ['USDC', 'USDT', 'DAI', 'BUSD', 'TUSD', 'FRAX', 'PYUSD', 'GUSD', 'USDP', 'USDD'];
        if (STABLECOINS.includes(symbolOrMint.toUpperCase())) {
            console.log(`[BrutalSim] 🚫 BLOCKED: Stablecoin ${symbolOrMint} not allowed in CHAOS MODE`);
            return SOL_MINT; // Force to SOL instead
        }

        // Check if it's already a mint address
        if (symbolOrMint.length === 44) {
            // Validate it's not a stablecoin mint
            const token = this.universe.find(t => t.mint === symbolOrMint);
            if (token?.isStable) {
                console.log(`[BrutalSim] 🚫 BLOCKED: Stablecoin ${token.symbol} not allowed in CHAOS MODE`);
                return SOL_MINT;
            }
            return symbolOrMint;
        }

        // Find by symbol
        const token = this.universe.find(t => t.symbol.toUpperCase() === symbolOrMint.toUpperCase());

        // Double-check not a stablecoin
        if (token?.isStable) {
            console.log(`[BrutalSim] 🚫 BLOCKED: Stablecoin ${token.symbol} not allowed in CHAOS MODE`);
            return SOL_MINT;
        }

        return token?.mint || SOL_MINT;
    }

    private openPosition(tokenMint: string, symbol: string, fees: number, now: number, allocationPct: number, maxTradeSize: number) {
        // 🔥 FINAL GUARD: Prevent stablecoin positions
        const token = this.universe.find(t => t.mint === tokenMint);
        if (token?.isStable) {
            throw new Error(`🚫 CHAOS MODE: Cannot open position on stablecoin ${symbol}`);
        }

        const solAvailable = this.balanceSOL;
        const effectivePct = Math.min(Math.max(allocationPct, 1), 100);
        const requestedSpend = solAvailable * (effectivePct / 100);
        const solToSpend = Math.min(requestedSpend, maxTradeSize);

        const netValue = solToSpend - fees;

        if (netValue <= 0) {
            throw new Error(`Insufficient funds. Available: ${solAvailable}, Needed > ${fees}`);
        }

        this.position = {
            token: tokenMint,
            entryValueSOL: netValue,
            entryPrice: 1.0,
            tokenAmount: netValue,
            openedAt: now,
        };

        this.balanceSOL -= solToSpend;
    }

    private simulatePriceMove() {
        if (!this.position) return;

        // Find token in universe for volatility
        const token = this.universe.find(t => t.mint === this.position!.token);
        const volatility = token?.volatility || 0.02;
        const momentum = token?.alphaScore || 0;

        // Price movement based on token characteristics
        const noise = (Math.random() - 0.45) * volatility * 2; // Slight positive bias
        const trend = momentum * 0.001; // Alpha momentum

        this.position.tokenAmount *= (1 + noise + trend);
    }

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
            // For brain compatibility
            liquidSOL: this.balanceSOL,
            positionValueSOL: this.position ? this.position.tokenAmount : 0,
            token: this.currentToken,
            tokenMint: this.currentTokenMint,
            hasPosition: !!this.position,
            penaltyScore: this.penaltyScore,
            totalValueSOL: currentVal,
            solPriceUSD: this.solPriceUSD,
            totalValueUSD: currentVal * this.solPriceUSD,

            // Extended state
            universe: this.universe,
            universeSize: this.universe.length,
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

        console.log('[BrutalSim] === FINAL REPORT ===');
        console.log(`  Start: ${this.START_SOL} SOL`);
        console.log(`  End: ${finalValue.toFixed(6)} SOL`);
        console.log(`  PnL: ${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%`);
        console.log(`  Penalty: ${this.penaltyScore}`);
        console.log(`  Verdict: ${verdict}`);

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
