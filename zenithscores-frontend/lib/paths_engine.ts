import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- TYPES ---

export interface QuizSignal {
    accuracy: number;            // 0-100
    avgTimePerQuestion: number;  // milliseconds
    difficulty: number;          // 1-5
    answerChanges: number;       // count
    repeatedMistakes: number;    // count
}

export interface TradingSignal {
    stopRespectedRate: number;   // 0-100
    riskLimitRespect: number;    // 0-100
    noStopLossRate: number;      // 0-100
    overtradesCount: number;     // count
    ruleViolations: number;      // count
    pnlVariance: number;         // lower is better
}

export interface UserTraits {
    analytical_depth: number;
    risk_discipline: number;
    adaptability: number;
    consistency: number;
    emotional_stability: number;
    calibration_confidence: number;
}

// --- CONSTANTS ---

const PATH_DEFINITIONS = {
    'market-analyst': {
        analytical_depth: 0.4,
        consistency: 0.3,
        emotional_stability: 0.3
    },
    'data-research': {
        analytical_depth: 0.5,
        consistency: 0.5
    },
    'systematic-trading': {
        consistency: 0.4,
        risk_discipline: 0.4,
        analytical_depth: 0.2
    },
    'execution-trader': {
        adaptability: 0.4,
        risk_discipline: 0.4,
        emotional_stability: 0.2
    },
    'macro-observer': {
        analytical_depth: 0.4,
        emotional_stability: 0.6
    }
};

// --- CORE LOGIC ---

/**
 * Calculates traits from a single Quiz session.
 * This is a partial calculation to be aggregated later.
 */
export function calculateQuizTraits(signal: QuizSignal): Partial<UserTraits> {
    const confidenceDelta = 15; // +15% confidence per quiz

    let analytical_depth = (signal.accuracy * 0.6) + ((signal.difficulty * 20) * 0.4);
    analytical_depth = Math.min(100, Math.max(0, analytical_depth));

    // Time penalty: too fast + poor accuracy = rushing
    if (signal.avgTimePerQuestion < 5000 && signal.accuracy < 60) {
        analytical_depth -= 10;
    }

    let consistency = 50; // Base
    if (signal.avgTimePerQuestion > 30000 && signal.accuracy > 80) consistency += 10;
    if (signal.repeatedMistakes > 0) consistency -= (signal.repeatedMistakes * 5);

    let emotional_stability = 50; // Base
    if (signal.answerChanges > 1) emotional_stability -= (signal.answerChanges * 5);

    let adaptability = 50; // Base
    if (signal.avgTimePerQuestion < 5000 && signal.accuracy < 50) adaptability += 10; // "Trying fast"

    return {
        analytical_depth: Math.max(0, analytical_depth),
        consistency: Math.max(0, Math.min(100, consistency)),
        emotional_stability: Math.max(0, Math.min(100, emotional_stability)),
        adaptability: Math.max(0, Math.min(100, adaptability)),
        calibration_confidence: confidenceDelta
    };
}


/**
 * Deterministic Path Scoring
 */
// --- TRADING LOGIC ---

export interface TradingSignal {
    stopRespectedRate: number;   // 0-100 (% of trades where stop loss was respected)
    riskLimitRespect: number;    // 0-100 (% of trades within risk limits)
    noStopLossRate: number;      // 0-100 (% of trades without stop loss)
    overtradesCount: number;     // Number of overtrades per session
    avgHoldingTime: number;      // Average trade duration in minutes
    winRate: number;             // Win rate percentage
    // Legacy fields for backward compatibility if needed, but above are the new standard
}

export function calculateTraitsFromTrading(signals: TradingSignal[]): Partial<UserTraits> {
    if (signals.length === 0) return {};

    const aggregated = signals.reduce((acc, signal) => ({
        stopRespected: acc.stopRespected + signal.stopRespectedRate,
        riskRespect: acc.riskRespect + signal.riskLimitRespect,
        noStopLoss: acc.noStopLoss + signal.noStopLossRate,
        overtrades: acc.overtrades + signal.overtradesCount,
        holdingTime: acc.holdingTime + signal.avgHoldingTime,
        winRate: acc.winRate + signal.winRate,
        count: acc.count + 1
    }), { stopRespected: 0, riskRespect: 0, noStopLoss: 0, overtrades: 0, holdingTime: 0, winRate: 0, count: 0 });

    const avg = {
        stopRespected: aggregated.stopRespected / aggregated.count,
        riskRespect: aggregated.riskRespect / aggregated.count,
        noStopLoss: aggregated.noStopLoss / aggregated.count,
        overtrades: aggregated.overtrades / aggregated.count,
        holdingTime: aggregated.holdingTime / aggregated.count,
        winRate: aggregated.winRate / aggregated.count
    };

    return {
        risk_discipline: calculateRiskDiscipline(avg),
        emotional_stability: calculateEmotionalStability(avg),
        consistency: calculateConsistency(avg),
        adaptability: calculateAdaptability(avg)
    };
}

