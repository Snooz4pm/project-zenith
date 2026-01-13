/**
 * Reason Logger - Pillar 8
 * Human-readable logs for every prediction
 */

import { TokenPrediction, CycleSummary, MarketRegime } from './types';

export interface ReasonLog {
    timestamp: number;
    symbol: string;
    prediction: string;
    reasons: string[];
    regime: MarketRegime;
    signals: Record<string, number>;
}

const logs: ReasonLog[] = [];

export function logPrediction(prediction: TokenPrediction): void {
    logs.push({
        timestamp: prediction.timestamp,
        symbol: prediction.symbol,
        prediction: prediction.prediction,
        reasons: prediction.reasons,
        regime: prediction.regime,
        signals: prediction.signals,
    });
}

export function logCycleSummary(summary: CycleSummary): void {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Cycle ${summary.cycleNumber}:`);
    console.log(`  Regime: ${summary.regime.regime} (${(summary.regime.confidence * 100).toFixed(0)}%)`);
    console.log(`  Brain Accuracy: ${(summary.brainAccuracy * 100).toFixed(1)}%`);
    console.log(`  Momentum Baseline: ${(summary.baselineResults.momentum.accuracy * 100).toFixed(1)}%`);
    console.log(`  Random Baseline: ${(summary.baselineResults.random.accuracy * 100).toFixed(1)}%`);
    console.log(`  Δ Accuracy: ${summary.deltaAccuracy >= 0 ? '+' : ''}${(summary.deltaAccuracy * 100).toFixed(1)}%`);
    console.log(`  Opportunity Score: ${(summary.avgOpportunityScore * 100).toFixed(0)}%`);
    console.log(`  Decision: ${summary.decision}`);
    console.log(`  Tokens: ${summary.tokensEvaluated} → ${summary.tokensNarrowed}`);
    console.log(`${'='.repeat(60)}\n`);
}

export function getLogs(): ReasonLog[] {
    return [...logs];
}

export function clearLogs(): void {
    logs.length = 0;
}

export function formatLogsAsTable(maxRows: number = 20): string {
    const recent = logs.slice(-maxRows);
    const lines = ['Symbol | Prediction | Reasons | Regime'];
    lines.push('-'.repeat(60));
    for (const log of recent) {
        lines.push(`${log.symbol} | ${log.prediction} | ${log.reasons.join(', ')} | ${log.regime}`);
    }
    return lines.join('\n');
}
