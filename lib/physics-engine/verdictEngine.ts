/**
 * Verdict Engine - Final Decision Maker
 * Combines all pillars into final verdict
 */

import {
    FinalVerdict,
    ValidationReport,
    CycleSummary,
    TokenPriceHistory,
    TokenOutcome,
    TokenLearningState,
} from './types';
import { detectRegime, isRegimeTradeable, getRegimeThresholds } from './regimeDetector';
import { predictBatch } from './predictor';
import { scoreBatch, calculateAccuracy, determineActualDirection, analyzeScoreBreakdown } from './scorer';
import { checkSaturation, checkEarlyStop } from './saturationGuard';
import { calculateBatchOpportunity, shouldTrade } from './opportunityScorer';
import { compareAgainstBaselines } from './baselineComparator';
import { enforceDiversity } from './diversityEnforcer';
import { logCycleSummary, clearLogs } from './reasonLogger';
import { emit, startRun } from './eventEmitter';
import { createRun, completeRun, recordCycle, recordDecisions } from './persistence';

export interface ValidationConfig {
    maxCycles: number;
    tokensPerCycle: number;
    narrowingRatio: number;
}

const DEFAULT_CONFIG: ValidationConfig = {
    maxCycles: 3,
    tokensPerCycle: 1000,
    narrowingRatio: 0.5,
};

