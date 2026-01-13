/**
 * Learning Event Emitter
 * 
 * Emits structured events for observer UI.
 * Events are immutable - no rewrites, no overrides.
 * 
 * Transport options:
 * - Memory (default)
 * - JSON file (for persistence)
 * - WebSocket/SSE (future)
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// Event Types
export type LearningEventType =
    | 'RUN_STARTED'
    | 'REGIME_DETECTED'
    | 'PREDICTIONS_MADE'
    | 'CYCLE_SUMMARY'
    | 'SATURATION_CHECK'
    | 'BASELINE_COMPARISON'
    | 'DIVERSITY_ENFORCED'
    | 'TOKENS_NARROWED'
    | 'EXECUTION_BLOCKED'
    | 'EXECUTION_ALLOWED'
    | 'RUN_COMPLETED';

export interface LearningEvent {
    type: LearningEventType;
    timestamp: number;
    runId: string;
    data: Record<string, any>;
}

// In-memory event store
const events: LearningEvent[] = [];
let currentRunId: string | null = null;
let listeners: ((event: LearningEvent) => void)[] = [];

/**
 * Start a new immutable learning run
 */
export function startRun(): string {
    const runId = new Date().toISOString();
    currentRunId = runId;
    events.length = 0; // Clear previous run

    emit('RUN_STARTED', { runId });
    return runId;
}

/**
 * Emit an event (immutable, append-only)
 */
export function emit(type: LearningEventType, data: Record<string, any>): void {
    if (!currentRunId) {
        currentRunId = new Date().toISOString();
    }

    const event: LearningEvent = {
        type,
        timestamp: Date.now(),
        runId: currentRunId,
        data,
    };

    events.push(event);

    // Notify listeners
    listeners.forEach(fn => fn(event));

    // Console log for debugging
    console.log(`[Event] ${type}:`, JSON.stringify(data).slice(0, 100));
}

/**
 * Subscribe to events (for WebSocket/SSE future)
 */
export function subscribe(fn: (event: LearningEvent) => void): () => void {
    listeners.push(fn);
    return () => {
        listeners = listeners.filter(l => l !== fn);
    };
}

/**
 * Get all events for current run
 */
export function getEvents(): LearningEvent[] {
    return [...events];
}

/**
 * Get current run ID
 */
export function getRunId(): string | null {
    return currentRunId;
}

/**
 * Save events to JSON file (Phase 1 persistence)
 */
export function saveToFile(directory?: string): string {
    const dir = directory || join(process.cwd(), '.learning-runs');

    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }

    const filename = `run_${currentRunId?.replace(/[:.]/g, '-') || 'unknown'}.json`;
    const filepath = join(dir, filename);

    const runData = {
        runId: currentRunId,
        startedAt: events[0]?.timestamp,
        completedAt: events[events.length - 1]?.timestamp,
        eventCount: events.length,
        events,
    };

    writeFileSync(filepath, JSON.stringify(runData, null, 2));
    console.log(`[Learning] Saved run to: ${filepath}`);

    return filepath;
}

/**
 * Get summary for UI display
 */
export function getRunSummary(): {
    runId: string | null;
    eventCount: number;
    verdict: string | null;
    regimes: string[];
    cycles: number;
} {
    const regimeEvents = events.filter(e => e.type === 'REGIME_DETECTED');
    const completedEvent = events.find(e => e.type === 'RUN_COMPLETED');
    const cycleEvents = events.filter(e => e.type === 'CYCLE_SUMMARY');

    return {
        runId: currentRunId,
        eventCount: events.length,
        verdict: completedEvent?.data.verdict || null,
        regimes: regimeEvents.map(e => e.data.regime),
        cycles: cycleEvents.length,
    };
}
