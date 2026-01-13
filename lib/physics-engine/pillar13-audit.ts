/**
 * Pillar 13: Observation Integrity Auditor
 *
 * REPLACES: "Voluntary Attention" (Biological Metaphor)
 * PURPOSE: Forensic audit of scanner coverage and blindspots.
 *
 * Core Responsibility:
 * 1. Verify that the scanner actually looked at the universe it claims to cover.
 * 2. Detect "blind spots" where tokens moved but were not observed (due to errors/limits).
 * 3. Flag distinct failures (API errors, skipped tokens) as "Coverage Failures".
 *
 * LOGIC:
 * - Coverage = Observed / Total
 * - If Coverage < 100%, log a FAILURE.
 * - NO "Regret". NO "Penalties". Just cold, hard logs.
 */

export interface CoverageReport {
    cycle: number;
    totalUniverse: number;
    successfullyScanned: number;
    failedScans: number;
    coverageRatio: number; // 0.0 to 1.0
    status: 'COMPLETE' | 'PARTIAL' | 'CRITICAL_FAILURE';
    missingTokens: string[]; // Symbols that failed
}

export interface MissedObservation {
    token: string;
    priceDelta: number;
    reason: 'NOT_SCANNED' | 'DATA_MISSING' | 'API_ERROR';
    timestamp: number;
}

// Configuration
const INTEGRITY_CONFIG = {
    CRITICAL_THRESHOLD: 0.95, // Below 95% is a critical failure
    WARNING_THRESHOLD: 0.99,  // Below 99% is a warning
};

/**
 * Audit the scanner's coverage for a cycle
 */
export function auditCoverage(
    cycle: number,
    totalUniverseTokens: string[],
    scannedTokens: Set<string>
): CoverageReport {
    const total = totalUniverseTokens.length;
    const scannedCount = scannedTokens.size;
    const missing: string[] = [];

    // Identify who was missed
    for (const token of totalUniverseTokens) {
        if (!scannedTokens.has(token)) {
            missing.push(token);
        }
    }

    const coverageRatio = total > 0 ? scannedCount / total : 0;

    let status: 'COMPLETE' | 'PARTIAL' | 'CRITICAL_FAILURE' = 'COMPLETE';
    if (coverageRatio < INTEGRITY_CONFIG.CRITICAL_THRESHOLD) {
        status = 'CRITICAL_FAILURE';
    } else if (coverageRatio < INTEGRITY_CONFIG.WARNING_THRESHOLD) {
        status = 'PARTIAL';
    }

    return {
        cycle,
        totalUniverse: total,
        successfullyScanned: scanned,
        failedScans: total - scanned,
        coverageRatio,
        status,
        missingTokens: missing,
    };
}

/**
 * Detect blindspots: Tokens we missed that actually moved.
 * NOTE: This requires an external source of truth (e.g. valid price snapshot)
 * to compare against the tokens we FAILED to scan.
 */
export function detectBlindspots(
    missingTokens: string[],
    externalPriceMap: Map<string, number>, // Ideally previous vs current, but we might only have current
    previousPrices: Map<string, number>
): MissedObservation[] {
    const blindspots: MissedObservation[] = [];

    for (const token of missingTokens) {
        const current = externalPriceMap.get(token);
        const previous = previousPrices.get(token);

        if (current && previous) {
            const delta = (current - previous) / previous;

            // If it moved significantly (> 2%), it's a Blindspot
            if (Math.abs(delta) > 0.02) {
                blindspots.push({
                    token,
                    priceDelta: delta,
                    reason: 'NOT_SCANNED',
                    timestamp: Date.now()
                });
            }
        }
    }

    return blindspots;
}
