/**
 * Pillar 10 + Brutal Simulation Integration
 *
 * Complete governance stack:
 * 1. Pillar 10 Compounding Funnel (predict → wait → score → narrow)
 * 2. FLAT Accountability (Pillar 10.3)
 * 3. Directional Commitment (Pillar 10.1 + 10.2)
 * 4. Authority-gated execution
 * 5. Brain v2 simulation with validated tokens only
 *
 * CRITICAL: CHAOS TOKENS ONLY
 * - All stablecoins EXCLUDED (USDC, USDT, PYUSD, DAI, etc.)
 * - Major tokens EXCLUDED (SOL, ETH, BTC, etc.) by default
 * - Only chaos/volatile tokens included
 *
 * Flow:
 * - Run funnel on CHAOS tokens until edge validated OR stopped
 * - If edge validated → allow Brain v2 to trade
 * - If no edge → block all swaps (NO TRADE = PASS)
 * - Track discipline violations throughout
 */

import { BrutalBrainSimulation } from './BrutalSimulation';
import { DecisionLog, DecisionIntent, SimulationReport } from './types';
import {
    freezeUniverse,
    createFunnelState,
    predictFunnel,
    scoreFunnel,
    shouldContinueFunnel,
    getFunnelVerdict,
    getFlatStatistics,
    FunnelState,
    TokenCandidate,
    PILLAR_10_CONFIG,
} from '@/lib/learning-validation/compoundingLoop';

// Authority context from funnel
interface FunnelAuthority {
    edgeValidated: boolean;
    validatedTokens: string[]; // Only these tokens can be traded
    regime: string;
    cycles: number;
    flatStats: {
        totalFlat: number;
        correctFlat: number;
        flatAccuracy: number;
        cowardiceScore: number;
    };
    stopReason?: string;
}

// Enhanced simulation report with funnel results
interface Pillar10SimulationReport extends SimulationReport {
    funnelAuthority: FunnelAuthority;
    disciplineMetrics: {
        blockedSwaps: number; // Swaps blocked by authority
        authorizedSwaps: number; // Swaps allowed by authority
        violations: string[]; // Discipline violations
    };
}

export class Pillar10BrutalSimulation extends BrutalBrainSimulation {
    private funnelAuthority: FunnelAuthority | null = null;
    private blockedSwaps = 0;
    private authorizedSwaps = 0;
    private violations: string[] = [];

