/**
 * Persistent Learning Memory
 * 
 * Sits below all pillars - never turned off.
 * "The brain may lose the right to act, but it never loses the right to learn."
 * 
 * Memory informs, pillars decide.
 */

import { PredictionDirection, TokenCandidate } from './compoundingLoop';

// ============================================================================
// Memory Storage Types
// ============================================================================

export interface ArchivedToken {
    token: string;
    mint: string;
    cycle: number;
    brainPrediction: PredictionDirection;
    priceAtPrediction: number;
    finalPrice: number;
    actualDirection: PredictionDirection;
    priceChange: number;
    lesson: string;
    timestamp: number;
    runId: string;
}

export interface TeachingEvent {
    token: string;
    cycle: number;
    prediction: PredictionDirection;
    actual: PredictionDirection;
    priceChange: number;
    lesson: string;
    type: 'MISSED_OPPORTUNITY' | 'DIRECTIONAL_ERROR' | 'CORRECT_CALL' | 'CORRECT_FLAT';
}

export interface LearningMemory {
    runId: string;
    startedAt: number;
    endedAt?: number;
    verdict?: string;
    archivedTokens: ArchivedToken[];
    teachingEvents: TeachingEvent[];
    biasAdjustments: {
        upBias: number;
        downBias: number;
        flatBias: number;
    };
}

// In-memory storage (persists for session, can be extended to localStorage/DB)
let currentRunMemory: LearningMemory | null = null;
const memoryHistory: LearningMemory[] = [];

// ============================================================================
// Memory Functions
// ============================================================================

/**
 * Start a new learning run
 */
export function startLearningRun(): string {
    const runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    currentRunMemory = {
        runId,
        startedAt: Date.now(),
        archivedTokens: [],
        teachingEvents: [],
        biasAdjustments: {
            upBias: 1.0,
            downBias: 1.0,
            flatBias: 1.0,
        },
    };

    return runId;
}

/**
 * Archive an eliminated token WITH its outcome (for learning)
 * This is NOT a penalty - it's post-hoc instruction
 */
export function archiveToken(
    token: TokenCandidate,
    cycle: number,
    finalPrice: number,
    emitEvent?: (type: string, data: any) => void
): TeachingEvent {
    if (!currentRunMemory) {
        startLearningRun();
    }

    const priceChange = token.priceAtStart > 0
        ? (finalPrice - token.priceAtStart) / token.priceAtStart
        : 0;

    // Determine actual direction
    const epsilon = 0.01;
    let actualDirection: PredictionDirection = 'FLAT';
    if (priceChange > epsilon) actualDirection = 'UP';
    else if (priceChange < -epsilon) actualDirection = 'DOWN';

    // Generate teaching lesson
    const { lesson, type } = generateLesson(
        token.prediction || 'FLAT',
        actualDirection,
        priceChange
    );

    const archived: ArchivedToken = {
        token: token.symbol,
        mint: token.mint,
        cycle,
        brainPrediction: token.prediction || 'FLAT',
        priceAtPrediction: token.priceAtStart,
        finalPrice,
        actualDirection,
        priceChange,
        lesson,
        timestamp: Date.now(),
        runId: currentRunMemory!.runId,
    };

    currentRunMemory!.archivedTokens.push(archived);

    const teaching: TeachingEvent = {
        token: token.symbol,
        cycle,
        prediction: token.prediction || 'FLAT',
        actual: actualDirection,
        priceChange,
        lesson,
        type,
    };

    currentRunMemory!.teachingEvents.push(teaching);

    if (emitEvent) {
        emitEvent('MEMORY_TEACHING', {
            token: token.symbol,
            prediction: token.prediction,
            actual: actualDirection,
            priceChange: (priceChange * 100).toFixed(2) + '%',
            lesson,
            type,
        });
    }

    return teaching;
}

/**
 * Generate a teaching lesson from the outcome
 */
function generateLesson(
    prediction: PredictionDirection,
    actual: PredictionDirection,
    priceChange: number
): { lesson: string; type: TeachingEvent['type'] } {
    const pctStr = (priceChange * 100).toFixed(2);
    const direction = priceChange >= 0 ? 'increased' : 'dropped';

    if (prediction === 'FLAT') {
        if (actual === 'UP') {
            return {
                lesson: `You predicted FLAT. Price ${direction} ${pctStr}%. You missed an UP opportunity.`,
                type: 'MISSED_OPPORTUNITY',
            };
        } else if (actual === 'DOWN') {
            return {
                lesson: `You predicted FLAT. Price ${direction} ${pctStr}%. You missed a DOWN signal.`,
                type: 'MISSED_OPPORTUNITY',
            };
        } else {
            return {
                lesson: `You predicted FLAT. Price stayed flat (${pctStr}%). Correct assessment.`,
                type: 'CORRECT_FLAT',
            };
        }
    }

    if (prediction === 'UP') {
        if (actual === 'UP') {
            return {
                lesson: `You predicted UP. Price ${direction} ${pctStr}%. Correct directional call.`,
                type: 'CORRECT_CALL',
            };
        } else {
            return {
                lesson: `You predicted UP. Price ${direction} ${pctStr}%. Directional error.`,
                type: 'DIRECTIONAL_ERROR',
            };
        }
    }

    if (prediction === 'DOWN') {
        if (actual === 'DOWN') {
            return {
                lesson: `You predicted DOWN. Price ${direction} ${pctStr}%. Correct directional call.`,
                type: 'CORRECT_CALL',
            };
        } else {
            return {
                lesson: `You predicted DOWN. Price ${direction} ${pctStr}%. Directional error.`,
                type: 'DIRECTIONAL_ERROR',
            };
        }
    }

    return { lesson: 'Unknown outcome', type: 'CORRECT_FLAT' };
}

