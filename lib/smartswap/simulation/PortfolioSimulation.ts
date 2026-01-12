/**
 * Portfolio-Based Brain v2 Simulation (DISCIPLINED VERSION)
 *
 * Multi-asset support with STRICT authority checks.
 * 
 * CRITICAL RULES:
 * - BUY is ILLEGAL unless LearningVerdict === EDGE_VALIDATED
 * - Positions are CAPPED by Trust level
 * - PnL is INFORMATIONAL, not a pass condition
 * - Discipline is the ONLY pass signal
 */

import { DecisionLog, DecisionIntent, SimulationReport } from './types';
import { TrustLevel, TrustDecision } from '@/lib/trust-engine';

// Multi-position portfolio types
interface PortfolioPosition {
    token: string;
    mint: string;
    entryValueSOL: number;
    currentValueSOL: number;
    entryTime: number;
    lastUpdateTime: number;
    holdCount: number;
}

interface PortfolioAction {
    type: 'BUY' | 'SELL' | 'HOLD_ALL' | 'HESITATE';
    token?: string;
    mint?: string;
    allocationSOL?: number;
    allocationPct?: number;
    intent: DecisionIntent;
}

// Authority context (passed from learning + trust layers)
export interface AuthorityContext {
    learningVerdict: 'EDGE_VALIDATED' | 'NO_EDGE_BASELINE_BEATS_BRAIN' | 'NO_TRADE_LOW_OPPORTUNITY' | 'LEARNING_SATURATED_EARLY' | 'CHAOS_ABORT';
    trustDecision: TrustDecision;
    regime: 'TREND_UP' | 'TREND_DOWN' | 'RANGE' | 'CHAOS';
}

// Violation tracking
interface Violation {
    type: 'BUY_WITHOUT_EDGE' | 'BUY_DURING_CHAOS' | 'EXCEEDED_POSITION_LIMIT' | 'EXCEEDED_SOL_LIMIT';
    action: PortfolioAction;
    context: string;
    timestamp: number;
}

export class PortfolioSimulation {
    private readonly START_SOL = 0.1; // Reduced for safety
    private readonly DURATION_MS = 30 * 60 * 1000; // 30 minutes
    private readonly MIN_INTERVAL_MS = 12_000; // 12 seconds

    private liquidSOL = this.START_SOL;
    private positions: Map<string, PortfolioPosition> = new Map();
    private totalFeesSOL = 0;
    private solPriceUSD = 150;

    private logs: DecisionLog[] = [];
    private penaltyScore = 0;
    private violations: Violation[] = []; // NEW: Track authority violations
    private blockedBuys = 0; // NEW: Blocked buy attempts
    private allowedBuys = 0; // NEW: Legitimate buys
    private lastActionAt = Date.now();
    private onProgress?: (log: DecisionLog, state: any) => void;

    // Authority context (set externally)
    private authorityContext: AuthorityContext | null = null;

    /**
     * Set authority context from Learning + Trust layers
     */
    setAuthorityContext(ctx: AuthorityContext): void {
        this.authorityContext = ctx;
    }

    /**
     * Get max positions allowed by trust level
     */
    private getMaxPositions(): number {
        if (!this.authorityContext) return 0;

        const level = this.authorityContext.trustDecision.trustLevel;
        switch (level) {
            case TrustLevel.LEVEL_0_OBSERVER: return 0;
            case TrustLevel.LEVEL_1_PAPER_MICRO: return 1;
            case TrustLevel.LEVEL_2_PAPER_STANDARD: return 3;
            default: return this.authorityContext.trustDecision.maxTradesAllowed;
        }
    }

