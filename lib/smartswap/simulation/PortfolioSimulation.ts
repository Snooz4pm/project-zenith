/**
 * Portfolio-Based Brain v2 Simulation
 *
 * Multi-asset support: Brain can hold multiple tokens simultaneously
 * Real wallet: Fees deducted from balance, not penalties
 * Smart penalties: Only penalize actual value losses
 */

import { DecisionLog, DecisionIntent, SimulationReport } from './types';

// Multi-position portfolio types
interface PortfolioPosition {
    token: string;
    mint: string;
    entryValueSOL: number;
    currentValueSOL: number;
    entryTime: number;
    lastUpdateTime: number;
    holdCount: number; // Number of times held
}

interface PortfolioAction {
    type: 'BUY' | 'SELL' | 'HOLD_ALL' | 'HESITATE';
    token?: string; // For BUY/SELL
    mint?: string;
    allocationSOL?: number; // Amount of SOL to spend (for BUY)
    allocationPct?: number; // % of position to sell (for SELL, default 100%)
    intent: DecisionIntent;
}

export class PortfolioSimulation {
    private readonly START_SOL = 0.2;
    private readonly DURATION_MS = 30 * 60 * 1000; // 30 minutes
    private readonly MIN_INTERVAL_MS = 12_000; // 12 seconds

    private liquidSOL = this.START_SOL; // Available cash
    private positions: Map<string, PortfolioPosition> = new Map(); // token symbol -> position
    private totalFeesSOL = 0; // Track fees paid (not a penalty, just accounting)
    private solPriceUSD = 150; // SOL price for USD conversions

    private logs: DecisionLog[] = [];
    private penaltyScore = 0; // Only for BAD decisions, not fees
    private lastActionAt = Date.now();
    private onProgress?: (log: DecisionLog, state: any) => void;

    /**
     * Run portfolio simulation
     */
    async run(
        brain: (state: any) => PortfolioAction[],
        onProgress?: (log: DecisionLog, state: any) => void
    ): Promise<SimulationReport> {
        this.onProgress = onProgress;

        // Fetch SOL price for USD conversions
        await this.fetchSolPrice();

        const start = Date.now();

        while (Date.now() - start < this.DURATION_MS) {
            const now = Date.now();

            // Cooldown check
            if (now - this.lastActionAt < this.MIN_INTERVAL_MS) {
                await this.sleep(500);
                continue;
            }

            // Brain makes portfolio decisions
            const actions = brain(this.getState());

            // Execute each action
            for (const action of actions) {
                await this.executeAction(action, now);
            }

            // Simulate price movements for all positions
            this.simulatePortfolioPriceMovement();

            this.lastActionAt = now;

            // Stop if penalty too high (only bad decisions, not fees)
            if (this.penaltyScore > 30) break;

            await this.sleep(200);
        }

        return this.report();
    }

    private async fetchSolPrice() {
        try {
            const response = await fetch('https://api.jup.ag/price/v2?ids=So11111111111111111111111111111111111111112');
            const data = await response.json();
            this.solPriceUSD = parseFloat(data.data['So11111111111111111111111111111111111111112']?.price || '150');
            if (!this.solPriceUSD || this.solPriceUSD <= 0) {
                this.solPriceUSD = 150;
            }
            console.log(`[Portfolio] SOL price: $${this.solPriceUSD.toFixed(2)}`);
        } catch (e) {
            console.error('Error fetching SOL price:', e);
            this.solPriceUSD = 150; // Fallback
        }
    }