/**
 * Archive multiple tokens at once (batch)
 */
export function archiveTokens(
    tokens: TokenCandidate[],
    cycle: number,
    currentPrices: Map<string, number>,
    emitEvent?: (type: string, data: any) => void
): TeachingEvent[] {
    const events: TeachingEvent[] = [];

    for (const token of tokens) {
        const finalPrice = currentPrices.get(token.symbol) || token.priceAtEnd || token.priceAtStart;
        const event = archiveToken(token, cycle, finalPrice);
        events.push(event);
    }

    if (emitEvent && events.length > 0) {
        emitEvent('MEMORY_ARCHIVED', {
            count: events.length,
            cycle,
            correct: events.filter(e => e.type === 'CORRECT_CALL' || e.type === 'CORRECT_FLAT').length,
            errors: events.filter(e => e.type === 'DIRECTIONAL_ERROR').length,
            missed: events.filter(e => e.type === 'MISSED_OPPORTUNITY').length,
        });
    }

    return events;
}

/**
 * End the current learning run and calculate bias adjustments
 */
export function endLearningRun(
    verdict: string,
    emitEvent?: (type: string, data: any) => void
): LearningMemory | null {
    if (!currentRunMemory) return null;

    currentRunMemory.endedAt = Date.now();
    currentRunMemory.verdict = verdict;

    // Calculate bias adjustments based on learning
    const events = currentRunMemory.teachingEvents;
    const missedOpportunities = events.filter(e => e.type === 'MISSED_OPPORTUNITY').length;
    const directionalErrors = events.filter(e => e.type === 'DIRECTIONAL_ERROR').length;
    const correctCalls = events.filter(e => e.type === 'CORRECT_CALL').length;

    // Adjust biases for next run
    // More missed opportunities → reduce FLAT bias
    // More directional errors → reduce that direction's bias
    if (missedOpportunities > 5) {
        currentRunMemory.biasAdjustments.flatBias *= 0.9;
    }
    if (directionalErrors > correctCalls) {
        // Conservative: reduce both
        currentRunMemory.biasAdjustments.upBias *= 0.95;
        currentRunMemory.biasAdjustments.downBias *= 0.95;
    }

    if (emitEvent) {
        emitEvent('MEMORY_RUN_COMPLETE', {
            runId: currentRunMemory.runId,
            totalArchived: currentRunMemory.archivedTokens.length,
            missedOpportunities,
            directionalErrors,
            correctCalls,
            biasAdjustments: currentRunMemory.biasAdjustments,
        });
    }

    // Archive to history
    memoryHistory.push(currentRunMemory);

    const result = currentRunMemory;
    currentRunMemory = null;

    return result;
}

/**
 * Get accumulated bias adjustments from all past runs
 */
export function getAccumulatedBiases(): { upBias: number; downBias: number; flatBias: number } {
    if (memoryHistory.length === 0) {
        return { upBias: 1.0, downBias: 1.0, flatBias: 1.0 };
    }

    // Accumulate from all runs
    let upBias = 1.0, downBias = 1.0, flatBias = 1.0;

    for (const run of memoryHistory) {
        upBias *= run.biasAdjustments.upBias;
        downBias *= run.biasAdjustments.downBias;
        flatBias *= run.biasAdjustments.flatBias;
    }

    // Clamp to reasonable range
    const clamp = (v: number) => Math.max(0.3, Math.min(2.0, v));

    return {
        upBias: clamp(upBias),
        downBias: clamp(downBias),
        flatBias: clamp(flatBias),
    };
}

/**
 * Get current run memory (for debugging)
 */
export function getCurrentMemory(): LearningMemory | null {
    return currentRunMemory;
}

/**
 * Get memory history
 */
export function getMemoryHistory(): LearningMemory[] {
    return memoryHistory;
}

/**
 * Clear all memory (reset)
 */
export function clearMemory(): void {
    currentRunMemory = null;
    memoryHistory.length = 0;
}
