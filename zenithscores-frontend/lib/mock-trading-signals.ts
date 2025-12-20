import { TradingSignal } from './paths_engine';

export function generateMockTradingSignals(userId: string, count: number = 20): TradingSignal[] {
    const signals: TradingSignal[] = [];

    // Use userId to seed randomness potentially, or just random
    // For now, simpler is better.

    for (let i = 0; i < count; i++) {
        // Generate realistic trading data

        // Good trader tendencies mixed with some mistakes
        const stopRespectedRate = Math.min(100, Math.floor(Math.random() * 40) + 60); // 60-100%
        const riskLimitRespect = Math.min(100, Math.floor(Math.random() * 50) + 50); // 50-100%
        const noStopLossRate = Math.max(0, Math.floor(Math.random() * 30)); // 0-30%

        // Overtrades: 0-2 is good, >5 is bad
        const overtradesCount = Math.floor(Math.random() * 5); // 0-4

        // Holding time: skew towards 15-60 mins
        const avgHoldingTime = Math.floor(Math.random() * 120) + 5; // 5-125 minutes

        // Win rate: 35-65%
        const winRate = Math.floor(Math.random() * 30) + 35;

        signals.push({
            stopRespectedRate,
            riskLimitRespect,
            noStopLossRate,
            overtradesCount,
            avgHoldingTime,
            winRate,
            ruleViolations: Math.floor(Math.random() * 3),
            pnlVariance: Math.random() * 1000
        });
    }

    return signals;
}