    private async executeAction(action: PortfolioAction, now: number) {
        const portfolioValue = this.getPortfolioValueSOL();

        const log: DecisionLog = {
            timestamp: now,
            action: this.mapActionType(action.type),
            fromToken: action.type === 'SELL' ? action.token || 'UNKNOWN' : 'SOL',
            toToken: action.type === 'BUY' ? action.token : undefined,
            intent: action.intent,
            executed: false,
            pnlSOL: 0,
            realizedPnlSOL: 0,
            unrealizedPnlSOL: 0,
            portfolioValueSOL: portfolioValue,
            portfolioValueUSD: 0,
        };

        try {
            if (action.type === 'BUY') {
                this.executeBuy(action, log);
            } else if (action.type === 'SELL') {
                this.executeSell(action, log);
            } else if (action.type === 'HOLD_ALL') {
                this.executeHoldAll(log);
            } else if (action.type === 'HESITATE') {
                log.executed = false;
                log.evaluation = {
                    outcomeClass: 'HESITATION_CORRECT',
                    penaltyScore: 0,
                    explanation: action.intent.thesis,
                };
            }
        } catch (error: any) {
            log.executed = false;
            log.skippedReason = error.message;
            log.evaluation = {
                outcomeClass: 'BAD_DECISION_BAD_OUTCOME',
                penaltyScore: 2,
                explanation: `Execution error: ${error.message}`,
            };
            this.penaltyScore += 2;
        }

        // Update portfolio value
        log.portfolioValueSOL = this.getPortfolioValueSOL();
        log.portfolioValueUSD = log.portfolioValueSOL * this.solPriceUSD;

        // Calculate unrealized PnL across all positions
        log.unrealizedPnlSOL = this.getTotalUnrealizedPnL();
        log.unrealizedPnlUSD = log.unrealizedPnlSOL * this.solPriceUSD;

        this.logs.push(log);
        if (this.onProgress) this.onProgress(log, this.getState());
    }

    private executeBuy(action: PortfolioAction, log: DecisionLog) {
        if (!action.token || !action.allocationSOL) {
            throw new Error('BUY action missing token or allocationSOL');
        }

        const allocSOL = Math.min(action.allocationSOL, this.liquidSOL);
        if (allocSOL <= 0) {
            throw new Error('Insufficient liquid SOL for purchase');
        }

        // Deduct entry fee from WALLET (not penalty)
        const entryFee = allocSOL * 0.0025; // 0.25% fee
        const netValue = allocSOL - entryFee;

        if (netValue <= 0) {
            throw new Error('Allocation too small to cover fees');
        }

        // Deduct from liquid SOL
        this.liquidSOL -= allocSOL;
        this.totalFeesSOL += entryFee;

        // Create or add to position
        const existingPos = this.positions.get(action.token);
        if (existingPos) {
            // Add to existing position
            existingPos.currentValueSOL += netValue;
            existingPos.entryValueSOL += netValue;
            existingPos.lastUpdateTime = Date.now();
        } else {
            // New position
            this.positions.set(action.token, {
                token: action.token,
                mint: action.mint || '',
                entryValueSOL: netValue,
                currentValueSOL: netValue,
                entryTime: Date.now(),
                lastUpdateTime: Date.now(),
                holdCount: 0,
            });
        }

        log.executed = true;
        log.action = 'SWAP';
        log.entryCostSOL = entryFee;
        log.tradeValueSOL = netValue;
        log.evaluation = {
            outcomeClass: 'POSITION_OPENED',
            penaltyScore: 0,
            explanation: `Opened ${action.token} position: ${netValue.toFixed(6)} SOL (fee: ${entryFee.toFixed(6)} SOL)`,
        };
    }

