/**
 * Brutal Brain Simulation Engine
 * 
 * 30-minute run with real-time logging
 * Penalizes bad reasoning even if profitable
 */

import { DecisionLog, DecisionIntent, SimulationReport } from './types';
import { evaluateDecision } from './evaluateDecision';

export class BrutalBrainSimulation {
    private readonly START_SOL = 0.1;
    private readonly DURATION_MS = 30 * 60 * 1000; // 30 minutes
    private readonly MIN_INTERVAL_MS = 12_000; // 12 seconds

    private balanceSOL = this.START_SOL;
    private currentToken = 'SOL';

    private logs: DecisionLog[] = [];
    private penaltyScore = 0;

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
                action: intentDecision.action,
                fromToken: this.currentToken,
                toToken: intentDecision.action === 'SWAP' ? intentDecision.toToken : undefined,
                intent: intentDecision,
                executed: false,
                pnlSOL: 0,
            };

            // EXECUTION SIMULATION
            if (intentDecision.action === 'HESITATE') {
                log.executed = false;
            } else {
                const realizedEdge = this.simulateMarketMove(intentDecision.expectedEdgePct ?? 0);
                const pnl = this.balanceSOL * realizedEdge;

                this.balanceSOL += pnl;

                log.executed = true;
                log.realizedEdgePct = realizedEdge * 100;
                log.pnlSOL = pnl;

                if (intentDecision.action === 'SWAP') {
                    this.currentToken = intentDecision.toToken!;
                }
            }

            // EVALUATE
            const evaluation = evaluateDecision(log);
            log.evaluation = evaluation;
            this.penaltyScore += evaluation.penaltyScore;

            this.logs.push(log);
            this.lastActionAt = now;

            // Send progress update
            if (this.onProgress) {
                this.onProgress(log, this.getState());
            }

            // HARD FAIL
            if (this.penaltyScore > 25) {
                console.log('🚨 SIMULATION FAILED: Penalty score exceeded 25');
                break;
            }

            await this.sleep(500);
        }

        return this.report();
    }

    private simulateMarketMove(expectedEdgePct: number): number {
        // Add noise to expected edge
        const noise = (Math.random() - 0.5) * 0.03; // ±3% noise
        const bias = expectedEdgePct / 100;
        return bias + noise;
    }

    private getState() {
        return {
            balanceSOL: this.balanceSOL,
            token: this.currentToken,
            penaltyScore: this.penaltyScore,
            elapsedMinutes: (Date.now() - this.lastActionAt) / 60000,
        };
    }

    private report(): SimulationReport {
        const pnlPct = ((this.balanceSOL - this.START_SOL) / this.START_SOL) * 100;

        // Verdict logic
        const passConditions = [
            pnlPct > 3, // +3% minimum
            this.penaltyScore < 15, // Low penalty
            this.logs.filter(l => l.evaluation?.outcomeClass.includes('GOOD_DECISION')).length > this.logs.length * 0.6,
        ];

        const verdict = passConditions.every(c => c) ? 'PASS' : 'FAIL';
        const verdictReason = verdict === 'PASS'
            ? 'Brain demonstrated good decision-making'
            : `Failed: PnL ${pnlPct.toFixed(1)}%, Penalty ${this.penaltyScore}`;

        return {
            startSOL: this.START_SOL,
            endSOL: this.balanceSOL,
            pnlPct,
            penaltyScore: this.penaltyScore,
            logs: this.logs,
            verdict,
            verdictReason,
        };
    }

    private sleep(ms: number) {
        return new Promise(res => setTimeout(res, ms));
    }
}
