/**
 * Continuous Simulation Runner
 *
 * Runs the Brain V2 simulation continuously with real market data,
 * fetching fresh data periodically and executing cycles.
 */

import { brainSimulator, SimulationWallet } from './brainv2-simulator';
import { buildTradingUniverse, fetchPriceHistories } from './data-fetcher';
import type { SearchableToken } from '@/types/BrainV2';

export interface RunnerConfig {
    initialSol: number;
    cycleIntervalMs: number; // Time between cycles
    dataRefreshIntervalMs: number; // Time between data refreshes
    maxCycles?: number;
    autoPause?: {
        onLoss: number; // Pause if loss exceeds this %
        onProfit: number; // Pause if profit exceeds this %
    };
}

export class ContinuousRunner {
    private runId?: string;
    private isRunning: boolean = false;
    private currentUniverse: SearchableToken[] = [];
    private config: RunnerConfig;
    private cycleInterval?: NodeJS.Timeout;
    private dataRefreshInterval?: NodeJS.Timeout;
    private cycleCount: number = 0;

    constructor(config: RunnerConfig) {
        this.config = config;
    }

    /**
     * Start the continuous simulation
     */
    async start(): Promise<void> {
        if (this.isRunning) {
            console.log('[ContinuousRunner] Already running');
            return;
        }

        console.log('[ContinuousRunner] Starting continuous simulation...');
        this.isRunning = true;

        try {
            // Start simulation
            this.runId = await brainSimulator.startSimulation({
                initialSol: this.config.initialSol,
            });

            console.log(`[ContinuousRunner] Simulation started: ${this.runId}`);

            // Initial data load
            await this.refreshData();

            // Start cycle loop
            this.cycleInterval = setInterval(async () => {
                await this.runCycle();
            }, this.config.cycleIntervalMs);

            // Start data refresh loop
            this.dataRefreshInterval = setInterval(async () => {
                await this.refreshData();
            }, this.config.dataRefreshIntervalMs);

            console.log('[ContinuousRunner] Loops started');
            console.log(`  - Cycle interval: ${this.config.cycleIntervalMs / 1000}s`);
            console.log(`  - Data refresh: ${this.config.dataRefreshIntervalMs / 1000}s`);
        } catch (error) {
            console.error('[ContinuousRunner] Start error:', error);
            this.isRunning = false;
            throw error;
        }
    }

    /**
     * Stop the continuous simulation
     */
    async stop(): Promise<void> {
        if (!this.isRunning) {
            console.log('[ContinuousRunner] Not running');
            return;
        }

        console.log('[ContinuousRunner] Stopping...');

        // Clear intervals
        if (this.cycleInterval) {
            clearInterval(this.cycleInterval);
            this.cycleInterval = undefined;
        }

        if (this.dataRefreshInterval) {
            clearInterval(this.dataRefreshInterval);
            this.dataRefreshInterval = undefined;
        }

        // Stop simulation
        if (this.runId) {
            await brainSimulator.stopSimulation(this.runId);
            const run = brainSimulator.getRun(this.runId);
            if (run) {
                const stats = run.wallet.getStats();
                console.log('[ContinuousRunner] Final stats:');
                console.log(`  - Cycles: ${this.cycleCount}`);
                console.log(`  - PnL: ${stats.pnlPercent.toFixed(2)}%`);
                console.log(`  - Total trades: ${stats.totalTrades}`);
                console.log(`  - Win rate: ${((stats.successfulTrades / stats.totalTrades) * 100).toFixed(1)}%`);
            }
        }

        this.isRunning = false;
        this.cycleCount = 0;
        console.log('[ContinuousRunner] Stopped');
    }

    /**
     * Refresh market data
     */
    private async refreshData(): Promise<void> {
        console.log('[ContinuousRunner] Refreshing market data...');

        try {
            // Build fresh trading universe with real data
            this.currentUniverse = await buildTradingUniverse();
            console.log(`[ContinuousRunner] Universe updated: ${this.currentUniverse.length} tokens`);
        } catch (error) {
            console.error('[ContinuousRunner] Data refresh error:', error);
            // Keep using old data if refresh fails
        }
    }

    /**
     * Run one simulation cycle
     */
    private async runCycle(): Promise<void> {
        if (!this.runId || !this.isRunning) return;

        this.cycleCount++;

        try {
            console.log(`\n[ContinuousRunner] === CYCLE ${this.cycleCount} ===`);

            // Check if we have data
            if (this.currentUniverse.length === 0) {
                console.log('[ContinuousRunner] No universe data, skipping cycle');
                return;
            }

            // Run cycle
            const cycle = await brainSimulator.runCycle(this.runId, this.currentUniverse);

            // Check auto-pause conditions
            if (this.config.autoPause) {
                const run = brainSimulator.getRun(this.runId);
                if (run) {
                    const stats = run.wallet.getStats();

                    if (stats.pnlPercent <= -this.config.autoPause.onLoss) {
                        console.log(`[ContinuousRunner] Auto-pause: Loss threshold hit (${stats.pnlPercent.toFixed(2)}%)`);
                        await this.stop();
                        return;
                    }

                    if (stats.pnlPercent >= this.config.autoPause.onProfit) {
                        console.log(`[ContinuousRunner] Auto-pause: Profit threshold hit (${stats.pnlPercent.toFixed(2)}%)`);
                        await this.stop();
                        return;
                    }
                }
            }

            // Check max cycles
            if (this.config.maxCycles && this.cycleCount >= this.config.maxCycles) {
                console.log(`[ContinuousRunner] Max cycles reached (${this.config.maxCycles})`);
                await this.stop();
                return;
            }
        } catch (error) {
            console.error('[ContinuousRunner] Cycle error:', error);
            // Continue running even if one cycle fails
        }
    }

    /**
     * Get current status
     */
    getStatus() {
        const run = this.runId ? brainSimulator.getRun(this.runId) : null;
        const stats = run?.wallet.getStats();

        return {
            isRunning: this.isRunning,
            runId: this.runId,
            cycleCount: this.cycleCount,
            universeSize: this.currentUniverse.length,
            stats,
        };
    }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

let globalRunner: ContinuousRunner | null = null;

/**
 * Get or create global runner
 */
export function getRunner(config?: RunnerConfig): ContinuousRunner {
    if (!globalRunner && config) {
        globalRunner = new ContinuousRunner(config);
    } else if (!globalRunner) {
        // Default config
        globalRunner = new ContinuousRunner({
            initialSol: 0.1,
            cycleIntervalMs: 60 * 1000, // 1 minute
            dataRefreshIntervalMs: 10 * 60 * 1000, // 10 minutes
            autoPause: {
                onLoss: 50, // Stop if -50%
                onProfit: 200, // Stop if +200%
            },
        });
    }
    return globalRunner;
}

/**
 * Quick start with defaults
 */
export async function quickStart(): Promise<void> {
    const runner = getRunner();
    await runner.start();
}

/**
 * Quick stop
 */
export async function quickStop(): Promise<void> {
    if (globalRunner) {
        await globalRunner.stop();
    }
}