export async function runValidation(
    fetchPriceHistories: () => Promise<TokenPriceHistory[]>,
    simulateOutcomes: (predictions: any[]) => Promise<TokenOutcome[]>,
    config: ValidationConfig = DEFAULT_CONFIG
): Promise<ValidationReport> {
    clearLogs();
    const eventRunId = startRun();
    emit('RUN_STARTED', { config, runId: eventRunId });

    // Create DB run (immutable)
    const dbRunId = await createRun({ config });

    const cycles: CycleSummary[] = [];
    let previousAccuracy = 0;
    let currentTokens: TokenLearningState[] = [];
    let allHistories: TokenPriceHistory[] = [];

    // Fetch initial data
    allHistories = await fetchPriceHistories();
    if (allHistories.length === 0) {
        return buildReport('NO_EDGE_BASELINE_BEATS_BRAIN', cycles, 'No data available');
    }

    // Initialize token states
    currentTokens = allHistories.slice(0, config.tokensPerCycle).map(h => ({
        symbol: h.symbol,
        mint: h.mint,
        cumulativeScore: 0,
        predictions: [],
        outcomes: [],
        scores: [],
        averageTrueRange: 0,
        volumeExpansion: 0,
        returnDispersion: 0,
        opportunityScore: 0,
    }));

    for (let cycle = 1; cycle <= config.maxCycles; cycle++) {
        // 1. Detect regime FIRST
        const regime = detectRegime(allHistories);
        emit('REGIME_DETECTED', { cycle, regime: regime.regime, confidence: regime.confidence, metrics: regime.metrics });

        if (!isRegimeTradeable(regime.regime)) {
            emit('EXECUTION_BLOCKED', { reason: 'CHAOS_REGIME', cycle });
            cycles.push(buildCycleSummary(cycle, regime, 0, 0, { random: { accuracy: 0, correctCount: 0, totalCount: 0 }, momentum: { accuracy: 0, correctCount: 0, totalCount: 0 } }, 0, 'STOP_NO_OPPORTUNITY', `CHAOS regime detected`, currentTokens.length, 0, []));
            return buildReport('NO_TRADE_LOW_OPPORTUNITY', cycles, 'Market in CHAOS regime - no trading');
        }

        const thresholds = getRegimeThresholds(regime.regime);

        // 2. Generate predictions
        const relevantHistories = allHistories.filter(h =>
            currentTokens.some(t => t.mint === h.mint)
        );
        const predictions = predictBatch(relevantHistories, regime.regime, thresholds.allowFlat);

        // 3. Simulate outcomes (5-min wait)
        const outcomes = await simulateOutcomes(predictions);

        // 4. Score predictions
        const scores = scoreBatch(predictions, outcomes);
        const accuracy = calculateAccuracy(scores);
        emit('PREDICTIONS_MADE', { cycle, count: predictions.length, accuracy });

        // 5. Check early stop
        const earlyCheck = checkEarlyStop(accuracy, scores.length);
        if (earlyCheck.shouldStop) {
            cycles.push(buildCycleSummary(cycle, regime, accuracy, accuracy - previousAccuracy, { random: { accuracy: 0.33, correctCount: 0, totalCount: 0 }, momentum: { accuracy: 0, correctCount: 0, totalCount: 0 } }, 0, 'STOP_NO_EDGE', earlyCheck.reason, currentTokens.length, 0, []));
            return buildReport('NO_EDGE_BASELINE_BEATS_BRAIN', cycles, earlyCheck.reason);
        }

        // 6. Compare against baselines
        const baselineResult = compareAgainstBaselines(accuracy, relevantHistories, outcomes);
        emit('BASELINE_COMPARISON', { cycle, brainAccuracy: accuracy, random: baselineResult.random.accuracy, momentum: baselineResult.momentum.accuracy, hasEdge: baselineResult.hasEdge });

        // 7. Check saturation
        const saturation = checkSaturation(accuracy, previousAccuracy, cycle, regime.regime);
        emit('SATURATION_CHECK', { cycle, delta: saturation.deltaAccuracy, threshold: saturation.threshold, shouldStop: saturation.shouldStop });

        // 8. Calculate opportunity
        const avgOpportunity = calculateBatchOpportunity(relevantHistories);
        const tradeDecision = shouldTrade(accuracy, avgOpportunity, thresholds.opportunityMinimum);

        // 9. Determine cycle decision
        let decision: CycleSummary['decision'] = 'CONTINUE';
        let reasoning = '';

        if (!baselineResult.hasEdge) {
            decision = 'STOP_NO_EDGE';
            reasoning = baselineResult.edgeAnalysis;
        } else if (saturation.shouldStop) {
            decision = 'STOP_SATURATION';
            reasoning = saturation.reason;
        } else if (!tradeDecision.shouldTrade) {
            decision = 'STOP_NO_OPPORTUNITY';
            reasoning = tradeDecision.reason;
        } else {
            reasoning = `Edge confirmed, continuing to cycle ${cycle + 1}`;
        }

        // 10. Narrow tokens based on scores
        const tokenScoreMap = new Map<string, number>();
        for (const score of scores) {
            const existing = tokenScoreMap.get(score.symbol) || 0;
            tokenScoreMap.set(score.symbol, existing + score.score);
        }

        currentTokens = currentTokens.map(t => ({
            ...t,
            cumulativeScore: t.cumulativeScore + (tokenScoreMap.get(t.symbol) || 0),
        }));

        // 11. Enforce diversity
        const diversity = enforceDiversity(currentTokens, relevantHistories);
        emit('DIVERSITY_ENFORCED', { cycle, dropped: diversity.droppedTokens.length, clusters: diversity.clusters.length });
        currentTokens = currentTokens.filter(t => diversity.survivingTokens.includes(t.symbol));

        // 12. Narrow to top performers
        currentTokens.sort((a, b) => b.cumulativeScore - a.cumulativeScore);
        const narrowedCount = Math.max(10, Math.floor(currentTokens.length * config.narrowingRatio));
        currentTokens = currentTokens.slice(0, narrowedCount);
        emit('TOKENS_NARROWED', { cycle, before: diversity.survivingTokens.length, after: currentTokens.length });

        // Build cycle summary
        const topTokens = currentTokens.slice(0, 5).map(t => ({
            symbol: t.symbol,
            score: t.cumulativeScore,
            accuracy: 0, // Would need per-token tracking
        }));

        const summary = buildCycleSummary(
            cycle, regime, accuracy, accuracy - previousAccuracy,
            baselineResult, avgOpportunity, decision, reasoning,
            predictions.length, currentTokens.length, topTokens
        );
        cycles.push(summary);
        logCycleSummary(summary);
        emit('CYCLE_SUMMARY', { cycle, accuracy, delta: accuracy - previousAccuracy, opportunity: avgOpportunity, decision, tokens: currentTokens.length });

        // Persist cycle to DB (immutable)
        await recordCycle({
            runId: dbRunId,
            cycleIndex: cycle,
            regime: regime.regime,
            regimeConfidence: regime.confidence,
            accuracy,
            baselineRandom: baselineResult.random.accuracy,
            baselineMomentum: baselineResult.momentum.accuracy,
            opportunityScore: avgOpportunity,
            saturationHit: saturation.shouldStop,
            decision,
            tokensBefore: predictions.length,
            tokensAfter: currentTokens.length,
        });

        // Persist token decisions (batch)
        await recordDecisions(scores.map(s => ({
            runId: dbRunId,
            cycleIndex: cycle,
            token: s.symbol,
            mint: predictions.find(p => p.symbol === s.symbol)?.mint || '',
            prediction: s.predicted,
            actual: s.actual,
            scoreDelta: s.score,
            reasons: predictions.find(p => p.symbol === s.symbol)?.reasons || [],
            eliminated: !currentTokens.some(t => t.symbol === s.symbol),
        })));

        previousAccuracy = accuracy;

        if (decision !== 'CONTINUE') {
            const verdict = decision === 'STOP_NO_EDGE' ? 'NO_EDGE_BASELINE_BEATS_BRAIN'
                : decision === 'STOP_SATURATION' ? 'LEARNING_SATURATED_EARLY'
                    : 'NO_TRADE_LOW_OPPORTUNITY';
            emit('EXECUTION_BLOCKED', { reason: verdict, cycle });
            await completeRun(dbRunId, verdict, false);
            return buildReport(verdict, cycles, reasoning);
        }
    }

    // Completed all cycles
    const finalAccuracy = cycles[cycles.length - 1]?.brainAccuracy || 0;
    const verdict: FinalVerdict = finalAccuracy > 0.6 ? 'EDGE_VALIDATED' : 'NO_EDGE_BASELINE_BEATS_BRAIN';
    const executionAllowed = verdict === 'EDGE_VALIDATED';

    if (executionAllowed) {
        emit('EXECUTION_ALLOWED', { verdict, finalAccuracy, cycles: cycles.length });
    } else {
        emit('EXECUTION_BLOCKED', { reason: verdict, finalAccuracy });
    }
    emit('RUN_COMPLETED', { verdict, cycles: cycles.length, finalAccuracy });

    await completeRun(dbRunId, verdict, executionAllowed);

    return buildReport(verdict, cycles, `Completed ${config.maxCycles} cycles`);
}

