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
        adaptability: Math.max(0, Math.min(100, adaptability))
    };
}


/**
 * Deterministic Path Scoring
 */
export function calculatePathScores(traits: UserTraits) {
    const scores: Record<string, number> = {};

    for (const [pathId, weights] of Object.entries(PATH_DEFINITIONS)) {
        let score = 0;
        let totalWeight = 0;

        for (const [trait, weight] of Object.entries(weights)) {
            if (trait in traits) {
                score += traits[trait as keyof UserTraits] * weight;
                totalWeight += weight;
            }
        }

        // Normalize if weights don't sum to 1 (safety)
        if (totalWeight > 0) {
            scores[pathId] = Math.round(score / totalWeight);
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
        emotional_stability: existing?.emotional_stability || 0
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
    // Confidence is hardcoded low for now until we have real data counting
    const confidence = 60;

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