    /**
     * Check if BUY is allowed by authority
     */
    private isBuyAllowed(action: PortfolioAction): { allowed: boolean; reason: string } {
        if (!this.authorityContext) {
            return { allowed: false, reason: 'No authority context set' };
        }

        // Rule 1: Learning verdict must be EDGE_VALIDATED
        if (this.authorityContext.learningVerdict !== 'EDGE_VALIDATED') {
            return {
                allowed: false,
                reason: `LearningVerdict is ${this.authorityContext.learningVerdict}, BUY blocked`
            };
        }

        // Rule 2: Cannot buy during CHAOS regime
        if (this.authorityContext.regime === 'CHAOS') {
            return { allowed: false, reason: 'CHAOS regime, BUY blocked' };
        }

        // Rule 3: Trust must allow execution
        if (this.authorityContext.trustDecision.executionType === 'NONE') {
            return { allowed: false, reason: 'Trust level does not allow execution' };
        }

        // Rule 4: Must not exceed position limit
        const maxPositions = this.getMaxPositions();
        if (this.positions.size >= maxPositions) {
            return {
                allowed: false,
                reason: `Position limit reached (${this.positions.size}/${maxPositions})`
            };
        }

        // Rule 5: Must not exceed SOL limit
        const maxSol = this.authorityContext.trustDecision.maxSolPerTrade;
        if (maxSol > 0 && action.allocationSOL && action.allocationSOL > maxSol) {
            return {
                allowed: false,
                reason: `Allocation ${action.allocationSOL} exceeds limit ${maxSol}`
            };
        }

        return { allowed: true, reason: 'BUY authorized' };
    }

    /**
     * Run portfolio simulation
     */
    async run(
        brain: (state: any) => PortfolioAction[],
        onProgress?: (log: DecisionLog, state: any) => void
    ): Promise<SimulationReport> {
        this.onProgress = onProgress;

        await this.fetchSolPrice();

        const start = Date.now();

        while (Date.now() - start < this.DURATION_MS) {
            const now = Date.now();

            if (now - this.lastActionAt < this.MIN_INTERVAL_MS) {
                await this.sleep(500);
                continue;
            }

            const actions = brain(this.getState());

            for (const action of actions) {
                await this.executeAction(action, now);
            }

            this.simulatePortfolioPriceMovement();
            this.lastActionAt = now;

            // Stop if too many violations (discipline failure)
            if (this.violations.length > 3) {
                console.log('[Portfolio] Stopping: Too many violations');
                break;
            }

            // Stop if penalty too high
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
        } catch {
            this.solPriceUSD = 150;
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
                // AUTHORITY CHECK (NEW)
                const authCheck = this.isBuyAllowed(action);
                if (!authCheck.allowed) {
                    this.blockedBuys++;
                    this.violations.push({
                        type: 'BUY_WITHOUT_EDGE',
                        action,
                        context: authCheck.reason,
                        timestamp: now,
                    });
                    this.penaltyScore += 5; // Heavy penalty for violating authority
                    log.executed = false;
                    log.skippedReason = `BLOCKED: ${authCheck.reason}`;
                    log.evaluation = {
                        outcomeClass: 'BAD_DECISION_BAD_OUTCOME',
                        penaltyScore: 5,
                        explanation: `Attempted BUY without authority: ${authCheck.reason}`,
                    };
                } else {
                    this.allowedBuys++;
                    this.executeBuy(action, log);
                }
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

        log.portfolioValueSOL = this.getPortfolioValueSOL();
        log.portfolioValueUSD = log.portfolioValueSOL * this.solPriceUSD;
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
            throw new Error('Insufficient liquid SOL');
        }

        const entryFee = allocSOL * 0.0025;
        const netValue = allocSOL - entryFee;

        if (netValue <= 0) {
            throw new Error('Allocation too small');
        }

        this.liquidSOL -= allocSOL;
        this.totalFeesSOL += entryFee;

        const existingPos = this.positions.get(action.token);
        if (existingPos) {
            existingPos.currentValueSOL += netValue;
            existingPos.entryValueSOL += netValue;
            existingPos.lastUpdateTime = Date.now();
        } else {
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
            explanation: `Opened ${action.token}: ${netValue.toFixed(6)} SOL (authorized)`,
        };
    }