    /**
     * Run Pillar 10 funnel FIRST (CHAOS tokens only), then simulation
     */
    async runWithFunnel(
        mode: 'EDGE' | 'EXPLORATION',
        horizonMinutes: 5 | 10 | 15,
        tokenLimit: number,
        brain: (state: any) => DecisionIntent & { action: any; toToken?: string },
        onFunnelProgress?: (event: string, data: any) => void,
        onSimProgress?: (log: DecisionLog, state: any) => void
    ): Promise<Pillar10SimulationReport> {

        console.log('[Pillar10Brutal] Starting Phase 1: Compounding Funnel (CHAOS TOKENS ONLY)...');
        console.log(`[Pillar10Brutal] Mode: ${PILLAR_10_CONFIG.FUNNEL_MODE}`);

        // ====================================================================
        // PHASE 1: RUN PILLAR 10 FUNNEL ON CHAOS TOKENS ONLY
        // ====================================================================

        // Step 1: Freeze universe (automatically filters stables + majors)
        if (onFunnelProgress) onFunnelProgress('FREEZING_UNIVERSE', { tokenLimit, mode: PILLAR_10_CONFIG.FUNNEL_MODE });
        const universe = await freezeUniverse(tokenLimit);

        // Verify no stablecoins leaked through
        const stableSymbols = ['USDC', 'USDT', 'PYUSD', 'DAI', 'USDH', 'UXD', 'FRAX', 'BUSD', 'TUSD'];
        const foundStables = universe.filter(t => stableSymbols.includes(t.symbol.toUpperCase()));
        if (foundStables.length > 0) {
            throw new Error(`CRITICAL: Stablecoins leaked into universe: ${foundStables.map(t => t.symbol).join(', ')}`);
        }

        console.log(`[Pillar10Brutal] ✅ Universe verified: ${universe.length} CHAOS tokens, 0 stables, 0 majors`);
        if (onFunnelProgress) onFunnelProgress('UNIVERSE_FROZEN', {
            tokenCount: universe.length,
            tokenClass: 'CHAOS_ONLY',
            verified: true
        });

        // Step 2: Create funnel
        const funnelState = createFunnelState(universe);
        if (onFunnelProgress) onFunnelProgress('FUNNEL_CREATED', { initialTokens: universe.length });

        // Step 3: Run compounding cycles
        const funnelCycles: any[] = [];
        let stopped = false;
        let stopReason = '';

        while (shouldContinueFunnel(funnelState) && funnelCycles.length < 6) {
            const cycleNum = funnelState.cycle + 1;
            if (onFunnelProgress) onFunnelProgress('CYCLE_START', { cycle: cycleNum, tokens: funnelState.tokens.length });

            // Predict
            const directionalCheck = predictFunnel(funnelState);

            // Check directional commitment (Pillar 10.1 + 10.2)
            if (!directionalCheck.valid) {
                stopped = true;
                stopReason = directionalCheck.reason || 'Directional commitment insufficient';
                if (onFunnelProgress) onFunnelProgress('STOP_NO_EDGE', { reason: stopReason, check: directionalCheck });
                break;
            }

            if (onFunnelProgress) {
                onFunnelProgress('PREDICTIONS_MADE', {
                    up: directionalCheck.upCount,
                    down: directionalCheck.downCount,
                    flat: directionalCheck.flatCount,
                });
            }

            // Wait
            if (onFunnelProgress) onFunnelProgress('WAITING', { minutes: horizonMinutes });
            await new Promise(resolve => setTimeout(resolve, horizonMinutes * 60 * 1000));

            // Score
            if (onFunnelProgress) onFunnelProgress('SCORING', { tokens: funnelState.tokens.length });
            const result = await scoreFunnel(funnelState, (type: string, data: any) => {
                if (onFunnelProgress) onFunnelProgress(type, data);
            });

            funnelCycles.push({
                cycle: result.cycle,
                accuracy: result.accuracy,
                survivors: result.tokensAfter,
                eliminated: result.eliminated.length,
                regime: result.regime,
            });

            if (onFunnelProgress) {
                onFunnelProgress('CYCLE_COMPLETE', {
                    cycle: result.cycle,
                    accuracy: (result.accuracy * 100).toFixed(1) + '%',
                    survivors: result.tokensAfter,
                });
            }

            if (funnelState.funnelComplete || funnelState.funnelCollapsed) {
                break;
            }
        }

        // Step 4: Get verdict
        const verdict = getFunnelVerdict(funnelState);
        const flatStats = getFlatStatistics(funnelState.predictionStorage);

        // Build authority context
        this.funnelAuthority = {
            edgeValidated: verdict.shouldExecute,
            validatedTokens: verdict.candidates.map(c => c.symbol),
            regime: funnelState.regime,
            cycles: funnelCycles.length,
            flatStats: {
                totalFlat: flatStats.totalFlat,
                correctFlat: flatStats.correctFlat,
                flatAccuracy: flatStats.flatAccuracy,
                cowardiceScore: flatStats.cowardiceScore,
            },
            stopReason: stopped ? stopReason : undefined,
        };

        if (onFunnelProgress) {
            onFunnelProgress('FUNNEL_COMPLETE', {
                edgeValidated: verdict.shouldExecute,
                validatedTokens: this.funnelAuthority.validatedTokens,
                flatStats,
            });
        }

        console.log(`[Pillar10Brutal] Funnel complete: Edge ${verdict.shouldExecute ? 'VALIDATED' : 'NOT VALIDATED'}`);
        console.log(`[Pillar10Brutal] Validated CHAOS tokens: ${this.funnelAuthority.validatedTokens.join(', ') || 'NONE'}`);

        // ====================================================================
        // PHASE 2: RUN BRAIN v2 SIMULATION WITH AUTHORITY
        // ====================================================================

        console.log('[Pillar10Brutal] Starting Phase 2: Brain v2 Simulation...');

        // Wrap brain with authority checks
        const authorityWrappedBrain = (state: any) => {
            const originalDecision = brain(state);

            // If brain wants to swap, check authority
            if (originalDecision.action === 'SWAP' && originalDecision.toToken) {
                const allowed = this.isSwapAllowed(originalDecision.toToken);

                if (!allowed.authorized) {
                    this.blockedSwaps++;
                    this.violations.push(allowed.reason);

                    // Force hesitation instead
                    return {
                        ...originalDecision,
                        action: 'HESITATE',
                        thesis: `BLOCKED: ${allowed.reason}`,
                        confidence: 0,
                    };
                }

                this.authorizedSwaps++;
            }

            return originalDecision;
        };

        // Run simulation with authority-wrapped brain
        const simReport = await this.run(authorityWrappedBrain, onSimProgress);

        // ====================================================================
        // PHASE 3: BUILD ENHANCED REPORT
        // ====================================================================

        const enhancedReport: Pillar10SimulationReport = {
            ...simReport,
            funnelAuthority: this.funnelAuthority,
            disciplineMetrics: {
                blockedSwaps: this.blockedSwaps,
                authorizedSwaps: this.authorizedSwaps,
                violations: this.violations,
            },
        };

        // Update verdict based on discipline
        if (this.blockedSwaps > 0) {
            enhancedReport.verdict = 'FAIL';
            enhancedReport.verdictReason = `Discipline VIOLATED: ${this.blockedSwaps} unauthorized swap attempts. ${simReport.verdictReason}`;
        } else if (!this.funnelAuthority.edgeValidated && simReport.verdict === 'PASS') {
            enhancedReport.verdict = 'PASS';
            enhancedReport.verdictReason = `NO TRADE (PASS): Funnel blocked execution, brain respected authority. ${this.funnelAuthority.stopReason || 'No edge detected'}`;
        }

        return enhancedReport;
    }

