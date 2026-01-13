'use server';

import { MarketScannerEngine } from '@/lib/execution-engine/simulation/MarketScanner';
import { SimulationReport } from '@/lib/execution-engine/simulation/types';

// Global state container (persists across server actions in dev mode usually, 
// though unreliable in serverless, suitable for valid local testing)
declare global {
    var systemTestEngine: MarketScannerEngine | undefined;
    var systemTestLogs: any[];
    var systemTestStatus: 'IDLE' | 'RUNNING' | 'COMPLETE' | 'FAILED';
    var systemTestReport: SimulationReport | null;
}

if (!global.systemTestLogs) global.systemTestLogs = [];
if (!global.systemTestStatus) global.systemTestStatus = 'IDLE';

export async function startSystemTest() {
    if (global.systemTestStatus === 'RUNNING') return { success: false, message: 'Already running' };

    console.log('[SystemTest] Starting new test...');
    global.systemTestLogs = [];
    global.systemTestReport = null;
    global.systemTestStatus = 'RUNNING';

    // Initialize Engine
    global.systemTestEngine = new MarketScannerEngine();

    // Start Async (Run in background)
    // We don't await this because we want to return immediately
    (async () => {
        try {
            const report = await global.systemTestEngine!.run((type, data) => {
                // Buffer logs
                global.systemTestLogs.push({
                    id: Date.now() + Math.random(),
                    timestamp: Date.now(),
                    type,
                    data
                });
            });
            global.systemTestReport = report;
            global.systemTestStatus = 'COMPLETE';
        } catch (error: any) {
            console.error('[SystemTest] Failed:', error);
            global.systemTestLogs.push({
                id: Date.now(),
                timestamp: Date.now(),
                type: 'ERROR',
                data: { message: error.message || String(error) }
            });
            global.systemTestStatus = 'FAILED';
        }
    })();

    return { success: true };
}

export async function stopSystemTest() {
    // We can't easily kill the promise, but we can set status
    // The engine doesn't have an abort controller yet, but we can clean state
    global.systemTestStatus = 'IDLE';
    global.systemTestEngine = undefined;
    return { success: true };
}

export async function getSystemTestStatus() {
    return {
        status: global.systemTestStatus,
        logs: global.systemTestLogs, // Return all logs (client filters by ID if needed)
        report: global.systemTestReport
    };
}
