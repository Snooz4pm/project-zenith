/**
 * Trust Levels - Pillar 9
 * 
 * Discrete permission states based on accumulated discipline.
 * NOT rewards. NOT capital scaling. ONLY permissions.
 */

export enum TrustLevel {
    LEVEL_0_OBSERVER = 0,
    LEVEL_1_PAPER_MICRO = 1,
    LEVEL_2_PAPER_STANDARD = 2,
    LEVEL_3_REAL_DUST = 3,
    LEVEL_4_REAL_SMALL = 4,
}

export type ExecutionType = 'NONE' | 'PAPER' | 'REAL';

export interface TrustLevelConfig {
    level: TrustLevel;
    name: string;
    maxTrades: number;
    executionType: ExecutionType;
    maxSolPerTrade: number;
    description: string;

    // Promotion requirements
    minConsecutiveEdgeValidated: number;
    minTotalRuns: number;
    maxViolations: number;
}

export const TRUST_LEVEL_CONFIGS: Record<TrustLevel, TrustLevelConfig> = {
    [TrustLevel.LEVEL_0_OBSERVER]: {
        level: TrustLevel.LEVEL_0_OBSERVER,
        name: 'OBSERVER',
        maxTrades: 0,
        executionType: 'NONE',
        maxSolPerTrade: 0,
        description: 'Learning only. No execution allowed.',
        minConsecutiveEdgeValidated: 0,
        minTotalRuns: 0,
        maxViolations: Infinity,
    },
    [TrustLevel.LEVEL_1_PAPER_MICRO]: {
        level: TrustLevel.LEVEL_1_PAPER_MICRO,
        name: 'PAPER_MICRO',
        maxTrades: 1,
        executionType: 'PAPER',
        maxSolPerTrade: 0,
        description: 'Max 1 paper trade. Tight diversity rules.',
        minConsecutiveEdgeValidated: 3,
        minTotalRuns: 5,
        maxViolations: 0,
    },
    [TrustLevel.LEVEL_2_PAPER_STANDARD]: {
        level: TrustLevel.LEVEL_2_PAPER_STANDARD,
        name: 'PAPER_STANDARD',
        maxTrades: 3,
        executionType: 'PAPER',
        maxSolPerTrade: 0,
        description: 'Max 3 paper trades.',
        minConsecutiveEdgeValidated: 5,
        minTotalRuns: 10,
        maxViolations: 0,
    },
    [TrustLevel.LEVEL_3_REAL_DUST]: {
        level: TrustLevel.LEVEL_3_REAL_DUST,
        name: 'REAL_DUST',
        maxTrades: 2,
        executionType: 'REAL',
        maxSolPerTrade: 0.01,
        description: 'Real trades ≤ 0.01 SOL. Auto-demotion on violation.',
        minConsecutiveEdgeValidated: 7,
        minTotalRuns: 20,
        maxViolations: 0,
    },
    [TrustLevel.LEVEL_4_REAL_SMALL]: {
        level: TrustLevel.LEVEL_4_REAL_SMALL,
        name: 'REAL_SMALL',
        maxTrades: 3,
        executionType: 'REAL',
        maxSolPerTrade: 0.1,
        description: 'Real trades ≤ 0.1 SOL. Sustained discipline required.',
        minConsecutiveEdgeValidated: 10,
        minTotalRuns: 50,
        maxViolations: 0,
    },
};

/**
 * Get config for a trust level
 */
export function getTrustConfig(level: TrustLevel): TrustLevelConfig {
    return TRUST_LEVEL_CONFIGS[level];
}

/**
 * Get level name for logging
 */
export function getTrustLevelName(level: TrustLevel): string {
    return TRUST_LEVEL_CONFIGS[level].name;
}

/**
 * Check if level allows execution
 */
export function canExecute(level: TrustLevel): boolean {
    return level > TrustLevel.LEVEL_0_OBSERVER;
}

/**
 * Check if level allows real trades
 */
export function canExecuteReal(level: TrustLevel): boolean {
    return level >= TrustLevel.LEVEL_3_REAL_DUST;
}