    /**
     * Check if swap to token is allowed by funnel authority
     */
    private isSwapAllowed(toToken: string): { authorized: boolean; reason: string } {
        if (!this.funnelAuthority) {
            return { authorized: false, reason: 'No funnel authority set' };
        }

        // Rule 1: Edge must be validated
        if (!this.funnelAuthority.edgeValidated) {
            return {
                authorized: false,
                reason: 'Edge not validated by funnel - NO TRADE enforced'
            };
        }

        // Rule 2: CHAOS regime blocks all trades
        if (this.funnelAuthority.regime === 'CHAOS') {
            return {
                authorized: false,
                reason: 'CHAOS regime - no trading allowed'
            };
        }

        // Rule 3: High cowardice = no authority
        if (this.funnelAuthority.flatStats.cowardiceScore > 0.6) {
            return {
                authorized: false,
                reason: `Excessive FLAT predictions (${(this.funnelAuthority.flatStats.cowardiceScore * 100).toFixed(0)}%) - cowardice detected`
            };
        }

        // Rule 4: Token must be in validated list
        if (toToken !== 'SOL' && !this.funnelAuthority.validatedTokens.includes(toToken)) {
            return {
                authorized: false,
                reason: `Token ${toToken} not in validated list: [${this.funnelAuthority.validatedTokens.join(', ')}]`
            };
        }

        return { authorized: true, reason: 'Swap authorized by funnel' };
    }
}

export type { Pillar10SimulationReport, FunnelAuthority };