    private executeSell(action: PortfolioAction, log: DecisionLog) {
        if (!action.token) {
            throw new Error('SELL action missing token');
        }

        const position = this.positions.get(action.token);
        if (!position) {
            throw new Error(`No position in ${action.token} to sell`);
        }

        const sellPct = (action.allocationPct || 100) / 100;
        const sellAmount = position.currentValueSOL * sellPct;

        // Deduct exit fee from WALLET (not penalty)
        const exitFee = sellAmount * 0.0015; // 0.15% fee
        const netProceeds = sellAmount - exitFee;

        this.totalFeesSOL += exitFee;

        // Calculate realized PnL
        const costBasis = position.entryValueSOL * sellPct;
        const realizedPnL = netProceeds - costBasis;

        // Add proceeds to liquid SOL
        this.liquidSOL += netProceeds;

        // Update or remove position
        if (sellPct >= 0.99) {
            // Close position entirely
            this.positions.delete(action.token);
        } else {
            // Partial sell
            position.currentValueSOL -= sellAmount;
            position.entryValueSOL -= costBasis;
            position.lastUpdateTime = Date.now();
        }

        log.executed = true;
        log.action = 'EXIT';
        log.tradeValueSOL = sellAmount;
        log.realizedPnlSOL = realizedPnL;
        log.pnlSOL = realizedPnL;

        // Evaluate: Only penalize if we lost money (not fees, actual bad decision)
        const isProfitable = realizedPnL > 0;
        if (isProfitable) {
            log.evaluation = {
                outcomeClass: 'GOOD_DECISION_GOOD_OUTCOME',
                penaltyScore: 0,
                explanation: `Profitable exit from ${action.token}: +${realizedPnL.toFixed(6)} SOL`,
            };
        } else {
            // Lost money - this is a penalty (bad decision)
            const lossPenalty = Math.min(5, Math.floor(Math.abs(realizedPnL) * 100));
            this.penaltyScore += lossPenalty;
            log.evaluation = {
                outcomeClass: 'BAD_DECISION_BAD_OUTCOME',
                penaltyScore: lossPenalty,
                explanation: `Loss on ${action.token}: ${realizedPnL.toFixed(6)} SOL (penalty: ${lossPenalty})`,
            };
        }
    }

    private executeHoldAll(log: DecisionLog) {
        if (this.positions.size === 0) {
            log.executed = false;
            log.skippedReason = 'No positions to hold';
            return;
        }

        // Increment hold counters
        for (const pos of this.positions.values()) {
            pos.holdCount++;
        }

        log.executed = true;
        log.action = 'HOLD';
        log.evaluation = {
            outcomeClass: 'GOOD_DECISION_GOOD_OUTCOME',
            penaltyScore: 0,
            explanation: `Holding ${this.positions.size} positions`,
        };
    }

    private simulatePortfolioPriceMovement() {
        // Simulate price changes for all positions
        for (const pos of this.positions.values()) {
            // Slight positive bias (0.5% average gain per hold)
            const noise = (Math.random() - 0.48) * 0.02;
            pos.currentValueSOL *= (1 + noise);
            pos.lastUpdateTime = Date.now();
        }
    }

    private getPortfolioValueSOL(): number {
        let totalPositionValue = 0;
        for (const pos of this.positions.values()) {
            totalPositionValue += pos.currentValueSOL;
        }
        return this.liquidSOL + totalPositionValue;
    }

    private getTotalUnrealizedPnL(): number {
        let unrealized = 0;
        for (const pos of this.positions.values()) {
            unrealized += (pos.currentValueSOL - pos.entryValueSOL);
        }
        return unrealized;
    }

    private getState() {
        const positions = Array.from(this.positions.values()).map(p => ({
            token: p.token,
            mint: p.mint,
            valueSOL: p.currentValueSOL,
            costBasis: p.entryValueSOL,
            unrealizedPnL: p.currentValueSOL - p.entryValueSOL,
            holdCount: p.holdCount,
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
        };
    }

    private mapActionType(type: string): 'SWAP' | 'HOLD' | 'HESITATE' | 'EXIT' {
        if (type === 'BUY') return 'SWAP';
        if (type === 'SELL') return 'EXIT';
        if (type === 'HOLD_ALL') return 'HOLD';
        return 'HESITATE';
    }

    private report(): SimulationReport {
        const finalValue = this.getPortfolioValueSOL();
        const pnlPct = ((finalValue - this.START_SOL) / this.START_SOL) * 100;
        const totalInvalidDecisions = this.logs.filter(l => l.skippedReason).length;

        const passConditions = [
            pnlPct > 0, // Profitable
            this.penaltyScore < 25, // Low penalties (only bad decisions)
            totalInvalidDecisions < 5,
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
            verdictReason: `PnL ${pnlPct.toFixed(2)}%, Penalty ${this.penaltyScore} (losses only), Fees ${this.totalFeesSOL.toFixed(6)} SOL, Invalid ${totalInvalidDecisions}`,
        };
    }

    private sleep(ms: number) {
        return new Promise(res => setTimeout(res, ms));
    }
}

export type { PortfolioAction };