    private executeSell(action: PortfolioAction, log: DecisionLog) {
        if (!action.token) {
            throw new Error('SELL action missing token');
        }

        const position = this.positions.get(action.token);
        if (!position) {
            throw new Error(`No position in ${action.token}`);
        }

        const sellPct = (action.allocationPct || 100) / 100;
        const sellAmount = position.currentValueSOL * sellPct;
        const exitFee = sellAmount * 0.0015;
        const netProceeds = sellAmount - exitFee;

        this.totalFeesSOL += exitFee;

        const costBasis = position.entryValueSOL * sellPct;
        const realizedPnL = netProceeds - costBasis;

        this.liquidSOL += netProceeds;

        if (sellPct >= 0.99) {
            this.positions.delete(action.token);
        } else {
            position.currentValueSOL -= sellAmount;
            position.entryValueSOL -= costBasis;
            position.lastUpdateTime = Date.now();
        }

        log.executed = true;
        log.action = 'EXIT';
        log.tradeValueSOL = sellAmount;
        log.realizedPnlSOL = realizedPnL;
        log.pnlSOL = realizedPnL;

        const isProfitable = realizedPnL > 0;
        if (isProfitable) {
            log.evaluation = {
                outcomeClass: 'GOOD_DECISION_GOOD_OUTCOME',
                penaltyScore: 0,
                explanation: `Profitable exit: +${realizedPnL.toFixed(6)} SOL`,
            };
        } else {
            const lossPenalty = Math.min(5, Math.floor(Math.abs(realizedPnL) * 100));
            this.penaltyScore += lossPenalty;
            log.evaluation = {
                outcomeClass: 'BAD_DECISION_BAD_OUTCOME',
                penaltyScore: lossPenalty,
                explanation: `Loss: ${realizedPnL.toFixed(6)} SOL`,
            };
        }
    }

    private executeHoldAll(log: DecisionLog) {
        if (this.positions.size === 0) {
            log.executed = false;
            log.skippedReason = 'No positions to hold';
            return;
        }

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
        for (const pos of this.positions.values()) {
            const noise = (Math.random() - 0.48) * 0.02;
            pos.currentValueSOL *= (1 + noise);
            pos.lastUpdateTime = Date.now();
        }
    }

    private getPortfolioValueSOL(): number {
        let total = 0;
        for (const pos of this.positions.values()) {
            total += pos.currentValueSOL;
        }
        return this.liquidSOL + total;
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
            maxPositions: this.getMaxPositions(),
            totalValueSOL: this.getPortfolioValueSOL(),
            unrealizedPnLSOL: this.getTotalUnrealizedPnL(),
            totalFeesSOL: this.totalFeesSOL,
            penaltyScore: this.penaltyScore,
            violations: this.violations.length,
            authorityContext: this.authorityContext,
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

        // NEW: Discipline-based PASS criteria
        const passConditions = [
            this.violations.length === 0, // No authority violations
            this.blockedBuys === 0, // No blocked buy attempts
            this.penaltyScore < 25, // Low penalties
            totalInvalidDecisions < 5, // Few errors
        ];

        const verdict = passConditions.every(c => c) ? 'PASS' : 'FAIL';

        // Detailed verdict reason
        const reasons: string[] = [];
        if (this.violations.length > 0) reasons.push(`${this.violations.length} violations`);
        if (this.blockedBuys > 0) reasons.push(`${this.blockedBuys} blocked buys`);
        if (this.penaltyScore >= 25) reasons.push(`penalty ${this.penaltyScore}`);
        if (totalInvalidDecisions >= 5) reasons.push(`${totalInvalidDecisions} invalid`);

        return {
            startSOL: this.START_SOL,
            endSOL: finalValue,
            solPriceUSD: this.solPriceUSD,
            pnlPct, // INFORMATIONAL ONLY
            penaltyScore: this.penaltyScore,
            totalInvalidDecisions,
            logs: this.logs,
            verdict,
            verdictReason: verdict === 'PASS'
                ? `Discipline maintained: ${this.allowedBuys} authorized buys, 0 violations, penalty ${this.penaltyScore}. PnL ${pnlPct.toFixed(2)}% (info only)`
                : `Discipline FAILED: ${reasons.join(', ')}. PnL ${pnlPct.toFixed(2)}% (irrelevant)`,
        };
    }

    private sleep(ms: number) {
        return new Promise(res => setTimeout(res, ms));
    }
}

export type { PortfolioAction, Violation };
