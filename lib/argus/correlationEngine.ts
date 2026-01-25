/**
 * Correlation Engine
 * Wallet ↔ Token Correlation Matrix for detecting cabals, shared exposure, and systemic risk
 */

export type WalletHolding = {
    token: string;
    symbol: string;
    usdValue: number;
    percent?: number;
};

export type WalletExposure = {
    wallet: string;
    holdings: WalletHolding[];
};

export type CorrelationResult = {
    walletA: string;
    walletB: string;
    score: number;
    sharedTokens: string[];
};

// Performance limits
export const MAX_WALLETS = 5;
export const MAX_TOKENS = 8;

/**
 * Extract unique token symbols from wallet exposures
 */
export function extractTokens(exposures: WalletExposure[]): string[] {
    const set = new Set<string>();
    exposures.forEach(w =>
        w.holdings.forEach(h => set.add(h.symbol))
    );
    return Array.from(set).slice(0, MAX_TOKENS);
}

/**
 * Build exposure matrix
 * Rows = wallets, Columns = tokens, Cells = USD value
 */
export function buildMatrix(
    wallets: WalletExposure[],
    tokens: string[]
): number[][] {
    return wallets.slice(0, MAX_WALLETS).map(wallet => {
        return tokens.map(token => {
            const holding = wallet.holdings.find(h => h.symbol === token);
            return holding ? holding.usdValue : 0;
        });
    });
}

/**
 * Jaccard-like similarity score between two wallet exposure vectors
 * 0 = no overlap, 1 = identical exposure pattern
 */
export function similarity(a: number[], b: number[]): number {
    let shared = 0;
    let total = 0;

    for (let i = 0; i < a.length; i++) {
        if (a[i] > 0 && b[i] > 0) shared++;
        if (a[i] > 0 || b[i] > 0) total++;
    }

    return total === 0 ? 0 : shared / total;
}

/**
 * Build correlation matrix between all wallet pairs
 * Returns NxN matrix where N = number of wallets
 */
export function buildCorrelationMatrix(matrix: number[][]): number[][] {
    return matrix.map((rowA, i) =>
        matrix.map((rowB, j) =>
            i === j ? 1 : similarity(rowA, rowB)
        )
    );
}

/**
 * Find significant correlations (pairs with overlap)
 */
export function findSignificantCorrelations(
    wallets: WalletExposure[],
    tokens: string[],
    matrix: number[][],
    threshold: number = 0.3
): CorrelationResult[] {
    const results: CorrelationResult[] = [];
    const limitedWallets = wallets.slice(0, MAX_WALLETS);

    for (let i = 0; i < limitedWallets.length; i++) {
        for (let j = i + 1; j < limitedWallets.length; j++) {
            const score = similarity(matrix[i], matrix[j]);

            if (score >= threshold) {
                const sharedTokens = tokens.filter((_, idx) =>
                    matrix[i][idx] > 0 && matrix[j][idx] > 0
                );

                results.push({
                    walletA: limitedWallets[i].wallet,
                    walletB: limitedWallets[j].wallet,
                    score,
                    sharedTokens
                });
            }
        }
    }

    return results.sort((a, b) => b.score - a.score);
}

/**
 * Normalize matrix values for heatmap display (0-1 scale)
 */
export function normalizeMatrix(matrix: number[][]): number[][] {
    const allValues = matrix.flat().filter(v => v > 0);
    if (allValues.length === 0) return matrix.map(row => row.map(() => 0));

    const max = Math.max(...allValues);
    if (max === 0) return matrix.map(row => row.map(() => 0));

    return matrix.map(row => row.map(v => v / max));
}

/**
 * Get exposure intensity level for styling
 */
export function getIntensityLevel(normalizedValue: number): 'empty' | 'low' | 'medium' | 'high' {
    if (normalizedValue === 0) return 'empty';
    if (normalizedValue < 0.33) return 'low';
    if (normalizedValue < 0.66) return 'medium';
    return 'high';
}

/**
 * Network Risk Assessment
 */
export type NetworkRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface NetworkRiskScore {
    level: NetworkRiskLevel;
    score: number; // 0-100
    factors: string[];
    correlatedPairs: number;
    topWhaleExposure: number; // % of total value held by top wallet
}

/**
 * Calculate overall network risk score
 */
export function calculateNetworkRisk(
    exposures: WalletExposure[],
    correlations: CorrelationResult[]
): NetworkRiskScore {
    const factors: string[] = [];
    let score = 0;

    // Factor 1: Number of correlated wallet pairs
    const correlatedPairs = correlations.filter(c => c.sharedTokens.length >= 2).length;
    if (correlatedPairs >= 3) {
        score += 35;
        factors.push(`${correlatedPairs} correlated wallet clusters detected`);
    } else if (correlatedPairs >= 1) {
        score += 20;
        factors.push(`${correlatedPairs} correlated wallet pair${correlatedPairs > 1 ? 's' : ''} detected`);
    }

    // Factor 2: High correlation scores (potential coordination)
    const highCorrelations = correlations.filter(c => c.score >= 0.66);
    if (highCorrelations.length > 0) {
        score += 25;
        factors.push('Strong wallet coordination signals');
    }

    // Factor 3: Whale dominance
    const totalValue = exposures.reduce((sum, w) =>
        sum + w.holdings.reduce((s, h) => s + h.usdValue, 0), 0
    );
    const topWalletValue = exposures.length > 0
        ? exposures[0].holdings.reduce((s, h) => s + h.usdValue, 0)
        : 0;
    const topWhaleExposure = totalValue > 0 ? (topWalletValue / totalValue) * 100 : 0;

    if (topWhaleExposure > 50) {
        score += 30;
        factors.push(`Top wallet controls ${topWhaleExposure.toFixed(0)}% of tracked exposure`);
    } else if (topWhaleExposure > 30) {
        score += 15;
        factors.push(`Elevated whale concentration (${topWhaleExposure.toFixed(0)}%)`);
    }

    // Factor 4: Multi-token exposure (systemic risk)
    const multiTokenWallets = exposures.filter(w => w.holdings.length >= 3);
    if (multiTokenWallets.length >= 2) {
        score += 10;
        factors.push('Multiple wallets with broad token exposure');
    }

    // Determine risk level
    let level: NetworkRiskLevel = 'LOW';
    if (score >= 70) level = 'CRITICAL';
    else if (score >= 50) level = 'HIGH';
    else if (score >= 25) level = 'MEDIUM';

    if (factors.length === 0) {
        factors.push('No significant network risks detected');
    }

    return {
        level,
        score: Math.min(score, 100),
        factors,
        correlatedPairs,
        topWhaleExposure
    };
}

/**
 * Get wallets involved in correlations (for highlighting)
 */
export function getCorrelatedWallets(correlations: CorrelationResult[]): Set<string> {
    const wallets = new Set<string>();
    correlations.forEach(c => {
        if (c.sharedTokens.length >= 2) {
            wallets.add(c.walletA);
            wallets.add(c.walletB);
        }
    });
    return wallets;
}