function buildCycleSummary(
    cycleNumber: number, regime: any, brainAccuracy: number, deltaAccuracy: number,
    baselineResults: any, avgOpportunityScore: number, decision: CycleSummary['decision'],
    reasoning: string, tokensEvaluated: number, tokensNarrowed: number,
    topTokens: any[]
): CycleSummary {
    return {
        cycleNumber, regime, brainAccuracy, deltaAccuracy, baselineResults,
        avgOpportunityScore, decision, reasoning, tokensEvaluated, tokensNarrowed, topTokens
    };
}

function buildReport(verdict: FinalVerdict, cycles: CycleSummary[], reasoning: string): ValidationReport {
    const lastCycle = cycles[cycles.length - 1];
    const breakdown = analyzeScoreBreakdown([]);

    return {
        verdict,
        reasoning,
        cycles,
        insights: {
            improvements: verdict === 'EDGE_VALIDATED' ? ['Brain shows consistent learning'] : [],
            failures: verdict !== 'EDGE_VALIDATED' ? [reasoning] : [],
            biases: breakdown.upBias > 0.6 ? ['UP bias detected'] : [],
        },
        finalStats: {
            totalPredictions: cycles.reduce((sum, c) => sum + c.tokensEvaluated, 0),
            overallAccuracy: lastCycle?.brainAccuracy || 0,
            beatsRandomBy: (lastCycle?.brainAccuracy || 0) - 0.33,
            beatsMomentumBy: (lastCycle?.brainAccuracy || 0) - (lastCycle?.baselineResults.momentum.accuracy || 0),
            finalTokenCount: lastCycle?.tokensNarrowed || 0,
        },
    };
}

export type { FinalVerdict, ValidationReport };