function calculateRiskDiscipline(avg: any): number {
    // Higher score for respecting stops and risk limits
    const stopScore = avg.stopRespected; // 0-100
    const riskScore = avg.riskRespect;   // 0-100
    const noStopPenalty = avg.noStopLoss; // 0-100 (Bad)

    // Formula: average of good behaviors minus penalty
    let score = (stopScore * 0.4 + riskScore * 0.4) - (noStopPenalty * 0.2);
    // Add bonus if noStopPenalty is 0 (perfect discipline)
    if (avg.noStopLoss === 0) score += 10;

    return Math.max(0, Math.min(100, score));
}

function calculateEmotionalStability(avg: any): number {
    // Lower overtrading = more stability
    // Base 100, subtract points for overtrading
    let score = 100 - (avg.overtrades * 10); // -10 points per overtrade

    // Holding time factor: extremely short holding times might indicate panic (scalping logic aside)
    // For general emotional stability, very short trades < 1 min often mean panic
    if (avg.holdingTime < 1) score -= 10;

    return Math.max(0, Math.min(100, score));
}

function calculateConsistency(avg: any): number {
    // Consistency is roughly correlated with following risk rules over time
    // And maintaining a stable win rate (though win rate itself isn't consistency)

    // Here we use Risk Respect as a proxy for process consistency
    return Math.max(0, Math.min(100, avg.riskRespect));
}

function calculateAdaptability(avg: any): number {
    // Adaptability is harder to measure from these simple signals
    // We'll use Win Rate as a weak proxy (adapting to market conditions)
    // combined with ensuring stops are used (adapting to being wrong)
    return Math.min(100, (avg.winRate * 0.6) + (avg.stopRespected * 0.4));
}

/**
 * Deterministic Path Scoring
 * Calculates score (0-100) for each career path based on user traits.
 */
export function calculatePathScores(traits: UserTraits, tradingTraits?: Partial<UserTraits>) {
    // Merge traits if trading data is provided (70% weight to trading data for practical traits)
    const finalTraits = tradingTraits ? {
        ...traits,
        risk_discipline: (traits.risk_discipline * 0.3 + (tradingTraits.risk_discipline || 0) * 0.7),
        emotional_stability: (traits.emotional_stability * 0.4 + (tradingTraits.emotional_stability || 0) * 0.6),
        consistency: (traits.consistency * 0.5 + (tradingTraits.consistency || 0) * 0.5),
        adaptability: (traits.adaptability * 0.6 + (tradingTraits.adaptability || 0) * 0.4)
    } : traits;

    const scores: Record<string, number> = {};

    for (const [pathId, weights] of Object.entries(PATH_DEFINITIONS)) {
        let score = 0;
        let totalWeight = 0;

        for (const [trait, weight] of Object.entries(weights)) {
            if (trait in finalTraits) {
                score += finalTraits[trait as keyof UserTraits] * weight;
                totalWeight += weight;
            }
        }

        // Normalize if weights don't sum to 1 (safety)
        if (totalWeight > 0) {
            scores[pathId] = Math.round((score / totalWeight) * 100); // Scale to 0-100
        } else {
            scores[pathId] = 0;
        }
    }

    return scores;
}

/**
 * Orchestrator: Updates user traits and paths in DB
 * Note: simplistic aggregation for now (new overrides old).
 * In production, this would fetch history and average it.
 */
export async function updateUserPaths(userId: string, newTraits: Partial<UserTraits>) {
    // 1. Fetch existing traits
    const existing = await prisma.userTrait.findUnique({ where: { user_id: userId } });

    const currentTraits: UserTraits = {
        analytical_depth: existing?.analytical_depth || 0,
        risk_discipline: existing?.risk_discipline || 0,
        adaptability: existing?.adaptability || 0,
        consistency: existing?.consistency || 0,
        emotional_stability: existing?.emotional_stability || 0,
        calibration_confidence: existing?.calibration_confidence || 0
    };

    // 2. Rolling Average (50% old, 50% new)
    // Only update fields that are present in newTraits
    const updatedTraits = { ...currentTraits };
    for (const k in newTraits) {
        const key = k as keyof UserTraits;
        if (newTraits[key] !== undefined) {
            // If first time, take the new value directly
            if (existing === null || currentTraits[key] === 0) {
                updatedTraits[key] = newTraits[key]!;
            } else if (key === 'calibration_confidence') {
                // Accumulate confidence, max 100
                updatedTraits[key] = Math.min(100, currentTraits[key] + newTraits[key]!);
            } else {
                updatedTraits[key] = Math.round((currentTraits[key] * 0.5) + (newTraits[key]! * 0.5));
            }
        }
    }

    // 3. Save Traits
    await prisma.userTrait.upsert({
        where: { user_id: userId },
        update: updatedTraits,
        create: { user_id: userId, ...updatedTraits }
    });

    // 4. Calculate Path Scores
    const pathScores = calculatePathScores(updatedTraits);

    // 5. Save Path Scores
    const confidence = updatedTraits.calibration_confidence;

    for (const [pathId, score] of Object.entries(pathScores)) {
        await prisma.userPathScore.upsert({
            where: {
                user_id_path_id: {
                    user_id: userId,
                    path_id: pathId
                }
            },
            update: { score, confidence },
            create: {
                user_id: userId,
                path_id: pathId,
                score,
                confidence
            }
        });
    }

    return { traits: updatedTraits, pathScores };
}
